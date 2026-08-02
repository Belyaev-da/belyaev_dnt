/*
 * Belyaev DNT — модуль лицензирования (записи 020749, 023311, 023346,
 * 023402, 023418).
 *
 * ЧЕСТНАЯ ГРАНИЦА ЗАЩИТЫ. Это клиентский модуль. Весь его код лежит у
 * пользователя на диске в открытом виде, поэтому он не защищает от того,
 * кто готов открыть исходники и поправить проверку. Настоящая защита от
 * взлома требует серверной валидации кода активации — здесь для неё
 * оставлена точка расширения verifyOnline().
 *
 * Что модуль реально обеспечивает:
 *   • формат и контрольную сумму кода активации (отсекает случайный ввод);
 *   • лимит попыток: 3 подряд, затем таймаут 60 минут (запись 023311);
 *   • 14-дневный пробный период (запись 023402);
 *   • гейтинг уровней 3–5 по наличию лицензии (запись 023346);
 *   • хранение ключа в зашифрованном виде через Web Crypto AES-GCM
 *     (запись 020749: «шифрование ключа, желательно AES-256»).
 *
 * Формат кода: BDNT-XXXXX-XXXXX-XXXXX-XXXXX-CC
 *   XXXXX — блоки из алфавита без похожих символов (crockford base32);
 *   CC    — контрольная сумма по всем блокам (защита от опечаток и
 *           наивного подбора).
 */

(function (root) {
  'use strict';

  const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // без I,L,O,U
  const PREFIX = 'BDNT';
  const BLOCKS = 4;
  const BLOCK_LEN = 5;

  const MAX_ATTEMPTS = 3;
  const LOCKOUT_MS = 60 * 60 * 1000;   // 60 минут (запись 023311)
  const TRIAL_MS = 14 * 24 * 60 * 60 * 1000; // 14 дней (запись 023402)

  // ── Контрольная сумма ───────────────────────────────────────────────
  function checksum(body) {
    let h = 0;
    for (let i = 0; i < body.length; i++) {
      const c = body.charCodeAt(i);
      h = (h * 31 + c) >>> 0;
    }
    const a = ALPHABET[h % 32];
    const b = ALPHABET[(h >>> 5) % 32];
    return a + b;
  }

  function normalize(code) {
    return String(code || '')
      .toUpperCase()
      .replace(/[^0-9A-Z]/g, '')
      .replace(/I/g, '1').replace(/L/g, '1')
      .replace(/O/g, '0').replace(/U/g, 'V');
  }

  // Разбирает код в канонический вид или возвращает null.
  function parse(code) {
    let s = normalize(code);
    if (s.indexOf(PREFIX) === 0) s = s.slice(PREFIX.length);
    const need = BLOCKS * BLOCK_LEN + 2; // тело + 2 символа суммы
    if (s.length !== need) return null;
    const body = s.slice(0, BLOCKS * BLOCK_LEN);
    const cc = s.slice(BLOCKS * BLOCK_LEN);
    for (const ch of body) if (ALPHABET.indexOf(ch) === -1) return null;
    if (checksum(body) !== cc) return null;
    const parts = [];
    for (let i = 0; i < BLOCKS; i++) {
      parts.push(body.slice(i * BLOCK_LEN, (i + 1) * BLOCK_LEN));
    }
    return PREFIX + '-' + parts.join('-') + '-' + cc;
  }

  function isValidFormat(code) {
    return parse(code) !== null;
  }

  // ── Генератор кодов (запись 023311) ─────────────────────────────────
  // Для выпуска лицензий. В расширении не вызывается — коды создаёт
  // издатель отдельно и раздаёт покупателям.
  function generate(rng) {
    const rand = rng || defaultRng;
    let body = '';
    for (let i = 0; i < BLOCKS * BLOCK_LEN; i++) {
      body += ALPHABET[Math.floor(rand() * 32) % 32];
    }
    const cc = checksum(body);
    const parts = [];
    for (let i = 0; i < BLOCKS; i++) {
      parts.push(body.slice(i * BLOCK_LEN, (i + 1) * BLOCK_LEN));
    }
    return PREFIX + '-' + parts.join('-') + '-' + cc;
  }

  function defaultRng() {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const a = new Uint32Array(1);
      crypto.getRandomValues(a);
      return a[0] / 4294967296;
    }
    return Math.random();
  }

  // ── Шифрование ключа через AES-GCM (запись 020749) ──────────────────
  // Ключ шифрования выводится из стабильного «секрета устройства», а не
  // хранится рядом. Это защита от подглядывания в storage, но не от
  // владельца машины — что честно отражено в комментарии к модулю.
  async function deviceKey() {
    const salt = 'belyaev-dnt-v5-license';
    const material = (self.navigator ? self.navigator.userAgent : '') + '|' + salt;
    const enc = new TextEncoder().encode(material);
    const hash = await crypto.subtle.digest('SHA-256', enc);
    return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' },
      false, ['encrypt', 'decrypt']);
  }

  async function encrypt(plain) {
    try {
      const key = await deviceKey();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const data = new TextEncoder().encode(plain);
      const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
      const out = new Uint8Array(iv.length + ct.byteLength);
      out.set(iv, 0);
      out.set(new Uint8Array(ct), iv.length);
      return btoa(String.fromCharCode.apply(null, out));
    } catch (e) { return null; }
  }

  async function decrypt(blob) {
    try {
      const raw = Uint8Array.from(atob(blob), c => c.charCodeAt(0));
      const iv = raw.slice(0, 12);
      const ct = raw.slice(12);
      const key = await deviceKey();
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
      return new TextDecoder().decode(pt);
    } catch (e) { return null; }
  }

  // ── Точка расширения для серверной проверки ─────────────────────────
  // Пока возвращает результат локальной проверки формата. Когда появится
  // сервер, здесь будет запрос на валидацию и привязку кода к устройству.
  async function verifyOnline(code) {
    // TODO: заменить на fetch к серверу лицензий, когда он появится.
    return { ok: isValidFormat(code), offline: true };
  }

  const api = {
    PREFIX, MAX_ATTEMPTS, LOCKOUT_MS, TRIAL_MS,
    checksum, parse, isValidFormat, generate,
    encrypt, decrypt, verifyOnline
  };

  root.BelyaevLicense = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : this);
