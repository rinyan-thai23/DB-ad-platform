import { access, readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = join(process.cwd(), 'docs');
const basePath = (process.env.BASE_PATH ?? '').replace(/\/$/, '');

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
const reviewPages = html.filter(file => /^services\/[^/]+\/reviews\/index\.html$/.test(relativeHtml(file)));

if (servicePages.length !== 30) failures.push(`expected 30 service pages, got ${servicePages.length}`);
if (categoryPages.length < 1) failures.push('no category pages generated');
if (reviewPages.length !== 5) failures.push(`expected 5 detailed review pages, got ${reviewPages.length}`);
const articleFile = join(root, 'articles', 'cloudflare-pages-monetization', 'index.html');
if (!html.includes(articleFile)) failures.push('Cloudflare Pages monetization article missing');

const homeSource = await readFile(join(root, 'index.html'), 'utf8');
const homeServiceOrder = [...homeSource.matchAll(new RegExp(`href="${basePath}/services/([^/]+)/"`, 'g'))].map(match => match[1]);
if (homeServiceOrder[0] !== 'imobile-ad-network') failures.push(`expected i-mobile first, got ${homeServiceOrder[0]}`);
if (homeServiceOrder.indexOf('ninja-admax') !== 28) failures.push('expected Ninja AdMax at rank 29');
if (!homeSource.includes('<span class="country-flag" aria-hidden="true">🇨🇾</span>海外/キプロス')) failures.push('Adsterra country flag or label missing');
if (!homeSource.includes('family=Noto+Color+Emoji&display=swap')) failures.push('Noto Color Emoji stylesheet missing');
if (!homeSource.includes('/articles/cloudflare-pages-monetization/')) failures.push('article link missing from home page');
if (!homeSource.includes('<span class="tag paypal">PayPal対応</span>')) failures.push('PayPal status tag missing');
if (homeSource.includes('日本の銀行のみ:') || homeSource.includes('日本の銀行だけで完結')) failures.push('legacy Japan bank wording remains');
if (homeSource.includes('<div class="card-type">海外アドネットワーク</div>') || homeSource.includes('<div class="card-type">Popunder広告</div>')) failures.push('legacy service type is still shown on cards');

for (const file of servicePages) {
  const source = await readFile(file, 'utf8');
  if (!source.includes('data-related-genres')) failures.push(`${file}: related genres missing`);
  if (!source.includes('ユーザー登録・確認手続き')) failures.push(`${file}: registration section missing`);
  const links = [...source.matchAll(new RegExp(`href="${basePath}/categories/([^/]+)/"`, 'g'))];
  if (!links.length) failures.push(`${file}: no category membership links`);
}

for (const file of reviewPages) {
  const source = await readFile(file, 'utf8');
  if (!source.includes('詳細口コミ調査まとめ')) failures.push(`${file}: detailed review heading missing`);
  if (!source.includes('読み方の注意')) failures.push(`${file}: source caveat missing`);
  const serviceDir = relativeHtml(file).split('/')[1];
  const serviceSource = await readFile(join(root, 'services', serviceDir, 'index.html'), 'utf8');
  if (!serviceSource.includes(`href="${basePath}/services/${serviceDir}/reviews/"`)) failures.push(`${file}: service page does not link to review page`);
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

for (const file of servicePages) {
  const source = await readFile(file, 'utf8');
  if (!source.includes('data-revenue-examples')) failures.push(`${file}: revenue examples section missing`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Checked ${html.length} HTML files; ${servicePages.length} services and ${categoryPages.length} categories are cross-linked; internal URLs resolve.`);
