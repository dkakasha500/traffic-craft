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
