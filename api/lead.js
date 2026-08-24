// ==============================================
// Vercel Serverless Function: приём заявок с формы
// ==============================================
// Принимает POST /api/lead (x-www-form-urlencoded от sendBeacon)
// и рассылает заявку в Telegram-группу + Google Sheets.
//
// Секреты хранятся в переменных окружения Vercel
// (Project → Settings → Environment Variables):
//   TG_BOT_TOKEN — токен бота из @BotFather
//   TG_CHAT_ID   — id группы (отрицательное число)
//   SHEETS_URL   — URL веб-приложения Google Apps Script
//   SHEETS_SECRET — (опц.) общий секрет с Apps Script: защищает таблицу
//                   от мусорных строк, если URL скрипта утечёт (тот же
//                   секрет прописать в SECRET внутри google-sheets-script.js)
//
// Опциональные (Meta Conversions API — серверный дубль события Lead,
// доходит даже при блокировщиках рекламы, дедуплицируется по event_id):
//   META_CAPI_TOKEN      — Events Manager → пиксель → Настройки →
//                          Conversions API → «Создать токен доступа»
//   META_PIXEL_ID        — id пикселя (по умолчанию текущий, 2342435819568558)
//   META_TEST_EVENT_CODE — код из вкладки «Тестовые события» Events Manager;
//                          задать на время проверки, потом удалить переменную
//
// В клиентский код (index.html) секреты больше не попадают.
// ==============================================

const crypto = require('crypto');

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const sha256 = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');

