/* Сверка цифр: модель tcCalc против всего, что показано на странице.
   Запуск чанками (память): node calc.numbers.test.js il,ae,es
   edge-кейсы: node calc.numbers.test.js edge */
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'calc.html'), 'utf8');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const vc = new VirtualConsole();
const dom = new JSDOM(html, {
  url: 'https://traffic-craft.com/calc', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
  beforeParse(w){
    w.matchMedia = q => ({ matches: /reduce/.test(q), addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
    w.HTMLElement.prototype.scrollIntoView = function(){};
    w.navigator.sendBeacon = () => true;
  }
});
const w = dom.window, d = w.document;
const g = id => (d.getElementById(id) || {}).textContent || '';

(async () => {
  await sleep(80);
  const arg = process.argv[2] || '';
  const edgeOnly = arg === 'edge';
  const countries = edgeOnly ? [] : (arg ? arg.split(',') : Object.keys(w.DATA.countries));
  const niches = Object.keys(w.DATA.niches);
  let checked = 0; const fails = [];

  const checkAll = () => {
    const r = w.tcCalc(w.state, w.DATA);
    const errs = [];
    if (!r) return { errs: ['tcCalc null'], r };
    const eq = (name, actual, expected) => { if (String(actual).trim() !== String(expected).trim()) errs.push(name + ': DOM"' + actual + '" != "' + expected + '"'); };
    /* зеркалим форматтер страницы: вырожденные диапазоны '2-2' -> '~2', ноль -> '<1' */
    const ri = v => {
      const lo = Math.round(v * r.lo), hi = Math.round(v * r.hi);
      if (hi === 0) return '<1';
      if (lo === hi) return '~' + w.fmtInt(lo);
      return w.fmtInt(lo) + '-' + w.fmtInt(hi);
    };
    const rm = v => w.fmtRangeMoney(v * r.lo, v * r.hi);
    eq('плитка заявок', g('rLeads'), ri(r.leads));
    eq('плитка выручки', g('rRevenue'), rm(r.revenue));
    eq('воронка заявки', g('fLeads'), ri(r.leads));
    eq('воронка записи', g('rBookings'), ri(r.bookings));
    eq('воронка продажи', g('rSales'), ri(r.sales));
    eq('воронка выручка', g('fRev'), rm(r.revenue));
    if (!g('fL2B').includes(Math.round(r.l2b * 100) + '%')) errs.push('процент записей "' + g('fL2B') + '"');
    if (!g('fB2S').includes(Math.round(r.b2s * 100) + '%')) errs.push('процент продаж "' + g('fB2S') + '"');
    const m = g('verdict').match(/~([\d.,]+)/);
    if (!m) errs.push('нет ROAS в вердикте');
    else { const shown = parseFloat(m[1].replace(',', '.')); if (Math.abs(shown - r.roas) > 0.15) errs.push('ROAS ' + shown + ' vs ' + r.roas.toFixed(2)); }
    eq('sticky заявки', g('sLeads'), w.fmtInt(r.leads));
    eq('sticky выручка', g('sRevenue'), w.fmtMoney(r.revenue));
    const sum = w.calcSummary();
    if (!sum.includes(w.fmtInt(r.leads) + ' заявок')) errs.push('сводка WA: заявки');
    if (!sum.includes((r.sales < 0.5 ? 'менее 1' : w.fmtInt(r.sales)) + ' продаж')) errs.push('сводка WA: продажи');
    if (!sum.includes(w.fmtMoney(r.revenue))) errs.push('сводка WA: выручка');
    if (!sum.includes(w.fmtMoney(w.state.budget))) errs.push('сводка WA: бюджет');
    const burn = d.getElementById('resBurn');
    if (r.overCap) {
      if (burn.hidden) errs.push('burn скрыт при overCap');
      else { if (!burn.textContent.includes(w.fmtMoney(r.cap))) errs.push('burn: потолок'); if (!burn.textContent.includes(w.fmtMoney(r.effBudget))) errs.push('burn: effBudget'); }
    } else if (!burn.hidden) errs.push('burn виден без overCap');
    /* видимый текст: без script/style (в коде легитимно встречаются NaN/undefined) */
    const clone = d.body.cloneNode(true);
    clone.querySelectorAll('script,style,template').forEach(x => x.remove());
    const bodyTxt = clone.textContent;
    for (const bad of ['NaN', 'Infinity', 'undefined']) if (bodyTxt.includes(bad)) errs.push('в тексте страницы: ' + bad);
    if (!(r.leads > 0 && r.revenue > 0 && isFinite(r.roas))) errs.push('модель: неположительные');
    if (Math.abs(r.bookings - r.leads * r.l2b) > 1e-9) errs.push('bookings != leads*l2b');
    if (Math.abs(r.sales - r.bookings * r.b2s) > 1e-9) errs.push('sales != bookings*b2s');
    if (Math.abs(r.roas - r.revenue / w.state.budget) > 1e-9) errs.push('roas != revenue/budget');
    return { errs, r };
  };

  for (const c of countries) for (const n of niches) for (const scen of ['cons','base','aggr']) {
    const dir = Object.keys(w.DATA.niches[n].dirs)[0];
    w.location.hash = '#c=' + c + '&n=' + n + '&d=' + dir + '&s=' + scen;
    w.dispatchEvent(new w.Event('hashchange'));
    await sleep(120);
    const { errs } = checkAll();
    checked++;
    if (errs.length) fails.push({ cfg: c + '/' + n + '/' + scen, errs });
  }

  if (edgeOnly) {
    /* переспенд: kz на потолке слайдера */
    w.location.hash = '#c=kz&n=dental&d=implants&b=6000&s=base';
    w.dispatchEvent(new w.Event('hashchange'));
    await sleep(140);
    { const r = w.tcCalc(w.state, w.DATA); const errs = [];
      if (!r.overCap) errs.push('kz6000: нет overCap');
      if (d.getElementById('resBurn').hidden) errs.push('kz6000: burn скрыт');
      if (!(r.effBudget < 6000)) errs.push('kz6000: effBudget >= бюджета');
      const all = checkAll(); errs.push(...all.errs);
      checked++; if (errs.length) fails.push({ cfg: 'edge-overcap', errs }); }

    /* ручной чек */
    const chk = d.getElementById('check');
    chk.value = '250'; chk.dispatchEvent(new w.Event('input', { bubbles: true }));
    await sleep(140);
    { const r = w.tcCalc(w.state, w.DATA); const errs = [];
      if (w.state.checkOverride !== 250) errs.push('checkOverride=' + w.state.checkOverride);
      if (r.check !== 250) errs.push('модель чек=' + r.check);
      const all = checkAll(); errs.push(...all.errs);
      checked++; if (errs.length) fails.push({ cfg: 'edge-чек250', errs }); }

    /* регионы США */
    for (const reg of ['ny','ca','fl','tx']) {
      w.location.hash = '#c=us&n=dental&d=implants&r=' + reg + '&s=base';
      w.dispatchEvent(new w.Event('hashchange'));
      await sleep(140);
      const all = checkAll();
      checked++; if (all.errs.length) fails.push({ cfg: 'edge-us-' + reg, errs: all.errs });
    }

    /* сегменты аудитории: DOM сходится с моделью + механика множителей */
    for (const [c, a] of [['il','ru'], ['il','loc'], ['ae','ex'], ['ae','loc'], ['es','ru'], ['us','ru']]) {
      w.location.hash = '#c=' + c + '&n=dental&d=implants&b=1000&s=base&a=' + a;
      w.dispatchEvent(new w.Event('hashchange'));
      await sleep(140);
      const errs = [];
      if (w.state.aud !== a) errs.push('аудитория не применилась: ' + w.state.aud);
      const rSeg = w.tcCalc(w.state, w.DATA);
      const cfgAud = w.DATA.countries[c].aud[a];
      const rBase = w.tcCalc(Object.assign({}, w.state, { aud: 'all' }), w.DATA);
      /* b=1000 - линейная зона всех сегментов: заявки = базовые / множитель CPL */
      if (Math.abs(rSeg.leads - rBase.leads / cfgAud.cpl) > 1e-9) errs.push('заявки != базовые/' + cfgAud.cpl);
      if (Math.abs(rSeg.cap - w.DATA.countries[c].cap * cfgAud.cap) > 1e-9) errs.push('потолок сегмента');
      if (Math.abs(rSeg.check - rBase.check) > 1e-9) errs.push('чек сегмента поехал');
      const all = checkAll(); errs.push(...all.errs);
      checked++; if (errs.length) fails.push({ cfg: 'edge-aud-' + c + '-' + a, errs });
    }
  }

  console.log('проверено:', checked, edgeOnly ? '(edge-кейсы)' : '(' + countries.join(',') + ' x ' + niches.length + ' ниш x 3 сценария)');
  if (fails.length) { console.log('РАСХОЖДЕНИЯ (' + fails.length + '):'); fails.slice(0, 15).forEach(f => console.log(' ', f.cfg, '->', f.errs.join(' | '))); process.exit(1); }
  console.log('ЦИФРЫ СХОДЯТСЯ');
  process.exit(0);
})().catch(e => { console.error('УПАЛО:', e.message); process.exit(1); });
