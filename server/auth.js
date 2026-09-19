// Módulo de Autenticação e Segurança - Biazotto CMS
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { db } from './db.js';

const SESSION_COOKIE_NAME = 'biazotto_session';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 horas
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos

// 1. Inicializa o administrador com hash seguro na primeira execução
export async function ensureInitialAdminUser() {
  const username = process.env.DEV_ADMIN_USERNAME || 'biazotto';
  const initialPassword = process.env.DEV_ADMIN_PASSWORD;

  const existing = await db.get('SELECT id, username FROM users WHERE username = ?', [username]);
  if (existing) {
    return existing;
  }

  if (!initialPassword) {
    console.warn('[Segurança] DEV_ADMIN_PASSWORD não configurada no ambiente. Usuário admin não criado.');
    return null;
  }

  const saltRounds = 12;
  const hash = bcrypt.hashSync(initialPassword, saltRounds);
  const now = Date.now();
  const userId = 'usr-' + crypto.randomUUID();

  await db.run(
    'INSERT INTO users (id, username, password_hash, must_change_password, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)',
    [userId, username, hash, now, now]
  );

  await db.run(
    'INSERT INTO audit_logs (id, action, user_id, ip_address, details_json, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ['log-admin-init-' + now, 'ADMIN_USER_INITIALIZED', userId, '127.0.0.1', JSON.stringify({ username }), now]
  );

  console.log(`[Segurança] Usuário administrador "${username}" inicializado com hash seguro bcrypt.`);
  return { id: userId, username };
}

// 2. Verificação de Bloqueio por Força Bruta (Rate Limiting)
export async function checkRateLimit(ip, username) {
  const windowStart = Date.now() - LOCKOUT_WINDOW_MS;
  const attempts = await db.all(
    'SELECT count(*) as count FROM login_attempts WHERE (ip_address = ? OR username = ?) AND success = 0 AND attempted_at > ?',
    [ip, username, windowStart]
  );

  const count = attempts[0]?.count || 0;
  if (count >= MAX_LOGIN_ATTEMPTS) {
    const oldestInWindow = await db.get(
      'SELECT attempted_at FROM login_attempts WHERE (ip_address = ? OR username = ?) AND success = 0 AND attempted_at > ? ORDER BY attempted_at ASC LIMIT 1',
      [ip, username, windowStart]
    );
    const expiresAt = oldestInWindow ? oldestInWindow.attempted_at + LOCKOUT_WINDOW_MS : Date.now() + LOCKOUT_WINDOW_MS;
    const remainingSeconds = Math.ceil((expiresAt - Date.now()) / 1000);
    return { blocked: true, remainingSeconds: Math.max(1, remainingSeconds) };
  }
  return { blocked: false, remainingAttempts: MAX_LOGIN_ATTEMPTS - count };
}

// 3. Autenticação com Geração de Sessão Segura
export async function authenticateUser(username, password, ip = '127.0.0.1', userAgent = '') {
  const rateLimit = await checkRateLimit(ip, username);
  if (rateLimit.blocked) {
    return {
      success: false,
      status: 429,
      error: `Muitas tentativas inválidas. Acesso temporariamente bloqueado por ${rateLimit.remainingSeconds} segundos.`
    };
  }

  const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
  const now = Date.now();

  const isPasswordValid = user ? bcrypt.compareSync(password, user.password_hash) : false;

  if (!user || !isPasswordValid) {
    await db.run(
      'INSERT INTO login_attempts (id, ip_address, username, attempted_at, success) VALUES (?, ?, ?, ?, 0)',
      ['att-' + crypto.randomUUID(), ip, username, now]
    );
    await db.run(
      'INSERT INTO audit_logs (id, action, user_id, ip_address, details_json, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['log-auth-fail-' + now, 'LOGIN_FAILED', user?.id || null, ip, JSON.stringify({ username, userAgent }), now]
    );
    return {
      success: false,
      status: 401,
      error: 'Credenciais inválidas.'
    };
  }

  // Sucesso: registra tentativa bem-sucedida
  await db.run(
    'INSERT INTO login_attempts (id, ip_address, username, attempted_at, success) VALUES (?, ?, ?, ?, 1)',
    ['att-' + crypto.randomUUID(), ip, username, now]
  );

  // Gera token de sessão criptográfico e token CSRF
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
  const csrfToken = crypto.randomBytes(24).toString('hex');
  const sessionId = 'ses-' + crypto.randomUUID();
  const expiresAt = now + SESSION_DURATION_MS;

  await db.run(
    'INSERT INTO sessions (id, user_id, token_hash, csrf_token, ip_address, user_agent, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [sessionId, user.id, tokenHash, csrfToken, ip, userAgent, now, expiresAt]
  );

  await db.run(
    'INSERT INTO audit_logs (id, action, user_id, ip_address, details_json, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ['log-login-' + now, 'LOGIN_SUCCESS', user.id, ip, JSON.stringify({ username }), now]
  );

  return {
    success: true,
    sessionToken,
    csrfToken,
    user: {
      id: user.id,
      username: user.username,
      mustChangePassword: !!user.must_change_password
    }
  };
}

