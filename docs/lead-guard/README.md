# Lead Guard — быстрый старт

Слайдер-подтверждение «проведите вправо» + анти-бот токен для форм заявок. Полное ТЗ — `SPEC.md`.

**Как использовать этот комплект с Claude в новой сессии:** приложите папку целиком и напишите: «Внедри Lead Guard на этот сайт по SPEC.md. Код из комплекта используй как есть, только настрой. После внедрения прогони `tests/` и пройди ручную приёмку из раздела 8».

## 5 шагов

1. **Формы.** Каждой форме заявки: `class="lead-form" data-form-location="…"`, honeypot `<input class="hp-field" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">`, поле `name="contact"`, `<button type="submit">`. Кнопка в строке с полем — оборачивайте в `.field-row`. Разметку слайдера не добавлять — её создаёт скрипт. Пример: `example/index.html`.
2. **Подключение.** `lead-guard.css` (после стилей сайта) + `lead-guard.js` (`defer`) → `LeadGuard.init({ endpoint: "/api/lead", thankYouUrl: "thank-you.html", onEvent: … })`. На странице «спасибо» — `LeadGuard.consumePendingLead()` → отправить конверсию (пример: `example/thank-you.html`).
3. **Сервер.** `api/lead.js` → в проект (Vercel: маршрут создастся сам). Настроить блок «НАСТРОЙКИ САЙТА» вверху файла. В хостинге задать `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID`. Бот должен быть добавлен в группу.
4. **Дизайн.** По желанию задать в `:root` сайта `--primary`, `--accent-tint`, `--line`, `--slate`, `--ring`.
5. **Приёмка.** `cd tests && npm install && npm test` (ожидается 23 + 23 passed) и ручная проверка из `SPEC.md` § 8.2 — обязательно в реальном браузере на десктопе и телефоне.

## Что нельзя менять
Сервер не может быть строже клиента; конверсия — только на thank-you; контакт — никогда в аналитику; бегунок — не `<input type=range>`. Подробно — `SPEC.md` § 9.

## Как внедрено на traffic-craft.com

- Файлы переименованы против cosmetic-фильтров адблоков: `lead-guard.js/css` → `tc-ui.js/css`, класс формы `lead-form` → `tc-form` (через `formSelector`), эндпоинт `/api/lead` → `/api/request` (старый — алиас).
- В `tc-ui.js` добавлено: хук `extraPayload(form)` (имя, UTM, fbp/fbc, расчёт калькулятора — только на свой сервер), настройки живут в экземпляре (`LeadGuard.create(cfg)` → `inst.bindForm(form)`, `inst.start()`, `inst.destroy()`), `thankYouUrl` может быть функцией. `LeadGuard.init` работает как раньше.
- **Мост в мессенджер — попап (`tc-go.js`).** Все ссылки WhatsApp/Telegram ведут на `/go?m=wa|tg&pl=…`; `tc-go.js` перехватывает клик и открывает окно на той же странице: иконка, «Проведите вправо», после свайпа — `Lead` (один на вкладку, ключ `tc_lead` общий с формами) + `Contact` в пиксель, заметка в группу и CAPI (`kind:'msg'`, `first`, `leadEventId`), затем `location.href` на wa.me/t.me. Закрыть: ✕, тап по фону, Esc. Калькулятор передаёт расчёт через `sessionStorage.tc_go_text`. Страница `/go` осталась запасным путём (без JS, ⌘-клик, прямая ссылка). Страницы могут слушать `document` событие `tc:bridge` (`open | confirm | close`).
- Конверсия `Lead` с форм — на `/thanks` (`consumePendingLead` + метка `tc_lead_pix` с тем же `eventID`, что у серверного CAPI).
- Тесты: `node api-lead.test.js` (сервер), `cd tests-lead-guard && node test-client.js` (ядро слайдера), `node calc.test.js` (калькулятор), e2e попапа — стенд в сессии Claude (`lg-server.js` + `lg-popup.js`).
