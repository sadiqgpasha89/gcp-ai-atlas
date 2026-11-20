// Loads the Atlas data layer and search module exactly as the browser does (index.html script order), without a DOM.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
export const dataScripts = [...html.matchAll(/<script src="(data\/[^"]+)"/g)].map(m => m[1]);

export function loadAtlas() {
  const ctx = {};
  ctx.window = ctx; // data files assign to window.*; window === global, as in the browser
  vm.createContext(ctx);
  for (const s of dataScripts) vm.runInContext(fs.readFileSync(path.join(root, s), 'utf8'), ctx, { filename: s });
  return ctx.ATLAS;
}
// assets/search.js is a classic browser script (sets window.AtlasSearch); run it the same way here.
const sctx = {}; sctx.window = sctx; vm.createContext(sctx);
vm.runInContext(fs.readFileSync(path.join(root, 'assets/search.js'), 'utf8'), sctx, { filename: 'assets/search.js' });
export const search = sctx.AtlasSearch;
export const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
