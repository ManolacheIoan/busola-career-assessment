const base = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

/* Every test blocks requests to other hosts and records them, so runs are offline and deterministic. */
const test = base.test.extend({
  external: [async ({ page }, use) => {
    const hits = [];
    await page.route((url) => !url.href.startsWith('http://localhost'), (route) => {
      hits.push(route.request().url());
      return route.abort();
    });
    await use(hits);
  }, { auto: true }],
});

const TYPES = ['R', 'I', 'A', 'S', 'E', 'C'];

async function clickScale(page, key, index, value) {
  await page.locator(`[data-act="lk"][data-k="${key}"][data-i="${index}"][data-v="${value}"]`).click();
}

async function next(page) {
  await base.expect(page.locator('#next')).toBeEnabled();
  await page.locator('#next').click();
}

/* Context step: required text fields and the four single-choice questions. */
async function fillContext(page) {
  await page.fill('#f-ctx-age', '24');
  await page.fill('#f-ctx-job', 'Student la Informatică');
  await page.fill('#f-ctx-why', 'Vreau o direcție mai clară.');
  for (const k of ['work', 'mobility']) await page.locator(`[data-act="ctxm"][data-k="${k}"][data-v="1"]`).click();
  for (const k of ['hours', 'edu', 'budget']) await page.locator(`[data-act="ctx"][data-k="${k}"][data-v="1"]`).click();
}

/* Completes all 8 steps. Interest answers give R 10, I 50, A 40, S 30, E 20, C 20, so the code is IAS. */
async function completeAssessment(page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Începe testul/ }).click();
  await fillContext(page);
  await next(page);

  const byType = { R: 1, I: 5, A: 4, S: 3, E: 2, C: 2 };
  for (let i = 0; i < 60; i++) await clickScale(page, 'riasec', i, byType[TYPES[i % 6]]);
  await next(page);

  for (let i = 0; i < 20; i++) await clickScale(page, 'big5', i, 3);
  await next(page);

  for (const s of ['Vizual / spațial', 'Logic / numeric', 'Introspectiv']) await page.locator(`[data-act="pick"][data-v="${s}"]`).click();
  await next(page);

  for (let i = 0; i < 4; i++) await clickScale(page, 'env', i, 4);
  await next(page);

  for (const v of ['creativitate', 'autonomie', 'învățare continuă', 'impact social', 'libertate']) await page.locator(`[data-act="pick"][data-k="values"][data-v="${v}"]`).click();
  for (const a of ['Expertiză tehnică', 'Autonomie']) await page.locator(`[data-act="pick"][data-k="anchors"][data-v="${a}"]`).click();
  await next(page);

  for (let i = 0; i < 3; i++) await page.fill(`#f-stories-${i}`, 'O poveste reală, cu câteva detalii concrete despre ce am făcut.');
  await next(page);

  for (let i = 0; i < 5; i++) {
    await page.locator('[data-act="sug"]').first().click();
    await page.locator(`[data-act="qs"][data-k="s"][data-i="${i}"][data-v="${5 - (i % 3)}"]`).click();
    await page.locator(`[data-act="qs"][data-k="p"][data-i="${i}"][data-v="${2 + i}"]`).click();
  }
  await next(page);
}

async function axe(page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
}

module.exports = { test, expect: base.expect, clickScale, next, fillContext, completeAssessment, axe };
