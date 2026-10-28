const { test, expect, axe, fillContext, next } = require('./helpers');

const pages = {
  home: async (page) => { await page.goto('/'); },
  context: async (page) => { await page.goto('/'); await page.getByRole('button', { name: /Începe testul/ }).click(); },
  interests: async (page) => { await page.goto('/'); await page.getByRole('button', { name: /Începe testul/ }).click(); await fillContext(page); await next(page); },
  results: async (page) => { await page.goto('/#exemplu'); await expect(page.locator('.code')).toBeVisible(); },
};

for (const [name, open] of Object.entries(pages)) {
  for (const theme of ['light', 'dark']) {
    test(`no accessibility violations: ${name}, ${theme} theme`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('busola-theme', t), theme);
      await open(page);
      const { violations } = await axe(page);
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
    });
  }

  test(`no horizontal scroll: ${name}`, async ({ page }) => {
    await open(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('the theme toggle switches theme and remembers the choice', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await page.getByRole('button', { name: /Schimbă tema/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('the only external requests are for Google Fonts', async ({ page, external }) => {
  await page.goto('/#exemplu');
  await expect(page.locator('.code')).toBeVisible();
  expect(external.length).toBeGreaterThan(0);
  for (const url of external) expect(url).toMatch(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//);
});

test('a "Salvat" indicator appears after an answer is saved', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Începe testul/ }).click();
  await page.fill('#f-ctx-age', '24');
  await expect(page.locator('#saved')).toHaveClass(/on/);
});

test('the compass description box keeps the same height for every quadrant', async ({ page }) => {
  await page.goto('/');
  const box = page.locator('#cread');
  const heights = [];
  for (const q of ['q1', 'q2', 'q3', 'q4']) {
    await page.locator(`.compass .sec[data-q="${q}"]`).hover({ force: true });
    await expect(box.locator('.on')).toHaveAttribute('data-q', q);
    heights.push((await box.boundingBox()).height);
  }
  expect(new Set(heights).size).toBe(1);
});
