process.env.SITE_URL ||= 'https://rinyan-thai23.github.io';
process.env.BASE_PATH ||= '/DB-ad-platform';

await import('./build-site.mjs');
await import('./check-site.mjs');
