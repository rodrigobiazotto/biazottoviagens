import assert from 'node:assert/strict';
import { db, initDb } from '../server/db.js';
import { seedInitialContent } from '../server/seed.js';
import {
  ensureInitialAdminUser,
  authenticateUser,
  checkRateLimit,
  validateSession,
  changeUserPassword,
  verifyCsrf
} from '../server/auth.js';
import {
  getPublishedContent,
  getDraftContent,
  updateBlock,
  reorderSections,
  updateSection,
  duplicateSection,
  deleteSection,
  updateNavigation,
  publishDraft,
  listPublishedVersions,
  restoreVersion,
  sanitizeContent,
  getAuditLogs
} from '../server/content.js';
import { validateImageBuffer, handleImageUpload } from '../server/media.js';

console.log('--- INICIANDO TESTES DO SISTEMA BIAZOTTO CMS ---');

// 1. Inicialização do Banco e Seed
await initDb();
await seedInitialContent();
await db.run('DELETE FROM login_attempts');
console.log('✔ 1. Migrações e seed inicial executados com sucesso');

// 2. Inicialização Segura do Usuário Administrador
const testInitialPassword = process.env.DEV_ADMIN_PASSWORD || 'GGpub9*';
process.env.DEV_ADMIN_USERNAME = 'biazotto';
process.env.DEV_ADMIN_PASSWORD = testInitialPassword;
const adminUser = await ensureInitialAdminUser();
assert.ok(adminUser, 'Admin user deve existir');
assert.equal(adminUser.username, 'biazotto');

// Garante que o hash da senha seja idêntico a testInitialPassword no início dos testes
import bcrypt from 'bcryptjs';
await db.run('UPDATE users SET password_hash = ? WHERE username = ?', [
  bcrypt.hashSync(testInitialPassword, 12),
  'biazotto'
]);

console.log('✔ 2. Usuário administrador inicializado com hash bcrypt');

// 3. Teste de Login Incorreto
const failedLogin = await authenticateUser('biazotto', 'SenhaIncorreta999*', '192.168.1.100');
assert.equal(failedLogin.success, false);
assert.equal(failedLogin.error, 'Credenciais inválidas.');
console.log('✔ 3. Login incorreto rejeitado sem revelar detalhes');

// 4. Teste de Login Correto
const goodLogin = await authenticateUser('biazotto', testInitialPassword, '192.168.1.100');
assert.equal(goodLogin.success, true);
assert.ok(goodLogin.sessionToken, 'Deve gerar sessionToken');
assert.ok(goodLogin.csrfToken, 'Deve gerar csrfToken');
console.log('✔ 4. Login correto autenticado com token de sessão e CSRF');

// 5. Validação de Sessão
const validSession = await validateSession(goodLogin.sessionToken);
assert.ok(validSession, 'Sessão deve ser válida');
assert.equal(validSession.username, 'biazotto');
console.log('✔ 5. Sessão validada com sucesso no servidor');

// 6. Teste de Rate Limiting (Brute Force)
const testIp = '10.0.0.99';
for (let i = 0; i < 5; i++) {
  await authenticateUser('biazotto', 'wrong_pass_' + i, testIp);
}
const blockedCheck = await checkRateLimit(testIp, 'biazotto');
assert.equal(blockedCheck.blocked, true, 'IP e usuário devem estar bloqueados após 5 tentativas consecutivas');
const blockedAttempt = await authenticateUser('biazotto', 'qualquer', testIp);
assert.equal(blockedAttempt.status, 429, 'Tentativa bloqueada deve retornar status 429');
// Limpa os registros de teste de força bruta para isolamento dos demais testes
await db.run('DELETE FROM login_attempts');
console.log('✔ 6. Bloqueio por força bruta (Rate Limiting) validado');

// 7. Teste de Proteção CSRF
assert.equal(verifyCsrf(goodLogin.csrfToken, goodLogin.csrfToken), true);
assert.equal(verifyCsrf('token_forjado', goodLogin.csrfToken), false);
assert.equal(verifyCsrf('', goodLogin.csrfToken), false);
console.log('✔ 7. Proteção CSRF verificada');

// 8. Teste de Sanitização e Proteção contra XSS
const maliciousInput = '<script>alert(1)</script><iframe src="malicious.com"></iframe><b>Texto Aprovado</b><a href="javascript:alert(2)">Link</a>';
const sanitized = sanitizeContent(maliciousInput);
assert.ok(!sanitized.includes('<script>'), 'Deve remover script');
assert.ok(!sanitized.includes('<iframe>'), 'Deve remover iframe');
assert.ok(!sanitized.includes('javascript:'), 'Deve neutralizar links javascript');
assert.ok(sanitized.includes('<b>Texto Aprovado</b>'), 'Deve preservar tags de formatação permitidas');

assert.throws(() => {
  sanitizeContent('Aqui está o bloco veja quem já voou conosco com empresários');
}, /não permitido pelas diretrizes da marca Biazotto/, 'Deve bloquear termos proibidos pelo manual de marca');
console.log('✔ 8. Sanitização de conteúdo e regras de marca validadas');

