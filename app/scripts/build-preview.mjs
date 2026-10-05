// Packs the built app (dist/) into a two-file hosted preview:
//   preview/index.html  — a page FRAGMENT (no doctype/html/head/body: the preview host adds them),
//                         with all CSS inline and the fonts embedded as data URIs
//   preview/app.js      — the app bundle, loaded as a file next to the page
// Also writes preview/harness.html, a local stand-in for the host's page skeleton, so the packed
// preview can be opened and screenshotted exactly as it will be wrapped.
//
//   npm run build && node scripts/build-preview.mjs
import { mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const dist = resolve('dist');
const out = resolve('preview');
const html = readFileSync(resolve(dist, 'index.html'), 'utf8');
const jsRel = html.match(/<script[^>]+src="\.\/(assets\/[^"]+\.js)"/)?.[1];
const cssRel = html.match(/<link[^>]+href="\.\/(assets\/[^"]+\.css)"/)?.[1];
const title = html.match(/<title>([^<]+)<\/title>/)?.[1] ?? 'Mansa AI';
if (!jsRel || !cssRel) throw new Error('Could not find the built JS/CSS in dist/index.html');

let css = readFileSync(resolve(dist, cssRel), 'utf8');
let fonts = 0;
css = css.replace(/url\((["']?)([^)"']+\.woff2)\1\)/g, (_, __, ref) => {
  const file = resolve(dirname(resolve(dist, cssRel)), ref);
  fonts++;
  return `url(data:font/woff2;base64,${readFileSync(file).toString('base64')})`;
});
const leftover = css.match(/url\((?!data:)[^)]+\)/g);
if (leftover) throw new Error('CSS still references files: ' + leftover.slice(0, 3).join(', '));

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const fragment = `<title>${title}</title>
<style>
${css}
</style>
<div id="root"></div>
<script>document.documentElement.lang = 'sl';</script>
<script type="module" src="app.js"></script>
`;
writeFileSync(resolve(out, 'index.html'), fragment);
copyFileSync(resolve(dist, jsRel), resolve(out, 'app.js'));

// Local stand-in for the host skeleton (charset + viewport + its small reset), for testing only.
writeFileSync(
  resolve(out, 'harness.html'),
  `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>:root{color-scheme:light;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif;background:#fafaf7}img{max-width:100%}[hidden]{display:none!important}</style>
</head><body>
${fragment}</body></html>
`,
);
const kb = (p) => (readFileSync(p).length / 1024).toFixed(0) + ' kB';
console.log(`preview/index.html ${kb(resolve(out, 'index.html'))} (${fonts} fonts embedded), preview/app.js ${kb(resolve(out, 'app.js'))}`);
