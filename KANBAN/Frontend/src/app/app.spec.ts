import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let el: HTMLElement;

  const columns = () => Array.from(el.querySelectorAll<HTMLElement>('[data-testid="column"]'));
  const cardTitles = (col: HTMLElement) =>
    Array.from(col.querySelectorAll('[data-testid="card"] .title')).map((t) => t.textContent?.trim());
  const stable = () => fixture.whenStable();

  beforeEach(async () => {
    fixture = TestBed.createComponent(App);
    el = fixture.nativeElement;
    await stable();
  });

  it('renders five columns with dummy cards', () => {
    expect(columns().map((c) => c.querySelector('.title')?.textContent?.trim())).toEqual([
      'Backlog', 'To Do', 'In Progress', 'Review', 'Done',
    ]);
    expect(el.querySelectorAll('[data-testid="card"]').length).toBe(10);
    expect(el.querySelector('.subtitle')?.textContent).toContain('10 cards');
  });

  it('renames a column via the header', async () => {
    columns()[1].querySelector<HTMLButtonElement>('button.title')!.click();
    await stable();
    const input = columns()[1].querySelector<HTMLInputElement>('.title-input')!;
    input.value = 'Next Up';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await stable();
    expect(columns()[1].querySelector('button.title')?.textContent?.trim()).toBe('Next Up');
  });

  it('cancels a rename with Escape', async () => {
    columns()[1].querySelector<HTMLButtonElement>('button.title')!.click();
    await stable();
    const input = columns()[1].querySelector<HTMLInputElement>('.title-input')!;
    input.value = 'Discarded';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await stable();
    expect(columns()[1].querySelector('button.title')?.textContent?.trim()).toBe('To Do');
  });

  it('adds a card through the form', async () => {
    const review = columns()[3];
    review.querySelector<HTMLButtonElement>('button.add')!.click();
    await stable();
    review.querySelector<HTMLInputElement>('input.field')!.value = 'Ship it';
    review.querySelector('form')!.dispatchEvent(new Event('submit'));
    await stable();
    expect(cardTitles(review)).toEqual(['Checkout flow copy', 'Ship it']);
    expect(review.querySelector('[data-testid="count"]')?.textContent).toBe('2');
  });

  it('deletes a card', async () => {
    const done = columns()[4];
    done.querySelector<HTMLButtonElement>('button.delete')!.click();
    await stable();
    expect(cardTitles(done)).toEqual(['Project kickoff']);
  });
});
