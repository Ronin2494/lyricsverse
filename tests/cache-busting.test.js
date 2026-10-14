import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { versionedIndex } from '../scripts/cache-bust.mjs';

const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('production index fingerprints both entrypoint files', () => {
  const html = versionedIndex(index, 'abc123');
  assert.match(html, /href="\.\/styles\.css\?v=abc123"/);
  assert.match(html, /src="\.\/src\/app\.js\?v=abc123"/);
  assert.doesNotMatch(html, /src="\.\/src\/app\.js"/);
});

test('fingerprints change when the release SHA changes', () => {
  assert.notEqual(versionedIndex(index, 'sha1'), versionedIndex(index, 'sha2'));
});

test('asset versions are restricted to safe URL characters', () => {
  const html = versionedIndex(index, 'a?&b');
  assert.match(html, /src="\.\/src\/app\.js\?v=ab"/);
  assert.throws(() => versionedIndex(index, '?&'), /missing_asset_version/);
});
