/*
 * Belyaev DNT — профили защиты.
 *
 * Четыре уровня, каждому соответствует свой облик щита:
 *   1 — «Базовая»      : светло-зелёный щит
 *   2 — «Уверенная»    : зелёный щит
 *   3 — «Усиленная»    : насыщенный зелёный щит
 *   4 — «Максимальная» : тёмно-зелёный щит, самая плотная кладка
 */

(function (root) {
  'use strict';

  const BASE = {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    platform: 'Win32',
    productSub: '20030107',
    vendor: 'Google Inc.',
    vendorSub: '',
    hardwareConcurrency: 4,
    deviceMemory: 8,
    maxTouchPoints: 0,
    language: 'en-US',
    languages: ['en-US', 'en'],
    acceptLanguage: 'en-US,en;q=0.9',

    screen: {
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040,
      colorDepth: 24,
      pixelDepth: 24,
      innerWidth: 1920,
      innerHeight: 947,
      outerWidth: 1920,
      outerHeight: 1040,
      devicePixelRatio: 1
    },

    timezone: {
      offsetMinutes: 0,
      name: 'UTC',
      locale: 'en-US'
    },

    connection: {
      downlink: 10,
      effectiveType: '4g',
      rtt: 50,
      saveData: false
    },

    // Графический стек — один из самых устойчивых идентификаторов.
    webgl: {
      vendor: 'Google Inc. (Intel)',
      renderer: 'ANGLE (Intel, Intel(R) UHD Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)'
    },

    // Типовой набор шрифтов Windows — маскирует редкие локальные шрифты.
    fonts: [
      'Arial', 'Calibri', 'Cambria', 'Consolas', 'Courier New', 'Georgia',
      'Segoe UI', 'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana'
    ],

    battery: { charging: true, level: 1, chargingTime: 0, dischargingTime: Infinity }
  };

  const LEVELS = {
    '1': {
      id: '1',
      name: 'Базовая',
      character: 'base',
      short: 'Мягкая защита без риска сбоев',
      addDNT: true,
      stripHeaders: ['x-forwarded-for', 'x-real-ip', 'via', 'forwarded'],
      spoofHeaders: {},
      blockAuthorization: false,
      trimReferrer: true,
      blockTrackers: true,
      spoofUserAgent: false,
      spoofNavigator: false,
      spoofScreen: false,
      spoofTimezone: false,
      spoofHardware: false,
      spoofConnection: false,
      spoofPlugins: true,
      spoofWebRTC: false,
      spoofCanvas: false,
      spoofWebGL: false,
      spoofAudio: false,
      spoofFonts: false,
      spoofBattery: true,
      spoofMedia: false,
      spoofClientHints: true,
      blockBeacon: true,
      protectStorage: false,
      reduceTimerPrecision: false,
      spoofSpeech: false,
      spoofGamepad: true,
      spoofPointer: false,
      spoofPermissions: false,
      spoofStorageQuota: false
    },

    '2': {
      id: '2',
      name: 'Уверенная',
      character: 'glasses',
      short: 'Рекомендуемый баланс защиты и совместимости',
      addDNT: true,
      stripHeaders: ['x-forwarded-for', 'x-real-ip', 'via', 'forwarded', 'x-requested-with'],
      spoofHeaders: {
        'user-agent': BASE.userAgent,
        'accept-language': BASE.acceptLanguage
      },
      blockAuthorization: false,
      trimReferrer: true,
      blockTrackers: true,
      spoofUserAgent: true,
      spoofNavigator: true,
      spoofScreen: true,
      spoofTimezone: true,
      spoofHardware: true,
      spoofConnection: true,
      spoofPlugins: true,
      spoofWebRTC: false,
      spoofCanvas: true,
      spoofWebGL: true,
      spoofAudio: false,
      spoofFonts: false,
      spoofBattery: true,
      spoofMedia: true,
      spoofClientHints: true,
      blockBeacon: true,
      protectStorage: false,
      reduceTimerPrecision: true,
      spoofSpeech: true,
      spoofGamepad: true,
      spoofPointer: true,
      spoofPermissions: false,
      spoofStorageQuota: true
    },

    '3': {
      id: '3',
      name: 'Усиленная',
      character: 'hat',
      short: 'Глубокая защита отпечатка устройства',
      addDNT: true,
      stripHeaders: [
        'x-forwarded-for', 'x-real-ip', 'via', 'forwarded',
        'x-requested-with', 'accept-charset'
      ],
      spoofHeaders: {
        'user-agent': BASE.userAgent,
        'accept-language': BASE.acceptLanguage
      },
      blockAuthorization: false,
      trimReferrer: true,
      blockTrackers: true,
      spoofUserAgent: true,
      spoofNavigator: true,
      spoofScreen: true,
      spoofTimezone: true,
      spoofHardware: true,
      spoofConnection: true,
      spoofPlugins: true,
      spoofWebRTC: true,
      spoofCanvas: true,
      spoofWebGL: true,
      spoofAudio: true,
      spoofFonts: true,
      spoofBattery: true,
      spoofMedia: true,
      spoofClientHints: true,
      blockBeacon: true,
      protectStorage: true,
      reduceTimerPrecision: true,
      spoofSpeech: true,
      spoofGamepad: true,
      spoofPointer: true,
      spoofPermissions: true,
      spoofStorageQuota: true
    },

    '4': {
      id: '4',
      name: 'Максимальная',
      character: 'cape',
      short: 'Предельная анонимность, возможны сбои сайтов',
      addDNT: true,
      stripHeaders: [
        'x-forwarded-for', 'x-real-ip', 'via', 'forwarded',
        'x-requested-with', 'accept-charset'
      ],
      spoofHeaders: {
        'user-agent': BASE.userAgent,
        'accept-language': BASE.acceptLanguage
      },
      blockAuthorization: true,
      trimReferrer: true,
      blockTrackers: true,
      spoofUserAgent: true,
      spoofNavigator: true,
      spoofScreen: true,
      spoofTimezone: true,
      spoofHardware: true,
      spoofConnection: true,
      spoofPlugins: true,
      spoofWebRTC: true,
      spoofCanvas: true,
      spoofWebGL: true,
      spoofAudio: true,
      spoofFonts: true,
      spoofBattery: true,
      spoofMedia: true,
      spoofClientHints: true,
      blockBeacon: true,
      protectStorage: true,
      reduceTimerPrecision: true,
      spoofSpeech: true,
      spoofGamepad: true,
      spoofPointer: true,
      spoofPermissions: true,
      spoofStorageQuota: true,
      spoofCookies: false,
      spoofDoNotTrack: true,
      licensed: true,
      minPlan: 'pro'
    },

    '5': {
      id: '5',
      name: 'Параноик',
      character: 'fortress',
      short: 'Максимум плюс вариативная подмена Cookie',
      addDNT: true,
      stripHeaders: [
        'x-forwarded-for', 'x-real-ip', 'via', 'forwarded',
        'x-requested-with', 'accept-charset'
      ],
      spoofHeaders: {
        'user-agent': BASE.userAgent,
        'accept-language': BASE.acceptLanguage
      },
      blockAuthorization: true,
      trimReferrer: true,
      blockTrackers: true,
      spoofUserAgent: true,
      spoofNavigator: true,
      spoofScreen: true,
      spoofTimezone: true,
      spoofHardware: true,
      spoofConnection: true,
      spoofPlugins: true,
      spoofWebRTC: true,
      spoofCanvas: true,
      spoofWebGL: true,
      spoofAudio: true,
      spoofFonts: true,
      spoofBattery: true,
      spoofMedia: true,
      spoofClientHints: true,
      blockBeacon: true,
      protectStorage: true,
      reduceTimerPrecision: true,
      spoofSpeech: true,
      spoofGamepad: true,
      spoofPointer: true,
      spoofPermissions: true,
      spoofStorageQuota: true,
      spoofCookies: true,
      spoofDoNotTrack: true,
      licensed: true,
      minPlan: 'pro'
    }
  };

  // Уровни, требующие активной лицензии (запись 023346).
  const LICENSED_LEVELS = ['3', '4', '5'];

  // Добавляю флаг подмены DoNotTrack на уровни 1-2 (улучшение из анализа выше).
  LEVELS['1'].spoofDoNotTrack = true;
  LEVELS['2'].spoofDoNotTrack = true;
  LEVELS['3'].spoofDoNotTrack = true;
  LEVELS['1'].licensed = false;
  LEVELS['2'].licensed = false;

  // Домены известных трекеров и рекламных сетей.
  const TRACKER_DOMAINS = [
    'google-analytics.com', 'googletagmanager.com', 'doubleclick.net',
    'googlesyndication.com', 'googleadservices.com',
    'connect.facebook.net', 'graph.facebook.com',
    'scorecardresearch.com', 'quantserve.com', 'criteo.com', 'criteo.net',
    'outbrain.com', 'taboola.com', 'adnxs.com', 'rubiconproject.com',
    'pubmatic.com', 'openx.net', 'casalemedia.com', 'bluekai.com',
    'demdex.net', 'omtrdc.net', 'branch.io', 'segment.io', 'segment.com',
    'amplitude.com', 'mixpanel.com', 'hotjar.com', 'fullstory.com',
    'mouseflow.com', 'clarity.ms', 'inspectlet.com', 'luckyorange.com',
    'crazyegg.com', 'moatads.com', 'adsrvr.org', 'everesttech.net',
    'sitescout.com', 'yieldmo.com', 'sharethis.com', 'addthis.com', 'zedo.com'
  ];

  // ── Пул реалистичных вариаций (запись 021427) ──────────────────────
  // Набор правдоподобных, статистически распространённых значений.
  // Движок детерминированно выбирает один вариант по хешу «домен+сессия»,
  // поэтому в пределах сайта отпечаток стабилен, а между сайтами и
  // пользователями различается. Это отвечает и на вывод из анализа
  // Pixelscan: единый «слишком чистый» профиль детектируется как маскировка,
  // а вариативность делает набор ближе к реальному распределению.
  const VARIATIONS = {
    // Популярные связки браузер/ОС/версия (доли рынка примерно реальные).
    // Только актуальные версии Chrome, платформы согласованы.
    ua: [
      { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', platform: 'Win32', chUA: '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"', chPlatform: '"Windows"' },
      { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36', platform: 'Win32', chUA: '"Chromium";v="121", "Not(A:Brand";v="24", "Google Chrome";v="121"', chPlatform: '"Windows"' },
      { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36', platform: 'Win32', chUA: '"Chromium";v="123", "Not(A:Brand";v="24", "Google Chrome";v="123"', chPlatform: '"Windows"' },
      { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', platform: 'Win32', chUA: '"Chromium";v="120", "Not(A:Brand";v="24", "Google Chrome";v="120"', chPlatform: '"Windows"' },
      { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36', platform: 'Win32', chUA: '"Chromium";v="124", "Not(A:Brand";v="24", "Google Chrome";v="124"', chPlatform: '"Windows"' },
      { ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', platform: 'MacIntel', chUA: '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"', chPlatform: '"macOS"' },
      { ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36', platform: 'MacIntel', chUA: '"Chromium";v="121", "Not(A:Brand";v="24", "Google Chrome";v="121"', chPlatform: '"macOS"' },
      { ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36', platform: 'MacIntel', chUA: '"Chromium";v="123", "Not(A:Brand";v="24", "Google Chrome";v="123"', chPlatform: '"macOS"' },
      { ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', platform: 'Linux x86_64', chUA: '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"', chPlatform: '"Linux"' },
      { ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36', platform: 'Linux x86_64', chUA: '"Chromium";v="121", "Not(A:Brand";v="24", "Google Chrome";v="121"', chPlatform: '"Linux"' }
    ],
    // Типовые разрешения экрана (десктоп и ноутбуки).
    screen: [
      { width: 1920, height: 1080, availHeight: 1040 },
      { width: 1536, height: 864,  availHeight: 824 },
      { width: 1440, height: 900,  availHeight: 860 },
      { width: 1366, height: 768,  availHeight: 728 },
      { width: 2560, height: 1440, availHeight: 1400 },
      { width: 1680, height: 1050, availHeight: 1010 },
      { width: 1600, height: 900,  availHeight: 860 },
      { width: 3840, height: 2160, availHeight: 2120 }
    ],
    // Ядра и память (реалистичные связки).
    hardware: [
      { cores: 4,  mem: 8 },
      { cores: 8,  mem: 8 },
      { cores: 8,  mem: 16 },
      { cores: 6,  mem: 16 },
      { cores: 12, mem: 16 },
      { cores: 16, mem: 32 },
      { cores: 10, mem: 32 }
    ],
    // Часовые пояса (согласованы с языком).
    timezone: [
      { name: 'America/New_York', offset: 300,  lang: 'en-US', langs: ['en-US','en'] },
      { name: 'America/Chicago',  offset: 360,  lang: 'en-US', langs: ['en-US','en'] },
      { name: 'America/Los_Angeles', offset: 480, lang: 'en-US', langs: ['en-US','en'] },
      { name: 'Europe/London',    offset: 0,    lang: 'en-GB', langs: ['en-GB','en'] },
      { name: 'Europe/Berlin',    offset: -60,  lang: 'de-DE', langs: ['de-DE','de','en'] },
      { name: 'Europe/Paris',     offset: -60,  lang: 'fr-FR', langs: ['fr-FR','fr','en'] },
      { name: 'America/Toronto',  offset: 300,  lang: 'en-CA', langs: ['en-CA','en','fr'] },
      { name: 'Australia/Sydney', offset: -660, lang: 'en-AU', langs: ['en-AU','en'] }
    ],
    // GPU-связки (вендор + рендерер согласованы). На macOS — только Apple/Intel,
    // без дискретных NVIDIA, чтобы не создавать невозможных связок.
    webgl: [
      { vendor: 'Google Inc. (Intel)', renderer: 'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)' },
      { vendor: 'Google Inc. (Intel)', renderer: 'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)' },
      { vendor: 'Google Inc. (Intel)', renderer: 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)' },
      { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 Direct3D11 vs_5_0 ps_5_0, D3D11)' },
      { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)' },
      { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Direct3D11 vs_5_0 ps_5_0, D3D11)' },
      { vendor: 'Google Inc. (AMD)',    renderer: 'ANGLE (AMD, AMD Radeon(TM) Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)' },
      { vendor: 'Google Inc. (AMD)',    renderer: 'ANGLE (AMD, AMD Radeon RX 6600 Direct3D11 vs_5_0 ps_5_0, D3D11)' }
    ],
    // Вариант «характера» шума canvas/audio — независимая ось энтропии.
    // Не меняет железо, но сдвигает детерминированный отпечаток, добавляя
    // реальное разнообразие поверх аппаратных связок.
    noise: [
      { canvasBias: 0.0003, audioBias: 0.00001 },
      { canvasBias: 0.0007, audioBias: 0.00003 },
      { canvasBias: 0.0011, audioBias: 0.00005 },
      { canvasBias: 0.0015, audioBias: 0.00007 }
    ]
  };

  // ── Справочник угроз для информационных уведомлений (запись 021400) ──
  // Что злоумышленник или трекер может сделать, получив данные каждого типа.
  const THREATS = {
    cookies: {
      title: 'Cookie',
      risk: 'Файлы Cookie позволяют связать ваши визиты в один профиль и ' +
            'отслеживать поведение между сайтами. Похищенные сессионные ' +
            'Cookie дают войти в ваш аккаунт без пароля.'
    },
    fingerprint: {
      title: 'Цифровой отпечаток',
      risk: 'Уникальный набор параметров браузера опознаёт вас даже без ' +
            'Cookie и в режиме инкогнито. Рекламные сети строят по нему ' +
            'профиль интересов и перепродают его.'
    },
    dnt: {
      title: 'Do Not Track',
      risk: 'Без сигнала DNT сайты по умолчанию считают отслеживание ' +
            'разрешённым. Ваши переходы попадают в аналитику третьих сторон.'
    },
    webrtc: {
      title: 'WebRTC',
      risk: 'WebRTC способен раскрыть ваш настоящий IP-адрес в обход VPN и ' +
            'прокси, выдав реальное местоположение и провайдера.'
    },
    ip: {
      title: 'IP-адрес',
      risk: 'По IP определяются город, провайдер и примерное местоположение. ' +
            'IP используют для блокировок, ценовой дискриминации и деанонимизации.'
    }
  };

  // ── Советы по безопасности (запись 021256) ──────────────────────────
  const TIPS = [
    { t: 'Пароли', s: 'Используйте менеджер паролей и уникальный пароль на каждый сайт. Один и тот же пароль — одна утечка компрометирует все аккаунты.' },
    { t: 'Двухфакторная аутентификация', s: 'Включите 2FA везде, где есть. Даже подобранный пароль без второго фактора бесполезен.' },
    { t: 'Проверка сайтов', s: 'Перед вводом данных проверьте адрес: опечатки в домене и отсутствие HTTPS — признак фишинга.' },
    { t: 'Обновления', s: 'Держите браузер и ОС обновлёнными. Большинство взломов используют уже закрытые уязвимости.' },
    { t: 'Публичный Wi-Fi', s: 'В открытых сетях пользуйтесь VPN: трафик без шифрования виден любому в той же сети.' },
    { t: 'Вложения', s: 'Не открывайте вложения и ссылки из неожиданных писем, даже если отправитель кажется знакомым.' },
    { t: 'Резервные копии', s: 'Делайте бэкапы важных данных. Это защита от шифровальщиков и отказа диска.' },
    { t: 'Права расширений', s: 'Периодически проверяйте, какие расширения установлены и какие права запросили. Удаляйте ненужные.' },
    { t: 'Финансы онлайн', s: 'Для банковских операций заведите отдельный браузерный профиль без лишних расширений.' },
    { t: 'Фишинг по телефону', s: 'Банк и госслужбы не спрашивают коды из SMS и CVV. Просят — это мошенник.' }
  ];

  const api = {
    BASE,
    LEVELS,
    TRACKER_DOMAINS,
    VARIATIONS,
    THREATS,
    TIPS,
    LICENSED_LEVELS,
    DEFAULT_LEVEL: '2',
    isLicensed(levelId) {
      return LICENSED_LEVELS.indexOf(String(levelId)) !== -1;
    },
    get(levelId) {
      return LEVELS[String(levelId)] || LEVELS[api.DEFAULT_LEVEL];
    },
    list() {
      return ['1', '2', '3', '4', '5'].map(id => LEVELS[id]);
    }
  };

  root.BelyaevProfiles = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : this);
