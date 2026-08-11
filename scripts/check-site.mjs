import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const root = join(process.cwd(),'docs');
async function walk(dir) { const out=[]; for(const name of await readdir(dir)){const p=join(dir,name); (await stat(p)).isDirectory()?out.push(...await walk(p)):out.push(p)} return out; }
const files=await walk(root); const html=files.filter(f=>f.endsWith('.html')); const failures=[];
for(const file of html){const s=await readFile(file,'utf8'); for(const token of ['<title>','meta name="description"','rel="canonical"','<h1']) if(!s.includes(token)) failures.push(`${file}: missing ${token}`); if(/href="undefined|>undefined</.test(s)) failures.push(`${file}: undefined value`);}
const servicePages=html.filter(f=>f.includes(`${join('docs','services')}\\`)||f.includes('/docs/services/'));
if(servicePages.length!==30) failures.push(`expected 30 service pages, got ${servicePages.length}`);
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log(`Checked ${html.length} HTML files; 30 service pages present; SEO essentials found.`);
