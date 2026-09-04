import { test, expect } from '@playwright/test';

/**
 * Shorky validation: custom (non-native) dropdown interaction mismatch.
 *
 * `dynamic-form-elements.spec.ts` already covers the *native* `<select>`
 * `.fill()` misuse (fixed via `.selectOption()`). This spec covers a
 * distinct, complementary pattern: a **custom, div/button-based dropdown
 * widget** — the kind commonly used in modern component libraries instead
 * of a native `<select>` — where there is no `<select>`/`<option>` element
 * at all, only a trigger `<button>` and a list of `<li role="option">`
 * items toggled via plain click handlers.
 *
 * The widget is built entirely in-page via `page.evaluate` (no dependency
 * on any external page's markup stability, so this is fully deterministic
 * and immune to upstream demo-site changes), simulating a bare-bones
 * "combobox" pattern:
 *
 *   <div data-testid="country-custom-dropdown">
 *     <button data-testid="country-trigger">Select a country</button>
 *     <ul hidden>
 *       <li role="option" data-value="US">United States</li>
 *       <li role="option" data-value="CA">Canada</li>
 *       <li role="option" data-value="MX">Mexico</li>
 *     </ul>
 *   </div>
 *
 * Opening the list and choosing a country requires **clicking the trigger
 * button, then clicking the desired `<li role="option">` item** — there is
 * no fillable text input anywhere in this widget. This spec intentionally
 * calls `.fill()` directly on the trigger `<button>` instead, which
 * Playwright rejects outright ("Element is not an <input>, <textarea> or
 * [contenteditable] element") since a `<button>` can never be filled.
 *
 * This is deliberate — it exists to verify Shorky's LLM diagnostics
 * recognize a *custom dropdown widget* interaction contract (click to
 * open, click the option item to select) rather than only ever knowing how
 * to fix the native `<select>`/`selectOption()` case.
 */
test('user should be able to choose Canada from the custom dropdown widget', async ({ page }) => {
  await page.goto('/dropdown');

  await page.evaluate(() => {
    const container = document.createElement('div');
    container.setAttribute('data-testid', 'country-custom-dropdown');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.setAttribute('data-testid', 'country-trigger');
    trigger.textContent = 'Select a country';

    const list = document.createElement('ul');
    list.hidden = true;

    const countries: Array<[string, string]> = [
      ['US', 'United States'],
      ['CA', 'Canada'],
      ['MX', 'Mexico'],
    ];
    for (const [value, label] of countries) {
      const item = document.createElement('li');
      item.setAttribute('role', 'option');
      item.setAttribute('data-value', value);
      item.textContent = label;
      item.addEventListener('click', () => {
        trigger.textContent = label;
        trigger.setAttribute('data-selected-value', value);
        list.hidden = true;
      });
      list.appendChild(item);
    }

    trigger.addEventListener('click', () => {
      list.hidden = !list.hidden;
    });

    container.appendChild(trigger);
    container.appendChild(list);
    document.querySelector('.example')!.appendChild(container);
  });

  const trigger = page.getByTestId('country-trigger');

  // Intentionally incorrect action contract: this custom widget has no
  // fillable input anywhere — selecting an option requires clicking the
  // trigger to open the list, then clicking the desired
  // `<li role="option">` item. Shorky should heal this to:
  //   await trigger.click();
  //   await page.getByRole('option', { name: 'Canada' }).click();
  await trigger.fill('Canada');

  await expect(trigger).toHaveAttribute('data-selected-value', 'CA');
});
