// ==============================================
// Google Apps Script для Traffic Craft
// Принимает заявки с сайта и пишет в Google Sheets
// ==============================================
//
// ИНСТРУКЦИЯ:
//
// 1. Создай Google Таблицу: https://sheets.new
//    Назови её "TC Заявки"
//    В первой строке заполни заголовки:
//    A1: Дата    B1: Имя    C1: Телефон    D1: Проект
//    E1: UTM Source    F1: UTM Medium    G1: UTM Campaign
//    H1: fbclid    I1: Event ID
//
// 2. Открой: Расширения → Apps Script
//
// 3. Удали всё в редакторе и вставь этот код
//
// 4. Нажми "Развернуть" → "Новое развёртывание"
//    - Тип: Веб-приложение
//    - Выполнять от: Меня
//    - Доступ: Все
//    - Нажми "Развернуть"
//
// 5. Скопируй URL веб-приложения
//
// 6. Вставь URL в переменную окружения SHEETS_URL на Vercel:
//    Project → Settings → Environment Variables
//    (в клиентский код URL больше не кладём — заявки идут через /api/lead)
//
// 7. Сделай Redeploy на Vercel, чтобы функция подхватила переменную
//
// Готово! Все заявки будут дублироваться в таблицу.
// ==============================================

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Форматируем дату в Алматы
    var date = data.date
      ? Utilities.formatDate(new Date(data.date), 'Asia/Almaty', 'dd.MM.yyyy HH:mm:ss')
      : Utilities.formatDate(new Date(), 'Asia/Almaty', 'dd.MM.yyyy HH:mm:ss');

    sheet.appendRow([
      date,
      data.name || '',
      data.phone || '',
      data.project || '',
      data.utm_source || '',
      data.utm_medium || '',
      data.utm_campaign || '',
      data.fbclid || '',
      data.eventId || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({status: 'ok'}))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({status: 'error', message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Обработка CORS preflight (нужен для sendBeacon с JSON)
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({status: 'ok', message: 'TC Sheets Backup is running'}))
    .setMimeType(ContentService.MimeType.JSON);
}
