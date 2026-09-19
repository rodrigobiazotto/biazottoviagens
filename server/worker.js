// Cloudflare Workers Entrypoint para Biazotto CMS
import { DatabaseAdapter } from './db.js';
import {
  authenticateUser,
  checkRateLimit,
  changeUserPassword,
  buildSessionCookie,
  clearSessionCookie,
  verifyCsrf
} from './auth.js';
import {
  sanitizeContent,
  APPROVED_COLORS
} from './content.js';
import { validateImageBuffer } from './media.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method.toUpperCase();

    // Attach D1 adapter if in Workers environment
    const db = new DatabaseAdapter(env.DB);

    // Security Headers
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; script-src 'self' 'unsafe-inline'; connect-src 'self';"
    };

    const jsonResponse = (data, status = 200, extraHeaders = {}) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          ...securityHeaders,
          ...extraHeaders
        }
      });
    };

    // Public API: Published content
    if (pathname === '/api/content/published' && method === 'GET') {
      try {
        const active = await db.get(
          'SELECT version_number, snapshot_json, summary, created_at FROM published_versions ORDER BY version_number DESC LIMIT 1'
        );
        if (active && active.snapshot_json) {
          const snapshot = JSON.parse(active.snapshot_json);
          return jsonResponse({
            success: true,
            data: {
              version: active.version_number,
              publishedAt: active.created_at,
              summary: active.summary,
              ...snapshot
            }
          });
        }
        return jsonResponse({ success: true, data: { pages: [], navigation: [], settings: {} } });
      } catch (err) {
        return jsonResponse({ success: false, error: 'Erro ao carregar conteúdo' }, 500);
      }
    }

    // Auth helpers for Workers
    const getSession = async () => {
      const cookie = request.headers.get('cookie') || '';
      const match = cookie.match(/biazotto_session=([^;]+)/);
      if (!match) return null;
      const token = match[1];
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(token));
      const tokenHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
      const now = Date.now();
      return await db.get(
        'SELECT s.*, u.username, u.must_change_password FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token_hash = ? AND s.expires_at > ?',
        [tokenHash, now]
      );
    };

    // Auth APIs
    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const ip = request.headers.get('cf-connecting-ip') || '127.0.0.1';
      const userAgent = request.headers.get('user-agent') || '';

      const authResult = await authenticateUser(body.username, body.password, ip, userAgent);
      if (!authResult.success) {
        return jsonResponse({ success: false, error: authResult.error }, authResult.status || 401);
      }

      const cookie = buildSessionCookie(authResult.sessionToken, true);
      return jsonResponse(
        { success: true, user: authResult.user, csrfToken: authResult.csrfToken },
        200,
        { 'Set-Cookie': cookie }
      );
    }

    if (pathname === '/api/auth/session' && method === 'GET') {
      const session = await getSession();
      if (!session) return jsonResponse({ authenticated: false });
      return jsonResponse({
        authenticated: true,
        user: { id: session.user_id, username: session.username, mustChangePassword: !!session.must_change_password },
        csrfToken: session.csrf_token
      });
    }

    if (pathname === '/api/auth/logout' && method === 'POST') {
      const session = await getSession();
      if (session) {
        await db.run('DELETE FROM sessions WHERE id = ?', [session.id]);
      }
      return jsonResponse({ success: true }, 200, { 'Set-Cookie': clearSessionCookie() });
    }

    // Media Serving from R2 if /uploads/
    if (pathname.startsWith('/uploads/') && method === 'GET' && env.MEDIA_BUCKET) {
      const key = pathname.replace('/uploads/', '');
      const object = await env.MEDIA_BUCKET.get(key);
      if (!object) return new Response('Imagem não encontrada', { status: 404 });
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      return new Response(object.body, { headers });
    }

    // Fallback to static assets via Workers Assets binding
    if (env.ASSETS) {
      return await env.ASSETS.fetch(request);
    }

    return new Response('Recurso não encontrado', { status: 404 });
  }
};
