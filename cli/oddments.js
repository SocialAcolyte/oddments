#!/usr/bin/env node
// oddments: list the collection, or copy a piece into your project.
//   npx oddments              list every piece
//   npx oddments add <piece>  download it into ./oddments/<piece>/
//   npx oddments open <piece> print its page on the site
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { inflateRawSync } from 'node:zlib';

const SITE = 'https://socialacolyte.github.io/stylefeatures/';
const PIECES = JSON.parse(readFileSync(new URL('./pieces.json', import.meta.url), 'utf8'));
const [cmd = 'list', name, dirArg] = process.argv.slice(2);
const dim = (s) => (process.stdout.isTTY ? `\x1b[2m${s}\x1b[0m` : s);
const bold = (s) => (process.stdout.isTTY ? `\x1b[1m${s}\x1b[0m` : s);

function find(slug) {
  const p = PIECES.find((q) => q.slug === slug);
  if (p) return p;
  const near = PIECES.filter((q) => q.slug.includes(slug ?? '')).map((q) => q.slug);
  console.error(slug ? `No piece called "${slug}".${near.length ? ' Did you mean: ' + near.slice(0, 5).join(', ') + '?' : ''}` : 'Name a piece: npx oddments add <piece>');
  process.exit(1);
}

// The download is a plain zip: read its central directory and inflate each file.
function unzip(buf, into) {
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error('not a zip file');
  const count = buf.readUInt16LE(eocd + 10);
  let at = buf.readUInt32LE(eocd + 16), written = 0;
  const root = resolve(into);
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(at + 10), size = buf.readUInt32LE(at + 20);
    const nameLen = buf.readUInt16LE(at + 28), extra = buf.readUInt16LE(at + 30), note = buf.readUInt16LE(at + 32);
    const local = buf.readUInt32LE(at + 42), file = buf.toString('utf8', at + 46, at + 46 + nameLen);
    at += 46 + nameLen + extra + note;
    if (file.endsWith('/')) continue;
    const out = resolve(root, file);
    if (!out.startsWith(root + sep)) throw new Error(`refusing to write outside ${into}: ${file}`);
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const raw = buf.subarray(start, start + size);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, method === 8 ? inflateRawSync(raw) : raw);
    written++;
  }
  return written;
}

if (cmd === 'list' || cmd === 'ls') {
  let section = '';
  for (const p of PIECES) {
    if (p.section !== section) { section = p.section; console.log('\n' + bold(section)); }
    console.log(`  ${p.slug.padEnd(24)} ${dim(p.blurb.length > 70 ? p.blurb.slice(0, 69) + '…' : p.blurb)}`);
  }
  console.log(`\n${PIECES.length} pieces. ${dim('npx oddments add <piece>  ·  see them all at ' + SITE)}`);
} else if (cmd === 'add') {
  const p = find(name), dir = dirArg ?? 'oddments', dest = join(dir, p.slug);
  if (existsSync(dest)) { console.error(`${dest} already exists; remove it first to fetch a fresh copy.`); process.exit(1); }
  process.stdout.write(`Fetching ${p.slug} (${p.kb} KB)… `);
  const res = await fetch(`${SITE}downloads/${p.slug}.zip`);
  if (!res.ok) { console.error(`\ncould not download it (${res.status}).`); process.exit(1); }
  const n = unzip(Buffer.from(await res.arrayBuffer()), dir);
  console.log(`${n} files into ${dest}/`);
  console.log(`\n  Open ${join(dest, 'demo.html')} through a local server to see it, and read ${join(dest, 'README.md')} for the markup.`);
  console.log(`  The pictures and sounds keep their own licences: ${join(dest, 'CREDITS.md')}.`);
  if (p.npm) console.log(dim(`  It is also on npm: npm i ${p.npm}`));
} else if (cmd === 'open') {
  console.log(`${SITE}#/${find(name).slug}`);
} else {
  console.log('npx oddments [list]          every piece\nnpx oddments add <piece> [dir]  copy one into ./oddments/<piece>/\nnpx oddments open <piece>    its page on the site');
}
