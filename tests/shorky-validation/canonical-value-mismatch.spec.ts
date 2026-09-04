import { test, expect } from '@playwright/test';

/**
 * Shorky validation: colloquial string vs. canonical selection value
 * mismatch.
 *
 * This spec targets a native `<select>` populated (via `page.evaluate`, so
 * it's fully deterministic and independent of any external page's markup)
 * with a small country picker:
 *
 *   <select id="country-select">
 *     <option value="">Please select a country</option>
 *     <option value="US">United States</option>
 *     <option value="CA">Canada</option>
 *     <option value="MX">Mexico</option>
 *   </select>
 *
 * Unlike `dynamic-form-elements.spec.ts` (which misuses `.fill()` on a
 * `<select>` — a *wrong action* mistake) or
 * `custom-dropdown-interaction.spec.ts` (a *non-native widget* mistake),
 * this spec uses the **correct** `.selectOption()` action contract but
 * supplies the **wrong value**: a colloquial abbreviation ("USA") instead
 * of either the option's canonical `value` attribute ("US") or its exact,
 * full-text visible label ("United States").
 *
 * `selectOption('USA')` matches neither the option `value` ("US") nor its
 * label ("United States"), so Playwright times out finding a matching
 * option — a genuine, reproducible "no matching option" failure distinct
 * from every other spec in this suite: the correct *action* is already
 * used, but the supplied *selection value* itself needs correcting to the
 * exact canonical string the page defines. This gives Shorky's LLM
 * diagnostics a case where the fix is neither a new selector nor a
 * different action method, but a corrected argument value (e.g.
 * `selectOption('US')` or `selectOption({ label: 'United States' })`).
 */
test('user should be able to select United States from the country dropdown', async ({ page }) => {
  await page.goto('/dropdown');

  await page.evaluate(() => {
    const select = document.createElement('select');
    select.id = 'country-select';

    const options: Array<[string, string]> = [
      ['', 'Please select a country'],
      ['US', 'United States'],
      ['CA', 'Canada'],
      ['MX', 'Mexico'],
    ];
    for (const [value, label] of options) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      select.appendChild(option);
    }

    document.querySelector('.example')!.appendChild(select);
  });

  const countrySelect = page.locator('#country-select');

  // Intentionally uses the correct `.selectOption()` action contract, but
  // supplies a colloquial abbreviation ("USA") that matches neither the
  // option's canonical `value` ("US") nor its full visible label
  // ("United States"). Shorky should heal this to
  // `selectOption('US')` or `selectOption({ label: 'United States' })`.
  await countrySelect.selectOption('USA', { timeout: 5000 });

  await expect(countrySelect).toHaveValue('US');
});
