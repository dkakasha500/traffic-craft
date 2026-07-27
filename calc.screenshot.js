const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox','--disable-gpu'] });
  const file = 'file:///sessions/gifted-clever-clarke/mnt/traffic-craft/calc.html';
  // desktop
  let ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  let p = await ctx.newPage();
  await p.goto(file, { waitUntil: 'networkidle' }).catch(()=>{});
  await p.waitForTimeout(1200);
  await p.screenshot({ path: '/tmp/calctest/desktop.png' });
  await ctx.close();
  // mobile
  ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true });
  p = await ctx.newPage();
  await p.goto(file, { waitUntil: 'networkidle' }).catch(()=>{});
  await p.waitForTimeout(1200);
  await p.screenshot({ path: '/tmp/calctest/mobile-top.png' });
  // домотать до результата на мобиле
  await p.evaluate(() => document.getElementById('res').scrollIntoView());
  await p.waitForTimeout(600);
  await p.screenshot({ path: '/tmp/calctest/mobile-res.png' });
  await browser.close();
  console.log('OK screenshots');
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
