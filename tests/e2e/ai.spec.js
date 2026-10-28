const { test, expect, completeAssessment } = require('./helpers');

/* A stand-in for the AI runtime: records every prompt and answers with fixed Markdown. */
function installMockAI(page) {
  return page.addInitScript(() => {
    window.__prompts = [];
    const sample = async (prompt, opts) => {
      window.__prompts.push(prompt);
      let text;
      if (prompt.includes('ÎNTREBAREA PERSOANEI')) text = 'Pentru că interesele tale de top sunt cercetarea și designul [Holland: Investigativ 50].';
      else if (prompt.includes('SARCINA (actualizare)')) text = '## 10. Ce am aflat din experimente\n- Prototipul a confirmat direcția [Experiment 1].';
      else if (prompt.includes('SARCINA (partea 2 din 2)')) text = '## 6. Cele 5 mini-experimente\n- **Prototip de weekend:** refaci un ecran [Povestea 1].\n- **Interviu cu un designer:** 20 de minute.\n- **Întreabă 3 oameni:** la ce te văd bun.\n\n## 7. Planul pe 30 de zile\n1. Săptămâna 1: interviul.';
      else text = '## 1. Profilul tău în 10 rânduri\nTe atrage cercetarea [Holland: Investigativ 50].';
      if (opts && opts.onText) opts.onText({ text: text.slice(0, 12) });
      return { text, truncated: false };
    };
    window.claude = { use: async (name) => (name === 'sample' ? sample : null) };
  });
}

test.beforeEach(async ({ page }) => {
  await installMockAI(page);
  await completeAssessment(page);
  await page.getByRole('button', { name: /Generează raportul personalizat/ }).click();
  await expect(page.locator('#status')).toContainText('Gata');
});

test('the report shows evidence pills and the prompt carries the checks and raw answers', async ({ page }) => {
  await expect(page.locator('#rep1 .ev')).toHaveText('Holland: Investigativ 50');
  await expect(page.locator('#rep2')).toContainText('Planul pe 30 de zile');

  const [first] = await page.evaluate(() => window.__prompts);
  expect(first).toContain('DOVEZI:');
  expect(first).toContain('VERIFICĂRI AUTOMATE: diferențiere Holland 40 din 40');
  expect(first).toContain('ACTIVITĂȚI NOTATE CU 5 (i-ar plăcea foarte mult): Caut cum funcționează ceva până înțeleg complet');
  expect(first).toContain('timp disponibil: 3–6 ore');
});

test('experiments from the report become a tracker that updates the report', async ({ page }) => {
  const items = page.locator('#exp .exps > li');
  await expect(items).toHaveCount(3);
  await expect(items.first()).toContainText('Prototip de weekend');
  await expect(page.locator('[data-act="upd"]')).toBeDisabled();

  await items.first().getByRole('radio', { name: 'Mi-a plăcut', exact: true }).click();
  await page.fill('#f-exp-0-note', 'Am lucrat 5 ore fără pauză.');
  await page.getByRole('button', { name: /Actualizează raportul/ }).click();

  await expect(page.locator('#rep3')).toContainText('Ce am aflat din experimente');
  await expect(page.locator('#rep3 .ev')).toHaveText('Experiment 1');
  const last = await page.evaluate(() => window.__prompts.at(-1));
  expect(last).toContain('Experiment 1 (Prototip de weekend): mi-a plăcut — notițe: Am lucrat 5 ore fără pauză.');
});

test('questions about the results get an answer with evidence', async ({ page }) => {
  await page.fill('#askq', 'De ce nu e programarea pe primul loc?');
  await page.getByRole('button', { name: 'Întreabă' }).click();

  await expect(page.locator('.qa-q')).toHaveText('De ce nu e programarea pe primul loc?');
  await expect(page.locator('.qa-a .ev')).toHaveText('Holland: Investigativ 50');
  const last = await page.evaluate(() => window.__prompts.at(-1));
  expect(last).toContain('ÎNTREBAREA PERSOANEI: De ce nu e programarea pe primul loc?');

  await page.reload();
  await page.getByRole('button', { name: 'Continuă de unde ai rămas' }).click();
  await expect(page.locator('.qa-a')).toContainText('cercetarea și designul');
});
