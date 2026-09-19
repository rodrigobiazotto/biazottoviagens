import crypto from 'node:crypto';
import { db } from './db.js';

// Approved brand color palette
export const APPROVED_COLORS = {
  navy: '#0B1E31',
  gold: '#DBB053',
  bronze: '#A87824',
  offwhite: '#F5F2EC',
  charcoal: '#3D3D3D',
  white: '#FFFFFF',
};

// Forbidden section keywords or fake claims
const FORBIDDEN_CONTENT = [
  'veja quem já voou conosco',
  'veja quem ja voou conosco',
  'experiências com empresários',
  'experiencias com empresarios',
  'depoimentos falsos',
];

/**
 * Strict HTML/text sanitizer for block content
 * Only allows clean, safe formatting tags without malicious attributes or scripts
 */
export function sanitizeContent(htmlOrText) {
  if (typeof htmlOrText !== 'string') return '';

  let sanitized = htmlOrText.trim();

  // Check forbidden phrases
  const lower = sanitized.toLowerCase();
  for (const forbidden of FORBIDDEN_CONTENT) {
    if (lower.includes(forbidden)) {
      throw new Error(`Conteúdo não permitido pelas diretrizes da marca Biazotto: "${forbidden}"`);
    }
  }

  // Remove dangerous tags and event handlers
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/on\w+\s*=\s*(["']).*?\1/gi, '')
    .replace(/on\w+\s*=\s*[^>\s]+/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/vbscript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '');

  return sanitized;
}

/**
 * Audit log helper
 */
export async function logAudit(action, userId, details = null, ipAddress = '127.0.0.1') {
  const id = 'aud-' + crypto.randomUUID();
  const now = Date.now();
  await db.run(
    'INSERT INTO audit_logs (id, action, user_id, ip_address, details_json, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [
      id,
      action,
      userId || null,
      ipAddress,
      details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null,
      now
    ]
  );
}

/**
 * Helper to build the complete content tree from current working tables
 */
export async function buildContentTree() {
  const pages = await db.all(
    'SELECT id, slug, title, meta_description, order_index, is_published FROM pages ORDER BY order_index ASC'
  );

  const sections = await db.all(
    'SELECT id, page_id, section_key, section_type, background_style, padding_preset, order_index, is_visible FROM sections ORDER BY page_id ASC, order_index ASC'
  );

  const blocks = await db.all(
    'SELECT id, section_id, block_key, block_type, content_json, visual_config_json, order_index, is_visible, version, updated_at FROM blocks ORDER BY section_id ASC, order_index ASC'
  );

  const navItems = await db.all(
    'SELECT id, menu_location, label, url, target, order_index, is_cta, is_visible FROM navigation_items ORDER BY order_index ASC'
  );

  const settingsRows = await db.all('SELECT key, value_json FROM site_settings');
  const settings = {};
  for (const s of settingsRows) {
    try {
      settings[s.key] = JSON.parse(s.value_json);
    } catch (e) {
      settings[s.key] = s.value_json;
    }
  }

  // Group blocks by section
  const blocksBySection = {};
  for (const b of blocks) {
    if (!blocksBySection[b.section_id]) blocksBySection[b.section_id] = [];
    let content = {};
    let visualConfig = {};
    try { content = JSON.parse(b.content_json); } catch (e) { content = { text: b.content_json }; }
    try { visualConfig = JSON.parse(b.visual_config_json); } catch (e) {}

    blocksBySection[b.section_id].push({
      id: b.id,
      block_key: b.block_key,
      block_type: b.block_type,
      content,
      visual_config: visualConfig,
      order_index: b.order_index,
      is_visible: b.is_visible,
      version: b.version,
      updated_at: b.updated_at
    });
  }

  // Group sections by page
  const sectionsByPage = {};
  for (const s of sections) {
    if (!sectionsByPage[s.page_id]) sectionsByPage[s.page_id] = [];
    sectionsByPage[s.page_id].push({
      id: s.id,
      section_key: s.section_key,
      section_type: s.section_type,
      background_style: s.background_style,
      padding_preset: s.padding_preset,
      order_index: s.order_index,
      is_visible: s.is_visible,
      blocks: blocksBySection[s.id] || []
    });
  }

  // Build pages list
  const assembledPages = pages.map(p => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    meta_description: p.meta_description,
    order_index: p.order_index,
    is_published: p.is_published,
    sections: sectionsByPage[p.id] || []
  }));

  return {
    pages: assembledPages,
    navigation: navItems,
    settings
  };
}

