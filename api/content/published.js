import fs from 'node:fs';
import path from 'node:path';

export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=3600');
  
  try {
    const filePath = path.join(process.cwd(), 'data', 'published_content.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return res.status(200).send(data);
    }
  } catch (err) {
    console.error('API Error /api/content/published:', err);
  }

  return res.status(200).json({ success: true, data: { pages: [] } });
}
