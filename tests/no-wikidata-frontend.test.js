import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
test('homepage does not render Wikidata metadata section',()=>{const start=src.indexOf('function homeHTML(');assert.ok(!src.includes('${realCatalogHTML()}'));});
test('frontend does not initiate Wikidata catalog loading',()=>{assert.ok(!src.includes('loadRealCatalog();'));});
