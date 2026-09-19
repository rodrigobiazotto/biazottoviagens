# Biazotto Gestão de Viagens e Milhas — CMS & Plataforma Web

Sistema web completo e editável para a **Biazotto Gestão de Viagens e Milhas**, preservando integralmente a identidade visual da marca, a responsividade (360px a 1920px), todas as páginas existentes e as diretrizes corporativas.

---

## 1. Arquitetura Implementada

A aplicação foi desenvolvida com arquitetura híbrida de alto desempenho e segurança:

- **Frontend Público & SPA:** HTML5 semântico, Vanilla CSS modular e JavaScript nativo com roteamento client-side, pré-renderização estática, Service Worker (PWA offline) e hidratação dinâmica via API `/api/content/published`.
- **Painel Administrativo:** Interface acessível (WCAG 2.1 AA) com foco controlado, atalhos de teclado (Escape para fechar), barra superior fixa de edição, contornos contextuais e painel lateral expansível (gaveta responsiva em dispositivos móveis).
- **Backend & APIs:** Servidor HTTP nativo em Node.js (v24 native `node:sqlite`) e compatibilidade total com **Cloudflare Workers** via `worker.js`.
- **Banco de Dados Relacional:** SQLite nativo local e **Cloudflare D1** em produção.
- **Armazenamento de Mídia:** Diretório `/uploads/` local com verificação estrita de *magic bytes* (PNG, JPEG, WebP, AVIF) e suporte direto a **Cloudflare R2**.
- **Segurança:** Hash de senhas via bcrypt (12 rounds), cookies `HttpOnly`, `SameSite=Strict`, `Secure`, tokens CSRF dinâmicos, cabeçalhos de segurança (CSP, nosniff, frame-options), rate limiting persistente contra força bruta e sanitização estrita de conteúdo.

---

## 2. Estrutura de Arquivos

```
dist/
├── assets/
│   ├── admin.css          # Estilização da barra de edição, modais e painel lateral
│   ├── admin.js           # Lógica do painel dev, modal acessível e edição contextual
│   ├── site.css           # Estilos principais da marca Biazotto
│   ├── site.js            # Roteamento SPA, sincronização CMS e Service Worker
│   └── ...                # Imagens, logos e ícones da marca
├── data/
│   └── biazotto.sqlite    # Banco de dados relacional local
├── server/
│   ├── auth.js            # Autenticação, bcrypt, sessões, CSRF e rate limiting
│   ├── content.js         # Gerenciamento de blocos, seções, rascunhos e versões
│   ├── db.js              # Adaptador de banco de dados (Node.js 24 + Cloudflare D1)
│   ├── index.js           # Servidor HTTP, roteamento de APIs e arquivos estáticos
│   ├── media.js           # Validador de magic bytes e upload para disco/R2
│   ├── migrations.sql     # DDL com todas as tabelas e índices
│   ├── seed.js            # Migração automática e idempotente do conteúdo inicial
│   └── worker.js          # Entrypoint para Cloudflare Workers
├── tests/
│   └── admin_cms.test.mjs # Suíte automatizada com 16 testes de segurança e CMS
├── uploads/               # Armazenamento de imagens enviadas pelo editor
├── .env.example           # Modelo seguro de variáveis de ambiente
├── package.json           # Dependências e scripts do projeto
├── wrangler.jsonc         # Configuração de deploy no Cloudflare Workers
└── index.html             # Shell principal com gatilho "Login Dev" no rodapé
```

---

## 3. Variáveis de Ambiente Obrigatórias

Configure as variáveis criando o arquivo `.env` a partir do `.env.example`:

```env
DEV_ADMIN_USERNAME=
DEV_ADMIN_PASSWORD=
SESSION_SECRET=
PORT=3000
NODE_ENV=production
```

> **IMPORTANTE:** Nunca versione o arquivo `.env` nem comite senhas em texto puro. Na primeira inicialização, o servidor criará o hash bcrypt seguro do administrador e registrará a operação no log de auditoria. Após a inicialização, remova `DEV_ADMIN_PASSWORD` do ambiente e efetue a troca periódica da senha pelo painel administrativo.

