import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Magic bytes definitions
const MAGIC_BYTES = {
  png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  jpeg: [0xFF, 0xD8, 0xFF],
  webp: [0x52, 0x49, 0x46, 0x46], // RIFF .... WEBP
  avif: [0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66], // ftypavif
};

/**
 * Validates buffer against allowed image types by inspection of magic bytes
 */
export function validateImageBuffer(buffer) {
  if (!buffer || buffer.length < 16) {
    return { valid: false, error: 'Arquivo inválido ou corrompido.' };
  }

  // Maximum allowed size: 10MB
  const MAX_SIZE = 10 * 1024 * 1024;
  if (buffer.length > MAX_SIZE) {
    return { valid: false, error: 'Tamanho excede o limite máximo permitido de 10MB.' };
  }

  // Check PNG
  if (buffer.length >= 8 && MAGIC_BYTES.png.every((b, i) => buffer[i] === b)) {
    let width = 0;
    let height = 0;
    if (buffer.length >= 24) {
      width = buffer.readUInt32BE(16);
      height = buffer.readUInt32BE(20);
    }
    return { valid: true, mime: 'image/png', ext: 'png', width, height };
  }

  // Check JPEG
  if (buffer.length >= 3 && MAGIC_BYTES.jpeg.every((b, i) => buffer[i] === b)) {
    let width = 0;
    let height = 0;
    let offset = 2;
    while (offset < buffer.length - 8) {
      if (buffer[offset] === 0xFF) {
        const marker = buffer[offset + 1];
        if ((marker >= 0xC0 && marker <= 0xC3) || (marker >= 0xC9 && marker <= 0xCB)) {
          height = buffer.readUInt16BE(offset + 5);
          width = buffer.readUInt16BE(offset + 7);
          break;
        } else if (marker === 0xD9 || marker === 0xDA) {
          break;
        } else {
          const len = buffer.readUInt16BE(offset + 2);
          offset += 2 + len;
          continue;
        }
      }
      offset++;
    }
    return { valid: true, mime: 'image/jpeg', ext: 'jpg', width, height };
  }

  // Check WebP (RIFF .... WEBP)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    let width = 0;
    let height = 0;
    const format = buffer.toString('ascii', 12, 16);
    if (format === 'VP8 ' && buffer.length >= 30) {
      width = buffer.readUInt16LE(26) & 0x3fff;
      height = buffer.readUInt16LE(28) & 0x3fff;
    } else if (format === 'VP8L' && buffer.length >= 25) {
      const b1 = buffer[21], b2 = buffer[22], b3 = buffer[23], b4 = buffer[24];
      width = 1 + (((b2 & 0x3f) << 8) | b1);
      height = 1 + (((b4 & 0xf) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
    } else if (format === 'VP8X' && buffer.length >= 30) {
      width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16));
      height = 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16));
    }
    return { valid: true, mime: 'image/webp', ext: 'webp', width, height };
  }

  // Check AVIF (ftypavif at offset 4)
  if (buffer.length >= 16) {
    const ftyp = buffer.toString('ascii', 4, 8);
    const brand = buffer.toString('ascii', 8, 12);
    if (ftyp === 'ftyp' && (brand === 'avif' || brand === 'avis' || brand === 'mif1')) {
      return { valid: true, mime: 'image/avif', ext: 'avif', width: 0, height: 0 };
    }
  }

  // Explicitly check for SVG or scripts
  const snippet = buffer.slice(0, 1024).toString('utf-8').toLowerCase();
  if (snippet.includes('<svg') || snippet.includes('<?xml') || snippet.includes('<script') || snippet.includes('<!doctype html')) {
    return { valid: false, error: 'Formato SVG, HTML ou script não é permitido por motivos de segurança.' };
  }

  return { valid: false, error: 'Formato de imagem não suportado. Utilize PNG, JPEG, WebP ou AVIF.' };
}

/**
 * Saves uploaded image to persistent storage (local uploads directory or R2)
 * and records it in media table
 */
export async function handleImageUpload(buffer, originalFilename, altText = '', userId = null, r2Bucket = null) {
  const check = validateImageBuffer(buffer);
  if (!check.valid) {
    throw new Error(check.error);
  }

  const hash = crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 12);
  const safeBase = path.basename(originalFilename, path.extname(originalFilename))
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .substring(0, 30);
  
  const finalFilename = `${safeBase}_${hash}.${check.ext}`;
  const fileUrl = `/uploads/${finalFilename}`;

  // If Cloudflare R2 bucket is provided
  if (r2Bucket && typeof r2Bucket.put === 'function') {
    await r2Bucket.put(finalFilename, buffer, {
      httpMetadata: { contentType: check.mime }
    });
  } else {
    // Local filesystem storage
    const targetPath = path.join(UPLOADS_DIR, finalFilename);
    fs.writeFileSync(targetPath, buffer);
  }

  // Insert into media database table matching migrations.sql
  const id = 'med-' + crypto.randomUUID();
  const now = Date.now();

  await db.run(
    'INSERT INTO media (id, filename, original_name, mime_type, size_bytes, width, height, alt_text, storage_path, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      id,
      finalFilename,
      originalFilename.substring(0, 100),
      check.mime,
      buffer.length,
      check.width || 0,
      check.height || 0,
      altText.substring(0, 255),
      fileUrl,
      now,
      userId || 'system'
    ]
  );

  return {
    id,
    filename: finalFilename,
    originalName: originalFilename,
    mimeType: check.mime,
    sizeBytes: buffer.length,
    width: check.width || 0,
    height: check.height || 0,
    altText,
    url: fileUrl,
    createdAt: now
  };
}

/**
 * List media records
 */
export async function listMediaRecords(limit = 50, offset = 0) {
  const rows = await db.all(
    `SELECT id, filename, original_name as originalName, mime_type as mimeType,
            size_bytes as sizeBytes, width, height, alt_text as altText,
            storage_path as url, created_at as createdAt
     FROM media
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  const countRow = await db.get('SELECT COUNT(*) as total FROM media');
  return {
    items: rows,
    total: countRow ? countRow.total : rows.length
  };
}
