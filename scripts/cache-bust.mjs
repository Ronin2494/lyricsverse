export function versionedIndex(html, version) {
  const safeVersion = String(version).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40);
  if (!safeVersion) throw new Error('missing_asset_version');
  return html
    .replaceAll('href="./styles.css"', 'href="./styles.css?v=' + safeVersion + '"')
    .replaceAll('src="./src/app.js"', 'src="./src/app.js?v=' + safeVersion + '"');
}
