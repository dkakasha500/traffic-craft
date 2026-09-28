/* ============================================================
   Lead Guard v1.0 — слайдер-подтверждение + защищённая доставка лида
   ------------------------------------------------------------
   Клиентский модуль без зависимостей (ES5-совместимый, IIFE).
   Подключение:
     <script src="lead-guard.js" defer></script>
     <script defer>document.addEventListener("DOMContentLoaded", function () {
       LeadGuard.init({ endpoint: "/api/lead", thankYouUrl: "thank-you.html" });
     });</script>

   Что делает:
     1) К каждой форме `formSelector` добавляет слайдер-подтверждение:
        после клика по кнопке отправки кнопка сменяется бегунком
        «Проведите вправо» — заявка уходит только после свайпа до конца.
        Вести можно ТОЛЬКО сам бегунок (клик по дорожке — лишь подсказка).
     2) Доставляет лид на серверный эндпоинт с анти-бот токеном:
        токен берётся у эндпоинта при загрузке (GET), сервер принимает
        POST только с валидным «выдержанным» токеном. Клиент ждёт ответ
        сервера, при истёкшем токене повторяет один раз, при глухой сети
        уходит на thank-you по жёсткому дедлайну.

   Требования к разметке формы (см. example/index.html):
     <form class="lead-form" data-form-location="hero">
       <input class="hp-field" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
       <input name="contact" ...>
       <p class="field-error" hidden>…</p>          (необязательно)
       <button type="submit">Отправить заявку</button>
     </form>

   Аналитика: модуль НИКОГДА не передаёт контакт в onEvent — только
   нейтральные параметры. Конверсию (Lead) шлите на thank-you странице,
   прочитав флаг через LeadGuard.consumePendingLead().

   Traffic Craft: настройки живут в экземпляре, а не в модуле - на одной
   странице могут работать форма заявки (init) и попап моста в мессенджер
   (LeadGuard.create + bindForm) с разными endpoint/thankYouUrl/текстами.
   thankYouUrl может быть функцией: тогда вместо редиректа вызывается она.
   ============================================================ */
