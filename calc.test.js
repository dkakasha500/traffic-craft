process.env.TZ = 'Asia/Jerusalem'; /* дефолт-страна в тестах - Израиль; иначе тест зависит от TZ машины */
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const assert = require('assert');
const html = fs.readFileSync('/sessions/gifted-clever-clarke/mnt/traffic-craft/calc.html', 'utf8');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const leadGuardSrc = fs.readFileSync('/sessions/gifted-clever-clarke/mnt/traffic-craft/lead-guard.js', 'utf8');

function boot(opts = {}) {
  const errors = [], beacons = [], leadPosts = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { if(!/navigation/i.test(e.message)) errors.push('jsdom: ' + e.message); });
  const dom = new JSDOM(html, {
    url: opts.url || 'https://traffic-craft.com/calc',
    runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(window) {
      window.matchMedia = q => ({ matches: /reduce/.test(q), addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
      window.HTMLElement.prototype.scrollIntoView = function(){};
      window.navigator.sendBeacon = (url, data) => { beacons.push({ url, body: String(data) }); return true; };
      /* Lead Guard: страница грузит /lead-guard.js внешним тегом - jsdom его не тянет,
         исполняем исходник руками. Сеть эндпоинта - мок: GET токен (minAge 0 - без
         ожиданий в тестах), POST лида копится в leadPosts */
      window.fetch = (url, o) => {
        if (String(url).includes('/api/lead') && (!o || !o.method || o.method === 'GET')) {
          return Promise.resolve({ json: () => Promise.resolve({ ok: true, token: '1234567890123.' + 'a'.repeat(32), minAge: 1 }) });
        }
        if (String(url).includes('/api/lead')) {
          leadPosts.push({ url: String(url), body: JSON.parse(o.body) });
          return Promise.resolve({ json: () => Promise.resolve({ ok: true }) });
        }
        return Promise.resolve({ json: () => Promise.resolve({}) });
      };
      window.eval(leadGuardSrc);
      window.addEventListener('error', e => errors.push(e.message));
      if (opts.storage) for (const [k, v] of Object.entries(opts.storage)) window.localStorage.setItem(k, v);
    }
  });
  const w = dom.window, d = w.document;
  const fbqCalls = () => Array.from(w.fbq.queue).map(a => Array.from(a));
  const chipTexts = id => Array.from(d.getElementById(id).children).map(b => b.textContent);
  const onChip = id => Array.from(d.getElementById(id).children).find(b => b.className.includes('on'));
  const clickChip = (id, match) => { Array.from(d.getElementById(id).children).find(b => b.textContent.includes(match)).click(); };
  return { w, d, errors, beacons, leadPosts, fbqCalls, chipTexts, onChip, clickChip };
}

(async () => {
  /* v31: страница исполняется и рендерится */
  let t = boot();
  assert.deepStrictEqual(t.errors, [], 'ошибки исполнения: ' + t.errors);
  assert.strictEqual(t.d.getElementById('countryChips').children.length, 9, '9 стран');
  assert.strictEqual(t.d.getElementById('nicheChips').children.length, 8, '8 ниш');
  assert.strictEqual(t.d.getElementById('dirChips').children.length, 7, '7 направлений в стоматологии');
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
  /* переключатель валюты: доллар и обратно в дирхамы */
  const curT = t.d.getElementById('curToggle');
  assert.ok(!curT.hidden, 'переключатель валюты виден для ОАЭ');
  curT.children[1].click();
  assert.ok(t.d.getElementById('budgetVal').textContent.includes('$'), 'долларовый режим: ' + t.d.getElementById('budgetVal').textContent);
  assert.ok(t.d.getElementById('budgetUsd').hidden, 'в долларовом режиме приписка не нужна');
  curT.children[0].click();
  assert.ok(t.d.getElementById('budgetVal').textContent.includes('AED'), 'обратно в дирхамы');
  /* второй тумблер (в результате) синхронен и переключает плитку выручки */
  const curT2 = t.d.getElementById('curToggle2');
  assert.ok(!curT2.hidden, 'тумблер у результата виден');
  curT2.children[1].click();
  assert.ok(t.d.getElementById('rRevenue').textContent.includes('$'), 'выручка в долларах: ' + t.d.getElementById('rRevenue').textContent);
  assert.ok(curT.children[1].className.includes('on'), 'тумблеры синхронны');
  curT2.children[0].click();
  Array.from(t.d.getElementById('scenToggle').children)[2].click();
  await sleep(320); /* дебаунс hash */
  assert.ok(t.w.location.hash.includes('s=aggr'), 'сценарий в hash: ' + t.w.location.hash);
  assert.ok(t.w.location.hash.includes('c=ae'), 'страна в hash');
  const saved = JSON.parse(t.w.localStorage.getItem('tc_calc_v1'));
  assert.strictEqual(saved.country, 'ae', 'localStorage пишется');
  console.log('✓ v32: чипы, слайдер, сценарии, hash, localStorage — работают');

  /* v33: форма - слайдер Lead Guard: submit → бегунок → подтверждение → POST с токеном */
  t = boot();
  await sleep(60); /* init Lead Guard висит на DOMContentLoaded */
  t.d.getElementById('cName').value = 'Тест Тестович';
  t.d.getElementById('cPhone').value = '+7 777 000 11 22';
  t.d.getElementById('calcForm').dispatchEvent(new t.w.Event('submit', { bubbles: true, cancelable: true }));
  const wrap = t.d.querySelector('#calcForm .slide-confirm');
  assert.ok(wrap && !wrap.hidden, 'слайдер показан после submit');
  assert.ok(t.d.getElementById('cBtn').hidden, 'кнопка скрыта на время слайдера');
  assert.strictEqual(t.leadPosts.length, 0, 'до свайпа ничего не уходит');
  /* подтверждение с клавиатуры (Enter на бегунке) - тот же путь complete() */
  wrap.querySelector('.slide-confirm__knob').dispatchEvent(new t.w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  await sleep(250); /* выдержка токена (minAge 1мс) + microtasks доставки */
  assert.strictEqual(t.leadPosts.length, 1, 'один POST лида');
  const body = t.leadPosts[0].body;
  assert.strictEqual(body.contact, '+7 777 000 11 22', 'contact');
  assert.strictEqual(body.name, 'Тест Тестович', 'имя в extraPayload');
  assert.ok(body.project.includes('Калькулятор: Израиль'), 'сводка расчета в проекте: ' + body.project);
  assert.ok(body.project.includes('чек ₪') && body.project.includes('(≈ $'), 'чек в шекелях с долларовой припиской');
  assert.ok(/^calc_/.test(body.eventId), 'eventId для CAPI');
  assert.ok(/^\d+\.a{32}$/.test(body.token), 'анти-бот токен приложен');
  assert.ok(body.pageUrl.startsWith('https://traffic-craft.com/calc'), 'pageUrl');
  /* пиксельный Lead уходит НЕ здесь, а на /thanks - по метке tc_lead_pix */
  assert.ok(!t.fbqCalls().some(c => c[0] === 'track' && c[1] === 'Lead'), 'Lead на странице формы не стреляет');
  assert.strictEqual(t.w.sessionStorage.getItem('tc_lead'), '1', 'tc_lead проставлен (дедуп с мостом)');
  const pix = JSON.parse(t.w.sessionStorage.getItem('tc_lead_pix'));
  assert.strictEqual(pix.eid, body.eventId, 'eventID метки для /thanks == eventId заявки (дедуп CAPI)');
  assert.strictEqual(pix.data.content_category, 'calc_form', 'категория события');
  assert.ok(t.fbqCalls().some(c => c[1] === 'SliderShown') && t.fbqCalls().some(c => c[1] === 'LeadConfirmed'), 'воронка слайдера в пикселе');
  console.log('✓ v33: сабмит через слайдер — POST полный, с токеном, Lead отложен на /thanks');

  /* валидация и honeypot (правило Lead Guard: телефон ≥ 9 цифр или текст ≥ 3) */
  t = boot();
  await sleep(60);
  t.d.getElementById('cName').value = 'A';
  t.d.getElementById('cPhone').value = '12345';
  t.d.getElementById('calcForm').dispatchEvent(new t.w.Event('submit', { bubbles: true, cancelable: true }));
  assert.strictEqual(t.leadPosts.length, 0, 'невалидное не ушло');
  assert.ok(!t.d.querySelector('#calcForm .slide-confirm') || t.d.querySelector('#calcForm .slide-confirm').hidden, 'слайдер не показан');
  assert.ok(t.d.getElementById('cPhone').className.includes('is-invalid'), 'подсветка контакта');
  assert.ok(!t.d.querySelector('#calcForm .field-error').hidden, 'строка ошибки видна');
  t = boot();
  await sleep(60);
  t.d.getElementById('cName').value = 'Бот Ботович';
  t.d.getElementById('cPhone').value = '+123456789';
  t.d.getElementById('cWebsite').value = 'http://spam';
  t.d.getElementById('calcForm').dispatchEvent(new t.w.Event('submit', { bubbles: true, cancelable: true }));
  assert.strictEqual(t.leadPosts.length, 0, 'honeypot: ничего не ушло');
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
  process.exit(0); /* setInterval обновления токена (lead-guard) держит процесс */
})().catch(e => { console.error('УПАЛО:', e.message); process.exit(1); });
