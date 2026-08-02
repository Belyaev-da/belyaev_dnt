/*
 * Belyaev DNT — engine.js  (СГЕНЕРИРОВАН из belyaev/inject.js)
 *
 * Движок подмены цифрового отпечатка. Выполняется в MAIN-мире страницы
 * на document_start — в том же контексте, что и скрипты сайта, но раньше них.
 *
 * Все профили, базовый отпечаток и пул вариаций встроены сюда. Номер уровня
 * приходит из world/levelN.js — статического файла, который service worker
 * регистрирует в том же массиве js[] непосредственно перед этим скриптом.
 * Поэтому подмена применяется СИНХРОННО, без единого асинхронного вызова.
 */

(function () {
  'use strict';

  var LEVEL = window.__BDNT_LEVEL__;
  try { delete window.__BDNT_LEVEL__; } catch (e) { window.__BDNT_LEVEL__ = undefined; }
  if (!LEVEL) return;

  var DATA = {"BASE":{"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36","platform":"Win32","productSub":"20030107","vendor":"Google Inc.","vendorSub":"","hardwareConcurrency":4,"deviceMemory":8,"maxTouchPoints":0,"language":"en-US","languages":["en-US","en"],"acceptLanguage":"en-US,en;q=0.9","screen":{"width":1920,"height":1080,"availWidth":1920,"availHeight":1040,"colorDepth":24,"pixelDepth":24,"innerWidth":1920,"innerHeight":947,"outerWidth":1920,"outerHeight":1040,"devicePixelRatio":1},"timezone":{"offsetMinutes":0,"name":"UTC","locale":"en-US"},"connection":{"downlink":10,"effectiveType":"4g","rtt":50,"saveData":false},"webgl":{"vendor":"Google Inc. (Intel)","renderer":"ANGLE (Intel, Intel(R) UHD Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)"},"fonts":["Arial","Calibri","Cambria","Consolas","Courier New","Georgia","Segoe UI","Tahoma","Times New Roman","Trebuchet MS","Verdana"],"battery":{"charging":true,"level":1,"chargingTime":0,"dischargingTime":null}},"LEVELS":{"1":{"id":"1","name":"Базовая","character":"base","short":"Мягкая защита без риска сбоев","addDNT":true,"stripHeaders":["x-forwarded-for","x-real-ip","via","forwarded"],"spoofHeaders":{},"blockAuthorization":false,"trimReferrer":true,"blockTrackers":true,"spoofUserAgent":false,"spoofNavigator":false,"spoofScreen":false,"spoofTimezone":false,"spoofHardware":false,"spoofConnection":false,"spoofPlugins":true,"spoofWebRTC":false,"spoofCanvas":false,"spoofWebGL":false,"spoofAudio":false,"spoofFonts":false,"spoofBattery":true,"spoofMedia":false,"spoofClientHints":true,"blockBeacon":true,"protectStorage":false,"reduceTimerPrecision":false,"spoofSpeech":false,"spoofGamepad":true,"spoofPointer":false,"spoofPermissions":false,"spoofStorageQuota":false,"spoofDoNotTrack":true,"licensed":false},"2":{"id":"2","name":"Уверенная","character":"glasses","short":"Рекомендуемый баланс защиты и совместимости","addDNT":true,"stripHeaders":["x-forwarded-for","x-real-ip","via","forwarded","x-requested-with"],"spoofHeaders":{"user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36","accept-language":"en-US,en;q=0.9"},"blockAuthorization":false,"trimReferrer":true,"blockTrackers":true,"spoofUserAgent":true,"spoofNavigator":true,"spoofScreen":true,"spoofTimezone":true,"spoofHardware":true,"spoofConnection":true,"spoofPlugins":true,"spoofWebRTC":false,"spoofCanvas":true,"spoofWebGL":true,"spoofAudio":false,"spoofFonts":false,"spoofBattery":true,"spoofMedia":true,"spoofClientHints":true,"blockBeacon":true,"protectStorage":false,"reduceTimerPrecision":true,"spoofSpeech":true,"spoofGamepad":true,"spoofPointer":true,"spoofPermissions":false,"spoofStorageQuota":true,"spoofDoNotTrack":true,"licensed":false},"3":{"id":"3","name":"Усиленная","character":"hat","short":"Глубокая защита отпечатка устройства","addDNT":true,"stripHeaders":["x-forwarded-for","x-real-ip","via","forwarded","x-requested-with","accept-charset"],"spoofHeaders":{"user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36","accept-language":"en-US,en;q=0.9"},"blockAuthorization":false,"trimReferrer":true,"blockTrackers":true,"spoofUserAgent":true,"spoofNavigator":true,"spoofScreen":true,"spoofTimezone":true,"spoofHardware":true,"spoofConnection":true,"spoofPlugins":true,"spoofWebRTC":true,"spoofCanvas":true,"spoofWebGL":true,"spoofAudio":true,"spoofFonts":true,"spoofBattery":true,"spoofMedia":true,"spoofClientHints":true,"blockBeacon":true,"protectStorage":true,"reduceTimerPrecision":true,"spoofSpeech":true,"spoofGamepad":true,"spoofPointer":true,"spoofPermissions":true,"spoofStorageQuota":true,"spoofDoNotTrack":true},"4":{"id":"4","name":"Максимальная","character":"cape","short":"Предельная анонимность, возможны сбои сайтов","addDNT":true,"stripHeaders":["x-forwarded-for","x-real-ip","via","forwarded","x-requested-with","accept-charset"],"spoofHeaders":{"user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36","accept-language":"en-US,en;q=0.9"},"blockAuthorization":true,"trimReferrer":true,"blockTrackers":true,"spoofUserAgent":true,"spoofNavigator":true,"spoofScreen":true,"spoofTimezone":true,"spoofHardware":true,"spoofConnection":true,"spoofPlugins":true,"spoofWebRTC":true,"spoofCanvas":true,"spoofWebGL":true,"spoofAudio":true,"spoofFonts":true,"spoofBattery":true,"spoofMedia":true,"spoofClientHints":true,"blockBeacon":true,"protectStorage":true,"reduceTimerPrecision":true,"spoofSpeech":true,"spoofGamepad":true,"spoofPointer":true,"spoofPermissions":true,"spoofStorageQuota":true,"spoofCookies":false,"spoofDoNotTrack":true,"licensed":true,"minPlan":"pro"},"5":{"id":"5","name":"Параноик","character":"fortress","short":"Максимум плюс вариативная подмена Cookie","addDNT":true,"stripHeaders":["x-forwarded-for","x-real-ip","via","forwarded","x-requested-with","accept-charset"],"spoofHeaders":{"user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36","accept-language":"en-US,en;q=0.9"},"blockAuthorization":true,"trimReferrer":true,"blockTrackers":true,"spoofUserAgent":true,"spoofNavigator":true,"spoofScreen":true,"spoofTimezone":true,"spoofHardware":true,"spoofConnection":true,"spoofPlugins":true,"spoofWebRTC":true,"spoofCanvas":true,"spoofWebGL":true,"spoofAudio":true,"spoofFonts":true,"spoofBattery":true,"spoofMedia":true,"spoofClientHints":true,"blockBeacon":true,"protectStorage":true,"reduceTimerPrecision":true,"spoofSpeech":true,"spoofGamepad":true,"spoofPointer":true,"spoofPermissions":true,"spoofStorageQuota":true,"spoofCookies":true,"spoofDoNotTrack":true,"licensed":true,"minPlan":"pro"}},"VARIATIONS":{"ua":[{"ua":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36","platform":"Win32","chUA":"\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Google Chrome\";v=\"122\"","chPlatform":"\"Windows\""},{"ua":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36","platform":"Win32","chUA":"\"Chromium\";v=\"121\", \"Not(A:Brand\";v=\"24\", \"Google Chrome\";v=\"121\"","chPlatform":"\"Windows\""},{"ua":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36","platform":"Win32","chUA":"\"Chromium\";v=\"123\", \"Not(A:Brand\";v=\"24\", \"Google Chrome\";v=\"123\"","chPlatform":"\"Windows\""},{"ua":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36","platform":"Win32","chUA":"\"Chromium\";v=\"120\", \"Not(A:Brand\";v=\"24\", \"Google Chrome\";v=\"120\"","chPlatform":"\"Windows\""},{"ua":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36","platform":"Win32","chUA":"\"Chromium\";v=\"124\", \"Not(A:Brand\";v=\"24\", \"Google Chrome\";v=\"124\"","chPlatform":"\"Windows\""},{"ua":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36","platform":"MacIntel","chUA":"\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Google Chrome\";v=\"122\"","chPlatform":"\"macOS\""},{"ua":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36","platform":"MacIntel","chUA":"\"Chromium\";v=\"121\", \"Not(A:Brand\";v=\"24\", \"Google Chrome\";v=\"121\"","chPlatform":"\"macOS\""},{"ua":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36","platform":"MacIntel","chUA":"\"Chromium\";v=\"123\", \"Not(A:Brand\";v=\"24\", \"Google Chrome\";v=\"123\"","chPlatform":"\"macOS\""},{"ua":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36","platform":"Linux x86_64","chUA":"\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Google Chrome\";v=\"122\"","chPlatform":"\"Linux\""},{"ua":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36","platform":"Linux x86_64","chUA":"\"Chromium\";v=\"121\", \"Not(A:Brand\";v=\"24\", \"Google Chrome\";v=\"121\"","chPlatform":"\"Linux\""}],"screen":[{"width":1920,"height":1080,"availHeight":1040},{"width":1536,"height":864,"availHeight":824},{"width":1440,"height":900,"availHeight":860},{"width":1366,"height":768,"availHeight":728},{"width":2560,"height":1440,"availHeight":1400},{"width":1680,"height":1050,"availHeight":1010},{"width":1600,"height":900,"availHeight":860},{"width":3840,"height":2160,"availHeight":2120}],"hardware":[{"cores":4,"mem":8},{"cores":8,"mem":8},{"cores":8,"mem":16},{"cores":6,"mem":16},{"cores":12,"mem":16},{"cores":16,"mem":32},{"cores":10,"mem":32}],"timezone":[{"name":"America/New_York","offset":300,"lang":"en-US","langs":["en-US","en"]},{"name":"America/Chicago","offset":360,"lang":"en-US","langs":["en-US","en"]},{"name":"America/Los_Angeles","offset":480,"lang":"en-US","langs":["en-US","en"]},{"name":"Europe/London","offset":0,"lang":"en-GB","langs":["en-GB","en"]},{"name":"Europe/Berlin","offset":-60,"lang":"de-DE","langs":["de-DE","de","en"]},{"name":"Europe/Paris","offset":-60,"lang":"fr-FR","langs":["fr-FR","fr","en"]},{"name":"America/Toronto","offset":300,"lang":"en-CA","langs":["en-CA","en","fr"]},{"name":"Australia/Sydney","offset":-660,"lang":"en-AU","langs":["en-AU","en"]}],"webgl":[{"vendor":"Google Inc. (Intel)","renderer":"ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)"},{"vendor":"Google Inc. (Intel)","renderer":"ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)"},{"vendor":"Google Inc. (Intel)","renderer":"ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)"},{"vendor":"Google Inc. (NVIDIA)","renderer":"ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 Direct3D11 vs_5_0 ps_5_0, D3D11)"},{"vendor":"Google Inc. (NVIDIA)","renderer":"ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)"},{"vendor":"Google Inc. (NVIDIA)","renderer":"ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Direct3D11 vs_5_0 ps_5_0, D3D11)"},{"vendor":"Google Inc. (AMD)","renderer":"ANGLE (AMD, AMD Radeon(TM) Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)"},{"vendor":"Google Inc. (AMD)","renderer":"ANGLE (AMD, AMD Radeon RX 6600 Direct3D11 vs_5_0 ps_5_0, D3D11)"}],"noise":[{"canvasBias":0.0003,"audioBias":1e-05},{"canvasBias":0.0007,"audioBias":3e-05},{"canvasBias":0.0011,"audioBias":5e-05},{"canvasBias":0.0015,"audioBias":7e-05}]}};

  var profile = DATA.LEVELS[String(LEVEL)];
  var base = JSON.parse(JSON.stringify(DATA.BASE)); // изменяемая копия под вариации
  if (!profile || !base) return;

  var SESSION = '';
  try {
    SESSION = sessionStorage.getItem('__bdnt_s') || '';
    if (!SESSION) {
      SESSION = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem('__bdnt_s', SESSION);
    }
  } catch (e) {
    SESSION = String(LEVEL);
  }

  // Прокидываем вариации в apply через CFG-совместимый объект.
  var CFG = { session: SESSION, variations: DATA.VARIATIONS };

  function apply(profile, base, CFG) {

  // ---- Детерминированный генератор -------------------------------------

  function hashStr(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  const seed = hashStr(location.hostname + '|' + (CFG.session || ''));

  // ── Вариативный выбор профиля (запись 021427) ───────────────────────
  // Детерминированно по домену выбираем один правдоподобный вариант из
  // пула, поэтому отпечаток стабилен в пределах сайта, но различается
  // между сайтами и пользователями. Это делает набор ближе к реальному
  // распределению и снижает детект «слишком чистой» маскировки.
  const V = CFG.variations;
  if (V) {
    const pick = (arr, salt) =>
      arr[hashStr(location.hostname + salt + (CFG.session || '')) % arr.length];

    if (profile.spoofUserAgent) {
      const u = pick(V.ua, '#ua');
      base.userAgent = u.ua;
      base.platform = u.platform;
      base._chUA = u.chUA;
      base._chPlatform = u.chPlatform;
    }
    if (profile.spoofScreen) {
      const s = pick(V.screen, '#scr');
      base.screen = Object.assign({}, base.screen, {
        width: s.width, height: s.height,
        availWidth: s.width, availHeight: s.availHeight,
        innerWidth: s.width, innerHeight: s.availHeight - 93,
        outerWidth: s.width, outerHeight: s.availHeight
      });
    }
    if (profile.spoofHardware) {
      const h = pick(V.hardware, '#hw');
      base.hardwareConcurrency = h.cores;
      base.deviceMemory = h.mem;
    }
    if (profile.spoofTimezone) {
      const t = pick(V.timezone, '#tz');
      base.timezone = { offsetMinutes: t.offset, name: t.name, locale: t.lang };
      base.language = t.lang;
      base.languages = t.langs;
      base.acceptLanguage = t.langs.map((l, i) =>
        i === 0 ? l : l + ';q=' + (0.9 - (i - 1) * 0.1).toFixed(1)).join(',');
    }
    if (profile.spoofWebGL) {
      const g = pick(V.webgl, '#gl');
      base.webgl = { vendor: g.vendor, renderer: g.renderer };
    }
    // Независимая ось шума: сдвигает отпечаток canvas/audio, добавляя
    // разнообразие поверх аппаратных связок (пул > 100 000 комбинаций).
    if (V.noise && V.noise.length) {
      base._noiseVariant = pick(V.noise, '#noise');
    }
  }

  function mulberry(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const rnd = mulberry(seed ^ (base._noiseVariant
    ? Math.round((base._noiseVariant.canvasBias + base._noiseVariant.audioBias) * 1e7)
    : 0));
  const noiseTable = Array.from({ length: 64 }, () => rnd());
  let noiseIdx = 0;
  const nextNoise = () => noiseTable[(noiseIdx++) % noiseTable.length];

  // ---- Утилиты переопределения -----------------------------------------

  function define(obj, prop, value) {
    try {
      Object.defineProperty(obj, prop, {
        get() { return value; },
        configurable: true,
        enumerable: true
      });
    } catch (e) {}
  }

  // Подменяет метод, сохраняя toString() — защита от детекта обёртки.
  function wrap(obj, name, factory) {
    try {
      const orig = obj[name];
      if (typeof orig !== 'function') return;
      const patched = factory(orig);
      Object.defineProperty(patched, 'name', { value: orig.name });
      Object.defineProperty(patched, 'length', { value: orig.length });
      const origToString = Function.prototype.toString;
      patched.toString = function () { return origToString.call(orig); };
      obj[name] = patched;
    } catch (e) {}
  }

  // ---- navigator --------------------------------------------------------

  if (profile.spoofNavigator || profile.spoofUserAgent) {
    if (profile.spoofUserAgent) {
      define(navigator, 'userAgent', base.userAgent);
      define(navigator, 'appVersion', base.userAgent.replace(/^Mozilla\//, ''));
    }
    define(navigator, 'platform', base.platform);
    define(navigator, 'vendor', base.vendor);
    define(navigator, 'vendorSub', base.vendorSub);
    define(navigator, 'productSub', base.productSub);
    define(navigator, 'language', base.language);
    define(navigator, 'languages', Object.freeze(base.languages.slice()));
    define(navigator, 'webdriver', false);
  }

  // Client Hints — современный канал утечки версии браузера и ОС.
  if (profile.spoofClientHints && 'userAgentData' in navigator) {
    // Версию Chrome и платформу берём из выбранного варианта UA, чтобы
    // Client Hints не противоречили строке User-Agent.
    const mVer = /Chrome\/(\d+)/.exec(base.userAgent);
    const ver = mVer ? mVer[1] : '122';
    let plat = 'Windows', platVer = '15.0.0';
    if (/Mac OS X/.test(base.userAgent)) { plat = 'macOS'; platVer = '13.5.0'; }
    else if (/Linux/.test(base.userAgent)) { plat = 'Linux'; platVer = '6.5.0'; }

    const brands = [
      { brand: 'Chromium', version: ver },
      { brand: 'Not(A:Brand', version: '24' },
      { brand: 'Google Chrome', version: ver }
    ];
    const fake = {
      brands: brands,
      mobile: false,
      platform: plat,
      getHighEntropyValues(hints) {
        const out = { brands: brands, mobile: false, platform: plat };
        (hints || []).forEach(h => {
          if (h === 'architecture') out.architecture = 'x86';
          if (h === 'bitness') out.bitness = '64';
          if (h === 'model') out.model = '';
          if (h === 'platformVersion') out.platformVersion = platVer;
          if (h === 'uaFullVersion') out.uaFullVersion = ver + '.0.0.0';
          if (h === 'fullVersionList') out.fullVersionList = brands;
        });
        return Promise.resolve(out);
      },
      toJSON() { return { brands: brands, mobile: false, platform: plat }; }
    };
    define(navigator, 'userAgentData', fake);
  }

  // ---- Аппаратные параметры --------------------------------------------

  if (profile.spoofHardware) {
    define(navigator, 'hardwareConcurrency', base.hardwareConcurrency);
    define(navigator, 'deviceMemory', base.deviceMemory);
    define(navigator, 'maxTouchPoints', base.maxTouchPoints);
  }

  // ---- Плагины и mimeTypes ---------------------------------------------

  if (profile.spoofPlugins) {
    try {
      const emptyPlugins = Object.create(PluginArray.prototype);
      Object.defineProperty(emptyPlugins, 'length', { value: 0 });
      emptyPlugins.item = () => null;
      emptyPlugins.namedItem = () => null;
      emptyPlugins.refresh = () => {};
      define(navigator, 'plugins', emptyPlugins);

      const emptyMime = Object.create(MimeTypeArray.prototype);
      Object.defineProperty(emptyMime, 'length', { value: 0 });
      emptyMime.item = () => null;
      emptyMime.namedItem = () => null;
      define(navigator, 'mimeTypes', emptyMime);
    } catch (e) {}
  }

  // ---- Экран ------------------------------------------------------------

  if (profile.spoofScreen) {
    const s = base.screen;
    define(screen, 'width', s.width);
    define(screen, 'height', s.height);
    define(screen, 'availWidth', s.availWidth);
    define(screen, 'availHeight', s.availHeight);
    define(screen, 'availLeft', 0);
    define(screen, 'availTop', 0);
    define(screen, 'colorDepth', s.colorDepth);
    define(screen, 'pixelDepth', s.pixelDepth);
    define(window, 'screenX', 0);
    define(window, 'screenY', 0);
    define(window, 'screenLeft', 0);
    define(window, 'screenTop', 0);
    define(window, 'devicePixelRatio', s.devicePixelRatio);

    try {
      if (screen.orientation) {
        define(screen.orientation, 'type', 'landscape-primary');
        define(screen.orientation, 'angle', 0);
      }
    } catch (e) {}
  }

  // ---- Часовой пояс -----------------------------------------------------

  if (profile.spoofTimezone) {
    const tz = base.timezone;

    wrap(Date.prototype, 'getTimezoneOffset', () => function () {
      return tz.offsetMinutes;
    });

    try {
      wrap(Intl.DateTimeFormat.prototype, 'resolvedOptions', orig => function () {
        const o = orig.apply(this, arguments);
        o.timeZone = tz.name;
        o.locale = tz.locale;
        return o;
      });
    } catch (e) {}

    // toString/toLocaleString раскрывают пояс текстом.
    try {
      wrap(Date.prototype, 'toString', orig => function () {
        try {
          return new Intl.DateTimeFormat('en-US', {
            weekday: 'short', month: 'short', day: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false, timeZone: tz.name, timeZoneName: 'longOffset'
          }).format(this);
        } catch (e) { return orig.apply(this, arguments); }
      });
    } catch (e) {}
  }

  // ---- Сетевое соединение ------------------------------------------------

  if (profile.spoofConnection && navigator.connection) {
    const c = base.connection;
    define(navigator.connection, 'downlink', c.downlink);
    define(navigator.connection, 'effectiveType', c.effectiveType);
    define(navigator.connection, 'rtt', c.rtt);
    define(navigator.connection, 'saveData', c.saveData);
  }

  // ---- Батарея -----------------------------------------------------------

  if (profile.spoofBattery && navigator.getBattery) {
    const b = base.battery;
    wrap(navigator, 'getBattery', () => function () {
      return Promise.resolve({
        charging: b.charging,
        level: b.level,
        chargingTime: b.chargingTime,
        dischargingTime: b.dischargingTime,
        addEventListener() {}, removeEventListener() {},
        onchargingchange: null, onlevelchange: null
      });
    });
  }

  // ---- WebRTC — утечка реального IP --------------------------------------

  if (profile.spoofWebRTC) {
    const kill = function () {
      throw new DOMException('Заблокировано Belyaev DNT', 'NotAllowedError');
    };
    try {
      ['RTCPeerConnection', 'webkitRTCPeerConnection',
       'mozRTCPeerConnection', 'RTCDataChannel'].forEach(k => {
        if (window[k]) window[k] = kill;
      });
    } catch (e) {}
  }

  // ---- Canvas ------------------------------------------------------------

  if (profile.spoofCanvas) {
    // Шум вносится один раз на изображение и стабилен в пределах домена.
    function noisifyImageData(data) {
      const step = Math.max(4, (data.length / 512) | 0) * 4;
      for (let i = 0; i < data.length; i += step) {
        const n = (nextNoise() * 3 | 0) - 1;
        data[i]     = Math.max(0, Math.min(255, data[i] + n));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
      }
    }

    try {
      wrap(HTMLCanvasElement.prototype, 'toDataURL', orig => function () {
        try {
          const ctx = this.getContext('2d');
          if (ctx && this.width && this.height) {
            const img = ctx.getImageData(0, 0, this.width, this.height);
            noisifyImageData(img.data);
            ctx.putImageData(img, 0, 0);
          }
        } catch (e) {}
        return orig.apply(this, arguments);
      });

      wrap(HTMLCanvasElement.prototype, 'toBlob', orig => function () {
        try {
          const ctx = this.getContext('2d');
          if (ctx && this.width && this.height) {
            const img = ctx.getImageData(0, 0, this.width, this.height);
            noisifyImageData(img.data);
            ctx.putImageData(img, 0, 0);
          }
        } catch (e) {}
        return orig.apply(this, arguments);
      });

      wrap(CanvasRenderingContext2D.prototype, 'getImageData', orig => function () {
        const img = orig.apply(this, arguments);
        try { noisifyImageData(img.data); } catch (e) {}
        return img;
      });

      // measureText выдаёт метрики шрифтов с точностью до микрона.
      wrap(CanvasRenderingContext2D.prototype, 'measureText', orig => function () {
        const m = orig.apply(this, arguments);
        try {
          const d = (nextNoise() - 0.5) * 0.02;
          const w = m.width + d;
          Object.defineProperty(m, 'width', { get: () => w, configurable: true });
        } catch (e) {}
        return m;
      });
    } catch (e) {}
  }

  // ---- WebGL --------------------------------------------------------------

  if (profile.spoofWebGL) {
    const G = base.webgl;
    const MAP = {
      37445: G.vendor,    // UNMASKED_VENDOR_WEBGL
      37446: G.renderer,  // UNMASKED_RENDERER_WEBGL
      7936:  'WebKit',    // VENDOR
      7937:  'WebKit WebGL' // RENDERER
    };

    ['WebGLRenderingContext', 'WebGL2RenderingContext'].forEach(ctxName => {
      const Ctx = window[ctxName];
      if (!Ctx || !Ctx.prototype) return;

      wrap(Ctx.prototype, 'getParameter', orig => function (p) {
        if (Object.prototype.hasOwnProperty.call(MAP, p)) return MAP[p];
        return orig.apply(this, arguments);
      });

      // Точные значения шейдерных лимитов тоже идентифицируют GPU.
      wrap(Ctx.prototype, 'getShaderPrecisionFormat', orig => function () {
        const r = orig.apply(this, arguments);
        if (r) {
          try {
            Object.defineProperty(r, 'precision',
              { get: () => 23, configurable: true });
            Object.defineProperty(r, 'rangeMin',
              { get: () => 127, configurable: true });
            Object.defineProperty(r, 'rangeMax',
              { get: () => 127, configurable: true });
          } catch (e) {}
        }
        return r;
      });

      // Шум в считывании пикселей WebGL-сцены.
      wrap(Ctx.prototype, 'readPixels', orig => function () {
        const r = orig.apply(this, arguments);
        try {
          const px = arguments[6];
          if (px && px.length) {
            for (let i = 0; i < px.length; i += 997) {
              px[i] = (px[i] + ((nextNoise() * 2 | 0))) & 255;
            }
          }
        } catch (e) {}
        return r;
      });
    });
  }

  // ---- AudioContext -------------------------------------------------------

  if (profile.spoofAudio) {
    try {
      if (window.AnalyserNode) {
        wrap(AnalyserNode.prototype, 'getFloatFrequencyData', orig => function (arr) {
          orig.apply(this, arguments);
          for (let i = 0; i < arr.length; i += 37) {
            arr[i] += (nextNoise() - 0.5) * 0.0008;
          }
        });
      }
      if (window.AudioBuffer) {
        wrap(AudioBuffer.prototype, 'getChannelData', orig => function () {
          const d = orig.apply(this, arguments);
          try {
            for (let i = 0; i < d.length; i += 1499) {
              d[i] += (nextNoise() - 0.5) * 1e-7;
            }
          } catch (e) {}
          return d;
        });
      }
    } catch (e) {}
  }

  // ---- Локальные шрифты ---------------------------------------------------

  if (profile.spoofFonts) {
    // document.fonts.check() — прямая проверка наличия шрифта.
    try {
      if (document.fonts && document.fonts.check) {
        const allowed = base.fonts.map(f => f.toLowerCase());
        wrap(document.fonts, 'check', orig => function (font) {
          try {
            const name = String(font).toLowerCase();
            return allowed.some(f => name.indexOf(f) !== -1);
          } catch (e) { return orig.apply(this, arguments); }
        });
      }
    } catch (e) {}

    // Замер размеров текста скрытым элементом — классический font-fingerprint.
    // Сдвигаем результат на ±1px детерминированно: набор шрифтов перестаёт
    // вычисляться точно, но вёрстка страницы не ломается.
    try {
      ['getBoundingClientRect'].forEach(m => {
        wrap(Element.prototype, m, orig => function () {
          const r = orig.apply(this, arguments);
          try {
            const d = (nextNoise() - 0.5) * 0.4;
            return new DOMRect(r.x, r.y,
              r.width ? r.width + d : r.width,
              r.height ? r.height + d : r.height);
          } catch (e) { return r; }
        });
      });
    } catch (e) {}
  }

  // ---- Медиаустройства ----------------------------------------------------

  if (profile.spoofMedia && navigator.mediaDevices) {
    try {
      wrap(navigator.mediaDevices, 'enumerateDevices', () => function () {
        return Promise.resolve([
          { deviceId: 'default', kind: 'audioinput',  label: '', groupId: 'g1' },
          { deviceId: 'default', kind: 'audiooutput', label: '', groupId: 'g1' },
          { deviceId: 'default', kind: 'videoinput',  label: '', groupId: 'g2' }
        ]);
      });
    } catch (e) {}
  }

  // ---- Синтез речи (список голосов = отпечаток ОС) ------------------------

  if (profile.spoofSpeech && window.speechSynthesis) {
    try {
      wrap(window.speechSynthesis, 'getVoices', () => function () { return []; });
    } catch (e) {}
  }

  // ---- Геймпады -----------------------------------------------------------

  if (profile.spoofGamepad && navigator.getGamepads) {
    try {
      wrap(navigator, 'getGamepads', () => function () { return []; });
    } catch (e) {}
  }

  // ---- Точность таймеров (защита от тайминг-атак) -------------------------

  if (profile.reduceTimerPrecision) {
    try {
      wrap(performance, 'now', orig => function () {
        return Math.floor(orig.call(performance) / 4) * 4;
      });
    } catch (e) {}
  }

  // ---- Permissions API ----------------------------------------------------

  if (profile.spoofPermissions && navigator.permissions) {
    try {
      wrap(navigator.permissions, 'query', orig => function (desc) {
        try {
          return Promise.resolve({
            state: 'prompt', name: (desc && desc.name) || '',
            onchange: null,
            addEventListener() {}, removeEventListener() {}
          });
        } catch (e) { return orig.apply(this, arguments); }
      });
    } catch (e) {}
  }

  // ---- Квота хранилища (объём диска идентифицирует устройство) ------------

  if (profile.spoofStorageQuota && navigator.storage && navigator.storage.estimate) {
    try {
      wrap(navigator.storage, 'estimate', () => function () {
        return Promise.resolve({ quota: 120259084288, usage: 0 });
      });
    } catch (e) {}
  }

  // ---- Указатель / тип ввода ----------------------------------------------

  if (profile.spoofPointer) {
    try {
      wrap(window, 'matchMedia', orig => function (q) {
        const r = orig.apply(this, arguments);
        try {
          const s = String(q);
          if (/pointer:\s*coarse|hover:\s*none|any-pointer:\s*coarse/.test(s)) {
            Object.defineProperty(r, 'matches', { get: () => false, configurable: true });
          }
          if (/pointer:\s*fine|hover:\s*hover/.test(s)) {
            Object.defineProperty(r, 'matches', { get: () => true, configurable: true });
          }
        } catch (e) {}
        return r;
      });
    } catch (e) {}
  }

  // ---- Изоляция долгоживущих хранилищ --------------------------------------

  if (profile.protectStorage) {
    // Ограничиваем срок жизни cookie, задаваемых через JS: метки живут сессию.
    try {
      const proto = Document.prototype;
      const d = Object.getOwnPropertyDescriptor(proto, 'cookie');
      if (d && d.set && d.get) {
        Object.defineProperty(proto, 'cookie', {
          get() { return d.get.call(this); },
          set(v) {
            try {
              let s = String(v);
              if (!/max-age|expires/i.test(s)) s += '; max-age=86400';
              else s = s.replace(/expires=[^;]+/i, 'max-age=86400')
                       .replace(/max-age=\d{7,}/i, 'max-age=86400');
              return d.set.call(this, s);
            } catch (e) { return d.set.call(this, v); }
          },
          configurable: true
        });
      }
    } catch (e) {}
  }

  // ---- Beacon (фоновая отправка телеметрии при уходе со страницы) ----------

  if (profile.blockBeacon) {
    try {
      wrap(navigator, 'sendBeacon', () => function () { return true; });
    } catch (e) {}
  }

  // ---- navigator.doNotTrack (вывод из анализа Pixelscan) ---------------
  // В отчёте Pixelscan свойство doNotTrack показывало null при включённой
  // защите: сетевой заголовок DNT уходил, а JS-свойство не подменялось.
  // Выставляем "1", согласуя JS и заголовок.
  if (profile.spoofDoNotTrack) {
    try {
      define(navigator, 'doNotTrack', '1');
      define(window, 'doNotTrack', '1');
      if (navigator.msDoNotTrack !== undefined) {
        define(navigator, 'msDoNotTrack', '1');
      }
      // Согласуем JS-свойство с сетевым заголовком Sec-GPC: 1. Без этого
      // globalPrivacyControl оставался false при отправленном заголовке —
      // BrowserLeaks и подобные ловят это рассогласование как аномалию.
      define(navigator, 'globalPrivacyControl', true);
    } catch (e) {}
  }

  // ---- Вариативная подмена аналитических Cookie (запись 021427) --------
  // Только уровень 5. Подменяем значения известных трекинговых Cookie на
  // правдоподобный шум, стабильный в пределах домена. Функциональные
  // Cookie не трогаем, чтобы не ломать вход и корзину.
  if (profile.spoofCookies) {
    try {
      const TRACK_COOKIE = /^(_ga|_gid|_gcl_|_fbp|_fbc|__utm|_ym_|amplitude|mp_|ajs_)/i;
      const proto = Document.prototype;
      const desc = Object.getOwnPropertyDescriptor(proto, 'cookie');
      if (desc && desc.get && desc.set) {
        const randId = (salt) => {
          let h = hashStr(location.hostname + salt + (CFG.session || ''));
          let s = '';
          for (let i = 0; i < 10; i++) {
            h = (h * 1103515245 + 12345) >>> 0;
            s += (h % 10);
          }
          return s;
        };
        Object.defineProperty(proto, 'cookie', {
          get() {
            const raw = desc.get.call(this);
            try {
              return raw.split('; ').map(pair => {
                const eq = pair.indexOf('=');
                if (eq < 0) return pair;
                const name = pair.slice(0, eq);
                if (TRACK_COOKIE.test(name)) return name + '=' + randId('#' + name);
                return pair;
              }).join('; ');
            } catch (e) { return raw; }
          },
          set(v) { return desc.set.call(this, v); },
          configurable: true
        });
      }
    } catch (e) {}
  }

  } // конец apply()
  // Применяем подмену немедленно, синхронно, до скриптов страницы.
  apply(profile, base, CFG);
})();
