import { expect, Locator, Page, test } from '@playwright/test';

const column = (page: Page, index: number) => page.getByTestId('column').nth(index);
const cardTitles = (col: Locator) => col.getByTestId('card').locator('.title');

async function drag(page: Page, source: Locator, target: Locator, offsetY = 0) {
  const from = (await source.boundingBox())!;
  const to = (await target.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2 + 10, { steps: 5 });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2 + offsetY, { steps: 20 });
  await page.mouse.up();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('loads the board with dummy data', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kanban');
  await expect(page.getByTestId('column')).toHaveCount(5);
  await expect(page.getByTestId('card')).toHaveCount(10);
  await expect(column(page, 0).locator('button.title')).toHaveText('Backlog');
});

test('renames a column with Enter and cancels with Escape', async ({ page }) => {
  const todo = column(page, 1);
  await todo.locator('button.title').click();
  await todo.getByLabel('Column name').fill('Next Up');
  await todo.getByLabel('Column name').press('Enter');
  await expect(todo.locator('button.title')).toHaveText('Next Up');

  await todo.locator('button.title').click();
  await todo.getByLabel('Column name').fill('Discarded');
  await todo.getByLabel('Column name').press('Escape');
  await expect(todo.locator('button.title')).toHaveText('Next Up');
});

test('renames a column on blur', async ({ page }) => {
  const review = column(page, 3);
  await review.locator('button.title').click();
  await review.getByLabel('Column name').fill('QA');
  await page.getByRole('heading', { level: 1 }).click();
  await expect(review.locator('button.title')).toHaveText('QA');
});

test('adds a card', async ({ page }) => {
  const review = column(page, 3);
  await review.getByRole('button', { name: 'Add card' }).click();
  await review.getByLabel('Card title').fill('Release notes');
  await review.getByLabel('Card details').fill('Draft for v1.0');
  await review.getByRole('button', { name: 'Add card' }).click();
  await expect(cardTitles(review)).toHaveText(['Checkout flow copy', 'Release notes']);
  await expect(review.getByTestId('count')).toHaveText('2');
  await expect(review.getByLabel('Card title')).toBeFocused();
  await expect(review.getByLabel('Card title')).toHaveValue('');

  await review.getByLabel('Card title').press('Escape');
  await expect(review.getByLabel('Card title')).toHaveCount(0);
});

test('deletes a card', async ({ page }) => {
  const done = column(page, 4);
  await done.getByTestId('card').first().hover();
  await done.getByRole('button', { name: 'Delete Brand color palette' }).click();
  await expect(cardTitles(done)).toHaveText(['Project kickoff']);
  await expect(page.getByTestId('card')).toHaveCount(9);
});

test('drags a card to another column', async ({ page }) => {
  const backlog = column(page, 0);
  const done = column(page, 4);
  await drag(page, backlog.getByTestId('card').first(), done.getByTestId('card').first(), -10);
  await expect(cardTitles(backlog)).toHaveText(['Onboarding email sequence', 'Accessibility audit']);
  await expect(cardTitles(done)).toHaveText(['Competitor research', 'Brand color palette', 'Project kickoff']);
});

test('drags a card into an empty column', async ({ page }) => {
  const review = column(page, 3);
  const done = column(page, 4);
  await review.getByTestId('card').first().hover();
  await review.getByRole('button', { name: 'Delete Checkout flow copy' }).click();
  await expect(review.getByText('Drop cards here')).toBeVisible();
  await drag(page, done.getByTestId('card').first(), review.locator('.cards'));
  await expect(cardTitles(review)).toHaveText(['Brand color palette']);
});

test('reorders cards within a column', async ({ page }) => {
  const backlog = column(page, 0);
  await drag(page, backlog.getByTestId('card').first(), backlog.getByTestId('card').last(), 10);
  await expect(cardTitles(backlog)).toHaveText(['Onboarding email sequence', 'Accessibility audit', 'Competitor research']);
});
