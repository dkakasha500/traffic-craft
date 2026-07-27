/* Калибровка экономической модели калькулятора.
   Берет DATA и tcCalc ПРЯМО из calc.html (jsdom) - без дублирования конфига.
   Запуск: NODE_PATH=<node_modules> node calc.calibration.js
   Прогоняет все комбинации страна x ниша x направление x сценарий на
   дефолтном бюджете (0.4 потолка) и показывает коридор ROAS + выбросы. */
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'calc.html'), 'utf8');
const dom = new JSDOM(html, {
  url: 'https://traffic-craft.com/calc', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: new VirtualConsole(),
  beforeParse(w){
    w.matchMedia = q => ({ matches: /reduce/.test(q), addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
    w.HTMLElement.prototype.scrollIntoView = function(){};
    w.navigator.sendBeacon = () => true;
  }
});
const w = dom.window;

setTimeout(() => {
  const DATA = w.DATA, tcCalc = w.tcCalc;
  const countries = Object.keys(DATA.countries);
  const niches = Object.keys(DATA.niches);
  const scens = ['cons', 'base', 'aggr'];

  const rows = [];
  for (const c of countries) for (const n of niches) for (const d of Object.keys(DATA.niches[n].dirs)) for (const s of scens) {
    const budget = Math.round(DATA.countries[c].cap * 0.4);
    const st = { country: c, niche: n, dirs: [d], budget, checkOverride: 0, scenario: s, usRegion: 'avg' };
    const r = tcCalc(st, DATA);
    if (!r) { console.log('NULL:', c, n, d, s); continue; }
    rows.push({ k: c + '/' + n + '/' + d, s, roas: r.roas });
  }

  const nDirs = niches.reduce((sum, n) => sum + Object.keys(DATA.niches[n].dirs).length, 0);
  console.log('Стран:', countries.length, '| ниш:', niches.length, '| направлений:', nDirs, '| комбинаций (x3 сценария):', rows.length);

  for (const s of scens) {
    const rs = rows.filter(x => x.s === s).sort((a, b) => a.roas - b.roas);
    const med = rs[Math.floor(rs.length / 2)].roas;
    console.log(s.toUpperCase() + ': мин x' + rs[0].roas.toFixed(1) + ' (' + rs[0].k + ') | медиана x' + med.toFixed(1) + ' | макс x' + rs[rs.length - 1].roas.toFixed(1) + ' (' + rs[rs.length - 1].k + ')');
  }

  /* коридор правдоподобия: base <= 9.6, aggr <= 12.7 (публичные кейсы TC: 600-1000%) */
  const badBase = rows.filter(x => x.s === 'base' && x.roas > 9.65).sort((a, b) => b.roas - a.roas);
  const badAggr = rows.filter(x => x.s === 'aggr' && x.roas > 12.75).sort((a, b) => b.roas - a.roas);
  console.log('ВЫБРОСЫ base > x9.6 (' + badBase.length + '):', badBase.slice(0, 10).map(x => x.k + ' x' + x.roas.toFixed(1)).join(', ') || 'нет');
  console.log('ВЫБРОСЫ aggr > x12.7 (' + badAggr.length + '):', badAggr.slice(0, 10).map(x => x.k + ' x' + x.roas.toFixed(1)).join(', ') || 'нет');

  /* нижняя граница: реклама не должна выглядеть убыточной в базовом сценарии */
  const lowBase = rows.filter(x => x.s === 'base' && x.roas < 1).sort((a, b) => a.roas - b.roas);
  console.log('base < x1.0 (' + lowBase.length + '):', lowBase.slice(0, 6).map(x => x.k + ' x' + x.roas.toFixed(1)).join(', ') || 'нет');

  /* якоря - публичные кейсы TC */
  const anchor = (c, n, d, s, b) => tcCalc({ country: c, niche: n, dirs: [d], budget: b, checkOverride: 0, scenario: s, usRegion: 'avg' }, DATA).roas;
  console.log('Якоря: IL multi/gyn base @12k x' + anchor('il', 'multi', 'gyn', 'base', 12000).toFixed(1) +
    ' | AE dental/implants aggr @15k x' + anchor('ae', 'dental', 'implants', 'aggr', 15000).toFixed(1) +
    ' | ES cosmo/smas base @14k x' + anchor('es', 'cosmo', 'smas', 'base', 14000).toFixed(1));

  /* педиатрия: регулярный спрос, ROAS должен быть умеренным (~x2-4) */
  const ped = rows.filter(x => x.s === 'base' && x.k.includes('/pediatric/'));
  const pmin = Math.min(...ped.map(x => x.roas)), pmax = Math.max(...ped.map(x => x.roas));
  console.log('Педиатрия base: x' + pmin.toFixed(1) + ' .. x' + pmax.toFixed(1) + ' (' + ped.length + ' комбо)');

  process.exit(badBase.length || badAggr.length ? 1 : 0);
}, 120);