/**
 * Get public published content (from active published version snapshot or fallback to working tables)
 */
export async function getPublishedContent() {
  const activeVersion = await db.get(
    'SELECT version_number, snapshot_json, summary, created_at, created_by FROM published_versions ORDER BY version_number DESC LIMIT 1'
  );

  if (activeVersion && activeVersion.snapshot_json) {
    try {
      const data = JSON.parse(activeVersion.snapshot_json);
      return {
        version: activeVersion.version_number,
        publishedAt: activeVersion.created_at,
        summary: activeVersion.summary,
        ...data
      };
    } catch (e) {
      console.error('Falha ao decodificar snapshot publicado:', e);
    }
  }

  // Fallback if no version exists
  const current = await buildContentTree();
  return {
    version: 1,
    publishedAt: Date.now(),
    summary: 'Versão de fallback',
    ...current
  };
}

/**
 * Get complete draft content (including hidden sections/blocks for administrative editing)
 */
export async function getDraftContent() {
  const current = await buildContentTree();
  const activeVer = await db.get(
    'SELECT version_number, summary, created_at FROM published_versions ORDER BY version_number DESC LIMIT 1'
  );

  return {
    ...current,
    versionInfo: activeVer || { version_number: 1, summary: 'Versão inicial', created_at: Date.now() }
  };
}

/**
 * Update block content or visual configuration
 */
export async function updateBlock(blockId, updates, userId) {
  const existing = await db.get('SELECT * FROM blocks WHERE id = ?', [blockId]);
  if (!existing) {
    throw new Error('Bloco não encontrado.');
  }

  let currentContent = {};
  try {
    currentContent = JSON.parse(existing.content_json);
  } catch (e) {
    currentContent = { text: existing.content_json };
  }

  if (updates.content) {
    if (typeof updates.content === 'string') {
      currentContent.text = sanitizeContent(updates.content);
    } else if (typeof updates.content === 'object') {
      for (const [k, v] of Object.entries(updates.content)) {
        if (typeof v === 'string') {
          currentContent[k] = sanitizeContent(v);
        } else {
          currentContent[k] = v;
        }
      }
    }
  }

  let currentVisual = {};
  try {
    currentVisual = JSON.parse(existing.visual_config_json || '{}');
  } catch (e) {}

  if (updates.visualConfig) {
    currentVisual = { ...currentVisual, ...updates.visualConfig };
  }

  const isVisible = updates.isVisible !== undefined ? (updates.isVisible ? 1 : 0) : existing.is_visible;
  const newVersion = (existing.version || 1) + 1;
  const now = Date.now();

  await db.run(
    'UPDATE blocks SET content_json = ?, visual_config_json = ?, is_visible = ?, version = ?, updated_at = ?, updated_by = ? WHERE id = ?',
    [
      JSON.stringify(currentContent),
      JSON.stringify(currentVisual),
      isVisible,
      newVersion,
      now,
      userId || 'admin',
      blockId
    ]
  );

  await logAudit('UPDATE_BLOCK', userId, {
    blockId,
    blockKey: existing.block_key,
    version: newVersion
  });

  return {
    id: blockId,
    content: currentContent,
    visualConfig: currentVisual,
    isVisible: isVisible === 1,
    version: newVersion,
    updatedAt: now
  };
}

/**
 * Reorder sections within a page
 */
export async function reorderSections(pageId, sectionIds, userId) {
  if (!Array.isArray(sectionIds)) {
    throw new Error('sectionIds deve ser um array.');
  }

  for (let i = 0; i < sectionIds.length; i++) {
    await db.run(
      'UPDATE sections SET order_index = ?, updated_at = ? WHERE id = ? AND page_id = ?',
      [i, Date.now(), sectionIds[i], pageId]
    );
  }

  await logAudit('REORDER_SECTIONS', userId, { pageId, count: sectionIds.length });
  return { success: true, count: sectionIds.length };
}

/**
 * Update section properties (visibility, background, padding, layout)
 */