(function (global) {
  "use strict";

  var DEFAULTS = {
    formSelector: "form.lead-form",
    contactField: "contact",
    honeypotField: "website",
    errorSelector: ".field-error",
    endpoint: "/api/lead",
    thankYouUrl: "thank-you.html",
    pendingFlagKey: "lg_pending_lead",     // sessionStorage: флаг для конверсии на thank-you
    extraPayload: null,                    // function(form) → object: дополнительные поля POST (имя, UTM, ...); PII в аналитику не попадает - только на свой сервер
    storagePrefix: "lg_",                  // localStorage: локальная копия лидов (для отладки)
    text: {
      hint:    "Проведите вправо, чтобы отправить",
      aria:    "Ползунок подтверждения: проведите вправо до конца, чтобы отправить заявку",
      confirm: "Подтвердить отправку заявки",
      sending: "Отправляем…"
    },
    swipe: { minSamples: 3, minMs: 100, doneAt: 97 },
    timing: {
      sendTimeoutMs: 4000,         // ждём ответ сервера не дольше
      hardDeadlineMs: 9000,        // абсолютный предел перед редиректом
      tokenStaleMs: 2.5 * 3600e3,  // старше — берём новый (сервер живёт 3 ч)
      tokenRefreshMs: 40 * 60e3,   // фоновое обновление токена
      defaultMinAgeMs: 2500        // если сервер не прислал minAge
    },
    /* Правило валидации контакта. Должно совпадать с серверным cleanContact():
       телефон ≥ 9 цифр ИЛИ любой текст ≥ 3 символов (без учёта ведущих @). */
    validateContact: function (value) {
      var v = (value || "").trim();
      if (!v) return false;
      if (/^[+\d][\d\s\-()]*$/.test(v)) return v.replace(/\D/g, "").length >= 9;
      return v.replace(/^@+/, "").length >= 3;
    },
    /* Хук аналитики: onEvent(name, detail). Имена: form_start, form_error, cta_click,
       slider_shown, lead_confirmed, lead_sent, lead_redirect. detail — без PII. */
    onEvent: function () {}
  };

  var ICON_ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>';

  function merge(base, over) {
    var out = {};
    Object.keys(base).forEach(function (k) { out[k] = base[k]; });
    Object.keys(over || {}).forEach(function (k) {
      if (over[k] && typeof over[k] === "object" && !Array.isArray(over[k]) && typeof base[k] === "object" && base[k] !== null && typeof base[k] !== "function") {
        out[k] = merge(base[k], over[k]);
      } else if (over[k] !== undefined) out[k] = over[k];
    });
    return out;
  }
  var pageshowBound = false;

  /* Экземпляр: собственные cfg и токен. Всё ниже до «Публичный API» - внутри. */
  function createInstance(userCfg) {
  var cfg = merge(DEFAULTS, userCfg || {});
  var TOKEN = null; // { value, at, minAge }
  var refreshTimer = null;

  function emit(name, detail) { try { cfg.onEvent(name, detail || {}); } catch (e) {} }

  /* ------------------------------------------------------------
     Анти-бот токен и доставка лида
     ------------------------------------------------------------ */
  function fetchToken() {
    try {
      return fetch(cfg.endpoint, { method: "GET", cache: "no-store", credentials: "same-origin" })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j && j.token) TOKEN = { value: j.token, at: Date.now(), minAge: Number(j.minAge) || cfg.timing.defaultMinAgeMs };
        })
        .catch(function () {});
    } catch (e) { return Promise.resolve(); }
  }

  /* Promise<string|null>: токен, «выдержанный» до минимального возраста, в пределах бюджета времени.
     Токен фиксируется в момент вызова — фоновое обновление его не подменит. */
  function ensureAgedToken(budgetMs) {
    var budget = typeof budgetMs === "number" ? Math.max(0, budgetMs) : 6000;
    var t = TOKEN;
    var stale = !t || (Date.now() - t.at) > cfg.timing.tokenStaleMs;
    var get = stale
      ? Promise.race([fetchToken(), new Promise(function (r) { setTimeout(r, Math.min(3000, budget)); })]).then(function () { return TOKEN; })
      : Promise.resolve(t);
    var started = Date.now();
    return get.then(function (tok) {
      if (!tok) return null;
      var wait = Math.max(0, tok.minAge - (Date.now() - tok.at));
      var left = Math.max(0, budget - (Date.now() - started));
      return new Promise(function (r) { setTimeout(function () { r(tok.value); }, Math.min(wait, left)); });
    });
  }

  /* POST лида с ожиданием ответа. keepalive — запрос доживёт, даже если страница уйдёт.
     Резолвится всегда: { ok, error }. */
  function sendLead(payload) {
    return new Promise(function (resolve) {
      var settled = false;
      var done = function (r) { if (!settled) { settled = true; resolve(r); } };
      var timer = setTimeout(function () { done({ ok: false, error: "timeout" }); }, cfg.timing.sendTimeoutMs);
      try {
        fetch(cfg.endpoint, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload), keepalive: true, credentials: "same-origin"
        }).then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); })
          .then(function (j) { clearTimeout(timer); done({ ok: !!(j && j.ok), error: (j && j.error) || (j && j.ok ? "" : "http") }); })
          .catch(function () { clearTimeout(timer); done({ ok: false, error: "network" }); });
      } catch (e) { clearTimeout(timer); done({ ok: false, error: "network" }); }
    });
  }

  function saveLocally(contact) {
    try {
      var key = cfg.storagePrefix + "leads";
      var leads = JSON.parse(localStorage.getItem(key) || "[]");
      leads.push({ contact: contact, ts: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(leads));
    } catch (e) {}
  }

  function submitLead(contact, loc, extra) {
    saveLocally(contact);
    var payload = { contact: contact, form_location: loc, page: location.pathname, ts: new Date().toISOString() };
    if (extra && typeof extra === "object") Object.keys(extra).forEach(function (k) { payload[k] = extra[k]; });

    var gone = false;
    function go() {
      if (gone) return; gone = true;
      try { sessionStorage.setItem(cfg.pendingFlagKey, JSON.stringify({ form_location: loc, ts: Date.now() })); } catch (e) {}
      emit("lead_redirect", { form_location: loc });
      if (typeof cfg.thankYouUrl === "function") { try { cfg.thankYouUrl(loc); } catch (e) {} }
      else global.location.href = cfg.thankYouUrl;
    }
    var startedAt = Date.now();
    var hardDeadline = setTimeout(go, cfg.timing.hardDeadlineMs);
    var left = function () { return cfg.timing.hardDeadlineMs - (Date.now() - startedAt); };

    ensureAgedToken(left() - cfg.timing.sendTimeoutMs)
      .then(function (token) { payload.token = token || ""; return sendLead(payload); })
      .then(function (r) {
        if (r.ok || !/^token_/.test(r.error || "")) return r;
        // Сервер не принял токен (истёк / не был получен) — новый токен, выдержка, один повтор.
        TOKEN = null;
        return ensureAgedToken(left() - 1500).then(function (token) { payload.token = token || ""; return sendLead(payload); });
      })
      .then(function (r) {
        emit("lead_sent", { form_location: loc, ok: !!r.ok, error: r.ok ? "" : (r.error || "") });
        if (!r.ok) console.warn("[LeadGuard] lead not accepted by server:", r.error);
        clearTimeout(hardDeadline); go();
      })
      .catch(function () { clearTimeout(hardDeadline); go(); });
  }

  /* ------------------------------------------------------------
     Слайдер-подтверждение. Вести можно только бегунок.
     Свайп = доведён до ≥ doneAt % за ≥ minSamples движений и ≥ minMs
     с захвата. Отпустили раньше — плавный откат. Клавиатура: стрелки /
     Home / End / Enter на бегунке. Экранные читалки: скрытая кнопка.
     ------------------------------------------------------------ */
  function createSlideConfirm(form, submitBtn, onConfirm) {
    var T = cfg.text, SW = cfg.swipe;
    var wrap = document.createElement("div");
    wrap.className = "slide-confirm";
    wrap.hidden = true;
    wrap.innerHTML =
      '<div class="slide-confirm__track">' +
        '<span class="slide-confirm__fill" aria-hidden="true"></span>' +
        '<span class="slide-confirm__label" aria-hidden="true"></span>' +
        '<div class="slide-confirm__knob" role="slider" tabindex="0" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
          '<span class="slide-confirm__knob-inner">' +
            '<span class="slide-confirm__icon slide-confirm__icon--arrow">' + ICON_ARROW + '</span>' +
            '<span class="slide-confirm__icon slide-confirm__icon--check">' + ICON_CHECK + '</span>' +
          '</span>' +
        '</div>' +
      '</div>' +
      '<button type="button" class="slide-confirm__sr-confirm sr-only"></button>';
    var track = wrap.querySelector(".slide-confirm__track");
    var fill  = wrap.querySelector(".slide-confirm__fill");
    var label = wrap.querySelector(".slide-confirm__label");
    var knob  = wrap.querySelector(".slide-confirm__knob");
    var srBtn = wrap.querySelector(".slide-confirm__sr-confirm");
    label.textContent = T.hint;
    knob.setAttribute("aria-label", T.aria);
    srBtn.textContent = T.confirm;

    // Ставим сразу под кнопкой (если кнопка в одной строке с полем — под всей строкой).
    var anchor = submitBtn ? (submitBtn.closest(".field-row") || submitBtn) : null;
    if (anchor && anchor.parentNode) anchor.insertAdjacentElement("afterend", wrap);
    else form.appendChild(wrap);

    var confirmed = false, value = 0, rafId = null, drag = null, viaKey = false;
    var now = function () { return (global.performance && performance.now) ? performance.now() : Date.now(); };

    function travel() {
      var w = track.clientWidth;
      if (!w) return 240; // среда без раскладки (тесты)
      return Math.max(1, w - knob.offsetWidth - 8);
    }
    function setValue(v) {
      value = Math.max(0, Math.min(100, v));
      var px = value / 100 * travel();
      knob.style.transform = "translateX(" + px + "px)";
      fill.style.width = "calc(" + px + "px + " + (knob.offsetWidth || 46) + "px + 4px)";
      wrap.style.setProperty("--p", value + "%");
      wrap.style.setProperty("--pn", String(Math.round(value)));
      knob.setAttribute("aria-valuenow", String(Math.round(value)));
    }
    function stopAnim() { if (rafId !== null && global.cancelAnimationFrame) cancelAnimationFrame(rafId); rafId = null; }
    function animateBack() {
      stopAnim();
      var from = value;
      if (!from || !global.requestAnimationFrame) { setValue(0); return; }
      var dur = 240, start = null;
      function step(t) {
        if (start === null) start = t;
        var k = Math.min(1, (t - start) / dur);
        var e = 1 - Math.pow(1 - k, 3);
        setValue(from * (1 - e));
        if (k < 1) { rafId = requestAnimationFrame(step); } else { rafId = null; }
      }
      rafId = requestAnimationFrame(step);
    }
    function swipeDone() {
      if (value < SW.doneAt) return false;
      if (viaKey) return true;
      return !!drag && drag.samples >= SW.minSamples && (now() - drag.start) >= SW.minMs;
    }

    function reset() {
      stopAnim();
      confirmed = false; drag = null; viaKey = false;
      setValue(0);
      wrap.classList.remove("is-confirmed");
      label.textContent = T.hint;
      knob.removeAttribute("aria-disabled");
      srBtn.disabled = false;
      wrap.hidden = true;
      if (submitBtn) { submitBtn.hidden = false; submitBtn.disabled = false; submitBtn.removeAttribute("aria-busy"); }
    }
    function show() {
      if (confirmed) return;
      stopAnim();
      drag = null; viaKey = false;
      setValue(0);
      wrap.hidden = false;
      if (submitBtn) submitBtn.hidden = true;
      // Фокус — на бегунок: на телефоне это закрывает клавиатуру; с клавиатуры можно сразу вести.
      try { knob.focus({ preventScroll: true }); } catch (e) { try { knob.focus(); } catch (e2) {} }
      try { if (!wrap.closest(".modal") && wrap.scrollIntoView) wrap.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) {}
    }
    function complete() {
      if (confirmed) return;
      stopAnim();
      confirmed = true; drag = null;
      setValue(100);
      wrap.classList.add("is-confirmed");
      label.textContent = T.sending;
      knob.setAttribute("aria-disabled", "true");
      srBtn.disabled = true;
      try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}
      onConfirm(reset);
    }

    /* ---- ведение бегунка (pointer events; fallback mouse/touch) ---- */
    var hasPointer = typeof global.PointerEvent !== "undefined";
    function pointX(e) {
      if (e.touches && e.touches[0]) return e.touches[0].clientX;
      if (e.changedTouches && e.changedTouches[0]) return e.changedTouches[0].clientX;
      return e.clientX || 0;
    }
    function onDown(e) {
      if (confirmed) return;
      if (e.button !== undefined && e.button !== 0 && e.type !== "touchstart") return;
      if (e.cancelable) e.preventDefault();
      stopAnim();
      viaKey = false;
      drag = { startX: pointX(e), startV: value, start: now(), samples: 0, pointerId: e.pointerId };
      try { if (hasPointer && knob.setPointerCapture && e.pointerId !== undefined) knob.setPointerCapture(e.pointerId); } catch (err) {}
      wrap.classList.add("is-dragging");
      bindMove();
    }
    function onMove(e) {
      if (!drag || confirmed) return;
      if (e.cancelable) e.preventDefault();
      var dx = pointX(e) - drag.startX;
      drag.samples += 1;
      setValue(drag.startV + dx / travel() * 100);
      if (swipeDone()) { finishDrag(); complete(); }
    }
    function onUp() {
      if (!drag) return;
      var done = swipeDone(); // быстрый флик до упора — проверяем при отпускании
      finishDrag();
      if (confirmed) return;
      if (done) complete(); else animateBack();
    }
    function finishDrag() {
      wrap.classList.remove("is-dragging");
      unbindMove();
      if (drag && hasPointer && knob.releasePointerCapture && drag.pointerId !== undefined) {
        try { knob.releasePointerCapture(drag.pointerId); } catch (err) {}
      }
      drag = null;
    }
    var moveEvents = hasPointer ? ["pointermove"] : ["mousemove", "touchmove"];
    var upEvents   = hasPointer ? ["pointerup", "pointercancel"] : ["mouseup", "touchend", "touchcancel"];
    function bindMove() {
      moveEvents.forEach(function (t) { global.addEventListener(t, onMove, { passive: false }); });
      upEvents.forEach(function (t) { global.addEventListener(t, onUp); });
    }
    function unbindMove() {
      moveEvents.forEach(function (t) { global.removeEventListener(t, onMove); });
      upEvents.forEach(function (t) { global.removeEventListener(t, onUp); });
    }
    (hasPointer ? ["pointerdown"] : ["mousedown", "touchstart"]).forEach(function (t) {
      knob.addEventListener(t, onDown, { passive: false });
    });
    if (hasPointer) knob.addEventListener("lostpointercapture", function () { if (drag) onUp(); });

    // Клик по дорожке мимо бегунка ничего не переключает — только подсказка «возьми меня».
    track.addEventListener(hasPointer ? "pointerdown" : "mousedown", function (e) {
      if (confirmed || e.target === knob || knob.contains(e.target)) return;
      if (e.cancelable) e.preventDefault();
      var inner = knob.firstElementChild;
      if (!inner) return;
      inner.classList.remove("is-hint");
      void inner.offsetWidth;
      inner.classList.add("is-hint");
      setTimeout(function () { inner.classList.remove("is-hint"); }, 500);
    }, { passive: false });

    /* ---- клавиатура ---- */
    knob.addEventListener("keydown", function (e) {
      if (confirmed) return;
      var v = null;
      switch (e.key) {
        case "ArrowRight": case "ArrowUp":   v = value + 10; break;
        case "ArrowLeft":  case "ArrowDown": v = value - 10; break;
        case "PageUp":   v = value + 25; break;
        case "PageDown": v = value - 25; break;
        case "Home": v = 0; break;
        case "End":  v = 100; break;
        case "Enter": case " ": case "Spacebar":
          e.preventDefault(); viaKey = true; complete(); return;
        default: return;
      }
      e.preventDefault();
      stopAnim(); viaKey = true;
      setValue(v);
      if (swipeDone()) complete();
    });
    /* ---- экранные читалки ---- */
    srBtn.addEventListener("click", function () { if (!confirmed) { viaKey = true; complete(); } });

    return { show: show, reset: reset, isVisible: function () { return !wrap.hidden; } };
  }

  /* ------------------------------------------------------------
     Биндинг формы: валидация → слайдер → отправка. Защита от гонок.
     ------------------------------------------------------------ */
  function bindForm(form) {
    var input = form.querySelector('input[name="' + cfg.contactField + '"]');
    if (!input) return;
    var errorEl = form.querySelector(cfg.errorSelector);
    var loc = form.getAttribute("data-form-location") || "form";
    var submitBtn = form.querySelector('button[type="submit"]');
    var honeypot = form.querySelector('[name="' + cfg.honeypotField + '"]');
    var submitting = false;
    var started = false;

    function showError() {
      input.classList.add("is-invalid");
      input.setAttribute("aria-invalid", "true");
      if (errorEl) errorEl.hidden = false;
      emit("form_error", { form_location: loc });
    }
    function clearError() {
      input.classList.remove("is-invalid");
      input.setAttribute("aria-invalid", "false");
      if (errorEl) errorEl.hidden = true;
    }

    var slider = createSlideConfirm(form, submitBtn, function (resetSlider) {
      if (submitting) return;
      if (honeypot && honeypot.value) { resetSlider(); return; }
      if (!cfg.validateContact(input.value)) { resetSlider(); showError(); input.focus(); return; }
      submitting = true;
      if (submitBtn) { submitBtn.disabled = true; submitBtn.setAttribute("aria-busy", "true"); }
      emit("lead_confirmed", { form_location: loc });
      var extra = null;
      if (typeof cfg.extraPayload === "function") { try { extra = cfg.extraPayload(form); } catch (e) {} }
      submitLead(input.value.trim(), loc, extra);
    });

    input.addEventListener("input", function () {
      if (submitting) return;
      if (!started) { started = true; emit("form_start", { form_location: loc }); }
      clearError();
      if (slider.isVisible()) slider.reset(); // контакт изменили — нужна повторная проверка
    });
    if (submitBtn) {
      submitBtn.addEventListener("click", function () { if (!submitting) emit("cta_click", { form_location: loc }); });
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (submitting) return;
      if (honeypot && honeypot.value) return;
      if (!cfg.validateContact(input.value)) { showError(); input.focus(); return; }
      clearError();
      slider.show();
      emit("slider_shown", { form_location: loc });
    });
    return { reset: function () { if (!submitting) slider.reset(); }, isSubmitting: function () { return submitting; } };
  }

  /* Токен: получить сейчас и обновлять в фоне (один таймер на экземпляр). */
  function start() {
    fetchToken();
    if (refreshTimer === null) refreshTimer = setInterval(fetchToken, cfg.timing.tokenRefreshMs);
  }
  function destroy() { if (refreshTimer !== null) { clearInterval(refreshTimer); refreshTimer = null; } }

  return {
    cfg: cfg,
    bindForm: bindForm,
    start: start,
    destroy: destroy,
    _token: { get: function () { return TOKEN; }, set: function (v) { TOKEN = v; } }
  };
  } /* createInstance */

  /* ------------------------------------------------------------
     Публичный API
     ------------------------------------------------------------ */
  var current = null; // экземпляр init() - для consumePendingLead и тестов

  function bindPageshow() {
    if (pageshowBound) return;
    pageshowBound = true;
    // «Назад» из bfcache возвращает страницу в состоянии «Отправляем…» — перезагружаем.
    global.addEventListener("pageshow", function (e) { if (e.persisted) location.reload(); });
  }

  /* Классический запуск: все формы formSelector с одной конфигурацией. */
  function init(userCfg) {
    var inst = createInstance(userCfg);
    current = inst;
    var forms = document.querySelectorAll(inst.cfg.formSelector);
    if (!forms.length) return inst;
    forms.forEach(function (f) { inst.bindForm(f); });
    inst.start();
    bindPageshow();
    return inst;
  }

  /* Экземпляр без привязки: формы подключаются позже через inst.bindForm(form),
     токен - inst.start(). Для попапа моста в мессенджер. */
  function create(userCfg) {
    bindPageshow();
    return createInstance(userCfg);
  }

  /* На thank-you: вернуть и снять флаг ожидающей конверсии (или null). Вызывать один раз. */
  function consumePendingLead(key) {
    key = key || (current && current.cfg.pendingFlagKey) || DEFAULTS.pendingFlagKey;
    try {
      var raw = sessionStorage.getItem(key);
      if (!raw) return null;
      sessionStorage.removeItem(key);
      return JSON.parse(raw) || {};
    } catch (e) { return null; }
  }

  global.LeadGuard = {
    init: init,
    create: create,
    consumePendingLead: consumePendingLead,
    validateContact: DEFAULTS.validateContact,
    _internals: { // для тестов: экземпляр последнего init()
      get token() { return current ? current._token.get() : null; },
      set token(v) { if (current) current._token.set(v); },
      get cfg() { return current ? current.cfg : null; }
    }
  };
})(window);
