const { chromium } = require('playwright');
const file = 'file:///sessions/gifted-clever-clarke/mnt/traffic-craft/calc.html';
(async () => {
  const b = await chromium.launch({ args:['--no-sandbox','--disable-gpu'] });
  // 1. PRINT / PDF вывод
  let ctx = await b.newContext({ viewport:{width:1000,height:1400}, deviceScaleFactor:2 });
  let p = await ctx.newPage();
  await p.goto(file+'#c=ae&n=dental&d=implants&b=15000&s=base',{waitUntil:'networkidle'}).catch(()=>{});
  await p.waitForTimeout(800);
  await p.evaluate(()=>{ var a=document.querySelector('.assume'); if(a) a.setAttribute('open',''); });
  await p.emulateMedia({ media:'print' });
  await p.waitForTimeout(300);
  await p.screenshot({ path:'/tmp/calctest/print.png', fullPage:true });
  await ctx.close();
  // 2. МАКСИМУМ чисел: ОАЭ виниры Смелый $30k
  ctx = await b.newContext({ viewport:{width:1280,height:900}, deviceScaleFactor:2 });
  p = await ctx.newPage();
  await p.goto(file+'#c=ae&n=dental&d=veneers&b=30000&s=aggr',{waitUntil:'networkidle'}).catch(()=>{});
  await p.waitForTimeout(900);
  await p.screenshot({ path:'/tmp/calctest/max.png' });
  await ctx.close();
  // 3. МИНИМУМ: Казахстан лечение $1k Осторожный + два направления
  ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:3, isMobile:true });
  p = await ctx.newPage();
  await p.goto(file+'#c=kz&n=dental&d=therapy&b=1000&s=cons',{waitUntil:'networkidle'}).catch(()=>{});
  await p.waitForTimeout(900);
  await p.evaluate(()=>document.getElementById('res').scrollIntoView());
  await p.waitForTimeout(500);
  await p.screenshot({ path:'/tmp/calctest/min.png' });
  await ctx.close();
  // 4. Планшетная граница 900px (ещё 1 колонка) и 1000px (уже 2)
  for (const w of [900, 1000]) {
    ctx = await b.newContext({ viewport:{width:w,height:1000}, deviceScaleFactor:2 });
    p = await ctx.newPage();
    await p.goto(file,{waitUntil:'networkidle'}).catch(()=>{});
    await p.waitForTimeout(800);
    await p.screenshot({ path:`/tmp/calctest/tablet-${w}.png` });
    await ctx.close();
  }
  await b.close(); console.log('OK');
})().catch(e=>{console.error(e.message);process.exit(1)});
