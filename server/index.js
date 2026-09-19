import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { initDb } from './db.js';
import { seedInitialContent } from './seed.js';
import {
  ensureInitialAdminUser,
  loginAdmin,
  validateSession,
  logoutSession,
  changeAdminPassword,
  verifyCsrf,
  serializeSessionCookie,
  clearSessionCookie,
  parseCookies
} from './auth.js';
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
  getAuditLogs
} from './content.js';
import { handleImageUpload, listMediaRecords } from './media.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '..');
const PORT = process.env.PORT || 3000;

// Security headers applied to all responses
function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; script-src 'self' 'unsafe-inline'; connect-src 'self';"
  );
}

// Helper to parse JSON request body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) { // 5MB json limit
        reject(new Error('Payload muito grande'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('JSON inválido'));
      }
    });
    req.on('error', reject);
  });
}

// Helper to parse binary body for file upload
function parseBinaryBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalLen = 0;
    req.on('data', chunk => {
      chunks.push(chunk);
      totalLen += chunk.length;
      if (totalLen > 15 * 1024 * 1024) { // 15MB file limit
        reject(new Error('Arquivo excede o limite de tamanho permitido'));
      }
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    req.on('error', reject);
  });
}

// JSON response helper
function sendJson(res, status, data, extraHeaders = {}) {
  setSecurityHeaders(res);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    ...extraHeaders
  });
  res.end(JSON.stringify(data));
}

// Error response helper
function sendError(res, status, message) {
  sendJson(res, status, { success: false, error: message });
}

// Auth middleware: extracts session and verifies admin access
async function authenticateRequest(req) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionToken = cookies['biazotto_session'];
  const session = await validateSession(sessionToken);
  if (!session) return null;
  return session;
}

// CSRF validation helper for mutating requests
function checkCsrfHeader(req, session) {
  const csrfHeader = req.headers['x-csrf-token'];
  return verifyCsrf(csrfHeader, session.csrfToken);
}

// MIME types mapping for static file serving
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

// Static file server with path traversal protection
function serveStaticFile(req, res, filePath) {
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(DIST_DIR)) {
    sendError(res, 403, 'Acesso proibido');
    return;
  }

  fs.stat(resolved, (err, stat) => {
    if (err || !stat.isFile()) {
      // Fallback for HTML5 history API navigation: if request is GET and accepts HTML, serve index.html
      const accept = req.headers['accept'] || '';
      if (req.method === 'GET' && accept.includes('text/html')) {
        const indexHtml = path.join(DIST_DIR, 'index.html');
        fs.readFile(indexHtml, (err2, content) => {
          if (err2) {
            sendError(res, 404, 'Não encontrado');
            return;
          }
          setSecurityHeaders(res);
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(content);
        });
        return;
      }
      sendError(res, 404, 'Arquivo não encontrado');
      return;
    }

    const ext = path.extname(resolved).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    setSecurityHeaders(res);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });

    const stream = fs.createReadStream(resolved);
    stream.pipe(res);
  });
}

