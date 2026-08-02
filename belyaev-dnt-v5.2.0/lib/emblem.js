/*
 * Belyaev DNT — эмблема защиты.
 *
 * Современный минималистичный щит из кирпичной кладки, прикрывающий
 * человека за компьютером. Голова и монитор видны над кромкой щита —
 * читается «щит защищает пользователя», а не «щит вместо пользователя».
 *
 * Состояния:
 *   выключено — красно-оранжевый, пульсирует (класс is-alarm)
 *   1 — светло-зелёный    3 — насыщенный зелёный
 *   2 — зелёный           4 — тёмно-зелёный, самая плотная кладка
 */

(function (root) {
  'use strict';

  const PALETTE = {
    off: { face: '#F2683C', edge: '#B33A16', mortar: '#F9A183', rim: '#C7431C' },
    '1': { face: '#7FCB92', edge: '#4E9E63', mortar: '#B6E3C0', rim: '#4E9E63' },
    '2': { face: '#4CAF6C', edge: '#2F7F49', mortar: '#8FD0A3', rim: '#2F7F49' },
    '3': { face: '#2C8B4F', edge: '#1B6234', mortar: '#6CB585', rim: '#1B6234' },
    '4': { face: '#16693A', edge: '#0A3F20', mortar: '#4A8E60', rim: '#0A3F20' },
    '5': { face: '#0E4D2A', edge: '#062E18', mortar: '#3A7350', rim: '#C9A227' }
  };

  // Щит с мягкими плечами и скруглённым остриём.
  const SHIELD =
    'M100 60 C126 60 150 68 170 80 V124 C170 154 142 178 100 192 ' +
    'C58 178 30 154 30 124 V80 C50 68 74 60 100 60 Z';

  function safeKey(v) {
    const k = String(v);
    return Object.prototype.hasOwnProperty.call(PALETTE, k) ? k : '2';
  }
  function safeId(v) {
    // Оставляем только безопасные символы и ограничиваем длину: в SVG-id
    // не должно попадать ничего из внешних строк, даже безобидного вида.
    return String(v == null ? '' : v).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 12);
  }
  function safeSize(v) {
    const n = Number(v);
    return (isFinite(n) && n > 0 && n <= 1024) ? n : 200;
  }

  function bricks(key, c) {
    const rows = key === 'off' ? 3 : 3 + Math.min(2, Number(key) - 1);
    const top = 60, bottom = 192;
    const h = (bottom - top) / rows;
    const bw = 32;
    const out = [];
    for (let r = 0; r < rows; r++) {
      const y = top + r * h;
      const dx = (r % 2) * (bw / 2);
      for (let x = 16 - bw; x < 194; x += bw) {
        out.push('<rect x="' + (x + dx).toFixed(1) + '" y="' + (y + 2).toFixed(1) +
                 '" width="' + (bw - 5) + '" height="' + (h - 4).toFixed(1) +
                 '" rx="3.5" fill="' + c.face + '"/>');
      }
    }
    return out.join('');
  }

  function build(level, opts) {
    opts = opts || {};
    const asleep = opts.asleep === true;
    const key = asleep ? 'off' : safeKey(level);
    const c = PALETTE[key];
    const size = safeSize(opts.size);
    const uid = 'b' + key + safeId(opts.uid);

    const skin  = asleep ? '#D9C3BC' : '#D6E0EE';
    const gear  = asleep ? '#E0CCC5' : '#C9D6E8';
    const glass = asleep ? '#F4EAE6' : '#EAF2FC';

    return [
'<svg viewBox="0 0 200 200" width="' + size + '" height="' + size + '"',
' xmlns="http://www.w3.org/2000/svg" role="img"',
' aria-label="Щит защиты, ' + (asleep ? 'защита выключена' : 'уровень ' + key) + '"',
' class="emblem' + (asleep ? ' is-alarm' : '') + '">',

'<defs><clipPath id="c' + uid + '"><path d="' + SHIELD + '"/></clipPath></defs>',

// человек за компьютером
'<g class="emblem__user">',
  '<rect x="67" y="56" width="66" height="45" rx="7" fill="' + gear + '"/>',
  '<rect x="73" y="62" width="54" height="33" rx="4" fill="' + glass + '"/>',
  '<rect x="94" y="101" width="12" height="7" rx="2" fill="' + gear + '"/>',
  '<rect x="82" y="108" width="36" height="5" rx="2.5" fill="' + gear + '"/>',
  '<circle cx="100" cy="33" r="18" fill="' + skin + '"/>',
  '<path d="M66 84 C66 63 81 53 100 53 C119 53 134 63 134 84 Z" fill="' + skin + '"/>',
'</g>',

// кирпичный щит
'<g class="emblem__shield">',
  '<path d="' + SHIELD + '" fill="' + c.mortar + '"/>',
  '<g clip-path="url(#c' + uid + ')">' + bricks(key, c) + '</g>',
  '<path d="M100 72 C122 72 143 79 160 89 V123 C160 148 136 168 100 180',
    ' C64 168 40 148 40 123 V89 C57 79 78 72 100 72 Z" fill="none"',
    ' stroke="' + c.edge + '" stroke-width="2.5" stroke-opacity=".4"/>',
  '<path d="' + SHIELD + '" fill="none" stroke="' + c.rim + '"',
    ' stroke-width="7" stroke-linejoin="round"/>',
'</g>',

'</svg>'
    ].join('');
  }

  const api = { build, PALETTE };
  root.BelyaevEmblem = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : this);