/* Простейший анти-флуд: не больше RATE_LIMIT заявок с одного IP за окно.
   Память живёт в пределах тёплого инстанса Vercel — от распределённой
   атаки не спасёт, но конвейерный спам с одного адреса режет. */
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const rateMap = new Map(); // ip -> [timestamps]
function rateLimited(ip) {
  if (!ip) return false;
  const now = Date.now();
  const arr = (rateMap.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  arr.push(now);
  if (rateMap.size > 5000) rateMap.clear(); // защита памяти инстанса
  rateMap.set(ip, arr);
  return arr.length > RATE_LIMIT;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const b = req.body || {};

  /* Honeypot: скрытое поле формы. Люди его не заполняют — если пришло
     со значением, это бот. Отвечаем «ок», ничего никуда не отправляя. */
  if (b.website) {
    console.log('lead: honeypot triggered, silently dropped');
    return res.status(200).json({ ok: true });
  }

  const name = String(b.name || '').trim().slice(0, 120);
  const phone = String(b.phone || '').trim().slice(0, 120);
  const project = String(b.project || '').trim().slice(0, 500);
  const eventId = String(b.eventId || '').slice(0, 64);
  const fbclid = String(b.fbclid || '').slice(0, 256);
  const fbp = String(b.fbp || '').slice(0, 128);
  const fbc = String(b.fbc || '').slice(0, 512);
  const pageUrl = String(b.pageUrl || '').slice(0, 500);

  const utm = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((k) => {
    if (b[k]) utm[k] = String(b[k]).slice(0, 256);
  });

  // Та же валидация, что и на клиенте
  if (name.length < 2 || phone.length < 3) {
    return res.status(400).json({ ok: false, error: 'invalid_payload' });
  }

  const clientIp = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();

  /* Гео запроса: Vercel проставляет заголовки по IP (city бывает URL-encoded) */
  let geoCity = String(req.headers['x-vercel-ip-city'] || '');
  try { geoCity = decodeURIComponent(geoCity); } catch (e) {}
  const geoCode = String(req.headers['x-vercel-ip-country'] || '');
  let geoCountry = geoCode;
  try {
    if (geoCode) geoCountry = new Intl.DisplayNames(['ru'], { type: 'region' }).of(geoCode) || geoCode;
  } catch (e) {}
  const geo = [geoCountry, geoCity].filter(Boolean).join(', ');
  if (rateLimited(clientIp)) {
    // Тихий дроп: спамеру отвечаем «ок», в логах видно реальную причину
    console.log('lead: rate limit exceeded for ' + clientIp + ', silently dropped');
    return res.status(200).json({ ok: true });
  }

  const tasks = [];

  /* --- Telegram --- */
  const tgToken = process.env.TG_BOT_TOKEN;
  const tgChatId = process.env.TG_CHAT_ID;
  if (!tgToken || !tgChatId) {
    // Заявка не потеряется молча: причина будет видна в Vercel → Logs
    console.error('lead: TG_BOT_TOKEN / TG_CHAT_ID не заданы в Environment Variables');
  }
  if (tgToken && tgChatId) {
    const mskTime = new Date().toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    const text =
      '🔥 Новая заявка!\n\n' +
      '👤 Имя: ' + esc(name) + '\n' +
      '📞 Телефон: ' + esc(phone) + '\n' +
      (project ? '🏥 Проект: ' + esc(project) + '\n' : '') +
      '\n🕒 ' + mskTime + ' (Мск)' +
      (geo ? '\n📍 ' + esc(geo) : '');

    tasks.push(
      fetch('https://api.telegram.org/bot' + tgToken + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: tgChatId, text, parse_mode: 'HTML' }),
        signal: AbortSignal.timeout(8000),
      }).then((r) => {
        if (!r.ok) return r.text().then((t) => Promise.reject(new Error('telegram: ' + t)));
      })
    );
  }

  /* --- Google Sheets backup --- */
  const sheetsUrl = process.env.SHEETS_URL;
  if (!sheetsUrl) {
    console.error('lead: SHEETS_URL не задан в Environment Variables');
  }
  if (sheetsUrl) {
    tasks.push(
      fetch(sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' }, // GAS читает postData.contents; CORS сервер-серверу не мешает
        body: JSON.stringify({
          secret: process.env.SHEETS_SECRET || '',
          name,
          phone,
          project,
          utm_source: utm.utm_source || '',
          utm_medium: utm.utm_medium || '',
          utm_campaign: utm.utm_campaign || '',
          fbclid,
          date: new Date().toISOString(),
          eventId,
        }),
        redirect: 'follow', // GAS отвечает 302 на script.googleusercontent.com
        signal: AbortSignal.timeout(8000),
      }).then((r) => {
        if (!r.ok) return Promise.reject(new Error('sheets: HTTP ' + r.status));
      })
    );
  }

  /* --- Meta Conversions API: серверный дубль Lead --- */
  // Тот же event_id, что у клиентского fbq('track','Lead') → Meta
  // дедуплицирует: событие засчитывается один раз, но серверное доходит
  // даже когда пиксель порезан блокировщиком рекламы или Safari ITP
  const capiToken = process.env.META_CAPI_TOKEN;
  const pixelId = process.env.META_PIXEL_ID || '2342435819568558';
  if (capiToken && eventId) {
    let ph = phone.replace(/\D/g, '');
    if (ph.length === 11 && ph[0] === '8') ph = '7' + ph.slice(1); // 8xxx → 7xxx (KZ/RU)

    const userData = {};
    if (ph.length >= 7) userData.ph = [sha256(ph)];
    if (name) userData.fn = [sha256(name.toLowerCase())];
    const ua = String(req.headers['user-agent'] || '').slice(0, 512);
    if (ua) userData.client_user_agent = ua;
    if (clientIp) userData.client_ip_address = clientIp;
    if (fbp) userData.fbp = fbp;
    const fbcVal = fbc || (fbclid ? 'fb.1.' + Date.now() + '.' + fbclid : '');
    if (fbcVal) userData.fbc = fbcVal;

    const event = {
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: 'website',
      user_data: userData,
      custom_data: Object.assign(
        {
          content_name: project || 'Разбор клиники',
          content_category: 'form_submit',
          value: 0,
          currency: 'KZT',
        },
        utm
      ),
    };
    if (pageUrl) event.event_source_url = pageUrl;

    const capiBody = { data: [event] };
    if (process.env.META_TEST_EVENT_CODE) capiBody.test_event_code = process.env.META_TEST_EVENT_CODE;

    tasks.push(
      fetch(
        'https://graph.facebook.com/v25.0/' + pixelId + '/events?access_token=' + encodeURIComponent(capiToken),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(capiBody),
          signal: AbortSignal.timeout(8000),
        }
      ).then((r) => {
        if (!r.ok) return r.text().then((t) => Promise.reject(new Error('meta_capi: ' + t.slice(0, 200))));
      })
    );
  }

  const results = await Promise.allSettled(tasks);
  const errors = results
    .filter((r) => r.status === 'rejected')
    .map((r) => String(r.reason && r.reason.message ? r.reason.message : r.reason).slice(0, 300));

  // Ошибки доставки не показываем посетителю (редирект не блокируем),
  // но пишем в логи Vercel (Project → Logs)
  if (errors.length) console.error('lead delivery errors:', errors);

  return res.status(200).json({ ok: true });
};