// Request handler router
async function handleRequest(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';

  // ----------------------------------------------------
  // PUBLIC CONTENT API
  // ----------------------------------------------------
  if (pathname === '/api/content/published' && method === 'GET') {
    try {
      const content = await getPublishedContent();
      return sendJson(res, 200, { success: true, data: content });
    } catch (err) {
      console.error('API Error /api/content/published:', err);
      return sendError(res, 500, 'Erro ao obter conteúdo publicado');
    }
  }

  // ----------------------------------------------------
  // AUTHENTICATION APIS
  // ----------------------------------------------------
  if (pathname === '/api/auth/login' && method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { username, password } = body;
      const userAgent = req.headers['user-agent'] || '';

      const authResult = await loginAdmin(username, password, ip, userAgent);
      if (!authResult.success) {
        return sendJson(res, 401, { success: false, error: authResult.error });
      }

      const isSecure = req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production';
      const cookieHeader = serializeSessionCookie(authResult.sessionToken, isSecure);

      return sendJson(
        res,
        200,
        {
          success: true,
          user: authResult.user,
          csrfToken: authResult.csrfToken,
        },
        { 'Set-Cookie': cookieHeader }
      );
    } catch (err) {
      console.error('Login Error:', err);
      return sendError(res, 400, 'Erro ao processar login.');
    }
  }

  if (pathname === '/api/auth/session' && method === 'GET') {
    const session = await authenticateRequest(req);
    if (!session) {
      return sendJson(res, 200, { authenticated: false });
    }
    return sendJson(res, 200, {
      authenticated: true,
      user: {
        id: session.userId,
        username: session.username,
        role: session.role
      },
      csrfToken: session.csrfToken
    });
  }

  if (pathname === '/api/auth/logout' && method === 'POST') {
    const session = await authenticateRequest(req);
    if (session) {
      const cookies = parseCookies(req.headers.cookie);
      await logoutSession(cookies['biazotto_session']);
    }
    const clearCookie = clearSessionCookie();
    return sendJson(res, 200, { success: true }, { 'Set-Cookie': clearCookie });
  }

  if (pathname === '/api/auth/change-password' && method === 'POST') {
    const session = await authenticateRequest(req);
    if (!session) return sendError(res, 401, 'Sessão expirada ou não autenticada.');
    if (!checkCsrfHeader(req, session)) return sendError(res, 403, 'Token CSRF inválido.');

    try {
      const body = await parseJsonBody(req);
      const { currentPassword, newPassword } = body;
      await changeAdminPassword(session.userId, currentPassword, newPassword);
      
      const clearCookie = clearSessionCookie();
      return sendJson(res, 200, {
        success: true,
        message: 'Senha alterada com sucesso. Faça login novamente com a nova senha.'
      }, { 'Set-Cookie': clearCookie });
    } catch (err) {
      return sendError(res, 400, err.message || 'Erro ao alterar senha.');
    }
  }

  // ----------------------------------------------------
  // PROTECTED ADMIN APIS
  // ----------------------------------------------------
  if (pathname.startsWith('/api/admin/')) {
    const session = await authenticateRequest(req);
    if (!session) {
      return sendError(res, 401, 'Acesso não autorizado. Por favor faça login.');
    }

    // CSRF check on mutating methods
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      if (!checkCsrfHeader(req, session)) {
        return sendError(res, 403, 'Token CSRF inválido ou ausente.');
      }
    }

    try {
      // 1. Get draft content tree
      if (pathname === '/api/admin/content/draft' && method === 'GET') {
        const draft = await getDraftContent();
        return sendJson(res, 200, { success: true, data: draft });
      }

      // 2. Update block content
      const blockMatch = pathname.match(/^\/api\/admin\/blocks\/([a-zA-Z0-9_-]+)$/);
      if (blockMatch && method === 'PATCH') {
        const blockId = blockMatch[1];
        const body = await parseJsonBody(req);
        const updated = await updateBlock(blockId, body, session.userId);
        return sendJson(res, 200, { success: true, data: updated });
      }

      // 3. Reorder sections
      if (pathname === '/api/admin/sections/reorder' && method === 'PATCH') {
        const body = await parseJsonBody(req);
        const { pageId, sectionIds } = body;
        const result = await reorderSections(pageId, sectionIds, session.userId);
        return sendJson(res, 200, { success: true, data: result });
      }

      // 4. Update section properties
      const sectionMatch = pathname.match(/^\/api\/admin\/sections\/([a-zA-Z0-9_-]+)$/);
      if (sectionMatch && method === 'PATCH') {
        const sectionId = sectionMatch[1];
        const body = await parseJsonBody(req);
        const updated = await updateSection(sectionId, body, session.userId);
        return sendJson(res, 200, { success: true, data: updated });
      }

      // 5. Duplicate section
      if (pathname === '/api/admin/sections/duplicate' && method === 'POST') {
        const body = await parseJsonBody(req);
        const duplicated = await duplicateSection(body.sectionId, session.userId);
        return sendJson(res, 200, { success: true, data: duplicated });
      }

      // 6. Delete section
      if (sectionMatch && method === 'DELETE') {
        const sectionId = sectionMatch[1];
        const result = await deleteSection(sectionId, session.userId);
        return sendJson(res, 200, { success: true, data: result });
      }

      // 7. Update menus
      if (pathname === '/api/admin/menus' && method === 'PUT') {
        const body = await parseJsonBody(req);
        const result = await updateNavigation(body.items, session.userId);
        return sendJson(res, 200, { success: true, data: result });
      }

      // 8. Publish draft
      if (pathname === '/api/admin/publish' && method === 'POST') {
        const body = await parseJsonBody(req);
        const result = await publishDraft(session.userId, body.summary || 'Publicação de alterações');
        return sendJson(res, 200, { success: true, data: result });
      }

      // 9. List published versions
      if (pathname === '/api/admin/versions' && method === 'GET') {
        const versions = await listPublishedVersions();
        return sendJson(res, 200, { success: true, data: versions });
      }

      // 10. Restore version
      const restoreMatch = pathname.match(/^\/api\/admin\/restore\/(\d+)$/);
      if (restoreMatch && method === 'POST') {
        const versionNumber = parseInt(restoreMatch[1], 10);
        const result = await restoreVersion(versionNumber, session.userId);
        return sendJson(res, 200, { success: true, data: result });
      }

      // 11. Media upload
      if (pathname === '/api/admin/media/upload' && method === 'POST') {
        const originalFilename = decodeURIComponent(req.headers['x-filename'] || 'imagem.png');
        const altText = decodeURIComponent(req.headers['x-alt-text'] || '');
        const buffer = await parseBinaryBody(req);
        const mediaRecord = await handleImageUpload(buffer, originalFilename, altText, session.userId);
        return sendJson(res, 200, { success: true, data: mediaRecord });
      }

      // 12. List media
      if (pathname === '/api/admin/media' && method === 'GET') {
        const list = await listMediaRecords();
        return sendJson(res, 200, { success: true, data: list });
      }

      // 13. Audit logs
      if (pathname === '/api/admin/audit-logs' && method === 'GET') {
        const logs = await getAuditLogs();
        return sendJson(res, 200, { success: true, data: logs });
      }

      return sendError(res, 404, 'Endpoint de administração não encontrado');
    } catch (err) {
      console.error('Admin API error:', err);
      return sendError(res, 400, err.message || 'Erro ao processar solicitação');
    }
  }

  // ----------------------------------------------------
  // STATIC FILES SERVING
  // ----------------------------------------------------
  let filePath = path.join(DIST_DIR, pathname);
  // Directory index handling
  if (pathname.endsWith('/') || !path.extname(pathname)) {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    } else if (fs.existsSync(`${filePath}.html`)) {
      filePath = `${filePath}.html`;
    } else {
      filePath = path.join(DIST_DIR, 'index.html');
    }
  }

  serveStaticFile(req, res, filePath);
}

