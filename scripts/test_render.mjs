import { getPublishedContent } from '../server/content.js';

const content = await getPublishedContent();
console.log('Published version:', content.version);
console.log('Pages count:', content.pages?.length);
for (const p of content.pages || []) {
  console.log('Page:', p.slug, 'Sections:', p.sections?.length);
}
