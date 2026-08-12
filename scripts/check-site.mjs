import { access, readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = join(process.cwd(), 'docs');
const basePath = (process.env.BASE_PATH ?? '/DB-ad-platform').replace(/\/$/, '');

async function walk(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    const path = join(dir, name);
    (await stat(path)).isDirectory() ? out.push(...await walk(path)) : out.push(path);
  }
  return out;
}

function localTarget(url) {
  if (!url.startsWith(`${basePath}/`) && url !== basePath) return null;
  const clean = url.split(/[?#]/)[0].slice(basePath.length).replace(/^\//, '');
  if (!clean) return join(root, 'index.html');
  return join(root, clean.endsWith('/') ? `${clean}index.html` : clean);
}

const files = await walk(root);
const html = files.filter(file => file.endsWith('.html'));
const failures = [];

for (const file of html) {
  const source = await readFile(file, 'utf8');
  for (const token of ['<title>', 'meta name="description"', 'rel="canonical"', '<h1']) {
    if (!source.includes(token)) failures.push(`${file}: missing ${token}`);
  }
  if (/href="undefined|>undefined</.test(source)) failures.push(`${file}: undefined value`);

  for (const match of source.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const target = localTarget(match[1]);
    if (target) await access(target).catch(() => failures.push(`${file}: broken internal URL ${match[1]}`));
  }
}

const relativeHtml = file => relative(root, file).replaceAll('\\', '/');
const servicePages = html.filter(file => /^services\/[^/]+\/index\.html$/.test(relativeHtml(file)));
const categoryPages = html.filter(file => /^categories\/[^/]+\/index\.html$/.test(relativeHtml(file)));

if (servicePages.length !== 30) failures.push(`expected 30 service pages, got ${servicePages.length}`);
if (categoryPages.length < 1) failures.push('no category pages generated');

for (const file of servicePages) {
  const source = await readFile(file, 'utf8');
  if (!source.includes('data-related-genres')) failures.push(`${file}: related genres missing`);
  const links = [...source.matchAll(new RegExp(`href="${basePath}/categories/([^/]+)/"`, 'g'))];
  if (!links.length) failures.push(`${file}: no category membership links`);
}

for (const file of categoryPages) {
  const source = await readFile(file, 'utf8');
  const categorySlug = relativeHtml(file).split('/')[1];
  if (!source.includes('data-category-context')) failures.push(`${file}: category context missing`);
  const serviceSlugs = [...source.matchAll(new RegExp(`href="${basePath}/services/([^/]+)/"`, 'g'))].map(match => match[1]);
  if (!serviceSlugs.length) failures.push(`${file}: empty category page`);
  for (const serviceSlug of new Set(serviceSlugs)) {
    const serviceSource = await readFile(join(root, 'services', serviceSlug, 'index.html'), 'utf8');
    if (!serviceSource.includes(`href="${basePath}/categories/${categorySlug}/"`)) {
      failures.push(`${file}: ${serviceSlug} does not link back to category`);
    }
  }
}

for (const slug of ['ninja-admax','imobile-ad-network','zucks-ad-network','adsterra','adstir']) {
  const source = await readFile(join(root, 'services', slug, 'index.html'), 'utf8');
  if (!source.includes('data-editorial-review')) failures.push(`${slug}: researched review missing`);
  for (const heading of ['利用者が挙げた良い点', '利用者が挙げた注意点', '口コミから見る、こんな人におすすめ']) {
    if (!source.includes(`<h2>${heading}</h2>`)) failures.push(`${slug}: ${heading} missing`);
  }
  const reviewLinks = [...source.matchAll(/>体験記事を確認<\/a>/g)];
  if (reviewLinks.length < 6) failures.push(`${slug}: expected at least 6 review source links`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Checked ${html.length} HTML files; ${servicePages.length} services and ${categoryPages.length} categories are cross-linked; internal URLs resolve.`);
