import { cp, mkdir, rm } from 'node:fs/promises';
const out = new URL('../dist/', import.meta.url);
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const file of ['index.html', 'admin.html', 'styles.css']) await cp(new URL('../' + file, import.meta.url), new URL(file, out));
await cp(new URL('../src/', import.meta.url), new URL('src/', out), { recursive: true });
await cp(new URL('../public/assets/', import.meta.url), new URL('assets/', out), { recursive: true });
console.log('LyricVerse production static build ready.');
