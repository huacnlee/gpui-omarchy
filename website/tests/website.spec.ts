import {test,expect} from '@playwright/test';

test('workspace preferences can be reviewed, cancelled and saved',async({page})=>{
  await page.goto('./');
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Review changes'})).toBeDisabled();
  await page.getByRole('combobox').click();
  await page.getByRole('option',{name:'Team workspace'}).click();
  await page.getByRole('button',{name:'Review changes'}).click();
  await expect(page.getByRole('dialog')).toContainText('Team workspace');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('button',{name:'Review changes'})).toBeFocused();
  await page.getByRole('button',{name:'Review changes'}).click();
  await page.getByRole('button',{name:'Save preferences'}).click();
  await expect(page.getByLabel('Saved preferences')).toContainText('Team workspace');
  await expect(page.getByRole('button',{name:'Review changes'})).toBeDisabled();
  await page.getByRole('tab',{name:'Activity'}).click();
  await expect(page.getByRole('tabpanel',{name:'Activity'})).toContainText('Saved preferences for Team workspace.');
});

test('themes persist and all layouts fit narrow screens',async({page})=>{
  await page.goto('./');
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0);
  for(const [name,id] of [['Flexoki Light','flexoki-light'],['Catppuccin','catppuccin'],['Tokyo Night','tokyo-night']]) {
    await page.getByRole('button',{name:/Theme:/}).click();
    await page.getByRole('menuitemradio',{name}).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme',id);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme',id);
  }
  for(const width of [1440,768,390,320]) {
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('page assets load and copy command works',async({page,context})=>{
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('./');
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0);
  await expect(page.getByRole('heading',{level:1})).toContainText('GPUI Kit');
  await page.getByRole('button',{name:'Copy'}).click();
  await expect(page.getByRole('button',{name:'Copy to clipboard'})).toHaveText('Copied');
  expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe('cargo run --example gallery');
  await page.locator('.gallery-shot').scrollIntoViewIfNeeded();
  await expect(page.locator('.gallery-shot')).toBeVisible();
  await expect.poll(()=>page.locator('.gallery-shot').evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
