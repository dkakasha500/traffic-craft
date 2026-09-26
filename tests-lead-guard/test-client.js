/* Тесты клиентского модуля lead-guard.js на примере example/index.html. Запуск: npm install && node test-client.js */
const { JSDOM, VirtualConsole } = require("jsdom"); const fs = require("fs"); const path = require("path");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(__dirname, "example", "index.html"), "utf8").replace(/\.\.\/lead-guard\.(js|css)/g, "lead-guard.$1");
const js = fs.readFileSync(path.join(root, "lead-guard.js"), "utf8");
let P = 0, F = 0; const ok = (c, m) => { c ? P++ : F++; console.log((c ? "  ✓ " : "  ✗ FAIL: ") + m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
function boot(opts = {}) {
  const vc = new VirtualConsole(); vc.on("jsdomError", () => {}); // jsdom не умеет редиректы — глушим шум
  const dom = new JSDOM(html, { url: "https://example.com/index.html", runScripts: "outside-only", pretendToBeVisual: true, virtualConsole: vc });
  const w = dom.window; w.gets = 0; w.posts = []; w.events = []; w.postScript = opts.postScript || [];
  w.fetch = (u, o) => {
    if (!o || !o.method || o.method === "GET") { w.gets++; if (opts.tokenFail) return Promise.reject(new Error("down")); return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, token: "1700000000000.tok" + w.gets, minAge: 200 }) }); }
    w.posts.push({ u, body: JSON.parse(o.body), keepalive: o.keepalive });
    const r = w.postScript.length ? w.postScript.shift() : { ok: true };
    if (r.hang) return new Promise(() => {});
    return Promise.resolve({ ok: true, json: () => Promise.resolve(r) });
  };
  w.eval(js);
  w.LeadGuard.init({ endpoint: "/api/lead", thankYouUrl: "thank-you.html", onEvent: (n, d) => w.events.push([n, d]) });
  return { w, d: w.document };
}
// В jsdom PointerEvent может отсутствовать — тогда модуль сам работает через mouse-события; тесты подстраиваются.
const hasPE = (w) => typeof w.PointerEvent === "function";
const down = (w, el, x) => el.dispatchEvent(hasPE(w) ? new w.PointerEvent("pointerdown", { clientX: x, button: 0, pointerId: 1, bubbles: true, cancelable: true }) : new w.MouseEvent("mousedown", { clientX: x, button: 0, bubbles: true, cancelable: true }));
const move = (w, x) => w.dispatchEvent(hasPE(w) ? new w.PointerEvent("pointermove", { clientX: x, pointerId: 1, bubbles: true, cancelable: true }) : new w.MouseEvent("mousemove", { clientX: x, bubbles: true, cancelable: true }));
const up = (w, x) => w.dispatchEvent(hasPE(w) ? new w.PointerEvent("pointerup", { clientX: x, pointerId: 1, bubbles: true }) : new w.MouseEvent("mouseup", { clientX: x, bubbles: true }));
const key = (w, el, k) => el.dispatchEvent(new w.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
function open(w, d, contact = "+998901234567") {
  const f = d.querySelector("form.lead-form"); const i = f.querySelector('input[name="contact"]'); i.value = contact;
  f.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  const wrap = f.querySelector(".slide-confirm");
  return { f, i, btn: f.querySelector('button[type="submit"]'), wrap, track: wrap.querySelector(".slide-confirm__track"), knob: wrap.querySelector(".slide-confirm__knob"), label: wrap.querySelector(".slide-confirm__label"), sr: wrap.querySelector(".slide-confirm__sr-confirm") };
}
const aged = (w) => { w.LeadGuard._internals.token.at = Date.now() - 5000; };
const val = (s) => Number(s.knob.getAttribute("aria-valuenow"));
const swipe = async (w, s) => { down(w, s.knob, 0); move(w, 60); move(w, 120); move(w, 180); await sleep(110); move(w, 240); up(w, 240); };
(async () => {
  console.log("=== CLIENT === (PointerEvent в jsdom: " + hasPE(new JSDOM("").window) + ")");
  let { w, d } = boot(); await sleep(30);
  ok(w.gets === 1 && w.LeadGuard._internals.token.minAge === 200, "токен получен при init");
  let s = open(w, d);
  ok(!s.wrap.hidden && s.btn.hidden && d.activeElement === s.knob, "submit → слайдер показан, кнопка скрыта, фокус на бегунке");
  ok(s.wrap.previousElementSibling.classList.contains("field-row"), "слайдер под строкой поле+кнопка");
  ok(w.events.some(e => e[0] === "slider_shown") && !JSON.stringify(w.events).includes("998901234567"), "onEvent: slider_shown, контакт в аналитику не уходит");
  down(w, s.track, 200); await sleep(10); ok(val(s) === 0 && s.knob.firstElementChild.classList.contains("is-hint"), "клик по дорожке → без прыжка, подсказка");
  down(w, s.knob, 0); up(w, 0); await sleep(10); ok(val(s) === 0 && !w.posts.length, "клик по бегунку без ведения → ничего");
  down(w, s.knob, 0); move(w, 60); move(w, 120); up(w, 120); await sleep(400); ok(val(s) === 0 && !w.posts.length, "отпустили на 50% → откат, отправки нет");
  aged(w); down(w, s.knob, 0); move(w, 80); move(w, 160); move(w, 240); ok(!s.wrap.classList.contains("is-confirmed"), "рывок <100 мс → не подтверждён");
  await sleep(120); up(w, 240); await sleep(30);
  ok(s.wrap.classList.contains("is-confirmed") && w.posts.length === 1 && w.posts[0].body.token === "1700000000000.tok1" && w.posts[0].keepalive, "отпустили после 100 мс → подтверждён, лид ушёл с токеном");
  ok(!!w.sessionStorage.getItem("lg_pending_lead") && w.events.some(e => e[0] === "lead_sent" && e[1].ok) && w.events.some(e => e[0] === "lead_redirect"), "ответ ok → флаг для thank-you, события lead_sent/lead_redirect");
  ok(s.label.textContent === "Отправляем…" && s.btn.disabled, "состояние confirmed");
  // thank-you: consumePendingLead
  const pend = w.LeadGuard.consumePendingLead(); ok(pend && pend.form_location === "hero" && w.LeadGuard.consumePendingLead() === null, "consumePendingLead возвращает флаг один раз");
  // клавиатура и AT
  ({ w, d } = boot()); await sleep(30); aged(w); s = open(w, d);
  for (let i = 0; i < 10; i++) key(w, s.knob, "ArrowRight"); await sleep(20); ok(s.wrap.classList.contains("is-confirmed") && w.posts.length === 1, "10×ArrowRight → подтверждено");
  ({ w, d } = boot()); await sleep(30); aged(w); s = open(w, d); key(w, s.knob, "Enter"); await sleep(20); ok(w.posts.length === 1, "Enter → подтверждено");
  ({ w, d } = boot()); await sleep(30); aged(w); s = open(w, d); s.sr.click(); await sleep(20); ok(w.posts.length === 1, "sr-only кнопка → подтверждено");
  // надёжность
  ({ w, d } = boot({ postScript: [{ ok: false, error: "token_expired" }, { ok: true }] })); await sleep(30); aged(w); s = open(w, d); await swipe(w, s); await sleep(400);
  ok(w.gets === 2 && w.posts.length === 2 && w.posts[1].body.token === "1700000000000.tok2" && !!w.sessionStorage.getItem("lg_pending_lead"), "token_expired → новый токен → повтор → редирект");
  ({ w, d } = boot({ postScript: [{ hang: true }] })); await sleep(30); aged(w); w.LeadGuard._internals.cfg.timing.sendTimeoutMs = 300; s = open(w, d); await swipe(w, s); await sleep(150);
  ok(!w.sessionStorage.getItem("lg_pending_lead"), "сервер молчит → ждём"); await sleep(300); ok(!!w.sessionStorage.getItem("lg_pending_lead"), "таймаут → редирект");
  ({ w, d } = boot({ tokenFail: true })); await sleep(30); w.LeadGuard._internals.cfg.timing.hardDeadlineMs = 600; s = open(w, d); await swipe(w, s); await sleep(700);
  ok(!!w.sessionStorage.getItem("lg_pending_lead"), "токен недоступен → дедлайн → не зависаем");
  // гонки
  ({ w, d } = boot({ postScript: [{ hang: true }] })); await sleep(30); aged(w); s = open(w, d); await swipe(w, s); await sleep(20);
  s.i.value = "+998907777777"; s.i.dispatchEvent(new w.Event("input", { bubbles: true })); s.f.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true })); await sleep(20);
  ok(s.wrap.classList.contains("is-confirmed") && w.posts.length === 1, "ввод/submit во время отправки игнорируются");
  ({ w, d } = boot()); await sleep(30); aged(w); s = open(w, d); s.i.value = "x"; await swipe(w, s); await sleep(20);
  ok(s.wrap.hidden && !s.btn.hidden && !s.btn.disabled && s.i.classList.contains("is-invalid") && !w.posts.length, "контакт стал невалидным → сброс без отправки");
  ({ w, d } = boot()); await sleep(30); s = open(w, d); s.f.querySelector('[name="website"]').value = "bot"; aged(w); await swipe(w, s); await sleep(20); ok(!w.posts.length && s.wrap.hidden, "honeypot → тихий сброс");
  ({ w, d } = boot()); await sleep(30); s = open(w, d, "ab"); ok(s.wrap.hidden && s.i.classList.contains("is-invalid") && w.events.some(e => e[0] === "form_error"), "невалидный контакт → ошибка, слайдер не показан");
  console.log(`CLIENT: ${P} passed, ${F} failed`); process.exit(F ? 1 : 0);
})().catch(e => { console.error("CRASH:", e); process.exit(1); });
