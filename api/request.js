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

/* ============================================================
   Lead Guard v1.0: анти-бот токен + лимиты (SPEC.md комплекта).
   GET /api/lead выдает подписанный токен; POST формы принимается только
   с валидным токеном возрастом 2.5с...3ч и с нашего же домена.
   Ветка kind:'msg' (мост /go) токена не требует - это заметка, не лид.
   ============================================================ */
const TOKEN_MIN_AGE_MS = 2500;        // раньше человек физически не успеет: ввод + кнопка + свайп
const TOKEN_MAX_AGE_MS = 3 * 3600e3;  // клиент обновляет токен каждые 40 минут

/* Ключ подписи: отдельный секрет не обязателен - по умолчанию выводится из
   токена бота через SHA-256 (сам токен бота из подписи не восстановить). */
function tokenKey() {
  const base = process.env.LEAD_TOKEN_SECRET || process.env.TG_BOT_TOKEN || '';
  return crypto.createHash('sha256').update('lead-token:' + base).digest();
}
function signToken(ts) {
  const sig = crypto.createHmac('sha256', tokenKey()).update(String(ts)).digest('hex').slice(0, 32);
  return ts + '.' + sig;
}
/* null = токен валиден, иначе код причины */
function verifyToken(token) {
  const m = /^(\d{10,16})\.([a-f0-9]{32})$/.exec(String(token || ''));
  if (!m) return 'token_missing';
  const ts = Number(m[1]);
  const expected = signToken(ts).split('.')[1];
  const a = Buffer.from(m[2]), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return 'token_invalid';
  const age = Date.now() - ts;
  if (age < TOKEN_MIN_AGE_MS) return 'token_too_fresh';
  if (age > TOKEN_MAX_AGE_MS) return 'token_expired';
  return null;
}
/* Запрос с нашего же домена? Отклоняем только явное несовпадение. */
function sameSite(req) {
  const host = String(req.headers.host || '').toLowerCase();
  let src = req.headers.origin || req.headers.referer || '';
  if (src === 'null') src = req.headers.referer || ''; // приватные режимы шлют Origin: null
  if (!src) return true; // заголовков нет - решает токен
  try { return new URL(src).host.toLowerCase() === host; } catch (e) { return false; }
}
/* Правило контакта - ЗЕРКАЛО клиентского validateContact (lead-guard.js):
   телефон >= 9 цифр ИЛИ текст >= 3 символов (ведущие @ не считаются).
   Сервер не строже клиента: что клиент принял - принимаем и мы. */
function contactOk(v) {
  v = String(v || '').replace(/[\p{Cc}\p{Cf}]/gu, '').replace(/\s+/g, ' ').trim();
  if (!v) return false;
  if (/^[+\d][\d\s\-()]*$/.test(v)) return v.replace(/\D/g, '').length >= 9;
  return v.replace(/^@+/, '').length >= 3;
}
/* Ключ дедупликации: телефон - по цифрам, текст - без регистра */
function dedupeKey(contact) {
  return /^[+\d][\d\s\-()]*$/.test(contact) ? contact.replace(/\D/g, '') : contact.toLowerCase();
}
const recentContacts = new Map(); // dedupeKey(contact) → ts; тот же контакт за 10 мин не дублируем