---

## 4. Desenvolvimento e Execução Local

### Pré-requisitos
- Node.js v24+
- npm v10+

### Instalação e Inicialização
```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Preencha DEV_ADMIN_USERNAME e DEV_ADMIN_PASSWORD no arquivo .env

# 3. Executar suíte de testes
npm test

# 4. Iniciar o servidor de desenvolvimento
npm start
```
O servidor estará acessível em `http://localhost:3000`.

---

## 5. Acesso ao Painel ("Login Dev")

1. Acesse o site no navegador.
2. Role até o rodapé e clique na opção discreta **“Login Dev”** ao lado do copyright.
3. No modal acessível, insira o usuário e a senha configurados no ambiente.
4. Clique em **“Entrar no painel”**.
5. A barra administrativa superior fixa será ativada com o selo **“Modo de edição ativo”**.

---

## 6. Fluxo de Edição, Rascunho e Publicação

1. **Modo Editar:** Clique em qualquer bloco de texto ou seção da página para abrir o painel lateral de propriedades.
2. **Formatação Segura:** Utilize os botões controlados (Negrito, Itálico, Listas). Todas as entradas são sanitizadas no servidor contra XSS e injeção.
3. **Reordenação de Seções:** Utilize os botões `↑ Mover acima` e `↓ Mover abaixo` presentes no cabeçalho de cada seção (acessível por teclado).
4. **Salvar Rascunho:** Clique no botão `💾 Rascunho` na barra superior para persistir as alterações sem afetar a versão pública dos visitantes.
5. **Publicar Alterações:** Clique em `🚀 Publicar`. Informe um resumo das mudanças. O sistema criará um novo snapshot imutável em `published_versions`, atualizará a versão ativa e tornará as mudanças visíveis para todos os visitantes imediatamente.

---

## 7. Histórico e Restauração de Versões (Rollback)

1. Na barra superior, clique em `📜 Histórico`.
2. O sistema exibirá a lista das versões publicadas com número, data/hora e resumo.
3. Digite o número da versão desejada para restaurar.
4. Ao confirmar, o sistema cria uma **nova versão imutável** restaurando os dados exatos daquele snapshot anterior, mantendo a integridade de todo o histórico.

---

## 8. Troca de Senha do Administrador

1. Na barra superior, clique em `⚙️ Senha`.
2. Informe a senha atual e defina a nova senha (mínimo de 8 caracteres).
3. O servidor gerará o novo hash bcrypt (12 rounds) e **invalidará imediatamente todas as sessões anteriores**, exigindo novo login.

---

## 9. Deploy na Cloudflare (Workers + D1 + R2)

### 1. Criar o Banco D1
```bash
npx wrangler d1 create biazotto-cms-db
```
Copie o `database_id` retornado e atualize o arquivo `wrangler.jsonc`.

### 2. Aplicar as Migrações no D1
```bash
npx wrangler d1 execute biazotto-cms-db --file=./server/migrations.sql
```

### 3. Criar o Bucket R2 para Imagens
```bash
npx wrangler r2 bucket create biazotto-media
```

### 4. Configurar Secrets no Cloudflare Workers
```bash
npx wrangler secret put DEV_ADMIN_USERNAME
npx wrangler secret put DEV_ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET
```

### 5. Publicar o Projeto
```bash
npx wrangler deploy
```

---

## 10. Procedimento de Backup e Restauração do Banco de Dados

### Backup Local (SQLite)
```bash
# Copia o arquivo SQLite para diretório de backup seguro
cp data/biazotto.sqlite backups/biazotto_backup_$(date +%Y%m%d_%H%M%S).sqlite
```

### Backup Cloudflare D1
```bash
npx wrangler d1 export biazotto-cms-db --output=./backups/d1_backup_$(date +%Y%m%d).sql
```

### Restauração Cloudflare D1
```bash
npx wrangler d1 execute biazotto-cms-db --file=./backups/d1_backup_20260919.sql
```
