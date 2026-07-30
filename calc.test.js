const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const assert = require('assert');
const html = fs.readFileSync('/sessions/gifted-clever-clarke/mnt/traffic-craft/calc.html', 'utf8');
const sleep = ms => new Promise(r => setTimeout(r, ms));

function boot(opts = {}) {
  const errors = [], beacons = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { if(!/navigation/i.test(e.message)) errors.push('jsdom: ' + e.message); });
  const dom = new JSDOM(html, {
    url: opts.url || 'https://traffic-craft.com/calc',
    runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(window) {
      window.matchMedia = q => ({ matches: /reduce/.test(q), addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
      window.HTMLElement.prototype.scrollIntoView = function(){};
      window.navigator.sendBeacon = (url, data) => { beacons.push({ url, body: String(data) }); return true; };
      window.addEventListener('error', e => errors.push(e.message));
      if (opts.storage) for (const [k, v] of Object.entries(opts.storage)) window.localStorage.setItem(k, v);
    }
  });
  const w = dom.window, d = w.document;
  const fbqCalls = () => Array.from(w.fbq.queue).map(a => Array.from(a));
  const chipTexts = id => Array.from(d.getElementById(id).children).map(b => b.textContent);
  const onChip = id => Array.from(d.getElementById(id).children).find(b => b.className.includes('on'));
  const clickChip = (id, match) => { Array.from(d.getElementById(id).children).find(b => b.textContent.includes(match)).click(); };
  return { w, d, errors, beacons, fbqCalls, chipTexts, onChip, clickChip };
}

(async () => {
  /* v31: страница исполняется и рендерится */
  let t = boot();
  assert.deepStrictEqual(t.errors, [], 'ошибки исполнения: ' + t.errors);
  assert.strictEqual(t.d.getElementById('countryChips').children.length, 9, '9 стран');
  assert.strictEqual(t.d.getElementById('nicheChips').children.length, 8, '8 ниш');
  /* услуги свернуты как в демо: 4 + кнопка «+3 еще», клик раскрывает все 7 */
  assert.strictEqual(t.d.getElementById('dirChips').children.length, 5, 'свернуто: 4 услуги + «еще»');
  Array.from(t.d.getElementById('dirChips').children).find(b => b.textContent.includes('еще')).click();
  assert.strictEqual(t.d.getElementById('dirChips').children.length, 7, 'раскрыто: 7 направлений в стоматологии');
  assert.notStrictEqual(t.d.getElementById('rLeads').textContent, '—', 'заявки посчитаны');
  assert.ok(/\d{4}/.test(t.d.getElementById('footerYear').textContent), 'год в подвале');
  assert.ok(t.d.getElementById('check').value > 0, 'чек подставлен');
  assert.ok(t.d.getElementById('waBtn').href.includes('wa.me/77782182305'), 'WA-ссылка собрана');
  assert.ok(t.d.getElementById('scenHint').textContent.length > 0, 'подсказка сценария показана');
  console.log('✓ v31: страница загружается без ошибок, всё отрендерено');

  /* v32: взаимодействия */
  const leadsBefore = t.d.getElementById('rLeads').textContent;
  t.clickChip('countryChips', 'ОАЭ');
  assert.notStrictEqual(t.d.getElementById('rLeads').textContent, leadsBefore, 'смена страны меняет прогноз');
  t.clickChip('nicheChips', 'Космет');
  assert.ok(t.onChip('dirChips'), 'выбранное направление подсвечено (без галочек - минимализм)');
  t.clickChip('dirChips', 'SMAS');
  const dirsOn = Array.from(t.d.getElementById('dirChips').children).filter(b => b.className.includes('on'));
  assert.strictEqual(dirsOn.length, 2, 'два направления выбраны');
  /* сегмент аудитории: чип меняет прогноз, попадает в hash, сбрасывается сменой страны */
  const audLeadsBefore = t.d.getElementById('rLeads').textContent;
  const audChip = Array.from(t.d.getElementById('audChips').children).find(b => b.textContent === 'Рус');
  assert.ok(audChip, 'чип аудитории отрендерен');
  audChip.click();
  assert.notStrictEqual(t.d.getElementById('rLeads').textContent, audLeadsBefore, 'сегмент меняет прогноз');
  assert.ok(t.w.buildHash().includes('a=ru'), 'сегмент в hash');
  assert.ok(t.d.getElementById('resTag').textContent.includes('Рус'), 'сегмент в бейдже');
  t.clickChip('countryChips', 'Израиль');
  assert.strictEqual(t.w.state.aud, 'all', 'смена страны сбрасывает сегмент');
  t.clickChip('countryChips', 'ОАЭ');
  const slider = t.d.getElementById('budget');
  slider.value = '10000';
  slider.dispatchEvent(new t.w.Event('input', { bubbles: true }));
  await sleep(60); /* rAF-троттлинг */
  /* ae показывает бюджет в дирхамах: сверяем через форматтер страницы */
  assert.strictEqual(t.d.getElementById('budgetVal').textContent, t.w.fmtMoney(10000), 'бюджет обновился: ' + t.d.getElementById('budgetVal').textContent);
  assert.ok(t.d.getElementById('budgetUsd').textContent.includes('$10 000'.replace(' ', ' ')) || t.d.getElementById('budgetUsd').textContent.includes('10'), 'долларовая приписка у бюджета: ' + t.d.getElementById('budgetUsd').textContent);
  Array.from(t.d.getElementById('scenToggle').children)[2].click();
  await sleep(320); /* дебаунс hash */
  assert.ok(t.w.location.hash.includes('s=aggr'), 'сценарий в hash: ' + t.w.location.hash);
  assert.ok(t.w.location.hash.includes('c=ae'), 'страна в hash');
  const saved = JSON.parse(t.w.localStorage.getItem('tc_calc_v1'));
  assert.strictEqual(saved.country, 'ae', 'localStorage пишется');
  console.log('✓ v32: чипы, слайдер, сценарии, hash, localStorage — работают');

  /* v33: форма */
  t = boot();
  t.d.getElementById('cName').value = 'Тест Тестович';
  t.d.getElementById('cPhone').value = '+7 777 000 11 22';
  t.d.getElementById('calcForm').dispatchEvent(new t.w.Event('submit', { bubbles: true, cancelable: true }));
  assert.strictEqual(t.beacons.length, 1, 'один beacon');
  assert.ok(t.beacons[0].url === '/api/lead', 'на /api/lead');
  const body = decodeURIComponent(t.beacons[0].body.replace(/\+/g, ' '));
  for (const part of ['name=Тест Тестович', 'phone=+7 777 000 11 22', 'project=Калькулятор: Израиль', 'eventId=calc_', 'pageUrl=https://traffic-craft.com/calc']) {
    assert.ok(body.includes(part), 'в заявке есть ' + part.split('=')[0] + ': ' + body);
  }
  /* il считает в шекелях, доллар - припиской */
  assert.ok(body.includes('чек ₪'), 'чек в сводке в шекелях: ' + body);
  assert.ok(body.includes('(≈ $'), 'долларовая приписка в сводке');
  const lead = t.fbqCalls().find(c => c[0] === 'track' && c[1] === 'Lead');
  assert.ok(lead, 'пиксель Lead отправлен (через стаб-очередь — сценарий адблока)');
  assert.ok(lead[3] && /^calc_/.test(lead[3].eventID), 'eventID для дедупликации');
  const idInBody = body.match(/eventId=(calc_[^&]+)/)[1];
  assert.strictEqual(lead[3].eventID, idInBody, 'eventID пикселя == eventId заявки (дедуп CAPI)');
  console.log('✓ v33: сабмит — beacon полный, Lead с тем же eventID');

  /* валидация и honeypot */
  t = boot();
  t.d.getElementById('cName').value = 'A';
  t.d.getElementById('cPhone').value = '1';
  t.d.getElementById('calcForm').dispatchEvent(new t.w.Event('submit', { bubbles: true, cancelable: true }));
  assert.strictEqual(t.beacons.length, 0, 'невалидное не ушло');
  assert.ok(t.d.getElementById('cName').className.includes('err'), 'подсветка ошибки');
  assert.strictEqual(t.d.getElementById('cName').getAttribute('aria-invalid'), 'true', 'aria-invalid');
  t = boot();
  t.d.getElementById('cName').value = 'Бот Ботович';
  t.d.getElementById('cPhone').value = '+123456789';
  t.d.getElementById('cWebsite').value = 'http://spam';
  t.d.getElementById('calcForm').dispatchEvent(new t.w.Event('submit', { bubbles: true, cancelable: true }));
  assert.strictEqual(t.beacons.length, 0, 'honeypot: ничего не ушло');
  assert.ok(!t.fbqCalls().some(c => c[1] === 'Lead'), 'honeypot: пиксель Lead не стрелял');
  console.log('✓ v33b: валидация и honeypot — чисто');

  /* v34: персистентность и входные точки */
  t = boot({ url: 'https://traffic-craft.com/calc#c=tr&n=cosmo&d=smas.threads&b=9000&s=cons' });
  assert.ok(t.onChip('countryChips').textContent.includes('Турция'), 'hash: страна');
  assert.ok(t.onChip('nicheChips').textContent.includes('Космет'), 'hash: ниша');
  assert.strictEqual(Array.from(t.d.getElementById('dirChips').children).filter(b => b.className.includes('on')).length, 2, 'hash: 2 направления');
  assert.strictEqual(t.d.getElementById('budget').value, '9000', 'hash: бюджет');
  t = boot({ url: 'https://traffic-craft.com/calc?c=ae&n=dental&b=12000&utm_source=fb' });
  assert.ok(t.onChip('countryChips').textContent.includes('ОАЭ'), 'query: страна для рекламных ссылок');
  assert.strictEqual(t.d.getElementById('budget').value, '12000', 'query: бюджет');
  t = boot({ storage: { tc_calc_v1: JSON.stringify({ country:'es', niche:'cosmo', dirs:['hardware'], budget:7000, checkOverride:0, scenario:'base' }) } });
  assert.ok(t.onChip('countryChips').textContent.includes('Испания'), 'storage: страна восстановлена');
  assert.strictEqual(t.d.getElementById('budget').value, '7000', 'storage: бюджет восстановлен');
  /* hashchange на лету */
  t.w.location.hash = '#c=kz&n=dental&d=implants&b=3000&s=base';
  t.w.dispatchEvent(new t.w.Event('hashchange'));
  assert.ok(t.onChip('countryChips').textContent.includes('Казахстан'), 'hashchange применился');
  console.log('✓ v34: hash / query / storage / hashchange — все входные точки работают');

  console.log('\nИНТЕГРАЦИОННЫЕ ТЕСТЫ ПРОШЛИ');
})().catch(e => { console.error('УПАЛО:', e.message); process.exit(1); });