// 4. Validação de Sessão via Cookie
export async function validateRequestSession(req) {
  const cookieHeader = req.headers.cookie || req.headers.get?.('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
  if (!match) return null;

  const sessionToken = match[1];
  const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
  const now = Date.now();

  const session = await db.get(
    'SELECT s.*, u.username, u.must_change_password FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token_hash = ? AND s.expires_at > ?',
    [tokenHash, now]
  );

  if (!session) return null;

  return {
    sessionId: session.id,
    userId: session.user_id,
    username: session.username,
    mustChangePassword: !!session.must_change_password,
    csrfToken: session.csrf_token
  };
}

// 5. Invalidação de Sessão (Logout)
export async function logoutSession(req) {
  const session = await validateRequestSession(req);
  if (!session) return true;

  await db.run('DELETE FROM sessions WHERE id = ?', [session.sessionId]);
  await db.run(
    'INSERT INTO audit_logs (id, action, user_id, ip_address, details_json, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ['log-logout-' + Date.now(), 'LOGOUT', session.userId, '127.0.0.1', JSON.stringify({ username: session.username }), Date.now()]
  );
  return true;
}

// 6. Troca de Senha com Invalidação de Sessões Anteriores
export async function changeUserPassword(userId, currentPassword, newPassword, ip = '127.0.0.1') {
  const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
  if (!user) {
    return { success: false, status: 404, error: 'Usuário não encontrado.' };
  }

  if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
    return { success: false, status: 400, error: 'Senha atual incorreta.' };
  }

  if (!newPassword || newPassword.length < 8) {
    return { success: false, status: 400, error: 'A nova senha deve ter no mínimo 8 caracteres.' };
  }

  const saltRounds = 12;
  const newHash = bcrypt.hashSync(newPassword, saltRounds);
  const now = Date.now();

  await db.run(
    'UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = ? WHERE id = ?',
    [newHash, now, userId]
  );

  // Invalida todas as sessões anteriores para máxima segurança
  await db.run('DELETE FROM sessions WHERE user_id = ?', [userId]);

  // Cria nova sessão ativa para o usuário
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
  const csrfToken = crypto.randomBytes(24).toString('hex');
  const sessionId = 'ses-' + crypto.randomUUID();
  const expiresAt = now + SESSION_DURATION_MS;

  await db.run(
    'INSERT INTO sessions (id, user_id, token_hash, csrf_token, ip_address, user_agent, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [sessionId, userId, tokenHash, csrfToken, ip, 'PasswordChange', now, expiresAt]
  );

  await db.run(
    'INSERT INTO audit_logs (id, action, user_id, ip_address, details_json, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ['log-pwd-' + now, 'PASSWORD_CHANGED', userId, ip, JSON.stringify({ username: user.username }), now]
  );

  return {
    success: true,
    sessionToken,
    csrfToken,
    user: { id: userId, username: user.username, mustChangePassword: false }
  };
}

// 7. Auxiliar de Cookie Seguro
export function buildSessionCookie(token, isSecure = false, maxAgeMs = SESSION_DURATION_MS) {
  const parts = [
    `${SESSION_COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict'
  ];
  if (maxAgeMs > 0) {
    parts.push(`Max-Age=${Math.floor(maxAgeMs / 1000)}`);
  } else {
    parts.push('Max-Age=0');
  }
  if (isSecure || process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }
  return parts.join('; ');
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}

export function parseCookies(cookieStr) {
  const list = {};
  if (!cookieStr) return list;
  cookieStr.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    list[parts.shift().trim()] = decodeURI(parts.join('='));
  });
  return list;
}

export function verifyCsrf(headerToken, sessionToken) {
  if (!headerToken || !sessionToken) return false;
  return headerToken.trim() === sessionToken.trim();
}

// Convenience aliases for flexible consumption
export const loginAdmin = authenticateUser;
export const changeAdminPassword = changeUserPassword;
export const serializeSessionCookie = buildSessionCookie;

export async function validateSession(token) {
  if (!token) return null;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const now = Date.now();

  const session = await db.get(
    'SELECT s.*, u.username, u.must_change_password FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token_hash = ? AND s.expires_at > ?',
    [tokenHash, now]
  );

  if (!session) return null;

  return {
    sessionId: session.id,
    userId: session.user_id,
    username: session.username,
    mustChangePassword: !!session.must_change_password,
    csrfToken: session.csrf_token
  };
}

