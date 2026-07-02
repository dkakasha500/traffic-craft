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
//
// В клиентский код (index.html) секреты больше не попадают.
// ==============================================

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const b = req.body || {};
  const name = String(b.name || '').trim().slice(0, 120);
  const phone = String(b.phone || '').trim().slice(0, 120);
  const project = String(b.project || '').trim().slice(0, 500);
  const eventId = String(b.eventId || '').slice(0, 64);
  const fbclid = String(b.fbclid || '').slice(0, 256);

  const utm = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((k) => {
    if (b[k]) utm[k] = String(b[k]).slice(0, 256);
  });

  // Та же валидация, что и на клиенте
  if (name.length < 2 || phone.length < 3) {
    return res.status(400).json({ ok: false, error: 'invalid_payload' });
  }

  const tasks = [];

  /* --- Telegram --- */
  const tgToken = process.env.TG_BOT_TOKEN;
  const tgChatId = process.env.TG_CHAT_ID;
  if (tgToken && tgChatId) {
    const utmText = Object.keys(utm)
      .map((k) => k.replace('utm_', '') + ': ' + esc(utm[k]))
      .join('\n');
    const text =
      '🔥 Новая заявка!\n\n' +
      '👤 Имя: ' + esc(name) + '\n' +
      '📞 Телефон: ' + esc(phone) + '\n' +
      (project ? '🏥 Проект: ' + esc(project) + '\n' : '') +
      (utmText ? '\n📊 UTM:\n' + utmText + '\n' : '') +
      (fbclid ? '\n🔗 fbclid: ' + esc(fbclid) + '\n' : '') +
      '\n📅 ' + new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' });

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
  if (sheetsUrl) {
    tasks.push(
      fetch(sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' }, // GAS читает postData.contents; CORS сервер-серверу не мешает
        body: JSON.stringify({
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

  const results = await Promise.allSettled(tasks);
  const errors = results
    .filter((r) => r.status === 'rejected')
    .map((r) => String(r.reason && r.reason.message ? r.reason.message : r.reason).slice(0, 300));

  // Ошибки доставки не показываем посетителю (редирект не блокируем),
  // но пишем в логи Vercel (Project → Logs)
  if (errors.length) console.error('lead delivery errors:', errors);

  return res.status(200).json({ ok: true });
};