export async function updateSection(sectionId, updates, userId) {
  const existing = await db.get('SELECT * FROM sections WHERE id = ?', [sectionId]);
  if (!existing) {
    throw new Error('Seção não encontrada.');
  }

  const bg = updates.backgroundStyle !== undefined ? updates.backgroundStyle : existing.background_style;
  const padding = updates.paddingPreset !== undefined ? updates.paddingPreset : existing.padding_preset;
  const visible = updates.isVisible !== undefined ? (updates.isVisible ? 1 : 0) : existing.is_visible;
  const now = Date.now();

  await db.run(
    'UPDATE sections SET background_style = ?, padding_preset = ?, is_visible = ?, updated_at = ? WHERE id = ?',
    [bg, padding, visible, now, sectionId]
  );

  await logAudit('UPDATE_SECTION', userId, { sectionId, updates });
  return { id: sectionId, backgroundStyle: bg, paddingPreset: padding, isVisible: visible === 1 };
}

/**
 * Duplicate a section and its blocks
 */
export async function duplicateSection(sectionId, userId) {
  const original = await db.get('SELECT * FROM sections WHERE id = ?', [sectionId]);
  if (!original) {
    throw new Error('Seção original não encontrada.');
  }

  const newSectionId = 'sec-' + crypto.randomUUID();
  const newOrder = original.order_index + 1;
  const now = Date.now();

  // Shift subsequent sections
  await db.run(
    'UPDATE sections SET order_index = order_index + 1 WHERE page_id = ? AND order_index >= ?',
    [original.page_id, newOrder]
  );

  await db.run(
    'INSERT INTO sections (id, page_id, section_key, section_type, background_style, padding_preset, order_index, is_visible, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)',
    [
      newSectionId,
      original.page_id,
      `${original.section_key}_copy_${now}`,
      original.section_type,
      original.background_style,
      original.padding_preset,
      newOrder,
      now,
      now
    ]
  );

  const blocks = await db.all('SELECT * FROM blocks WHERE section_id = ? ORDER BY order_index ASC', [sectionId]);
  for (const b of blocks) {
    const newBlockId = 'blk-' + crypto.randomUUID();
    await db.run(
      'INSERT INTO blocks (id, section_id, block_key, block_type, content_json, visual_config_json, order_index, is_visible, version, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)',
      [
        newBlockId,
        newSectionId,
        `${b.block_key}_copy`,
        b.block_type,
        b.content_json,
        b.visual_config_json,
        b.order_index,
        b.is_visible,
        now,
        userId || 'admin'
      ]
    );
  }

  await logAudit('DUPLICATE_SECTION', userId, { originalId: sectionId, newSectionId });
  return { id: newSectionId, pageId: original.page_id, orderIndex: newOrder };
}

/**
 * Delete a section
 */
export async function deleteSection(sectionId, userId) {
  const existing = await db.get('SELECT * FROM sections WHERE id = ?', [sectionId]);
  if (!existing) {
    throw new Error('Seção não encontrada.');
  }

  await db.run('DELETE FROM blocks WHERE section_id = ?', [sectionId]);
  await db.run('DELETE FROM sections WHERE id = ?', [sectionId]);

  await logAudit('DELETE_SECTION', userId, { sectionId, key: existing.section_key });
  return { success: true, id: sectionId };
}

/**
 * Update navigation items
 */
export async function updateNavigation(items, userId) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('O menu deve conter pelo menos um item de navegação.');
  }

  // Validate items
  for (const it of items) {
    if (!it.label || !it.url) {
      throw new Error('Todos os itens de menu devem ter rótulo e URL.');
    }
    const cleanUrl = it.url.trim().toLowerCase();
    if (cleanUrl.startsWith('javascript:') || cleanUrl.startsWith('vbscript:') || cleanUrl.startsWith('data:')) {
      throw new Error(`URL insegura detectada no menu: ${it.url}`);
    }
  }

  await db.run('DELETE FROM navigation_items');

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const id = it.id || ('nav-' + crypto.randomUUID());
    await db.run(
      'INSERT INTO navigation_items (id, menu_location, label, url, target, order_index, is_cta, is_visible) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        it.menu_location || 'header',
        it.label.substring(0, 100),
        it.url.substring(0, 255),
        it.target || '_self',
        i,
        it.is_cta ? 1 : 0,
        it.is_visible !== false ? 1 : 0
      ]
    );
  }

  await logAudit('UPDATE_NAVIGATION', userId, { count: items.length });
  return { success: true, count: items.length };
}

/**
 * Publish draft state to create a new immutable version
 */
