/*
 * Belyaev DNT — passwordtips.js
 * ISOLATED, document_idle. При фокусе на поле пароля один раз за сессию
 * показывает компактную подсказку: требования к надёжному паролю и
 * рекомендацию не хранить пароли в браузере.
 */
(function () {
  'use strict';
  if (window.top !== window.self) return;

  const SEEN_KEY = '__bdnt_pwdtip_' + location.hostname;
  let shown = false;
  try { shown = sessionStorage.getItem(SEEN_KEY) === '1'; } catch (e) {}
  if (shown) return;

  function attach() {
    const inputs = document.querySelectorAll('input[type="password"]');
    inputs.forEach(el => {
      if (el.__bdntBound) return;
      el.__bdntBound = true;
      el.addEventListener('focus', onFocus, { once: true });
    });
  }

  function onFocus(e) {
    if (shown) return;
    shown = true;
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (err) {}
    showTip(e.target);
  }

  function showTip(input) {
    const rect = input.getBoundingClientRect();
    const holder = document.createElement('div');
    holder.style.cssText = 'all:initial;position:fixed;z-index:2147483647;' +
      'left:' + Math.max(8, rect.left) + 'px;top:' + (rect.bottom + window.scrollY < 0 ? 8 : rect.bottom + 8) + 'px;';
    const root = holder.attachShadow({ mode: 'closed' });
    root.innerHTML = `
      <style>
        .c{box-sizing:border-box;width:280px;padding:12px 13px;border-radius:12px;
          background:rgba(22,30,44,.94);backdrop-filter:blur(10px);
          border:1px solid rgba(255,255,255,.14);color:#EAF0F6;
          font:400 12px/1.5 'Segoe UI',system-ui,sans-serif;
          box-shadow:0 8px 24px rgba(0,0,0,.35);
          opacity:0;transform:translateY(-6px);transition:.25s ease}
        .c.in{opacity:1;transform:translateY(0)}
        .h{font-weight:600;font-size:12.5px;display:flex;justify-content:space-between}
        ul{margin:7px 0 0;padding-left:16px}
        li{margin-bottom:3px;color:rgba(234,240,246,.85)}
        .warn{margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.12);
          color:#F2C879;font-size:11.3px}
        .x{background:none;border:none;color:rgba(234,240,246,.5);
          cursor:pointer;font-size:14px;line-height:1}
      </style>
      <div class="c">
        <div class="h">Надёжный пароль <button class="x">&times;</button></div>
        <ul>
          <li>От 12 символов</li>
          <li>Заглавные и строчные буквы</li>
          <li>Цифры и спецсимволы (!@#$…)</li>
          <li>Свой пароль на каждый сайт</li>
        </ul>
        <div class="warn">Не сохраняйте пароль в браузере: при краже устройства
          или через вредоносное расширение его можно извлечь целиком.
          Используйте менеджер паролей — он хранит их в зашифрованном виде.</div>
      </div>`;
    document.documentElement.appendChild(holder);
    const card = root.querySelector('.c');
    requestAnimationFrame(() => card.classList.add('in'));
    const hide = () => { card.classList.remove('in'); setTimeout(() => holder.remove(), 250); };
    root.querySelector('.x').addEventListener('click', hide);
    setTimeout(hide, 12000);
  }

  attach();
  const mo = new MutationObserver(attach);
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();
