// Browser smoke test: node scripts/smoke.mjs
// Opens every route it can reach by following in-page links, at desktop and phone width, and fails on console errors
// (this includes Content-Security-Policy violations), horizontal overflow, empty pages, "undefined"/"NaN" text and
// broken in-page links; then exercises search, a calculator and the theme toggle.
// Needs Playwright:  npm i --no-save playwright && npx playwright install chromium
// Env: CHROME_PATH (use an installed Chrome), PLAYWRIGHT_DIR (node_modules folder that contains playwright).
import { createRequire } from 'node:module';
import { serve } from './serve.mjs';

let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); }
catch (e) {
  if (!process.env.PLAYWRIGHT_DIR) { console.error('Playwright is not installed. Run: npm i --no-save playwright && npx playwright install chromium'); process.exit(2); }
  ({ chromium } = createRequire(process.env.PLAYWRIGHT_DIR.replace(/\/?$/, '/'))('playwright'));
}

const server = await serve(0);
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox'] });
const failures = [];
const fail = (where, what) => failures.push(`${where}: ${what}`);
const BAD = /\bNaN\b|\bundefined\b|\bInfinity\b|\[object /;

async function newPage(width) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`console.${m.type()}: ${m.text()}`); });
  page.on('requestfailed', r => errors.push('requestfailed: ' + r.url()));
  page.on('request', r => { if (!r.url().startsWith(base) && !r.url().startsWith('data:')) errors.push('external request: ' + r.url()); });
  return { ctx, page, errors };
}

// ---- 1. every reachable route, two widths. Routes are discovered by following links, starting at the home page.
let routeCount = 0;
for (const width of [1280, 375]) {
  const { ctx, page, errors } = await newPage(width);
  await page.goto(base + '/index.html');
  await page.waitForSelector('#main');
  const seen = new Set(), queue = ['#/'], linkTargets = new Map();
  while (queue.length) {
    const r = queue.shift();
    if (seen.has(r)) continue;
    seen.add(r);
    const before = errors.length;
    await page.evaluate(h => { location.hash = h; }, r);
    await page.waitForTimeout(60);
    await page.waitForFunction(() => document.querySelector('#main h1'), null, { timeout: 5000 }).catch(() => fail(`${width} ${r}`, 'no h1 rendered'));
    const info = await page.evaluate(() => ({
      text: document.querySelector('#main').innerText,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      links: [...document.querySelectorAll('a[href^="#/"]')].map(a => a.getAttribute('href'))
    }));
    if (info.text.length < 150) fail(`${width} ${r}`, 'page is nearly empty');
    if (BAD.test(info.text)) fail(`${width} ${r}`, 'text contains ' + info.text.match(BAD)[0]);
    if (info.overflow > 1) fail(`${width} ${r}`, `horizontal overflow ${info.overflow}px`);
    errors.slice(before).forEach(e => fail(`${width} ${r}`, e));
    for (const l of info.links) { if (!seen.has(l)) queue.push(l); if (!linkTargets.has(l)) linkTargets.set(l, r); }
  }
  routeCount = seen.size;
  await page.evaluate(() => { location.hash = '#/does-not-exist'; });
  await page.waitForTimeout(100);
  if (!/not found|isn.t here|couldn.t find|does not exist/i.test(await page.evaluate(() => document.querySelector('#main').innerText))) fail(`${width} 404`, 'unknown route should show a not-found page');
  // a link that leads to the not-found page is a broken link
  for (const [l, from] of linkTargets) {
    await page.evaluate(h => { location.hash = h; }, l);
    await page.waitForTimeout(40);
    const t = await page.evaluate(() => document.querySelector('#main').innerText);
    if (/^\s*Not found\b/i.test(t) && /does not exist/i.test(t)) fail(`${width} links`, `${l} (linked from ${from}) shows the not-found page`);
  }
  await ctx.close();
}