// 9. Teste de Edição de Bloco e Persistência
const blockId = 'blk-h-hero-title';
const updatedBlock = await updateBlock(blockId, {
  content: { text: 'Sua viagem começa com a estratégia perfeita da Biazotto.' }
}, adminUser.id);
assert.equal(updatedBlock.content.text, 'Sua viagem começa com a estratégia perfeita da Biazotto.');

const draft = await getDraftContent();
const homePage = draft.pages.find(p => p.slug === '/');
const heroSec = homePage.sections.find(s => s.section_key === 'hero');
const titleBlk = heroSec.blocks.find(b => b.id === blockId);
assert.equal(titleBlk.content.text, 'Sua viagem começa com a estratégia perfeita da Biazotto.');
console.log('✔ 9. Edição de bloco persistida no rascunho');

// 10. Teste de Publicação e Versionamento Imutável
const pubResult = await publishDraft(adminUser.id, 'Atualização de título Hero');
assert.ok(pubResult.version >= 2, 'Versão publicada deve ser incrementada');
assert.equal(pubResult.changeSummary, 'Atualização de título Hero');

const published = await getPublishedContent();
assert.equal(published.version, pubResult.version);
console.log(`✔ 10. Publicação efetuada com criação da Versão #${pubResult.version}`);

// 11. Teste de Reordenação e Modificação de Seções
const sectionIds = heroSec ? [heroSec.id] : [];
const reorderRes = await reorderSections('page-home', sectionIds, adminUser.id);
assert.equal(reorderRes.success, true);
console.log('✔ 11. Reordenação de seções validada');

// 12. Teste de Upload de Imagem e Verificação de Magic Bytes
// Cria buffer PNG válido: 89 50 4E 47 0D 0A 1A 0A + 20 bytes
const validPngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 0x08, 0x06, 0x00, 0x00, 0x00]);
const pngCheck = validateImageBuffer(validPngBuffer);
assert.equal(pngCheck.valid, true);
assert.equal(pngCheck.mime, 'image/png');

// Cria buffer inválido / arquivo malicioso disfarçado de imagem
const fakeSvgBuffer = Buffer.from('<svg onload="alert(1)"><circle cx="50" cy="50" r="40"/></svg>');
const svgCheck = validateImageBuffer(fakeSvgBuffer);
assert.equal(svgCheck.valid, false, 'SVG deve ser bloqueado');

const uploadedMedia = await handleImageUpload(validPngBuffer, 'teste_imagem.png', 'Imagem de teste', adminUser.id);
assert.ok(uploadedMedia.id, 'Deve registrar mídia no banco');
assert.ok(uploadedMedia.url.startsWith('/uploads/'), 'Deve gerar URL em /uploads/');
console.log('✔ 12. Validação por magic bytes e upload seguro validados');

// 13. Teste de Edição de Menus e Bloqueio de URLs Inseguras
assert.rejects(async () => {
  await updateNavigation([
    { label: 'Menu Malicioso', url: 'javascript:alert(1)' }
  ], adminUser.id);
}, /URL insegura detectada/, 'Deve bloquear URLs com protocolo javascript:');

const safeMenus = [
  { label: 'Início', url: '/', order_index: 0 },
  { label: 'A Biazotto', url: '/sobre/', order_index: 1 }
];
const menuUpdate = await updateNavigation(safeMenus, adminUser.id);
assert.equal(menuUpdate.success, true);
console.log('✔ 13. Validação e integridade dos menus verificadas');

// 14. Teste de Histórico e Restauração de Versão Anterior
const versionsList = await listPublishedVersions();
assert.ok(versionsList.length >= 2, 'Deve conter pelo menos 2 versões publicadas');

const restoreRes = await restoreVersion(1, adminUser.id);
assert.ok(restoreRes.version > pubResult.version, 'Restauração deve gerar uma nova versão imutável');
assert.ok(restoreRes.summary.includes('Restauração para o estado da Versão #1'));
console.log(`✔ 14. Restauração de versão anterior (Rollback) executada com sucesso -> Nova Versão #${restoreRes.version}`);

// 15. Teste de Troca de Senha com Invalidação de Sessões
const newPassword = 'NovaSenhaUltraSegura*2026';
const passChange = await changeUserPassword(adminUser.id, testInitialPassword, newPassword);
assert.equal(passChange.success, true);

// Sessão anterior deve ter sido revogada
const oldSessionCheck = await validateSession(goodLogin.sessionToken);
assert.equal(oldSessionCheck, null, 'Sessão anterior deve ser invalidada após troca de senha');

// Nova senha deve permitir autenticação
const newLogin = await authenticateUser('biazotto', newPassword, '192.168.1.100');
assert.equal(newLogin.success, true, 'Deve autenticar com a nova senha');

// Restaura a senha inicial para manter idempotência dos testes
await changeUserPassword(adminUser.id, newPassword, testInitialPassword);
console.log('✔ 15. Troca de senha realizada com invalidação total de sessões anteriores');

// 16. Teste de Registro de Auditoria
const auditLogs = await getAuditLogs(10);
assert.ok(auditLogs.length > 0, 'Deve registrar logs de auditoria para ações sensíveis');
console.log('✔ 16. Registros de auditoria (Audit Logs) persistidos');

console.log('\n======================================================');
console.log('TODOS OS 16 TESTES AUTOMATIZADOS PASSARAM COM SUCESSO!');
console.log('======================================================\n');
