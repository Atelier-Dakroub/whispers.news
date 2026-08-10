// Collects the build into one directory for a static host.
//
// `transclude-build` writes three: `dist/static` holds the prerendered pages,
// `dist/client` the hashed CSS and JS they ask for at `/assets/…`, and
// `dist/public` whatever was in `public/`. A host serving only the first would
// answer every page with a stylesheet that 404s.
//
//   node scripts/bundle-static.js   →   dist/site

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist', 'site');

// The build writes `.br` and `.gz` beside each file. Cloudflare compresses on
// the way out, so copying these would publish `/index.html.br` as its own URL
// for no benefit.
const PRECOMPRESSED = /\.(br|gz)$/;

/**
 * Copies a directory into `out`, keeping its shape.
 *
 * @param {string} from
 * @returns {number} files copied
 */
function merge(from) {
  if (!fs.existsSync(from)) return 0;

  let copied = 0;

  for (const entry of fs.readdirSync(from, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile() || PRECOMPRESSED.test(entry.name)) continue;

    const source = path.join(entry.parentPath ?? entry.path, entry.name);
    const target = path.join(out, path.relative(from, source));

    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
    copied += 1;
  }

  return copied;
}

fs.rmSync(out, { recursive: true, force: true });

const total =
  merge(path.join(root, 'dist', 'static')) +
  merge(path.join(root, 'dist', 'client')) +
  merge(path.join(root, 'dist', 'public'));

console.log(`dist/site: ${total} files`);
