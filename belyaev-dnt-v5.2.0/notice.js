/*
 * Belyaev DNT — notice.js
 *
 * ISOLATED-мир, document_idle. Показывает компактную полупрозрачную
 * карточку: сколько трекеров заблокировано на этой странице и какие типы
 * данных о пользователе закрыты защитой. Полный перечень типов данных
 * раскрывается по кнопке.
 *
 * Счётчик трекеров считается ЗДЕСЬ, на стороне страницы, через
 * PerformanceObserver — он видит все сетевые запросы. Это работает у всех
 * пользователей, в отличие от onRuleMatchedDebug, доступного только
 * распакованным расширениям в режиме разработчика.
 *
 * Карточка живёт в закрытом Shadow DOM, показывается один раз на домен
 * за сессию вкладки, скрывается через 12 секунд, не перехватывает клики.
 * Показ можно отложить на 1–24 часа или отключить совсем.
 */

(function () {
  'use strict';

  if (window.top !== window.self) return;

  const HOST = location.hostname;
  if (!HOST) return;

  // Полный перечень типов собираемых данных и что с ними делает защита.
  // Флаг профиля -> [название, что именно закрывается].
  const ITEMS = [
    ['addDNT',            'Do Not Track',        'Сигнал «не отслеживать» в каждом запросе'],
    ['spoofDoNotTrack',   'navigator.doNotTrack','JS-сигнал отказа от слежки'],
    ['blockTrackers',     'Трекеры и аналитика', 'Запросы к рекламным и счётчиковым сетям'],
    ['trimReferrer',      'Источник перехода',   'Заголовок Referer на чужих доменах'],
    ['spoofUserAgent',    'Браузер и система',   'User-Agent и версия ОС'],
    ['spoofScreen',       'Разрешение экрана',   'Размер экрана и глубина цвета'],
    ['spoofTimezone',     'Часовой пояс и язык', 'Регион и языковые настройки'],
    ['spoofHardware',     'Ядра и память',       'Число ядер CPU и объём RAM'],
    ['spoofCanvas',       'Графический отпечаток','Canvas-слепок браузера'],
    ['spoofWebGL',        'Видеокарта',          'Модель GPU через WebGL'],
    ['spoofAudio',        'Звуковой отпечаток',  'Слепок аудио-движка'],
    ['spoofFonts',        'Шрифты',              'Список установленных шрифтов'],
    ['spoofWebRTC',       'Реальный IP',         'Утечка адреса через WebRTC'],
    ['spoofPlugins',      'Плагины',             'Список плагинов браузера'],
    ['spoofBattery',      'Батарея',             'Уровень заряда устройства'],
    ['spoofConnection',   'Сеть',                'Тип и скорость соединения'],
    ['spoofMedia',        'Камера и микрофон',   'Список медиаустройств'],
    ['spoofClientHints',  'Client Hints',        'Заголовки-подсказки о браузере'],
    ['protectStorage',    'Хранилища',           'Долгоживущие метки сайтов'],
    ['spoofCookies',      'Трекинговые Cookie',  'Подмена аналитических Cookie'],
    ['blockAuthorization','Авторизация',         'Заголовок Authorization']
  ];

  const SEEN_KEY = '__bdnt_seen_' + HOST;

  // ── Подсчёт трекеров на странице ──────────────────────────────────────
  // Собираем хосты всех сетевых запросов и сверяем со списком трекеров.
  let trackerDomains = [];
  let blockedHosts = new Set();
  let perfObserver = null;

  function hostMatchesTracker(url) {
    let h;
    try { h = new URL(url, location.href).hostname; } catch (e) { return; }
    for (const d of trackerDomains) {
      if (h === d || h.endsWith('.' + d)) {
        blockedHosts.add(h);
        return;
      }
    }
  }

  function scanExisting() {
    try {
      performance.getEntriesByType('resource')
        .forEach(e => hostMatchesTracker(e.name));
    } catch (e) {}
  }

  function startObserving() {
    try {
      perfObserver = new PerformanceObserver(list => {
        list.getEntries().forEach(e => hostMatchesTracker(e.name));
      });
      perfObserver.observe({ entryTypes: ['resource'] });
    } catch (e) {}
  }

  // ── Запрос состояния и запуск ─────────────────────────────────────────
  chrome.runtime.sendMessage({ type: 'getNoticeState' }, (st) => {
    if (chrome.runtime.lastError || !st) return;
    if (!st.isOn) return;

    trackerDomains = st.trackerDomains || [];
    scanExisting();
    startObserving();

    // Через некоторое время сообщаем фону итог для общего счётчика.
    setTimeout(() => {
      const count = blockedHosts.size;
      if (count > 0) {
        try {
          chrome.runtime.sendMessage({ type: 'reportBlocked', count });
        } catch (e) {}
      }
    }, 8000);

    // Карточку показываем один раз на домен за сессию и только если не muted.
    let alreadySeen = false;
    try { alreadySeen = !!sessionStorage.getItem(SEEN_KEY); } catch (e) {}
    if (st.muted || alreadySeen) return;
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) {}

    // Даём странице подгрузить ресурсы, чтобы счётчик был осмысленным.
    setTimeout(() => render(st), 2500);
  });

  function render(st) {
    if (!document.body) return;

    const profile = st.profile || {};
    const covered = ITEMS.filter(i => profile[i[0]]);
    const trackerCount = blockedHosts.size;
    if (!covered.length && !trackerCount) return;

    const holder = document.createElement('div');
    holder.style.cssText =
      'all:initial;position:fixed;z-index:2147483647;right:16px;bottom:16px;';
    const root = holder.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = `
      :host { all: initial; }
      .card {
        width: 300px; box-sizing: border-box; padding: 12px 13px 11px;
        border-radius: 14px; background: rgba(22, 38, 28, .84);
        backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
        border: 1px solid rgba(255,255,255,.13);
        box-shadow: 0 6px 28px rgba(0,0,0,.28); color: #EAF3EC;
        font: 400 12px/1.45 'Segoe UI', system-ui, -apple-system, sans-serif;
        opacity: 0; transform: translateY(10px);
        transition: opacity .32s ease, transform .32s ease;
      }
      .card.in { opacity: 1; transform: translateY(0); }
      .head { display: flex; align-items: center; gap: 8px; }
      .ico { width: 20px; height: 20px; flex: none; }
      .title { font-size: 12.5px; font-weight: 600; letter-spacing: -.01em; flex: 1; }
      .x { width: 22px; height: 22px; flex: none; cursor: pointer; border: none;
        border-radius: 6px; background: transparent; color: rgba(234,243,236,.6);
        font-size: 15px; line-height: 1; display: grid; place-items: center; padding: 0; }
      .x:hover { background: rgba(255,255,255,.1); color: #fff; }
      .count { display: flex; align-items: baseline; gap: 6px; margin: 9px 0 2px; }
      .count b { font-size: 22px; font-weight: 700; color: #7FCB92; letter-spacing: -.02em; }
      .count span { font-size: 11.5px; color: rgba(234,243,236,.72); }
      .sub { margin: 4px 0 0; font-size: 11.5px; color: rgba(234,243,236,.72); }
      .tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 9px; }
      .tag { font-size: 10.5px; padding: 3px 7px; border-radius: 6px;
        background: rgba(124,203,146,.17); color: #B7E6C4; white-space: nowrap; }
      .toggle { margin-top: 9px; width: 100%; height: 28px; cursor: pointer;
        border: 1px solid rgba(255,255,255,.16); border-radius: 7px;
        background: rgba(255,255,255,.04); color: rgba(234,243,236,.9);
        font: inherit; font-size: 11px; font-weight: 500;
        display: flex; align-items: center; justify-content: center; gap: 6px; }
      .toggle:hover { background: rgba(255,255,255,.09); }
      .toggle svg { width: 12px; height: 12px; transition: transform .2s; }
      .toggle.open svg { transform: rotate(180deg); }
      .details { margin-top: 8px; max-height: 220px; overflow-y: auto;
        display: none; flex-direction: column; gap: 5px; }
      .details.show { display: flex; }
      .details::-webkit-scrollbar { width: 6px; }
      .details::-webkit-scrollbar-thumb { background: rgba(255,255,255,.14); border-radius: 3px; }
      .row { display: flex; gap: 8px; padding: 6px 8px; border-radius: 7px;
        background: rgba(255,255,255,.03); }
      .row.off { opacity: .4; }
      .dot { width: 6px; height: 6px; border-radius: 50%; flex: none; margin-top: 5px;
        background: #7FCB92; }
      .row.off .dot { background: rgba(234,243,236,.4); }
      .rowtext { flex: 1; min-width: 0; }
      .rowname { font-size: 11.5px; font-weight: 600; }
      .rowdesc { font-size: 10.5px; color: rgba(234,243,236,.6); margin-top: 1px; }
      .rowstate { font-size: 10px; font-weight: 600; color: #7FCB92; white-space: nowrap; }
      .row.off .rowstate { color: rgba(234,243,236,.4); }
      .foot { display: flex; align-items: center; gap: 6px; margin-top: 10px;
        padding-top: 9px; border-top: 1px solid rgba(255,255,255,.1); }
      .mute { flex: 1; height: 26px; cursor: pointer; border: 1px solid rgba(255,255,255,.16);
        border-radius: 7px; background: transparent; color: rgba(234,243,236,.82);
        font: inherit; font-size: 11px; padding: 0 6px; }
      .mute:hover { background: rgba(255,255,255,.08); }
      select.mute { appearance: none; text-align: center; }
      select.mute option { background: #16261C; color: #EAF3EC; }
    `;

    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('role', 'status');

    // Шапка
    const head = document.createElement('div');
    head.className = 'head';
    const ico = document.createElement('div');
    ico.className = 'ico';
    ico.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<path d="M12 2.6 L20.2 6 v6.2 c0 4.3-3.4 7.6-8.2 9.2' +
      ' C7.2 19.8 3.8 16.5 3.8 12.2 V6 Z" fill="#4CAF6C"/>' +
      '<path d="M3.8 9.6 H20.2 M3.8 14.6 H20.2" stroke="#16261C"' +
      ' stroke-width="1.3" stroke-opacity=".55"/>' +
      '<path d="M8.4 6 V9.6 M15.6 6 V9.6 M12 9.6 V14.6 M7 14.6 V19' +
      ' M17 14.6 V19" stroke="#16261C" stroke-width="1.3" stroke-opacity=".55"/>' +
      '</svg>';
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = 'Belyaev DNT на страже';
    const close = document.createElement('button');
    close.className = 'x';
    close.setAttribute('aria-label', 'Закрыть');
    close.textContent = '\u00D7';
    head.appendChild(ico);
    head.appendChild(title);
    head.appendChild(close);

    // Счётчик трекеров
    const count = document.createElement('div');
    count.className = 'count';
    const cb = document.createElement('b');
    cb.textContent = String(trackerCount);
    const cs = document.createElement('span');
    cs.textContent = trackerCount === 1 ? 'трекер заблокирован на этой странице'
      : (trackerCount >= 2 && trackerCount <= 4) ? 'трекера заблокировано на этой странице'
      : 'трекеров заблокировано на этой странице';
    count.appendChild(cb);
    count.appendChild(cs);

    const sub = document.createElement('div');
    sub.className = 'sub';
    sub.textContent = HOST + ' пытался собрать данные об устройстве. ' +
      'Закрыто типов: ' + covered.length + '.';

    // Топ-5 тегов
    const tags = document.createElement('div');
    tags.className = 'tags';
    covered.slice(0, 5).forEach(i => {
      const t = document.createElement('span');
      t.className = 'tag';
      t.textContent = i[1];
      tags.appendChild(t);
    });

    // Кнопка раскрытия полного списка
    const toggle = document.createElement('button');
    toggle.className = 'toggle';
    toggle.innerHTML = '<span>Показать все типы данных</span>' +
      '<svg viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5 L6 8 L9.5 4.5" ' +
      'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" ' +
      'stroke-linejoin="round"/></svg>';

    // Полный список (все ITEMS, вкл/выкл)
    const details = document.createElement('div');
    details.className = 'details';
    ITEMS.forEach(i => {
      const on = !!profile[i[0]];
      const row = document.createElement('div');
      row.className = 'row' + (on ? '' : ' off');
      const dot = document.createElement('span');
      dot.className = 'dot';
      const rt = document.createElement('div');
      rt.className = 'rowtext';
      const rn = document.createElement('div');
      rn.className = 'rowname';
      rn.textContent = i[1];
      const rd = document.createElement('div');
      rd.className = 'rowdesc';
      rd.textContent = i[2];
      rt.appendChild(rn);
      rt.appendChild(rd);
      const rs = document.createElement('div');
      rs.className = 'rowstate';
      rs.textContent = on ? 'Закрыто' : '—';
      row.appendChild(dot);
      row.appendChild(rt);
      row.appendChild(rs);
      details.appendChild(row);
    });

    toggle.addEventListener('click', () => {
      const open = details.classList.toggle('show');
      toggle.classList.toggle('open', open);
      toggle.querySelector('span').textContent =
        open ? 'Скрыть подробности' : 'Показать все типы данных';
      clearTimeout(timer);   // не прячем карточку, пока смотрят детали
    });

    // Управление показом
    const foot = document.createElement('div');
    foot.className = 'foot';
    const sel = document.createElement('select');
    sel.className = 'mute';
    sel.setAttribute('aria-label', 'Не показывать уведомления');
    [
      ['',   'Не показывать\u2026'],
      ['1',  'Скрыть на 1 час'],
      ['3',  'Скрыть на 3 часа'],
      ['6',  'Скрыть на 6 часов'],
      ['12', 'Скрыть на 12 часов'],
      ['24', 'Скрыть на 24 часа'],
      ['0',  'Отключить совсем']
    ].forEach(o => {
      const opt = document.createElement('option');
      opt.value = o[0];
      opt.textContent = o[1];
      sel.appendChild(opt);
    });
    sel.addEventListener('change', () => {
      if (sel.value === '') return;
      chrome.runtime.sendMessage({ type: 'muteNotice', hours: Number(sel.value) },
        () => { hide(); });
    });
    foot.appendChild(sel);

    card.appendChild(head);
    card.appendChild(count);
    card.appendChild(sub);
    if (covered.length) card.appendChild(tags);
    card.appendChild(toggle);
    card.appendChild(details);
    card.appendChild(foot);

    root.appendChild(style);
    root.appendChild(card);
    document.body.appendChild(holder);

    requestAnimationFrame(() => card.classList.add('in'));

    let timer = setTimeout(hide, 12000);
    card.addEventListener('mouseenter', () => clearTimeout(timer));
    card.addEventListener('mouseleave', () => {
      if (!details.classList.contains('show')) timer = setTimeout(hide, 4000);
    });
    close.addEventListener('click', hide);

    function hide() {
      clearTimeout(timer);
      card.classList.remove('in');
      setTimeout(() => { try { holder.remove(); } catch (e) {} }, 340);
    }
  }
})();
