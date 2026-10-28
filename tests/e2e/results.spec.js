const fs = require('fs');
const { test, expect, completeAssessment } = require('./helpers');

test('#exemplu opens the example profile without overwriting saved answers', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('busola-v2', JSON.stringify({ phase: 2, ctx: { age: '41' } })));

  await page.goto('/#exemplu');
  await expect(page.locator('.demo-note')).toContainText('Profil exemplu');
  await expect(page.locator('.code')).toHaveAttribute('aria-label', 'Cod Holland: IAS');
  await page.locator('#egg summary').click();
  await page.locator('[data-act="zod"][data-v="Leu"]').click();

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('busola-v2')));
  expect(stored).toEqual({ phase: 2, ctx: { age: '41' } });
});

test('the profile downloads as Markdown outside the AI runtime', async ({ page }) => {
  await page.goto('/#exemplu');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Descarcă profilul (.md)' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('busola-profil.md');
  const text = fs.readFileSync(await download.path(), 'utf8');
  expect(text).toContain('Cod Holland: **IAS**');
  expect(text).toContain('## Meserii de explorat');
});

test('the data and prompt download as a text file', async ({ page }) => {
  await page.goto('/#exemplu');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Descarcă datele și promptul (.txt)' }).click(),
  ]);
  const text = fs.readFileSync(await download.path(), 'utf8');
  expect(text).toContain('HOLLAND (O*NET Interest Profiler');
  expect(text).toContain('MESERII CALCULATE DIN COD');
  expect(text).toContain('timp disponibil: 6–10 ore');
});

test('Holland ties are explained on the results page', async ({ page }) => {
  await page.goto('/');
  /* I and A tie at 40, S and E tie at 30: both groups touch the 3-letter code */
  await page.evaluate(() => {
    const byType = { R: 2, I: 4, A: 4, S: 3, E: 3, C: 1 };
    const types = ['R', 'I', 'A', 'S', 'E', 'C'];
    localStorage.setItem('busola-v2', JSON.stringify({
      phase: 8,
      riasec: Array.from({ length: 60 }, (_, i) => byType[types[i % 6]]),
      big5: Array(20).fill(3),
    }));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Continuă de unde ai rămas' }).click();

  await expect(page.locator('.code')).toHaveAttribute('aria-label', 'Cod Holland: IAS');
  await expect(page.locator('.ties')).toHaveText('Scor egal (40): Investigativ, Artistic · Scor egal (30): Social, Întreprinzător. Între ele, ordinea din cod e interschimbabilă.');
});

test('the zodiac easter egg stays open while a sign is chosen', async ({ page }) => {
  await page.goto('/#exemplu');
  const egg = page.locator('#egg');
  await egg.locator('summary').click();
  await page.locator('[data-act="zod"][data-v="Leu"]').click();
  await expect(egg).toHaveAttribute('open', '');
  await expect(page.locator('[data-act="zod"][data-v="Leu"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.zc')).toContainText('Leu');
});

test('starting a new test asks for a second click', async ({ page }) => {
  await page.goto('/#exemplu');
  const btn = page.locator('[data-act="reset"]');
  await btn.click();
  await expect(btn).toHaveText('Ieși din exemplu? Apasă încă o dată');
  await expect(page.locator('.demo-note')).toBeVisible();
  await btn.click();
  await expect(page.getByRole('button', { name: /Începe testul/ })).toBeVisible();
});

test('without AI, starting experiments are calculated and their results are saved', async ({ page }) => {
  await completeAssessment(page);
  const items = page.locator('#exp .exps > li');
  await expect(items).toHaveCount(5);
  await expect(items.first()).toContainText('Interviu de 20 de minute');
  await expect(items.first()).toContainText('UX researcher');

  await items.nth(1).getByRole('radio', { name: 'Așa și așa' }).click();
  await page.fill('#f-exp-1-note', 'Doi au spus „explici bine”.');
  await page.locator('#newExp').fill('Un proiect open source');
  await page.getByRole('button', { name: 'Adaugă', exact: true }).last().click();
  await expect(items).toHaveCount(6);

  await page.reload();
  await page.getByRole('button', { name: 'Continuă de unde ai rămas' }).click();
  await expect(page.locator('#exp .counter')).toContainText('Încercate: 1 din 6');
  await expect(page.locator('#f-exp-1-note')).toHaveValue('Doi au spus „explici bine”.');
});

test('the checks card explains how reliable the profile is', async ({ page }) => {
  await completeAssessment(page);
  const card = page.locator('#checks');
  await expect(card.locator('.ck-t').nth(0)).toContainText('ridicată');
  await expect(card.locator('.ck-t').nth(1)).toContainText('Investigativ și Artistic sunt vecine');
  /* the helper answers in seconds and writes short stories, so the quality checks must notice */
  await expect(card).toContainText('Interese completate foarte repede');
  await expect(card).toContainText('Povești scurte');
  await expect(card.locator('.ck-t').nth(2)).toContainText('scăzută');
});

test('regulated professions are marked in the occupation list', async ({ page }) => {
  await page.goto('/#exemplu');
  await expect(page.locator('#careers')).toContainText('Reglementată: atestat de liberă practică de la Colegiul Psihologilor din România');
});
