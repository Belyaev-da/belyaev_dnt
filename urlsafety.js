/*
 * Belyaev DNT — urlsafety.js
 * ISOLATED, document_start. Проверяет домен через background (список
 * фишинговых/вредоносных паттернов) и либо показывает лёгкий баннер с
 * вердиктом, либо — при высоком риске — полноэкранный блокирующий
 * оверлей с объяснением и выбором «Принимаю риск» / «Покинуть сайт».
 */
(function () {
  'use strict';
  if (window.top !== window.self) return;
  const host = location.hostname;
  if (!host) return;

  const SEEN_KEY = '__bdnt_url_' + host;
  let seen = false;
  try { seen = sessionStorage.getItem(SEEN_KEY) === '1'; } catch (e) {}

  const RISK_KEY = '__bdnt_risk_' + host;
  let riskAccepted = false;
  try { riskAccepted = sessionStorage.getItem(RISK_KEY) === '1'; } catch (e) {}
  if (riskAccepted) return;

  chrome.runtime.sendMessage({ type: 'checkUrlSafety', url: location.href }, (res) => {
    if (chrome.runtime.lastError || !res) return;
    if (!res.safe) {
      try { window.stop(); } catch (e) {}
      showBlock(res);
    } else if (!seen) {
      try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) {}
      onReady(() => showBanner());
    }
  });

  function onReady(fn) {
    if (document.body) fn();
    else document.addEventListener('DOMContentLoaded', fn, { once: true });
  }

  function shadowRoot(id) {
    const holder = document.createElement('div');
    holder.id = id;
    holder.style.cssText = 'all:initial;position:fixed;inset:0;z-index:2147483647;';
    return { holder, root: holder.attachShadow({ mode: 'closed' }) };
  }

  function showBanner() {
    const { holder, root } = shadowRoot('__bdnt_url_banner');
    holder.style.inset = 'auto 16px 16px auto';
    holder.style.width = '300px';
    root.innerHTML = `
      <style>
        .c{box-sizing:border-box;padding:11px 13px;border-radius:14px;
          background:rgba(22,38,28,.85);backdrop-filter:blur(14px);
          border:1px solid rgba(255,255,255,.13);color:#EAF3EC;
          font:400 12px/1.45 'Segoe UI',system-ui,sans-serif;
          box-shadow:0 6px 28px rgba(0,0,0,.28);
          opacity:0;transform:translateY(10px);transition:.3s ease}
        .c.in{opacity:1;transform:translateY(0)}
        .h{display:flex;align-items:center;gap:7px;font-weight:600;font-size:12.5px}
        .h svg{width:16px;height:16px;flex:none;color:#7FCB92}
        .t{margin-top:5px;color:rgba(234,243,236,.75);font-size:11.5px}
        .x{position:absolute;top:8px;right:10px;background:none;border:none;
          color:rgba(234,243,236,.5);font-size:15px;cursor:pointer}
      </style>
      <div class="c" style="position:relative">
        <button class="x">&times;</button>
        <div class="h"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2.6 20.2 6v6.2c0 4.3-3.4 7.6-8.2 9.2C7.2 19.8 3.8 16.5 3.8 12.2V6Z" fill="#7FCB92"/></svg>Сайт проверен</div>
        <div class="t">${host} не найден в списках фишинга и вредоносных сайтов. Это не гарантия безопасности — сохраняйте осторожность с личными данными.</div>
      </div>`;
    document.body.appendChild(holder);
    const card = root.querySelector('.c');
    requestAnimationFrame(() => card.classList.add('in'));
    const hide = () => { card.classList.remove('in'); setTimeout(() => holder.remove(), 300); };
    root.querySelector('.x').addEventListener('click', hide);
    setTimeout(hide, 8000);
  }

  function showBlock(res) {
    onReady(() => {
      const { holder, root } = shadowRoot('__bdnt_url_block');
      const reasonText = res.reason === 'known_malware'
        ? 'Домен находится в списке источников вредоносного ПО.'
        : 'Адрес похож на фишинговую подделку известного сервиса (банка, платёжной системы, соцсети).';
      root.innerHTML = `
        <style>
          .ov{position:fixed;inset:0;background:rgba(120,20,20,.93);
            backdrop-filter:blur(6px);display:flex;align-items:center;
            justify-content:center;font:400 15px/1.5 'Segoe UI',system-ui,sans-serif}
          .box{max-width:520px;margin:20px;padding:32px;border-radius:18px;
            background:rgba(20,8,8,.9);border:1px solid rgba(255,255,255,.15);
            color:#fff;text-align:center}
          .box h1{font-size:20px;margin:12px 0 8px;font-weight:700}
          .box p{color:rgba(255,255,255,.82);font-size:13.5px;margin:0 0 6px}
          .host{font-weight:700;word-break:break-all}
          .btns{display:flex;gap:10px;margin-top:22px}
          .btn{flex:1;padding:12px;border-radius:10px;border:none;
            font-size:13.5px;font-weight:600;cursor:pointer}
          .leave{background:#fff;color:#7a1414}
          .risk{background:rgba(255,255,255,.12);color:#fff;
            border:1px solid rgba(255,255,255,.3)}
        </style>
        <div class="ov"><div class="box">
          <div style="font-size:40px">&#9888;</div>
          <h1>Сайт похож на опасный</h1>
          <p>Адрес <span class="host">${host}</span> заблокирован Belyaev DNT.</p>
          <p>${reasonText}</p>
          <p>Возможные последствия перехода: кража паролей и данных карт,
             заражение устройства вредоносным ПО, потеря доступа к аккаунтам.</p>
          <div class="btns">
            <button class="btn leave" id="__bdnt_leave">Покинуть сайт</button>
            <button class="btn risk" id="__bdnt_risk">Принимаю риск</button>
          </div>
        </div></div>`;
      document.documentElement.appendChild(holder);
      root.querySelector('#__bdnt_leave').addEventListener('click', () => {
        try {
          if (history.length > 1) { history.back(); return; }
        } catch (e) {}
        chrome.runtime.sendMessage({ type: 'closeCurrentTab' });
      });
      root.querySelector('#__bdnt_risk').addEventListener('click', () => {
        try { sessionStorage.setItem(RISK_KEY, '1'); } catch (e) {}
        holder.remove();
        location.reload();
      });
    });
  }
})();
