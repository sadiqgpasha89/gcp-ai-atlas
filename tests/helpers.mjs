// Loads the same browser scripts the site loads, inside a Node vm context.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function loadLogic() {
  const ctx = {}; ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'assets/logic.js'), 'utf8'), ctx, { filename: 'assets/logic.js' });
  return ctx.AtlasLogic;
}

export function loadAtlas() {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script src="(data\/[^"]+)"/g)].map(m => m[1]);
  const ctx = {}; ctx.window = ctx; vm.createContext(ctx);
  for (const s of scripts) vm.runInContext(fs.readFileSync(path.join(root, s), 'utf8'), ctx, { filename: s });
  return ctx.ATLAS;
}
