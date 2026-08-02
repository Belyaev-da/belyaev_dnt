/*
 * Belyaev DNT — popup.js
 * Навигация, переключение защиты, выбор уровня, перечень механизмов,
 * контактная почта.
 */

(function () {
  'use strict';

  const P = window.BelyaevProfiles;
  const E = window.BelyaevEmblem;
  const MAIL = 'belyaev.pro@mail.ru';

  const $ = id => document.getElementById(id);
  const body = document.body;

  const state = {
    isOn: false,
    level: P.DEFAULT_LEVEL,       // запрошенный пользователем уровень
    effectiveLevel: P.DEFAULT_LEVEL, // фактический (может быть понижен без лицензии)
    blocked: 0,
    license: { active: false, trial: true, daysLeft: 0, reason: 'trial' }
  };

  const store = {
    get(keys) { return new Promise(r => chrome.storage.local.get(keys, r)); },
    set(obj)  { return new Promise(r => chrome.storage.local.set(obj, r)); }
  };

  const send = (msg) => new Promise(r => {
    try { chrome.runtime.sendMessage(msg, resp => {
      if (chrome.runtime.lastError) { r(null); return; }
      r(resp);
    }); } catch (e) { r(null); }
  });

  function show(id) {
    document.querySelectorAll('.screen')
      .forEach(s => s.classList.toggle('is-active', s.id === id));
  }

  document.querySelectorAll('.back')
    .forEach(b => b.addEventListener('click', () => show('scr-home')));

  $('go-levels').addEventListener('click', () => { renderLevels(); show('scr-levels'); });
  $('go-shield').addEventListener('click', () => { renderShield(); show('scr-shield'); });
  $('go-about').addEventListener('click', () => show('scr-about'));
  $('go-license').addEventListener('click', () => { renderLicense(); show('scr-license'); });
  $('go-tips').addEventListener('click', () => { renderTips(); show('scr-tips'); });
  $('go-whitelist').addEventListener('click', () => { renderWhitelist(); show('scr-whitelist'); });

  // ---- Главный экран ---------------------------------------------------

  function renderHome() {
    const p = P.get(state.effectiveLevel);
    body.classList.toggle('is-off', !state.isOn);

    $('emblem-home').innerHTML =
      E.build(state.effectiveLevel, { asleep: !state.isOn, size: 132, uid: 'home' });

    $('status-text').textContent =
      state.isOn ? 'Защита включена' : 'Защита выключена';

    $('level-name').textContent = state.isOn ? p.name : 'Защита отключена';
    $('level-hint').textContent =
      state.isOn ? p.short : 'Включите защиту, чтобы скрыть свои данные';

    $('toggle-text').textContent =
      state.isOn ? 'Выключить защиту' : 'Включить защиту';

    $('stat-level').textContent = state.effectiveLevel;
    $('stat-blocked').textContent = state.blocked.toLocaleString('ru-RU');

    // Индикатор пробного периода (записи 023402, 023418).
    renderTrialBadge();
  }

  function renderTrialBadge() {
    let badge = $('trial-badge');
    const lic = state.license;
    const hero = document.querySelector('.hero__hint');
    if (!hero) return;

    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'trial-badge';
      badge.className = 'trial-badge';
      hero.insertAdjacentElement('afterend', badge);
    }

    if (lic.reason === 'licensed') {
      badge.style.display = 'none';
    } else if (lic.reason === 'trial') {
      badge.style.display = 'inline-block';
      badge.className = 'trial-badge';
      badge.textContent = 'Пробный период: ' + lic.daysLeft +
        (lic.daysLeft === 1 ? ' день' : lic.daysLeft < 5 ? ' дня' : ' дней');
    } else {
      badge.style.display = 'inline-block';
      badge.className = 'trial-badge is-expired';
      badge.textContent = 'Пробный период истёк · уровни 1–2 бесплатны';
    }
  }

  $('toggle').addEventListener('click', async () => {
    state.isOn = !state.isOn;
    await store.set({ isOn: state.isOn });
    await refreshFromSW();
    renderHome();
  });

  // Забирает у SW фактический уровень (с учётом лицензии) и статус.
  async function refreshFromSW() {
    const lic = await send({ type: 'getLicense' });
    if (lic) state.license = lic;
    // Эффективный уровень: лицензионный без лицензии понижается до 2.
    if (P.isLicensed(state.level) && !(state.license && state.license.active)) {
      state.effectiveLevel = '2';
    } else {
      state.effectiveLevel = state.level;
    }
  }

  // ---- Уровни ----------------------------------------------------------

  function renderLevels() {
    const box = $('levels');
    box.textContent = '';
    const hasLicense = state.license && state.license.active;

    P.list().forEach(p => {
      const locked = P.isLicensed(p.id) && !hasLicense;
      const current = p.id === state.effectiveLevel;

      const btn = document.createElement('button');
      btn.className = 'level' + (current ? ' is-current' : '') +
                      (locked ? ' is-locked' : '');
      btn.setAttribute('aria-pressed', current ? 'true' : 'false');

      const fig = document.createElement('span');
      fig.className = 'level__fig';
      fig.innerHTML = E.build(p.id, { size: 38, uid: 'lv' + p.id });

      const text = document.createElement('span');
      text.className = 'level__text';

      const name = document.createElement('span');
      name.className = 'level__name';
      name.textContent = p.id + ' · ' + p.name;

      const desc = document.createElement('span');
      desc.className = 'level__desc';
      desc.textContent = locked ? 'Доступно по лицензии' : p.short;

      text.appendChild(name);
      text.appendChild(desc);

      const mark = document.createElement('span');
      if (locked) {
        mark.className = 'level__lock';
        mark.innerHTML =
          '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
          '<rect x="3.5" y="7" width="9" height="6.5" rx="1.5" ' +
          'stroke="currentColor" stroke-width="1.4"/>' +
          '<path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" stroke="currentColor" ' +
          'stroke-width="1.4"/></svg>';
      } else {
        mark.className = 'level__check';
        mark.innerHTML =
          '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true">' +
          '<path d="M2.5 6.2 L4.8 8.5 L9.5 3.8" stroke="#fff" stroke-width="2" ' +
          'stroke-linecap="round" stroke-linejoin="round"/></svg>';
      }

      btn.appendChild(fig);
      btn.appendChild(text);
      btn.appendChild(mark);

      btn.addEventListener('click', async () => {
        if (locked) {
          // Ведём на экран лицензии вместо переключения.
          renderLicense();
          show('scr-license');
          return;
        }
        state.level = p.id;
        await store.set({ level: p.id });
        await refreshFromSW();
        renderLevels();
        renderHome();
      });

      box.appendChild(btn);
    });
  }

  // ---- Что защищено ----------------------------------------------------

  const MECHANISMS = [
    ['addDNT',            'Заголовок Do Not Track',   'DNT и Sec-GPC в каждом запросе'],
    ['spoofDoNotTrack',   'navigator.doNotTrack',     'Согласование JS-свойства с заголовком'],
    ['blockTrackers',     'Блокировка трекеров',      'Аналитика и рекламные сети'],
    ['trimReferrer',      'Скрытие источника',        'Referer на сторонних доменах'],
    ['spoofUserAgent',    'Подмена User-Agent',       'Браузер и операционная система'],
    ['spoofScreen',       'Параметры экрана',         'Разрешение и глубина цвета'],
    ['spoofTimezone',     'Часовой пояс и язык',      'Регион пользователя'],
    ['spoofCanvas',       'Canvas-отпечаток',         'Шум в графическом слепке'],
    ['spoofWebGL',        'Видеокарта (WebGL)',       'Модель графического адаптера'],
    ['spoofAudio',        'Аудио-отпечаток',          'Слепок звукового движка'],
    ['spoofFonts',        'Локальные шрифты',         'Список установленных шрифтов'],
    ['spoofWebRTC',       'Защита WebRTC',            'Утечка реального IP-адреса'],
    ['spoofHardware',     'Параметры устройства',     'Ядра процессора и память'],
    ['protectStorage',    'Изоляция хранилищ',        'Долгоживущие метки сайтов'],
    ['spoofCookies',      'Подмена Cookie',           'Вариативная замена трекинговых Cookie'],
    ['blockAuthorization','Заголовок Authorization',  'Полная блокировка']
  ];

  const ICON_ON =
    '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<path d="M3.5 8.4 L6.4 11.3 L12.5 5" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const ICON_OFF =
    '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<path d="M5 5 l6 6 M11 5 l-6 6" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round"/></svg>';

  function renderShield() {
    const p = P.get(state.effectiveLevel);
    const box = $('shield-list');
    box.textContent = '';

    MECHANISMS.forEach(m => {
      const key = m[0], name = m[1], meta = m[2];
      const active = state.isOn && !!p[key];

      const row = document.createElement('div');
      row.className = 'shield' + (active ? '' : ' is-off');

      const ico = document.createElement('span');
      ico.className = 'shield__ico';
      ico.innerHTML = active ? ICON_ON : ICON_OFF;

      const text = document.createElement('span');
      text.className = 'shield__text';

      const n = document.createElement('span');
      n.className = 'shield__name';
      n.textContent = name;

      const mt = document.createElement('span');
      mt.className = 'shield__meta';
      mt.textContent = meta;

      text.appendChild(n);
      text.appendChild(mt);

      const st = document.createElement('span');
      st.className = 'shield__state';
      st.textContent = active ? 'Вкл' : 'Выкл';

      row.appendChild(ico);
      row.appendChild(text);
      row.appendChild(st);
      box.appendChild(row);
    });
  }

  // ---- Почта -----------------------------------------------------------

  $('copy-mail').addEventListener('click', async () => {
    const msg = $('copy-msg');
    let ok = false;

    try {
      await navigator.clipboard.writeText(MAIL);
      ok = true;
    } catch (e) {
      // Резервный путь: буфер обмена может быть недоступен в попапе.
      try {
        const ta = document.createElement('textarea');
        ta.value = MAIL;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (e2) { ok = false; }
    }

    msg.textContent = ok ? 'Адрес скопирован' : 'Скопируйте адрес вручную';
    setTimeout(() => { msg.textContent = ''; }, 2400);
  });

  // ---- Сброс режима уведомлений ---------------------------------------

  const resetBtn = $('reset-notice');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      await store.set({ noticeDisabled: false, noticeMutedUntil: 0 });
      const m = $('notice-msg');
      m.textContent = 'Уведомления включены';
      setTimeout(() => { m.textContent = ''; }, 2400);
    });
  }

  // ---- Экран лицензии --------------------------------------------------

  function renderLicense() {
    const box = $('lic-status');
    const lic = state.license;
    box.className = 'lic-status';
    let icon, txt;

    if (lic.reason === 'licensed') {
      box.classList.add('is-active');
      icon = '<svg viewBox="0 0 18 18" fill="none"><path d="M3 9.5 L7 13.5 L15 5" ' +
             'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
             'stroke-linejoin="round"/></svg>';
      txt = 'Лицензия активна. Доступны все уровни.';
    } else if (lic.reason === 'trial') {
      box.classList.add('is-trial');
      icon = '<svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" ' +
             'stroke="currentColor" stroke-width="1.6"/><path d="M9 5v4l3 2" ' +
             'stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
      txt = 'Пробный период: осталось ' + lic.daysLeft +
        (lic.daysLeft === 1 ? ' день' : lic.daysLeft < 5 ? ' дня' : ' дней') +
        '. Доступны все уровни.';
    } else {
      box.classList.add('is-expired');
      icon = '<svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" ' +
             'stroke="currentColor" stroke-width="1.6"/><path d="M9 5.5v4M9 12h0" ' +
             'stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
      txt = 'Пробный период истёк. Уровни 3–5 требуют лицензии; 1–2 бесплатны.';
    }
    box.innerHTML = icon + '<span>' + txt + '</span>';

    $('lic-manage').style.display = lic.reason === 'licensed' ? 'block' : 'none';
    $('lic-input').value = '';
    $('lic-msg').textContent = '';
    $('lic-msg').className = 'copy-msg';
  }

  $('lic-activate').addEventListener('click', async () => {
    const msg = $('lic-msg');
    const code = $('lic-input').value.trim();
    if (!code) {
      msg.className = 'copy-msg is-error';
      msg.textContent = 'Введите код активации';
      return;
    }
    const res = await send({ type: 'activateLicense', code });
    if (!res) { msg.className = 'copy-msg is-error'; msg.textContent = 'Ошибка связи'; return; }

    if (res.ok) {
      msg.className = 'copy-msg';
      msg.textContent = 'Лицензия активирована';
      await refreshFromSW();
      setTimeout(() => { renderLicense(); renderHome(); }, 900);
    } else if (res.locked) {
      msg.className = 'copy-msg is-error';
      msg.textContent = 'Слишком много попыток. Повтор через ' +
        res.lockLeftMin + ' мин.';
    } else {
      msg.className = 'copy-msg is-error';
      msg.textContent = 'Неверный код. Осталось попыток: ' +
        (res.attemptsLeft != null ? res.attemptsLeft : '?');
    }
  });

  const licClear = $('lic-clear');
  if (licClear) {
    licClear.addEventListener('click', async () => {
      await send({ type: 'clearLicense' });
      await refreshFromSW();
      renderLicense();
      renderHome();
    });
  }

  // ---- Экран советов и угроз (записи 021256, 021400) -------------------

  function renderTips() {
    const tipsBox = $('tips-list');
    const threatsBox = $('threats-list');
    tipsBox.textContent = '';
    threatsBox.textContent = '';

    (P.TIPS || []).forEach(item => {
      const el = document.createElement('div');
      el.className = 'tip';
      const t = document.createElement('div');
      t.className = 'tip__t'; t.textContent = item.t;
      const s = document.createElement('div');
      s.className = 'tip__s'; s.textContent = item.s;
      el.appendChild(t); el.appendChild(s);
      tipsBox.appendChild(el);
    });

    Object.keys(P.THREATS || {}).forEach(key => {
      const item = P.THREATS[key];
      const el = document.createElement('div');
      el.className = 'tip tip--threat';
      const t = document.createElement('div');
      t.className = 'tip__t'; t.textContent = item.title;
      const s = document.createElement('div');
      s.className = 'tip__s'; s.textContent = item.risk;
      el.appendChild(t); el.appendChild(s);
      threatsBox.appendChild(el);
    });
  }

  $('seg-tips').addEventListener('click', () => {
    $('seg-tips').classList.add('is-active');
    $('seg-threats').classList.remove('is-active');
    $('tips-list').style.display = '';
    $('threats-list').style.display = 'none';
  });
  $('seg-threats').addEventListener('click', () => {
    $('seg-threats').classList.add('is-active');
    $('seg-tips').classList.remove('is-active');
    $('threats-list').style.display = '';
    $('tips-list').style.display = 'none';
  });

  // ---- Исключения (whitelist) ------------------------------------------

  let currentHost = '';
  let currentExcluded = false;

  async function refreshSiteToggle() {
    const res = await send({ type: 'checkCurrentSite' });
    const btn = $('site-toggle');
    if (!res || !res.host) {
      btn.style.display = 'none';
      return;
    }
    btn.style.display = 'flex';
    currentHost = res.host;
    currentExcluded = res.excluded;
    $('site-toggle-text').textContent = res.excluded
      ? 'Включить на ' + res.host
      : 'Отключить на ' + res.host;
    btn.classList.toggle('is-off', res.excluded);
  }

  $('site-toggle').addEventListener('click', async () => {
    if (!currentHost) return;
    if (currentExcluded) {
      await send({ type: 'removeWhitelist', domain: currentHost });
    } else {
      await send({ type: 'addWhitelist', domain: currentHost });
    }
    await refreshSiteToggle();
  });

  async function renderWhitelist() {
    const res = await send({ type: 'getWhitelist' });
    const list = $('wl-list');
    const empty = $('wl-empty');
    list.innerHTML = '';
    const domains = (res && res.whitelist) || [];
    empty.style.display = domains.length ? 'none' : 'block';
    domains.forEach(d => {
      const li = document.createElement('li');
      li.className = 'wl-item';
      const name = document.createElement('span');
      name.className = 'wl-item__name';
      name.textContent = d;
      const del = document.createElement('button');
      del.className = 'wl-item__del';
      del.setAttribute('aria-label', 'Удалить ' + d);
      del.innerHTML = '<svg viewBox="0 0 16 16" fill="none">' +
        '<path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" ' +
        'stroke-linecap="round"/></svg>';
      del.addEventListener('click', async () => {
        await send({ type: 'removeWhitelist', domain: d });
        renderWhitelist();
        refreshSiteToggle();
      });
      li.appendChild(name);
      li.appendChild(del);
      list.appendChild(li);
    });
  }

  async function addWhitelistFromInput() {
    const input = $('wl-input');
    const val = input.value.trim();
    if (!val) return;
    await send({ type: 'addWhitelist', domain: val });
    input.value = '';
    renderWhitelist();
    refreshSiteToggle();
  }

  $('wl-add-btn').addEventListener('click', addWhitelistFromInput);
  $('wl-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addWhitelistFromInput();
  });

  // ---- Запуск ----------------------------------------------------------

  (async function init() {
    const saved = await store.get(['isOn', 'level', 'blockedCount']);
    state.isOn = saved.isOn === true;
    state.level = String(saved.level || P.DEFAULT_LEVEL);
    if (!P.LEVELS[state.level]) state.level = P.DEFAULT_LEVEL;
    state.blocked = Number(saved.blockedCount) || 0;
    await refreshFromSW();
    renderHome();
    refreshSiteToggle();
  })();
})();
