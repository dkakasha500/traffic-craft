/* ============================================================
   Тесты объединенного api/lead.js: слой Lead Guard (токен, домен,
   контакт, лимит, дедуп) + наши ветки доставки (форма и мост /go).
   Запуск: node api-lead.test.js  (сеть замокана, env подставлен)
   ============================================================ */
process.env.TG_BOT_TOKEN = 'test-bot-token';
process.env.TG_CHAT_ID = '-100500';
process.env.SHEETS_URL = 'https://sheets.example/exec';
process.env.META_CAPI_TOKEN = 'capi-token';

const assert = require('assert');

/* мок сети: собираем все исходящие вызовы */
let calls = [];
global.fetch = async (url, opts) => {
  calls.push({ url: String(url), body: opts && opts.body ? JSON.parse(opts.body) : null });
  return { ok: true, status: 200, json: async () => ({ ok: true }), text: async () => '' };
};

const handler = require('./api/request.js');
/* алиас переходного периода: /api/lead должен остаться тем же обработчиком */
const alias = require('./api/lead.js');
if (alias !== handler) { console.log('  \u2717 алиас /api/lead не совпадает с /api/request'); process.exit(1); }
const signToken = handler.signToken;

function mkReq(body, headers, method) {
  return {
    method: method || 'POST',
    body: body,
    headers: Object.assign({
      host: 'traffic-craft.com',
      origin: 'https://traffic-craft.com',
      'x-forwarded-for': '203.0.113.7',
      'user-agent': 'jest-like',
      'x-vercel-ip-country': 'KZ',
      'x-vercel-ip-city': 'Almaty',
    }, headers || {}),
  };
}
function mkRes() {
  const r = { statusCode: 0, jsonBody: null, headers: {} };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r.statusCode = c; return r; };
  r.json = (j) => { r.jsonBody = j; return r; };
  r.end = () => r;
  return r;
}
const aged = () => signToken(Date.now() - 5000); // валидный «выдержанный» токен

let pass = 0, fail = 0;
async function t(name, fn) {
  calls = [];
  try { await fn(); console.log('  ✓ ' + name); pass++; }
  catch (e) { console.log('  ✗ ' + name + ': ' + e.message); fail++; }
}

