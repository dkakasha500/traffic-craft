/* ============================================================
   Мост в мессенджер как попап (Traffic Craft)
   ------------------------------------------------------------
   Любая ссылка на /go?m=wa|tg&pl=… открывает не отдельную страницу,
   а окно поверх текущей: иконка, «Проведите вправо», после свайпа -
   Lead/Contact в пиксель, заметка в группу + CAPI (kind:'msg'), и уже
   потом открывается WhatsApp/Telegram. Закрыть: ✕, тап по фону, Esc -
   человек остаётся там, где был.

   Без JS (или если tc-ui.js не загрузился) ссылки работают как раньше:
   ведут на страницу /go с тем же бегунком - она остаётся запасным путём.

   Подключение (после tc-ui.js):
     <link rel="stylesheet" href="/tc-ui.css">
     <script src="/tc-ui.js" defer></script>
     <script src="/tc-go.js" defer></script>
   ============================================================ */
(function (global) {
  "use strict";
  var doc = global.document;

  var WA_URL = "https://wa.me/77782182305";
  var TG_URL = "https://t.me/PPavel_D";
  var DEFAULT_TEXT = "Добрый день! Пишу по поводу рекламы с сайта";
  var ENDPOINT = "/api/request?m=1"; /* ?m=1: мосту не нужна выдержка токена (ветка msg его не проверяет) */

  var ICON = {
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>',
    tg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.492-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>'
  };

  var inst = null;     // экземпляр Lead Guard моста (один на страницу, токен живёт между открытиями)
  var root = null;     // DOM попапа
  var form = null;     // форма текущего открытия
  var state = null;    // { m, pl, name, dest, hand, first, eid }
  var lastFocus = null;
  var closeTimer = null;

  function once(key) {
    try { if (sessionStorage.getItem(key)) return false; sessionStorage.setItem(key, "1"); return true; }
    catch (e) { return true; }
  }
  function cookie(n) { var m = doc.cookie.match(new RegExp("(?:^|; )" + n + "=([^;]*)")); return m ? decodeURIComponent(m[1]) : ""; }
  function fbq() { try { if (typeof global.fbq === "function") global.fbq.apply(null, arguments); } catch (e) {} }
  /* страницы могут слушать: document.addEventListener('tc:bridge', e => e.detail.type) - open | confirm | close */
  function notify(type) {
    try { doc.dispatchEvent(new CustomEvent("tc:bridge", { detail: { type: type, messenger: state ? state.m : "", placement: state ? state.pl : "" } })); } catch (e) {}
  }

  /* href → { m, pl } если это ссылка на мост, иначе null. Мусор в параметрах молча заменяется дефолтами. */
  function parseBridge(href) {
    if (!href) return null;
    var u;
    try { u = new URL(href, global.location.href); } catch (e) { return null; }
    if (u.origin !== global.location.origin) return null;
    if (!/^\/go(\.html)?\/?$/.test(u.pathname)) return null;
    var m = u.searchParams.get("m") === "tg" ? "tg" : "wa";
    var pl = String(u.searchParams.get("pl") || "");
    if (!/^[a-z0-9-]{1,16}$/i.test(pl)) pl = "other";
    return { m: m, pl: pl };
  }

  function build() {
    if (root) return;
    root = doc.createElement("div");
    root.className = "tc-go";
    root.hidden = true;
    root.innerHTML =
      '<div class="tc-go__bg" data-close></div>' +
      '<div class="tc-go__card modal" role="dialog" aria-modal="true" aria-labelledby="tcGoTtl">' +
        '<button type="button" class="tc-go__x" data-close aria-label="Закрыть">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '</button>' +
        '<div class="tc-go__ico"></div>' +
        '<div class="tc-go__ttl" id="tcGoTtl"></div>' +
        '<div class="tc-go__hint">Один свайп — и откроется чат с нами.<br>Это защита от ботов, людям он не мешает.</div>' +
        '<div class="tc-go__body"></div>' +
        '<div class="tc-go__note">Пишете нам первый раз? Расскажите в двух словах про клинику и город — так ответим быстрее.</div>' +
      '</div>';
    doc.body.appendChild(root);
    root.addEventListener("click", function (e) {
      var t = e.target.closest ? e.target.closest("[data-close]") : null;
      if (t) { e.preventDefault(); close(); }
    });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && root && !root.hidden) { e.preventDefault(); close(); }
    });
    /* кастомный курсор сайта (кольцо) реагирует на кнопки по body.cursor-hover;
       бегунок и ✕ в его список не входят - подсказываем сами */
    root.addEventListener("mouseover", function (e) {
      if (e.target.closest && e.target.closest(".slide-confirm__knob, .tc-go__x")) doc.body.classList.add("cursor-hover");
    });
    root.addEventListener("mouseout", function (e) {
      if (e.target.closest && e.target.closest(".slide-confirm__knob, .tc-go__x") && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(".slide-confirm__knob, .tc-go__x"))) doc.body.classList.remove("cursor-hover");
    });
  }

  function ensureInstance() {
    if (inst || !global.LeadGuard || !global.LeadGuard.create) return inst;
    inst = global.LeadGuard.create({
      formSelector: "form.tc-go__form",
      endpoint: ENDPOINT,
      pendingFlagKey: "lg_pending_msg", /* не трогаем флаг формы для /thanks */
      thankYouUrl: function () {
        /* «спасибо» моста = сам мессенджер. На iOS универсальная ссылка откроет
           приложение, а страница останется - через пару секунд убираем окно */
        var dest = state ? state.dest : WA_URL;
        clearTimeout(closeTimer);
        closeTimer = setTimeout(close, 2500);
        global.location.href = dest;
      },
      onEvent: function (name, detail) {
        if (!state) return;
        if (name === "slider_shown") { fbq("trackCustom", "SliderShown", { placement: "bridge-" + state.pl }); return; }
        if (name !== "lead_confirmed") return;
        notify("confirm");
        fbq("trackCustom", "LeadConfirmed", { placement: "bridge-" + state.pl });
        /* Telegram не умеет предзаполнять чат ссылкой - кладём расчёт в буфер */
        if (state.hand && state.m === "tg" && navigator.clipboard && navigator.clipboard.writeText) {
          try { navigator.clipboard.writeText(state.hand).catch(function () {}); } catch (e) {}
        }
        /* Lead - один на вкладку, каким бы путём человек ни пошёл (тот же ключ tc_lead
           пишут формы). Contact - на каждый переход. Всё - ПОСЛЕ свайпа */
        state.first = once("tc_lead");
        if (state.first) {
          state.eid = "msg_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
          fbq("track", "Lead", { content_category: "messenger_" + state.m, placement: state.pl, value: 0, currency: "KZT" }, { eventID: state.eid });
        }
        fbq("track", "Contact", { content_category: "messenger_" + state.m, placement: state.pl });
      },
      extraPayload: function () {
        /* заметка «Ушёл в WhatsApp» в группу + серверный дубль Lead (CAPI) */
        var utm = {};
        try { var qp = new URLSearchParams(global.location.search); ["utm_source", "utm_medium", "utm_campaign"].forEach(function (k) { var v = qp.get(k); if (v) utm[k] = v; }); } catch (e) {}
        var fbc = cookie("_fbc"), fbp = cookie("_fbp");
        try { fbc = fbc || localStorage.getItem("_fbc") || ""; fbp = fbp || localStorage.getItem("_fbp") || ""; } catch (e) {}
        return {
          kind: "msg", messenger: state.m, placement: state.pl,
          first: state.first ? 1 : 0, leadEventId: state.eid || "",
          page: global.location.href.split("#")[0].slice(0, 500),
          utm_source: utm.utm_source || "", utm_medium: utm.utm_medium || "", utm_campaign: utm.utm_campaign || "",
          fbc: fbc, fbp: fbp
        };
      }
    });
    return inst;
  }

  function open(m, pl, trigger) {
    if (!ensureInstance()) return false;
    build();
    clearTimeout(closeTimer);
    if (form) { form.parentNode && form.parentNode.removeChild(form); form = null; }

    /* калькулятор передаёт свой расчёт через sessionStorage (кладёт на клике):
       WhatsApp получит его в тексте ссылки, для Telegram скопируем в буфер на свайпе.
       Только текст, до 500 символов, без управляющих символов; в разметку не попадает */
    var hand = "";
    try { hand = String(sessionStorage.getItem("tc_go_text") || "").replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 500).trim(); sessionStorage.removeItem("tc_go_text"); } catch (e) {}
    var name = m === "tg" ? "Telegram" : "WhatsApp";
    state = {
      m: m, pl: pl, name: name, hand: hand, first: false, eid: "",
      dest: m === "tg" ? TG_URL : WA_URL + "?text=" + encodeURIComponent(hand || DEFAULT_TEXT)
    };

    var card = root.querySelector(".tc-go__card");
    card.className = "tc-go__card modal is-" + m;
    root.querySelector(".tc-go__ico").innerHTML = ICON[m];
    root.querySelector(".tc-go__ttl").textContent = "Открыть чат в " + name;

    /* форма моста: контакт скрыт (подставляется мессенджер), видна только кнопка → слайдер сразу */
    form = doc.createElement("form");
    form.className = "tc-go__form";
    form.setAttribute("data-form-location", "bridge");
    form.setAttribute("novalidate", "");
    form.innerHTML =
      '<input type="hidden" name="contact" value="messenger">' +
      '<div class="tc-go__hp" aria-hidden="true"><input type="text" name="website" tabindex="-1" autocomplete="off"></div>' +
      '<p class="field-error" hidden></p>' +
      '<button type="submit" class="tc-go__btn">Открыть ' + name + '</button>';
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    root.querySelector(".tc-go__body").appendChild(form);

    var cfg = inst.cfg;
    cfg.text = {
      hint: "Проведите вправо",
      aria: "Ползунок: проведите вправо до конца, чтобы открыть " + name,
      confirm: "Открыть " + name,
      sending: (hand && m === "tg") ? "Расчёт скопирован · открываем Telegram…" : "Открываем " + name + "…"
    };
    inst.bindForm(form);
    inst.start();

    lastFocus = trigger || doc.activeElement;
    root.hidden = false;
    doc.documentElement.classList.add("tc-go-open");
    /* слайдер - сразу, без лишнего клика по кнопке (фокус на бегунке ставит сам модуль) */
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    fbq("trackCustom", "BridgeOpen", { messenger: m, placement: pl });
    notify("open");
    return true;
  }

  function close() {
    clearTimeout(closeTimer);
    if (!root || root.hidden) return;
    root.hidden = true;
    doc.documentElement.classList.remove("tc-go-open");
    doc.body.classList.remove("cursor-hover");
    if (form) { form.parentNode && form.parentNode.removeChild(form); form = null; }
    notify("close");
    state = null;
    try { if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); } catch (e) {}
    lastFocus = null;
  }

  /* Перехват кликов по ссылкам на мост. Модификаторы (⌘/Ctrl/Shift, средняя
     кнопка) - обычный переход: человек сам просит новую вкладку. */
  doc.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    var p = parseBridge(a.getAttribute("href"));
    if (!p) return;
    if (!global.LeadGuard || !global.LeadGuard.create) return; /* нет модуля - пусть работает страница /go */
    e.preventDefault();
    open(p.m, p.pl, a);
  });

  global.TCBridge = { open: open, close: close, parse: parseBridge, _state: function () { return state; } };
})(window);