/* Анти-флуд: не больше RATE_LIMIT ПРИНЯТЫХ лидов с одного IP за окно
   (SPEC Lead Guard: порог не ниже 20 - мобильные операторы сажают тысячи
   людей за один CGNAT-адрес). Память тёплого инстанса - best-effort;
   настоящий флуд решается Vercel Firewall одним переключателем. */
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const rateMap = new Map(); // ip -> [timestamps принятых лидов]
function rateHits(ip) {
  const now = Date.now();
  const arr = (rateMap.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (rateMap.size > 5000) rateMap.clear(); // защита памяти инстанса
  rateMap.set(ip, arr);
  return arr;
}
function pruneContacts() {
  const now = Date.now();
  for (const [k, ts] of recentContacts) if (now - ts > RATE_WINDOW_MS) recentContacts.delete(k);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();

  /* Выдача анти-бот токена: страница запрашивает при загрузке, обновляет раз в 40 мин */
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, token: signToken(Date.now()), minAge: TOKEN_MIN_AGE_MS });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  /* Тело: JSON-строкой (fetch из lead-guard.js) или объект (urlencoded от sendBeacon) */
  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }

  /* Honeypot: скрытое поле формы. Люди его не заполняют — если пришло
     со значением, это бот. Отвечаем «ок», ничего никуда не отправляя. */
  if (b.website) {
    console.log('lead: honeypot triggered, silently dropped');
    return res.status(200).json({ ok: true });
  }

  const name = String(b.name || '').trim().slice(0, 120);
  /* Новый клиент (lead-guard.js) шлет поле contact; легаси-пейлоады - phone */
  const phone = String(b.contact || b.phone || '').replace(/[\p{Cc}\p{Cf}]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 120);
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

  const isMsgNote = b.kind === 'msg'; // заметка с моста /go - формы там нет

  const clientIp = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();

  /* Любой отказ - в логи (Vercel → Logs): лид не пропадает бесследно */
  const reject = (code, error) => {
    console.warn('LEAD_REJECTED ' + JSON.stringify({ error, contact: phone, name, ip: clientIp, at: new Date().toISOString() }));
    return res.status(code).json({ ok: false, error });
  };

  if (!isMsgNote) {
    /* Анти-бот (Lead Guard): наш домен + валидный «выдержанный» токен */
    if (!sameSite(req)) return reject(403, 'bad_origin');
    const tokenError = verifyToken(b.token);
    if (tokenError) return reject(403, tokenError);
    /* Контакт - зеркало клиентского правила (сервер не строже клиента) */
    if (!contactOk(phone)) return reject(400, 'no_contact');
  } else if (!sameSite(req)) {
    /* Мост /go: чужой Origin - тихо игнорируем (заметка, не лид) */
    console.warn('msg-note: foreign origin dropped');
    return res.status(200).json({ ok: true });
  }

  /* Гео запроса: Vercel проставляет заголовки по IP (city бывает URL-encoded) */
  let geoCity = String(req.headers['x-vercel-ip-city'] || '');
  try { geoCity = decodeURIComponent(geoCity); } catch (e) {}
  const geoCode = String(req.headers['x-vercel-ip-country'] || '');
  let geoCountry = geoCode;
  try {
    if (geoCode) geoCountry = new Intl.DisplayNames(['ru'], { type: 'region' }).of(geoCode) || geoCode;
  } catch (e) {}
  const geo = [geoCountry, geoCity].filter(Boolean).join(', ');

  let ipArr = null;
  if (!isMsgNote) {
    /* Лимит IP (429 - клиент честно узнает) и отсечка дублей (тот же контакт
       за 10 мин - тихо ok, в группу не дублируем). Заметки моста не считаем. */
    ipArr = rateHits(clientIp);
    if (ipArr.length >= RATE_LIMIT) return reject(429, 'rate_limited');
    pruneContacts();
    const dKey = dedupeKey(phone);
    if (recentContacts.has(dKey)) {
      console.log('lead: duplicate contact within 10 min, skipped');
      return res.status(200).json({ ok: true, skipped: 'duplicate' });
    }
    recentContacts.set(dKey, Date.now());
    ipArr.push(Date.now()); rateMap.set(clientIp, ipArr);
  }

  const tasks = [];

  /* --- Заметка с моста /go: человек ушел в мессенджер --- */
  if (isMsgNote) {
    const messenger = b.messenger === 'tg' ? 'Telegram' : 'WhatsApp';
    const placement = /^[a-z0-9-]{1,24}$/i.test(String(b.placement || '')) ? String(b.placement) : 'other';
    let page = '';
    try { const u = new URL(String(b.page || '')); page = (u.pathname + u.search).slice(0, 120); } catch (e) {}
    const noteToken = process.env.TG_BOT_TOKEN;
    const noteChat = process.env.TG_CHAT_ID;
    const isFirst = b.first === 1 || b.first === '1';

    if (noteToken && noteChat && isFirst) {
      const mskTime = new Date().toLocaleString('ru-RU', {
        timeZone: 'Europe/Moscow',
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
      const noteText =
        '\ud83d\udc63 Ушел в ' + messenger + ' \u00b7 кнопка: ' + esc(placement) + '\n' +
        (page ? '\ud83d\udcc4 Со страницы: ' + esc(page) + '\n' : '') +
        '\n\ud83d\udd52 ' + mskTime + ' (Мск)' +
        (geo ? '\n\ud83d\udccd ' + esc(geo) : '');
      tasks.push(
        fetch('https://api.telegram.org/bot' + noteToken + '/sendMessage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: noteChat, text: noteText, parse_mode: 'HTML' }),
          signal: AbortSignal.timeout(8000),
        }).then((r) => {
          if (!r.ok) return r.text().then((t) => Promise.reject(new Error('telegram_note: ' + t)));
        })
      );
    }

    /* серверный дубль Lead моста: тот же eventID, что у пикселя - Meta дедуплицирует,
       но серверное событие доходит даже при адблоке */
    const noteCapi = process.env.META_CAPI_TOKEN;
    const notePixel = process.env.META_PIXEL_ID || '2342435819568558';
    const noteEid = String(b.leadEventId || '').slice(0, 64);
    if (noteCapi && noteEid && isFirst) {
      const userData = {};
      const ua = String(req.headers['user-agent'] || '').slice(0, 512);
      if (ua) userData.client_user_agent = ua;
      if (clientIp) userData.client_ip_address = clientIp;
      const nFbp = String(b.fbp || '').slice(0, 128);
      const nFbc = String(b.fbc || '').slice(0, 512);
      if (nFbp) userData.fbp = nFbp;
      if (nFbc) userData.fbc = nFbc;
      const event = {
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        event_id: noteEid,
        action_source: 'website',
        user_data: userData,
        custom_data: Object.assign(
          { content_category: 'messenger_' + (b.messenger === 'tg' ? 'tg' : 'wa'), placement: placement, value: 0, currency: 'KZT' },
          utm
        ),
      };
      if (b.page) event.event_source_url = String(b.page).slice(0, 500);
      const capiBody = { data: [event] };
      if (process.env.META_TEST_EVENT_CODE) capiBody.test_event_code = process.env.META_TEST_EVENT_CODE;
      tasks.push(
        fetch(
          'https://graph.facebook.com/v25.0/' + notePixel + '/events?access_token=' + encodeURIComponent(noteCapi),
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(capiBody),
            signal: AbortSignal.timeout(8000),
          }
        ).then((r) => {
          if (!r.ok) return r.text().then((t) => Promise.reject(new Error('meta_capi_note: ' + t.slice(0, 200))));
        })
      );
    }

    try {
      await Promise.allSettled(tasks).then((rs) => {
        rs.forEach((r) => { if (r.status === 'rejected') console.error('lead msg-note:', r.reason && r.reason.message); });
      });
    } catch (e) { console.error('lead msg-note:', e && e.message); }
    return res.status(200).json({ ok: true });
  }

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
      }).catch((e) => {
        /* и сетевые ошибки (fetch бросил, таймаут) помечаем как telegram -
           иначе LEAD_NOT_DELIVERED ниже их не распознает */
        const msg = String(e && e.message || e);
        return Promise.reject(msg.startsWith('telegram') ? e : new Error('telegram_network: ' + msg.slice(0, 200)));
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
          geo,
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
  if (errors.length) {
    console.error('lead delivery errors:', errors);
    if (errors.some((e) => e.startsWith('telegram'))) {
      /* Lead Guard: лид, не доехавший до группы, остается в логах с контактом */
      console.error('LEAD_NOT_DELIVERED ' + JSON.stringify({ contact: phone, name, at: new Date().toISOString() }));
    }
  }

  return res.status(200).json({ ok: true });
};

// Для автотестов: подпись токена с произвольной временной меткой
module.exports.signToken = signToken;
