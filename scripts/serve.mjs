import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = join(process.cwd(), 'docs');
const basePath = (process.env.BASE_PATH ?? '').replace(/\/$/, '');
const port = Number(process.env.PORT || 4173);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.xml':'application/xml', '.txt':'text/plain; charset=utf-8' };
const server = createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (basePath && path.startsWith(`${basePath}/`)) path = path.slice(basePath.length);
    let file = normalize(join(root, path));
    if (!file.startsWith(root)) throw new Error('invalid path');
    if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type':'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});
server.listen(port, () => console.log(`Preview: http://localhost:${port}`));
