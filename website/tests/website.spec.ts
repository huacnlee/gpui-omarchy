import {test,expect,type Locator,type Page} from '@playwright/test';

async function waitForGalleryPaint(page: Page, canvas: Locator) {
  // A created WebGPU canvas can still be blank. Inspect actual rendered pixels.
  // Retry the whole capture because GPUI can replace the canvas during startup.
  await expect(async () => {
    const png = await canvas.screenshot();
    const count = await page.evaluate(async (bytes) => {
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
    expect(count).toBeGreaterThan(30);
  }).toPass({timeout:30_000});
}

test('themes persist and all layouts fit narrow screens',async({page})=>{
  await page.goto('./');
  await page.evaluate(() => localStorage.setItem('gpui-omarchy-theme', 'catppuccin'));
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'tokyo-night');
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0);
  for(const [name,id] of [['Flexoki Light','flexoki-light'],['Tokyo Night','tokyo-night']]) {
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
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const [width,height] of [[1280,720],[1440,800],[1512,850]]) {
    await page.setViewportSize({width,height});
    await page.locator('#components').evaluate(element=>element.scrollIntoView());
    const bounds = await page.locator('#components iframe').boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.y).toBeGreaterThanOrEqual(68);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(height);
  }
});

test('page assets load and Cargo.toml dependencies can be copied',async({page,context})=>{
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('./');
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0);
  await expect(page.getByRole('heading',{level:1})).toContainText('GPUI / OMARCHY');
  await page.getByRole('button',{name:'Copy'}).click();
  await expect(page.getByRole('button',{name:'Copy to clipboard'})).toHaveText('Copied');
  expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe('[dependencies]\ngpui-kit = { version = "=0.6.1", default-features = false }\ngpui-omarchy = "0.1.2"');
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
  await waitForGalleryPaint(page, canvas);
  const overview = await canvas.screenshot();
  await canvas.click({position:{x:40,y:150}, delay:100});
  await page.mouse.move(0,0);
  await expect.poll(async()=>!(await canvas.screenshot()).equals(overview)).toBe(true);
  await expect(gallery.locator('#loading')).toHaveCount(0);
});


test('gallery follows the page theme at startup and without reloading', async ({page}) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => localStorage.setItem('gpui-omarchy-theme', 'flexoki-light'));
  await page.goto('./');
  await page.locator('iframe').scrollIntoViewIfNeeded();
  const gallery = page.frameLocator('iframe');
  await expect(gallery.locator('html')).toHaveAttribute('data-gallery-theme','flexoki-light', {timeout:90_000});
  await expect(gallery.locator('html')).toHaveAttribute('data-gallery-ready','true');
  const canvas = gallery.locator('canvas');
  // Read an unoccupied pixel from the actual Rust canvas, not the iframe background.
  const background = async () => {
    const png = await canvas.screenshot();
    return page.evaluate(async bytes => {
      const bitmap = await createImageBitmap(new Blob([new Uint8Array(bytes)], {type:'image/png'}));
      const surface = new OffscreenCanvas(bitmap.width,bitmap.height);
      const ctx = surface.getContext('2d')!;
      ctx.drawImage(bitmap,0,0);
      const color = [...ctx.getImageData(bitmap.width-10,100,1,1).data].slice(0,3);
      bitmap.close();
      return color;
    },[...png]);
  };
  await expect.poll(background).toEqual([255,252,240]);
  const frame = page.frames().find(frame=>frame.url().includes('/gallery/index.html'))!;
  await frame.evaluate(()=>{document.documentElement.dataset.sessionMarker='same-app';});
  for(const [name,id,color] of [
    ['Tokyo Night','tokyo-night',[26,27,38]],
    ['Flexoki Light','flexoki-light',[255,252,240]],
  ] as const) {
    await page.getByRole('button',{name:/Theme:/}).click();
    await page.getByRole('menuitemradio',{name}).click();
    await expect(gallery.locator('html')).toHaveAttribute('data-gallery-theme',id);
    await expect.poll(background).toEqual([...color]);
    await expect(gallery.locator('html')).toHaveAttribute('data-session-marker','same-app');
  }
});


test('Select and Combobox stay interactive and scrolling survives', async ({page, baseURL}) => {
  test.setTimeout(120_000);
  await page.setViewportSize({width:1060,height:760});
  const errors:string[]=[];
  // gpui-kit-assets fetches icons on the web and reports a miss as an error so
  // GPUI retries the next frame. That is the loader working, not a page fault.
  const loadingIcon = (text:string)=>text.includes('Wasm assets loading');
  page.on('pageerror', error=>{if(!loadingIcon(error.message)) errors.push(error.message);});
  page.on('console', message=>{if(message.type()==='error' && !loadingIcon(message.text())) errors.push(message.text());});
  await page.goto(new URL('gallery/index.html',baseURL).href);
  await expect(page.locator('html')).toHaveAttribute('data-gallery-ready','true',{timeout:90_000});
  const canvas = page.locator('canvas');
  await waitForGalleryPaint(page, canvas);
  // The WASM canvas has no DOM controls. These coordinates are for the fixed
  // 1060×760 viewport; verify navigation separately from opening the popup.
  const overview = await canvas.screenshot();
  await canvas.click({position:{x:35,y:386},delay:100});
  await page.mouse.move(1000,700);
  await expect.poll(async()=>!(await canvas.screenshot()).equals(overview)).toBe(true);
  const select = await canvas.screenshot();
  await canvas.click({position:{x:400,y:204},delay:100});
  await page.mouse.move(1000,700);
  await expect.poll(async()=>!(await canvas.screenshot()).equals(select)).toBe(true);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  // Compare after closing the popup, so opening it alone cannot satisfy selection.
  await expect.poll(async()=>!(await canvas.screenshot()).equals(select)).toBe(true);
  const selected = await canvas.screenshot();
  await canvas.click({position:{x:35,y:412},delay:100});
  await page.mouse.move(1000,700);
  await expect.poll(async()=>!(await canvas.screenshot()).equals(selected)).toBe(true);
  const combobox = await canvas.screenshot();
  await canvas.click({position:{x:400,y:204},delay:100});
  await expect.poll(async()=>!(await canvas.screenshot()).equals(combobox)).toBe(true);
  await page.keyboard.type('sandbox',{delay:100});
  await page.keyboard.press('Enter');
  await expect.poll(async()=>!(await canvas.screenshot()).equals(combobox)).toBe(true);
  const beforeScroll = await canvas.screenshot();
  await page.mouse.move(80,550);
  await page.mouse.wheel(0,700);
  await page.mouse.move(1000,700);
  await expect.poll(async()=>!(await canvas.screenshot()).equals(beforeScroll)).toBe(true);
  expect(errors).toEqual([]);
});
