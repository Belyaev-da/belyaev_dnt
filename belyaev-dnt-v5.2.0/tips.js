/*
 * Belyaev DNT — tips.js
 *
 * ISOLATED-мир. Показывает всплывающий совет по цифровой безопасности
 * каждые 30 минут активной работы в интернете. Советы меняются по кругу
 * в случайном порядке, не повторяя предыдущий. Карточку можно закрыть
 * или временно отключить советы (на 3 часа / на сутки / совсем).
 *
 * Тайминг держит service worker через chrome.alarms (переживает выгрузку
 * воркера). Content-script лишь спрашивает «пора ли показать совет» при
 * загрузке страницы и по внутреннему таймеру, а сам показ и выбор совета
 * приходят от воркера.
 */

(function () {
  'use strict';

  if (window.top !== window.self) return;

  function ask() {
    try {
      chrome.runtime.sendMessage({ type: 'getTip' }, (resp) => {
        if (chrome.runtime.lastError || !resp) return;
        if (resp.show && resp.tip) showTip(resp.tip);
      });
    } catch (e) {}
  }

  // Спрашиваем при загрузке и затем раз в 5 минут — воркер сам решает,
  // прошло ли 30 минут с прошлого показа.
  setTimeout(ask, 8000);
  setInterval(ask, 5 * 60 * 1000);

  function showTip(tip) {
    if (!document.body) return;
    if (document.getElementById('__bdnt_tip_holder')) return;

    const holder = document.createElement('div');
    holder.id = '__bdnt_tip_holder';
    holder.style.cssText =
      'all:initial;position:fixed;z-index:2147483647;right:16px;bottom:16px;';
    const root = holder.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = `
      :host { all: initial; }
      .card {
        width: 300px; box-sizing: border-box; padding: 13px 14px 12px;
        border-radius: 14px; background: rgba(20, 32, 44, .85);
        backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
        border: 1px solid rgba(255,255,255,.13);
        box-shadow: 0 6px 28px rgba(0,0,0,.3); color: #EAF0F6;
        font: 400 12px/1.5 'Segoe UI', system-ui, -apple-system, sans-serif;
        opacity: 0; transform: translateY(10px);
        transition: opacity .32s ease, transform .32s ease;
      }
      .card.in { opacity: 1; transform: translateY(0); }
      .head { display: flex; align-items: center; gap: 8px; margin-bottom: 7px; }
      .ico { width: 22px; height: 22px; flex: none; }
      .kicker { font-size: 10px; font-weight: 700; letter-spacing: .06em;
        text-transform: uppercase; color: #6FB3E8; flex: 1; }
      .x { width: 22px; height: 22px; flex: none; cursor: pointer; border: none;
        border-radius: 6px; background: transparent; color: rgba(234,240,246,.6);
        font-size: 15px; line-height: 1; display: grid; place-items: center; padding: 0; }
      .x:hover { background: rgba(255,255,255,.1); color: #fff; }
      .tiptitle { font-size: 13.5px; font-weight: 600; letter-spacing: -.01em; }
      .tiptext { margin-top: 4px; font-size: 12px; color: rgba(234,240,246,.82); }
      .foot { display: flex; gap: 6px; margin-top: 11px; padding-top: 9px;
        border-top: 1px solid rgba(255,255,255,.1); }
      .mute { flex: 1; height: 26px; cursor: pointer; border: 1px solid rgba(255,255,255,.16);
        border-radius: 7px; background: transparent; color: rgba(234,240,246,.82);
        font: inherit; font-size: 11px; padding: 0 6px; }
      .mute:hover { background: rgba(255,255,255,.08); }
      select.mute { appearance: none; text-align: center; }
      select.mute option { background: #14202C; color: #EAF0F6; }
    `;

    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('role', 'status');

    const head = document.createElement('div');
    head.className = 'head';
    const ico = document.createElement('div');
    ico.className = 'ico';
    ico.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<path d="M12 3 a6 6 0 0 0-3.6 10.8 c.5.4.9 1 .9 1.7 v.5 h5.4 v-.5' +
      ' c0-.7.4-1.3.9-1.7 A6 6 0 0 0 12 3 Z" fill="#6FB3E8"/>' +
      '<path d="M9.6 19.5 h4.8 M10.2 21.3 h3.6" stroke="#14202C"' +
      ' stroke-width="1.4" stroke-linecap="round"/></svg>';
    const kicker = document.createElement('div');
    kicker.className = 'kicker';
    kicker.textContent = 'Совет по безопасности';
    const close = document.createElement('button');
    close.className = 'x';
    close.setAttribute('aria-label', 'Закрыть');
    close.textContent = '\u00D7';
    head.appendChild(ico);
    head.appendChild(kicker);
    head.appendChild(close);

    const tt = document.createElement('div');
    tt.className = 'tiptitle';
    tt.textContent = tip.t;
    const tx = document.createElement('div');
    tx.className = 'tiptext';
    tx.textContent = tip.s;

    const foot = document.createElement('div');
    foot.className = 'foot';
    const sel = document.createElement('select');
    sel.className = 'mute';
    sel.setAttribute('aria-label', 'Отключить советы');
    [
      ['',   'Отложить советы\u2026'],
      ['3',  'Пауза на 3 часа'],
      ['24', 'Пауза на сутки'],
      ['0',  'Отключить советы']
    ].forEach(o => {
      const opt = document.createElement('option');
      opt.value = o[0];
      opt.textContent = o[1];
      sel.appendChild(opt);
    });
    sel.addEventListener('change', () => {
      if (sel.value === '') return;
      chrome.runtime.sendMessage({ type: 'muteTips', hours: Number(sel.value) },
        () => hide());
    });
    foot.appendChild(sel);

    card.appendChild(head);
    card.appendChild(tt);
    card.appendChild(tx);
    card.appendChild(foot);
    root.appendChild(style);
    root.appendChild(card);
    document.body.appendChild(holder);

    requestAnimationFrame(() => card.classList.add('in'));
    let timer = setTimeout(hide, 15000);
    card.addEventListener('mouseenter', () => clearTimeout(timer));
    card.addEventListener('mouseleave', () => { timer = setTimeout(hide, 4000); });
    close.addEventListener('click', hide);

    function hide() {
      clearTimeout(timer);
      card.classList.remove('in');
      setTimeout(() => { try { holder.remove(); } catch (e) {} }, 340);
    }
  }
})();