// ---- 2. search
{
  const { ctx, page, errors } = await newPage(1280);
  await page.goto(base + '/index.html');
  await page.keyboard.press('/');
  if (!(await page.isVisible('#q'))) fail('search', '"/" did not open search');
  await page.fill('#q', '429');
  const first = await page.textContent('#results li:first-child');
  if (!/429|throttl|quota|rate/i.test(first)) fail('search', `"429" top result was "${first.slice(0, 60)}"`);
  await page.fill('#q', 'ADK');
  if (!/ADK|Agent Development/i.test(await page.textContent('#results'))) fail('search', '"ADK" found nothing relevant');
  if (BAD.test(await page.textContent('#results'))) fail('search', 'results contain undefined/NaN');
  await page.fill('#q', 'amp');
  if (/&amp;|&lt;|&gt;/.test(await page.innerText('#results'))) fail('search', 'highlighting broke an HTML entity');
  await page.fill('#q', 'zzzqqq');
  if (!/No matches/.test(await page.textContent('#results'))) fail('search', 'no empty-state message');
  await page.fill('#q', 'service');
  await page.click('#searchFilters [data-kind="service"]');
  const kinds = await page.$$eval('#results li small', els => els.map(e => e.textContent));
  if (!kinds.length || kinds.some(k => !/Service/.test(k))) fail('search', 'service filter leaked other types');
  await page.fill('#q', 'agent development kit');
  await page.click('#searchFilters [data-kind="all"]');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
  if (!/#\/s\//.test(await page.evaluate(() => location.hash))) fail('search', 'Enter did not navigate to the top result');
  if (await page.isVisible('#q')) fail('search', 'overlay stayed open after Enter');
  await page.keyboard.press('Control+k'); await page.keyboard.press('Escape');
  if (await page.isVisible('#q')) fail('search', 'Escape did not close');
  errors.forEach(e => fail('search', e));
  await ctx.close();
}

// ---- 2b. search on a phone-width screen
{
  const { ctx, page, errors } = await newPage(375);
  await page.goto(base + '/index.html');
  await page.click('#searchBtn');
  await page.fill('#q', 'throttling');
  if (!/429|throttl|quota/i.test(await page.textContent('#results'))) fail('search 375', 'no relevant result for "throttling"');
  const over = await page.evaluate(() => { const d = document.querySelector('.dialog').getBoundingClientRect(); return d.right - document.documentElement.clientWidth; });
  if (over > 1) fail('search 375', `dialog overflows the screen by ${Math.round(over)}px`);
  await page.click('#results li:first-child a');
  await page.waitForTimeout(150);
  if (await page.isVisible('#q')) fail('search 375', 'overlay stayed open after choosing a result');
  errors.forEach(e => fail('search 375', e));
  await ctx.close();
}

// ---- 3. a calculator reacts to input
{
  const { ctx, page, errors } = await newPage(1280);
  await page.goto(base + '/index.html#/d/calculator');
  await page.waitForSelector('#main input[type="number"]');
  const before = await page.innerText('#main');
  const input = page.locator('#main input[type="number"]').first();
  const old = await input.inputValue();
  await input.fill(String((Number(old) || 1) * 7 + 3));
  await page.waitForTimeout(150);
  if (before === await page.innerText('#main')) fail('calculator', 'changing the first input did not change the page');
  if (BAD.test(await page.innerText('#main'))) fail('calculator', 'page text contains undefined/NaN after editing');
  errors.forEach(e => fail('calculator', e));
  await ctx.close();
}

// ---- 4. theme toggle and a service page
{
  const { ctx, page, errors } = await newPage(375);
  await page.goto(base + '/index.html');
  const theme = () => page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  const t0 = await theme();
  await page.click('#themeBtn');
  if (t0 === await theme()) fail('theme', 'toggle did nothing');
  await page.goto(base + '/index.html#/freshness');
  await page.waitForSelector('#main h1');
  const fresh = await page.innerText('#main');
  for (const need of ['Verified service records', 'Coverage by category', 'Lifecycle status']) if (!new RegExp(need, 'i').test(fresh)) fail('freshness', `missing section "${need}"`);
  await page.goto(base + '/index.html#/s/adk');
  await page.waitForSelector('#main h1');
  if (!/Agent Development Kit|ADK/i.test(await page.innerText('#main h1'))) fail('service page', 'unexpected heading');
  if (!/Not yet verified|Verified 20\d\d/i.test(await page.innerText('#main'))) fail('service page', 'service page should show a verification state');
  errors.forEach(e => fail('misc', e));
  await ctx.close();
}

await browser.close();
server.close();
console.log(`smoke: ${routeCount} routes x 2 widths, search, calculator, theme`);
if (failures.length) { console.error(`\n${failures.length} failure(s):`); failures.slice(0, 60).forEach(f => console.error(' - ' + f)); process.exit(1); }
console.log('smoke OK');
