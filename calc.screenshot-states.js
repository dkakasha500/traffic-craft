const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args:['--no-sandbox','--disable-gpu'] });
  const file = 'file:///sessions/gifted-clever-clarke/mnt/traffic-craft/calc.html';
  // узкий экран 320px
  let ctx = await b.newContext({ viewport:{width:320,height:720}, deviceScaleFactor:2, isMobile:true });
  let p = await ctx.newPage(); await p.goto(file,{waitUntil:'networkidle'}).catch(()=>{}); await p.waitForTimeout(900);
  await p.screenshot({ path:'/tmp/calctest/w320.png' });
  // заполненная форма (десктоп, доскроллить до CTA)
  ctx = await b.newContext({ viewport:{width:1280,height:900}, deviceScaleFactor:2 });
  p = await ctx.newPage(); await p.goto(file,{waitUntil:'networkidle'}).catch(()=>{}); await p.waitForTimeout(900);
  await p.fill('#cName','Марина Клинике'); await p.fill('#cPhone','+971 50 123 4567');
  await p.evaluate(()=>document.getElementById('cta').scrollIntoView({block:'center'}));
  await p.waitForTimeout(500);
  await p.screenshot({ path:'/tmp/calctest/cta.png' });
  await b.close(); console.log('OK');
})().catch(e=>{console.error(e.message);process.exit(1)});