export async function publishDraft(userId, summary = 'Publicação de alterações') {
  const snapshot = await buildContentTree();

  const latestVer = await db.get('SELECT MAX(version_number) as maxVer FROM published_versions');
  const nextVer = ((latestVer && latestVer.maxVer) || 0) + 1;

  const now = Date.now();
  const versionId = 'v' + nextVer + '-' + crypto.randomUUID();

  await db.run(
    'INSERT INTO published_versions (id, version_number, snapshot_json, summary, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?)',
    [
      versionId,
      nextVer,
      JSON.stringify(snapshot),
      summary.substring(0, 255),
      now,
      userId || 'admin'
    ]
  );

  // Keep at least the last 20 published versions
  const countRow = await db.get('SELECT COUNT(*) as total FROM published_versions');
  if (countRow && countRow.total > 25) {
    const keepLimit = 20;
    await db.run(
      `DELETE FROM published_versions
       WHERE version_number NOT IN (
         SELECT version_number FROM published_versions ORDER BY version_number DESC LIMIT ?
       )`,
      [keepLimit]
    );
  }

  await logAudit('PUBLISH_VERSION', userId, { version: nextVer, summary });

  return {
    version: nextVer,
    publishedAt: now,
    summary,
    changeSummary: summary,
    snapshot
  };
}

/**
 * List published versions
 */
export async function listPublishedVersions(limit = 25) {
  return await db.all(
    'SELECT id, version_number, summary, created_at, created_by FROM published_versions ORDER BY version_number DESC LIMIT ?',
    [limit]
  );
}

/**
 * Restore a specific published version
 */
export async function restoreVersion(versionNumber, userId) {
  const target = await db.get('SELECT * FROM published_versions WHERE version_number = ?', [versionNumber]);
  if (!target || !target.snapshot_json) {
    throw new Error(`Versão ${versionNumber} não encontrada.`);
  }

  const snapshot = JSON.parse(target.snapshot_json);
  const now = Date.now();

  if (snapshot.pages && Array.isArray(snapshot.pages)) {
    await db.run('DELETE FROM blocks');
    await db.run('DELETE FROM sections');
    await db.run('DELETE FROM pages');

    for (const p of snapshot.pages) {
      await db.run(
        'INSERT INTO pages (id, slug, title, meta_description, order_index, is_published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [p.id, p.slug, p.title, p.meta_description || '', p.order_index || 0, p.is_published ? 1 : 0, now, now]
      );

      if (p.sections && Array.isArray(p.sections)) {
        for (const s of p.sections) {
          await db.run(
            'INSERT INTO sections (id, page_id, section_key, section_type, background_style, padding_preset, order_index, is_visible, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [s.id, p.id, s.section_key, s.section_type, s.background_style, s.padding_preset || 'normal', s.order_index || 0, s.is_visible ? 1 : 0, now, now]
          );

          if (s.blocks && Array.isArray(s.blocks)) {
            for (const b of s.blocks) {
              await db.run(
                'INSERT INTO blocks (id, section_id, block_key, block_type, content_json, visual_config_json, order_index, is_visible, version, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                  b.id,
                  s.id,
                  b.block_key,
                  b.block_type,
                  JSON.stringify(b.content),
                  JSON.stringify(b.visual_config || {}),
                  b.order_index || 0,
                  b.is_visible ? 1 : 0,
                  b.version || 1,
                  now,
                  userId || 'admin'
                ]
              );
            }
          }
        }
      }
    }
  }

  if (snapshot.navigation && Array.isArray(snapshot.navigation)) {
    await db.run('DELETE FROM navigation_items');
    for (const it of snapshot.navigation) {
      await db.run(
        'INSERT INTO navigation_items (id, menu_location, label, url, target, order_index, is_cta, is_visible) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [it.id, it.menu_location, it.label, it.url, it.target || '_self', it.order_index || 0, it.is_cta ? 1 : 0, it.is_visible !== false ? 1 : 0]
      );
    }
  }

  const restoreSummary = `Restauração para o estado da Versão #${versionNumber}`;
  const publishResult = await publishDraft(userId, restoreSummary);

  await logAudit('RESTORE_VERSION', userId, {
    restoredFromVersion: versionNumber,
    newPublishedVersion: publishResult.version
  });

  return publishResult;
}

/**
 * Get audit logs
 */
export async function getAuditLogs(limit = 50) {
  return await db.all(
    'SELECT id, action, user_id, ip_address, details_json, created_at FROM audit_logs ORDER BY created_at DESC LIMIT ?',
    [limit]
  );
}