(async () => {
  await t('GET выдает токен формата ts.hex32 + minAge', async () => {
    const res = mkRes();
    await handler(mkReq(null, {}, 'GET'), res);
    assert.strictEqual(res.statusCode, 200);
    assert.match(res.jsonBody.token, /^\d{10,16}\.[a-f0-9]{32}$/);
    assert.strictEqual(res.jsonBody.minAge, 2500);
    assert.strictEqual(res.headers['Cache-Control'], 'no-store');
  });

  await t('GET ?m=1 (мост) → тот же токен, minAge 300', async () => {
    const res = mkRes();
    const req = mkReq(null, {}, 'GET'); req.url = '/api/request?m=1'; req.query = { m: '1' };
    await handler(req, res);
    assert.strictEqual(res.jsonBody.minAge, 300);
    assert.match(res.jsonBody.token, /^\d{10,16}\.[a-f0-9]{32}$/);
    /* токен моста для ФОРМЫ всё равно должен выдержаться 2.5с */
    const res2 = mkRes();
    await handler(mkReq({ contact: '+77012340077', name: 'Мост', token: res.jsonBody.token }), res2);
    assert.strictEqual(res2.jsonBody.error, 'token_too_fresh');
  });

  await t('POST формы без токена → 403 token_missing', async () => {
    const res = mkRes();
    await handler(mkReq({ contact: '+77012345678', name: 'Тест' }), res);
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.jsonBody.error, 'token_missing');
    assert.strictEqual(calls.length, 0, 'доставка не должна была стартовать');
  });

  await t('свежий токен (<2.5с) → 403 token_too_fresh', async () => {
    const res = mkRes();
    await handler(mkReq({ contact: '+77012345678', name: 'Тест', token: signToken(Date.now()) }), res);
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.jsonBody.error, 'token_too_fresh');
  });

  await t('истекший токен (>3ч) → 403 token_expired', async () => {
    const res = mkRes();
    await handler(mkReq({ contact: '+77012345678', name: 'Тест', token: signToken(Date.now() - 4 * 3600e3) }), res);
    assert.strictEqual(res.jsonBody.error, 'token_expired');
  });

  await t('подделанная подпись → 403 token_invalid', async () => {
    const res = mkRes();
    const bad = (Date.now() - 5000) + '.' + 'a'.repeat(32);
    await handler(mkReq({ contact: '+77012345678', name: 'Тест', token: bad }), res);
    assert.strictEqual(res.jsonBody.error, 'token_invalid');
  });

  await t('чужой Origin → 403 bad_origin', async () => {
    const res = mkRes();
    await handler(mkReq({ contact: '+77012345678', token: aged() }, { origin: 'https://evil.example' }), res);
    assert.strictEqual(res.jsonBody.error, 'bad_origin');
  });

  await t('без Origin/Referer (приватный режим) решает токен → 200', async () => {
    const res = mkRes();
    await handler(mkReq({ contact: '+7 701 999 11 22', name: 'Инкогнито', token: aged() }, { origin: '', referer: '' }), res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonBody.ok, true);
  });

  await t('валидный лид: ТГ (имя+тел+гео+Мск) + Sheets + CAPI с eventID', async () => {
    const res = mkRes();
    await handler(mkReq({
      contact: '+7 705 111 22 33', name: 'Айгуль', project: 'Стоматология',
      token: aged(), eventId: 'lead_test_1', utm_source: 'fb', fbp: 'fb.1.1.2',
    }), res);
    assert.strictEqual(res.statusCode, 200);
    const tg = calls.find((c) => c.url.includes('api.telegram.org'));
    assert.ok(tg, 'сообщение в ТГ');
    assert.ok(tg.body.text.includes('Айгуль') && tg.body.text.includes('+7 705 111 22 33'), 'имя и телефон');
    assert.ok(tg.body.text.includes('(Мск)') && tg.body.text.includes('Казахстан'), 'время Мск + гео');
    const sh = calls.find((c) => c.url.includes('sheets.example'));
    assert.ok(sh && sh.body.name === 'Айгуль' && sh.body.utm_source === 'fb', 'Sheets');
    const capi = calls.find((c) => c.url.includes('graph.facebook.com'));
    assert.ok(capi && capi.body.data[0].event_id === 'lead_test_1', 'CAPI eventID');
  });

  await t('дубль контакта за 10 мин → 200 skipped, без доставки', async () => {
    const res = mkRes();
    await handler(mkReq({ contact: '+7 (705) 111-22-33', name: 'Айгуль', token: aged() }), res);
    assert.strictEqual(res.jsonBody.skipped, 'duplicate');
    assert.strictEqual(calls.length, 0);
  });

  await t('контакт короче правила (клиент бы не пропустил) → 400 no_contact', async () => {
    const res = mkRes();
    await handler(mkReq({ contact: '12345', name: 'Бот', token: aged() }), res);
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.jsonBody.error, 'no_contact');
  });

  await t('текстовый контакт (@ник) проходит', async () => {
    const res = mkRes();
    await handler(mkReq({ contact: '@aigul_km', name: 'Айгуль', token: aged() }), res);
    assert.strictEqual(res.jsonBody.ok, true);
  });

  await t('honeypot → тихий 200 без доставки', async () => {
    const res = mkRes();
    await handler(mkReq({ contact: '+77051112244', website: 'spam.biz', token: aged() }), res);
    assert.strictEqual(res.jsonBody.ok, true);
    assert.strictEqual(calls.length, 0);
  });

  await t('мост /go (kind:msg) работает БЕЗ токена: заметка + CAPI', async () => {
    const res = mkRes();
    await handler(mkReq({ kind: 'msg', messenger: 'wa', placement: 'cta', first: 1, leadEventId: 'msg_e2e_1', page: 'https://traffic-craft.com/' }), res);
    assert.strictEqual(res.statusCode, 200);
    const tg = calls.find((c) => c.url.includes('api.telegram.org'));
    assert.ok(tg && tg.body.text.includes('Ушел в WhatsApp'), 'заметка');
    const capi = calls.find((c) => c.url.includes('graph.facebook.com'));
    assert.ok(capi && capi.body.data[0].event_id === 'msg_e2e_1', 'CAPI моста');
  });

  await t('мост с чужого Origin → тихий 200 без доставки', async () => {
    const res = mkRes();
    await handler(mkReq({ kind: 'msg', messenger: 'wa', first: 1 }, { origin: 'https://evil.example' }), res);
    assert.strictEqual(res.jsonBody.ok, true);
    assert.strictEqual(calls.length, 0);
  });

  await t('легаси-поле phone принимается как контакт', async () => {
    const res = mkRes();
    await handler(mkReq({ phone: '+34 600 000 001', name: 'Легаси', token: aged() }), res);
    assert.strictEqual(res.jsonBody.ok, true);
  });

  await t('строковое JSON-тело (keepalive fetch) парсится', async () => {
    const res = mkRes();
    await handler(mkReq(JSON.stringify({ contact: '+34 600 000 777', name: 'Строка', token: aged() })), res);
    assert.strictEqual(res.jsonBody.ok, true);
  });

  await t('лимит IP: 21-й принятый лид с одного IP → 429', async () => {
    let last = null;
    for (let i = 0; i < 21; i++) {
      const res = mkRes();
      await handler(mkReq({ contact: '+7 777 000 0' + String(100 + i), name: 'Флуд', token: aged() }, { 'x-forwarded-for': '198.51.100.1' }), res);
      last = res;
    }
    assert.strictEqual(last.statusCode, 429);
    assert.strictEqual(last.jsonBody.error, 'rate_limited');
  });

  await t('без Origin, но с чужим Referer → 403 bad_origin', async () => {
    const res = mkRes();
    await handler(mkReq({ contact: '+77012340001', token: aged() }, { origin: '', referer: 'https://evil.example/page' }), res);
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.jsonBody.error, 'bad_origin');
  });

  await t('HTML в имени/проекте экранируется в ТГ (parse_mode HTML)', async () => {
    const res = mkRes();
    await handler(mkReq({ contact: '+7 909 000 77 66', name: '<b>Хак</b>', project: '<script>alert(1)</script>', token: aged() }), res);
    const tg = calls.find((c) => c.url.includes('api.telegram.org'));
    assert.ok(tg.body.text.includes('&lt;b&gt;Хак&lt;/b&gt;'), 'имя экранировано: ' + tg.body.text.split('\n')[2]);
    assert.ok(tg.body.text.includes('&lt;script&gt;'), 'проект экранирован');
    assert.ok(!tg.body.text.includes('<script>'), 'сырого HTML нет');
  });

  await t('мост: мусорный placement → other, m=junk → WhatsApp', async () => {
    const res = mkRes();
    await handler(mkReq({ kind: 'msg', messenger: 'junk', placement: '<script>x', first: 1 }), res);
    const tg = calls.find((c) => c.url.includes('api.telegram.org'));
    assert.ok(tg.body.text.includes('Ушел в WhatsApp'), 'дефолт WhatsApp');
    assert.ok(tg.body.text.includes('кнопка: other'), 'placement отброшен в other: ' + tg.body.text.split('\n')[0]);
  });

  await t('UTM+fbclid доезжают до Sheets и CAPI custom_data', async () => {
    const res = mkRes();
    await handler(mkReq({
      contact: '+7 909 111 00 99', name: 'Утм', token: aged(), eventId: 'lead_utm_1',
      utm_source: 'fb', utm_medium: 'cpc', utm_campaign: 'sep', fbclid: 'AbCd123',
    }), res);
    const sh = calls.find((c) => c.url.includes('sheets.example'));
    assert.strictEqual(sh.body.utm_source, 'fb');
    assert.strictEqual(sh.body.utm_campaign, 'sep');
    assert.strictEqual(sh.body.fbclid, 'AbCd123');
    assert.ok(sh.body.geo.includes('Казахстан'), 'гео в Sheets');
    const capi = calls.find((c) => c.url.includes('graph.facebook.com'));
    assert.strictEqual(capi.body.data[0].custom_data.utm_source, 'fb');
    assert.ok(capi.body.data[0].user_data.fbc.includes('AbCd123'), 'fbc восстановлен из fbclid');
  });

  await t('токен-объект вместо строки не роняет сервер', async () => {
    const res = mkRes();
    await handler(mkReq({ contact: '+77012340002', token: { evil: true } }), res);
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.jsonBody.error, 'token_missing');
  });

  await t('ТГ упал СЕТЬЮ → 200 клиенту + LEAD_NOT_DELIVERED с контактом в логах', async () => {
    const oldFetch = global.fetch;
    const logged = [];
    const oldErr = console.error;
    console.error = (...a) => logged.push(a.join(' '));
    global.fetch = async (url, opts) => {
      if (String(url).includes('telegram')) throw new Error('network down');
      calls.push({ url: String(url), body: opts && opts.body ? JSON.parse(opts.body) : null });
      return { ok: true, status: 200, json: async () => ({ ok: true }), text: async () => '' };
    };
    try {
      const res = mkRes();
      await handler(mkReq({ contact: '+7 909 555 44 33', name: 'Сеть', token: aged() }), res);
      assert.strictEqual(res.statusCode, 200, 'клиенту все равно ok (редирект не блокируем)');
      const nd = logged.find((l) => l.includes('LEAD_NOT_DELIVERED'));
      assert.ok(nd, 'LEAD_NOT_DELIVERED в логах');
      assert.ok(nd.includes('+7 909 555 44 33'), 'контакт в логе - лид восстановим');
    } finally { global.fetch = oldFetch; console.error = oldErr; }
  });

  await t('OPTIONS → 204, PUT → 405', async () => {
    let res = mkRes();
    await handler(mkReq(null, {}, 'OPTIONS'), res);
    assert.strictEqual(res.statusCode, 204);
    res = mkRes();
    await handler(mkReq(null, {}, 'PUT'), res);
    assert.strictEqual(res.statusCode, 405);
  });

  console.log('API-LEAD: ' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})();
