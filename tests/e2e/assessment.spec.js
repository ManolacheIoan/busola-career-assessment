const { test, expect, clickScale, next, fillContext, completeAssessment } = require('./helpers');

test('completes all 8 steps and shows a calculated profile', async ({ page }) => {
  await completeAssessment(page);

  await expect(page.getByRole('heading', { level: 1, name: 'Profilul tău' })).toBeVisible();
  await expect(page.locator('.code')).toHaveAttribute('aria-label', 'Cod Holland: IAS');
  await expect(page.locator('#careers .job')).toHaveCount(8);
  await expect(page.locator('#careers .job').first()).toContainText('UX researcher');
  await expect(page.locator('.b5 .pct')).toHaveText(['50', '50', '50', '50', '50']);
  await expect(page.locator('.qb')).toHaveCount(4);
});

test('the next step stays locked until the required answers are given', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Începe testul/ }).click();

  const nextBtn = page.locator('#next');
  await expect(nextBtn).toBeDisabled();
  await expect(page.locator('#hint')).toHaveText('Completează vârsta și ce te-a adus aici.');

  await page.fill('#f-ctx-age', '30');
  await page.fill('#f-ctx-why', 'Vreau o schimbare.');
  await expect(page.locator('#hint')).toHaveText('Mai ai de ales 5 variante despre situația ta.');

  await fillContext(page);
  await expect(nextBtn).toBeEnabled();
  await expect(page.locator('#hint')).toHaveText('');
});

test('answers are saved automatically and the test resumes after a reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Începe testul/ }).click();
  await fillContext(page);
  await next(page);
  await clickScale(page, 'riasec', 0, 4);
  await clickScale(page, 'riasec', 1, 2);
  await expect(page.locator('#hint')).toHaveText('Mai ai de răspuns la 58 activități.');

  await page.reload();
  await page.getByRole('button', { name: 'Continuă de unde ai rămas' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Interese' })).toBeVisible();
  await expect(page.locator('[data-k="riasec"][data-i="0"][data-v="4"]')).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('[data-k="riasec"][data-i="1"][data-v="2"]')).toHaveAttribute('aria-checked', 'true');
});

test('completed steps can be reopened from the route in the header', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Începe testul/ }).click();
  await fillContext(page);
  await next(page);

  await page.locator('#route [data-jump="0"]').click();
  await expect(page.getByRole('heading', { level: 1, name: 'Context' })).toBeVisible();
  await expect(page.locator('#f-ctx-age')).toHaveValue('24');
  await expect(page.locator('#route [data-jump="1"]')).toBeDisabled();
});

test('the live map places each rated activity in its quadrant', async ({ page }) => {
  await completeAssessment(page);
  await page.getByRole('button', { name: '← Înapoi la răspunsuri' }).click();

  await expect(page.locator('#liveplot .pt')).toHaveCount(5);
  await expect(page.locator('#livecap')).toContainText('5 din 5 pe hartă');
  await page.locator('[data-act="qs"][data-k="p"][data-i="0"][data-v="6"]').click();
  await expect(page.locator('[data-qb="0"]')).toHaveText('Zona de aur');
});

test('people who do not work can say so and skip the occupation details', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Începe testul/ }).click();
  await page.fill('#f-ctx-age', '35');
  await page.fill('#f-ctx-why', 'Vreau să mă reapuc de muncă.');
  await page.getByRole('button', { name: 'Nu lucrez acum' }).click();
  await page.getByRole('button', { name: 'Remote, de acasă' }).click();
  await page.getByRole('button', { name: 'În orașul meu' }).click();
  for (const k of ['hours', 'edu', 'budget']) await page.locator(`[data-act="ctx"][data-k="${k}"][data-v="0"]`).click();

  await expect(page.locator('#f-ctx-job')).toHaveValue('');
  await expect(page.locator('#next')).toBeEnabled();
});

test('several answers can be chosen where more than one can be true', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Începe testul/ }).click();
  const student = page.getByRole('button', { name: 'Sunt elev sau student' });
  const partTime = page.getByRole('button', { name: 'Lucrez part-time' });
  await student.click();
  await partTime.click();
  await expect(student).toHaveAttribute('aria-pressed', 'true');
  await expect(partTime).toHaveAttribute('aria-pressed', 'true');
  await partTime.click();
  await expect(partTime).toHaveAttribute('aria-pressed', 'false');
});

test('one work style and one career anchor are enough to continue', async ({ page }) => {
  await page.goto('/#exemplu');
  await page.locator('#route [data-jump="3"]').click();
  for (const s of ['Logic / numeric', 'Introspectiv']) await page.locator(`[data-act="pick"][data-v="${s}"]`).click();
  await expect(page.locator('#next')).toBeEnabled();
  await page.locator('[data-act="pick"][data-v="Vizual / spațial"]').click();
  await expect(page.locator('#hint')).toHaveText('Alege cel puțin un stil.');
});