// Helper to bind server with fallback if port is already occupied
function listenWithFallback(port, maxPort) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handleRequest);
    server.listen(port, () => {
      server.actualPort = port;
      console.log(`[Biazotto CMS] Servidor em execução na porta ${port}`);
      console.log(`[Biazotto CMS] Acesse: http://localhost:${port}`);
      resolve(server);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE' && port < maxPort) {
        console.warn(`[Biazotto CMS] Porta ${port} já está em uso por outro aplicativo. Tentando porta ${port + 1}...`);
        resolve(listenWithFallback(port + 1, maxPort));
      } else {
        reject(err);
      }
    });
  });
}

// Server bootstrap
export async function startServer(initialPort = PORT) {
  try {
    // 1. Initialize DB migrations
    await initDb();

    // 2. Ensure initial seed data is loaded
    await seedInitialContent();

    // 3. Ensure initial admin user is set up with bcrypt hash
    await ensureInitialAdminUser();

    // 4. Create and start HTTP server with auto port fallback
    const targetPort = Number(initialPort) || 3000;
    const server = await listenWithFallback(targetPort, targetPort + 20);
    return server;
  } catch (err) {
    console.error('[Biazotto CMS] Falha crítica na inicialização:', err);
    throw err;
  }
}

// Auto-run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer().then((server) => {
    const port = server.actualPort || PORT;
    const url = `http://localhost:${port}`;
    console.log(`[Biazotto CMS] Abrindo navegador automaticamente em: ${url}`);
    try {
      if (process.platform === 'win32') {
        exec(`start ${url}`);
      } else if (process.platform === 'darwin') {
        exec(`open ${url}`);
      } else {
        exec(`xdg-open ${url}`);
      }
    } catch {
      // Ignorar caso o ambiente não suporte abertura direta de janela
    }
  }).catch((err) => {
    console.error('[Biazotto CMS] Erro fatal na inicialização:', err);
    process.exit(1);
  });
}

