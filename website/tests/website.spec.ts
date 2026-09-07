import {test,expect} from '@playwright/test';

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
  await expect(page.getByRole('heading',{level:1})).toContainText('GPUI Omarchy');
  await page.getByRole('button',{name:'Copy'}).click();
  await expect(page.getByRole('button',{name:'Copy to clipboard'})).toHaveText('Copied');
  expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe('cargo run --example gallery');
  await page.locator('.gallery-shot').scrollIntoViewIfNeeded();
  await expect(page.locator('.gallery-shot')).toBeVisible();
  await expect.poll(()=>page.locator('.gallery-shot').evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});


test('the homepage runs the real WebAssembly gallery', async ({page}) => {
  test.setTimeout(120_000);
  await page.goto('./');
  const iframe = page.locator('iframe[title="GPUI Omarchy component gallery running in WebAssembly"]');
  await iframe.scrollIntoViewIfNeeded();
  const gallery = page.frameLocator('iframe[title="GPUI Omarchy component gallery running in WebAssembly"]');
  await expect(gallery.locator('html')).toHaveAttribute('data-gallery-ready', 'true', {timeout:90_000});
  const canvas = gallery.locator('canvas');
  await expect(canvas).toBeVisible();
  // A created WebGPU canvas can still be blank. Inspect actual rendered pixels.
  await expect.poll(async () => {
    const png = await canvas.screenshot();
    return page.evaluate(async (bytes) => {
      const bitmap = await createImageBitmap(new Blob([new Uint8Array(bytes)], {type:'image/png'}));
      const surface = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = surface.getContext('2d')!;
      ctx.drawImage(bitmap, 0, 0);
      const pixels = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
      const colors = new Set<number>();
      for(let i=0;i<pixels.length;i+=16) colors.add((pixels[i]<<16)|(pixels[i+1]<<8)|pixels[i+2]);
      bitmap.close();
      return colors.size;
    }, [...png]);
  }, {timeout:30_000}).toBeGreaterThan(30);
  const overview = await canvas.screenshot();
  await canvas.click({position:{x:40,y:164}});
  await page.mouse.move(0,0);
  await expect.poll(async()=>!(await canvas.screenshot()).equals(overview)).toBe(true);
  await expect(gallery.locator('#loading')).toHaveCount(0);
});
