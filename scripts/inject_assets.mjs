import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '..');

const files = [
  'index.html',
  'sobre/index.html',
  'servicos/index.html',
  'como-funciona/index.html',
  'insights/index.html',
  'contato/index.html',
  'privacidade/index.html',
  'termos/index.html'
];

for (const rel of files) {
  const p = path.resolve(DIST_DIR, rel);
  if (!fs.existsSync(p)) continue;
  let content = fs.readFileSync(p, 'utf8');

  if (!content.includes('/assets/admin.css')) {
    content = content.replace(
      '<link rel="stylesheet" href="/assets/site.css">',
      '<link rel="stylesheet" href="/assets/site.css">\n  <link rel="stylesheet" href="/assets/admin.css">'
    );
  }

  if (!content.includes('/assets/admin.js')) {
    content = content.replace(
      '<script src="/assets/site.js" defer></script>',
      '<script src="/assets/site.js" defer></script>\n  <script src="/assets/admin.js" defer></script>'
    );
  }

  fs.writeFileSync(p, content, 'utf8');
  console.log('Injected admin assets in:', rel);
}
