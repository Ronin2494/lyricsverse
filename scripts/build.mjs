import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { versionedIndex } from './cache-bust.mjs';

const out = new URL('../dist/', import.meta.url);
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
const version = process.env.RENDER_GIT_COMMIT || process.env.GITHUB_SHA || Date.now().toString(36);
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
await writeFile(new URL('index.html', out), versionedIndex(html, version));
for (const file of ['admin.html', 'styles.css']) await cp(new URL('../' + file, import.meta.url), new URL(file, out));
await cp(new URL('../src/', import.meta.url), new URL('src/', out), { recursive: true });
await cp(new URL('../public/assets/', import.meta.url), new URL('assets/', out), { recursive: true });
console.log('LyricVerse production static build ready.');
