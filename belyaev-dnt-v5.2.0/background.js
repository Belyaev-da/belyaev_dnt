/*
 * Belyaev DNT — фоновый service worker (Manifest V3).
 *
 * Главная задача: держать зарегистрированным нужный набор MAIN-скриптов.
 * Когда защита включена на уровне N, регистрируется пара
 * [world/levelN.js, engine.js] — оба на document_start в MAIN-мире.
 * Когда выключена — регистрация снимается целиком, и на страницах
 * не выполняется ничего.
 *
 * Такой подход исключает гонку: движок получает уровень синхронно,
 * из скрипта, выполненного строкой выше, а не ждёт ответа по асинхронному
 * каналу, пока страница уже снимает отпечаток.
 */

importScripts('lib/profiles.js', 'lib/license.js');

const P = self.BelyaevProfiles;
const L = self.BelyaevLicense;

// Перемешивание индексов советов (Fisher–Yates) для показа без повторов.
function shuffleTips(n) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SCRIPT_ID  = 'bdnt-engine';
const MATCHES    = ['http://*/*', 'https://*/*', 'file://*/*'];

const RULE_HEADERS  = 1;
const RULE_REFERRER = 2;
const RULE_TRACKERS = 100;

// ---- Лицензия и пробный период ------------------------------------------

// Возвращает { active, trial, daysLeft, reason } — текущий статус доступа.
async function getLicenseStatus() {
  const now = Date.now();
  const {
    licenseKeyEnc, licenseActivatedAt, licenseExpiresAt, installedAt
  } = await chrome.storage.local.get(
    ['licenseKeyEnc', 'licenseActivatedAt', 'licenseExpiresAt', 'installedAt']);

  // Активная лицензия: есть ключ, формат корректен, срок не истёк.
  if (licenseKeyEnc) {
    const code = await L.decrypt(licenseKeyEnc);
    if (code && L.isValidFormat(code)) {
      const start = licenseActivatedAt || now;
      const end = licenseExpiresAt || (start + 365 * 24 * 3600 * 1000); // год по умолчанию

      if (now > end) {
        // Лицензия истекла — понижаем до бесплатных уровней.
        return {
          active: false, trial: false, reason: 'license_expired',
          daysLeft: 0,
          startDate: new Date(start).toISOString().slice(0, 10),
          endDate: new Date(end).toISOString().slice(0, 10)
        };
      }

      const daysLeft = Math.ceil((end - now) / (24 * 3600 * 1000));
      return {
        active: true, trial: false, reason: 'licensed',
        daysLeft,
        startDate: new Date(start).toISOString().slice(0, 10),
        endDate: new Date(end).toISOString().slice(0, 10)
      };
    }
  }

  // Пробный период 14 дней от первой установки.
  const start = installedAt || now;
  const elapsed = now - start;
  if (elapsed < L.TRIAL_MS) {
    const daysLeft = Math.ceil((L.TRIAL_MS - elapsed) / (24 * 3600 * 1000));
    return { active: true, trial: true, daysLeft, reason: 'trial' };
  }

  return { active: false, trial: true, daysLeft: 0, reason: 'expired' };
}

// ---- Состояние ----------------------------------------------------------

async function getState() {
  const { isOn = false, level = P.DEFAULT_LEVEL } =
    await chrome.storage.local.get(['isOn', 'level']);
  let lv = P.LEVELS[String(level)] ? String(level) : P.DEFAULT_LEVEL;

  // Гейтинг уровней 3–5 по лицензии (запись 023346). Без активного
  // доступа лицензионный уровень мягко понижается до максимального
  // бесплатного (2), а защита при этом остаётся включённой.
  const lic = await getLicenseStatus();
  if (!lic.active && P.isLicensed(lv)) {
    lv = '2';
  }

  return {
    isOn: isOn === true,
    level: lv,
    requestedLevel: P.LEVELS[String(level)] ? String(level) : P.DEFAULT_LEVEL,
    license: lic
  };
}

// ---- Регистрация MAIN-скриптов -------------------------------------------

async function unregister() {
  try {
    const all = await chrome.scripting.getRegisteredContentScripts();
    const ids = all.filter(s => s.id.startsWith('bdnt-')).map(s => s.id);
    if (ids.length) await chrome.scripting.unregisterContentScripts({ ids });
  } catch (e) {}
}

async function registerScripts() {
  const { isOn, level } = await getState();

  await unregister();
  if (!isOn) return;

  // Собираем per-site правила: whitelist (= 'off') + siteRules.
  const { whitelist = [], siteRules = {} } = await chrome.storage.local.get(
    ['whitelist', 'siteRules']);

  // Сливаем whitelist в siteRules как 'off'.
  const rules = Object.assign({}, siteRules);
  whitelist.forEach(d => {
    const clean = String(d).trim().toLowerCase()
      .replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (clean && !rules[clean]) rules[clean] = 'off';
  });

  // excludeMatches для дефолтной регистрации: все домены с кастомными правилами.
  const excludeMatches = [];
  const siteScripts = [];
  Object.entries(rules).forEach(([domain, lv], i) => {
    const clean = domain.trim().toLowerCase();
    if (!clean) return;
    excludeMatches.push('*://' + clean + '/*');
    excludeMatches.push('*://*.' + clean + '/*');
    if (lv === 'off') return; // просто исключён, без замены уровня.
    const safeLv = P.LEVELS[String(lv)] ? String(lv) : level;
    siteScripts.push({
      id: 'bdnt-site-' + i,
      js: ['world/level' + safeLv + '.js', 'engine.js'],
      matches: ['*://' + clean + '/*', '*://*.' + clean + '/*'],
      runAt: 'document_start', allFrames: true,
      matchOriginAsFallback: true, world: 'MAIN',
      persistAcrossSessions: true
    });
  });

  try {
    const scripts = [];
    // Дефолтная регистрация (все домены кроме кастомных).
    const def = {
      id: SCRIPT_ID,
      js: ['world/level' + level + '.js', 'engine.js'],
      matches: MATCHES,
      runAt: 'document_start', allFrames: true,
      matchOriginAsFallback: true, world: 'MAIN',
      persistAcrossSessions: true
    };
    if (excludeMatches.length) def.excludeMatches = excludeMatches;
    scripts.push(def);
    // Отдельные регистрации для доменов с кастомным уровнем.
    scripts.push(...siteScripts);
    await chrome.scripting.registerContentScripts(scripts);
  } catch (e) {
    console.error('Belyaev DNT: не удалось зарегистрировать скрипты', e);
  }
}

// ---- Правила declarativeNetRequest ----------------------------------------

const ALL_TYPES = [
  'main_frame', 'sub_frame', 'stylesheet', 'script', 'image', 'font',
  'object', 'xmlhttprequest', 'ping', 'csp_report', 'media',
  'websocket', 'other'
];

function buildRules(profile, whitelist) {
  const rules = [];
  const requestHeaders = [];
  // Домены-исключения: на них не трогаем заголовки и не блокируем трекеры.
  const excluded = (whitelist || [])
    .map(d => String(d).trim().toLowerCase()
      .replace(/^https?:\/\//, '').replace(/\/.*$/, ''))
    .filter(Boolean);
  const exCond = excluded.length ? { excludedInitiatorDomains: excluded } : {};

  if (profile.addDNT) {
    requestHeaders.push({ header: 'DNT', operation: 'set', value: '1' });
    requestHeaders.push({ header: 'Sec-GPC', operation: 'set', value: '1' });
  }

  for (const [name, value] of Object.entries(profile.spoofHeaders || {})) {
    requestHeaders.push({ header: name, operation: 'set', value });
  }

  if (profile.spoofClientHints && profile.spoofUserAgent) {
    requestHeaders.push({
      header: 'Sec-CH-UA', operation: 'set',
      value: '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"'
    });
    requestHeaders.push({ header: 'Sec-CH-UA-Mobile', operation: 'set', value: '?0' });
    requestHeaders.push({ header: 'Sec-CH-UA-Platform', operation: 'set', value: '"Windows"' });
    ['Sec-CH-UA-Platform-Version', 'Sec-CH-UA-Full-Version-List',
     'Sec-CH-UA-Full-Version', 'Sec-CH-UA-Arch', 'Sec-CH-UA-Model',
     'Sec-CH-UA-Bitness'].forEach(h => {
      requestHeaders.push({ header: h, operation: 'remove' });
    });
  }

  for (const name of profile.stripHeaders || []) {
    requestHeaders.push({ header: name, operation: 'remove' });
  }

  if (profile.blockAuthorization) {
    requestHeaders.push({ header: 'Authorization', operation: 'remove' });
  }

  if (requestHeaders.length) {
    rules.push({
      id: RULE_HEADERS,
      priority: 1,
      action: { type: 'modifyHeaders', requestHeaders },
      condition: Object.assign({ urlFilter: '*', resourceTypes: ALL_TYPES }, exCond)
    });
  }

  if (profile.trimReferrer) {
    rules.push({
      id: RULE_REFERRER,
      priority: 2,
      action: {
        type: 'modifyHeaders',
        requestHeaders: [{ header: 'Referer', operation: 'remove' }]
      },
      condition: Object.assign({
        urlFilter: '*',
        domainType: 'thirdParty',
        resourceTypes: ALL_TYPES
      }, exCond)
    });
  }

  if (profile.blockTrackers) {
    P.TRACKER_DOMAINS.forEach((domain, i) => {
      rules.push({
        id: RULE_TRACKERS + i,
        priority: 3,
        action: { type: 'block' },
        condition: Object.assign({
          urlFilter: '||' + domain,
          resourceTypes: ['script', 'xmlhttprequest', 'image', 'ping',
                          'sub_frame', 'websocket', 'media', 'other']
        }, exCond)
      });
    });
  }

  return rules;
}

async function applyRules() {
  const { isOn, level } = await getState();
  const { whitelist = [] } = await chrome.storage.local.get('whitelist');
  try {
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existing.map(r => r.id);
    const addRules = isOn ? buildRules(P.get(level), whitelist) : [];
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules });
  } catch (e) {
    console.error('Belyaev DNT: не удалось применить правила', e);
  }
  updateBadge(isOn, level);
}

// ---- Значок ---------------------------------------------------------------

const BADGE_COLOR = {
  '1': '#7FCB92', '2': '#4CAF6C', '3': '#2C8B4F', '4': '#16693A', '5': '#0E4D2A'
};

function updateBadge(isOn, level) {
  try {
    chrome.action.setBadgeText({ text: isOn ? String(level) : '!' });
    chrome.action.setBadgeBackgroundColor({
      color: isOn ? (BADGE_COLOR[level] || '#4CAF6C') : '#E4572E'
    });
    chrome.action.setTitle({
      title: isOn
        ? 'Belyaev DNT — защита включена (уровень ' + level + ')'
        : 'Belyaev DNT — защита выключена'
    });
  } catch (e) {}
}

// ---- Учёт собранных данных и заблокированных запросов ---------------------

// Что именно каждый механизм отдаёт сайту — для уведомления пользователя.
const pageStats = new Map();   // tabId -> { host, trackers, requested }

function bump(tabId, host, kind) {
  if (typeof tabId !== 'number' || tabId < 0) return;
  let s = pageStats.get(tabId);
  if (!s || s.host !== host) {
    s = { host, trackers: 0, requested: 0 };
    pageStats.set(tabId, s);
  }
  if (kind === 'tracker') s.trackers++;
  else s.requested++;
}

if (chrome.declarativeNetRequest.onRuleMatchedDebug) {
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(info => {
    if (!info.rule || !info.request) return;
    if (info.rule.ruleId >= RULE_TRACKERS) {
      let host = '';
      try { host = new URL(info.request.initiator || info.request.url).hostname; }
      catch (e) {}
      bump(info.request.tabId, host, 'tracker');
      pending++;
      scheduleFlush();
    }
  });
}

let pending = 0;
let flushTimer = null;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(async () => {
    flushTimer = null;
    if (!pending) return;
    const add = pending;
    pending = 0;
    try {
      const { blockedCount = 0 } = await chrome.storage.local.get('blockedCount');
      await chrome.storage.local.set({ blockedCount: blockedCount + add });
    } catch (e) {}
  }, 3000);
}

chrome.tabs.onRemoved.addListener(tabId => pageStats.delete(tabId));

// ---- Обмен с контент-скриптом уведомления --------------------------------

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg) return;

  if (msg.type === 'getNoticeState') {
    (async () => {
      const { isOn, level } = await getState();
      const { noticeMutedUntil = 0, noticeDisabled = false } =
        await chrome.storage.local.get(['noticeMutedUntil', 'noticeDisabled']);
      const tabId = sender.tab ? sender.tab.id : -1;
      const s = pageStats.get(tabId) || { trackers: 0 };
      sendResponse({
        isOn,
        level,
        profile: P.get(level),
        threats: P.THREATS,
        trackerDomains: P.TRACKER_DOMAINS,
        muted: noticeDisabled || Date.now() < noticeMutedUntil,
        trackers: s.trackers
      });
    })();
    return true;
  }

  // Content-script сообщает, сколько трекеров он насчитал на странице
  // через PerformanceObserver. Это работает у всех пользователей, в отличие
  // от onRuleMatchedDebug, доступного только распакованным расширениям.
  if (msg.type === 'reportBlocked') {
    (async () => {
      const n = Number(msg.count) || 0;
      if (n > 0) {
        const { blockedCount = 0 } = await chrome.storage.local.get('blockedCount');
        await chrome.storage.local.set({ blockedCount: blockedCount + n });
      }
      sendResponse({ ok: true });
    })();
    return true;
  }

  if (msg.type === 'muteNotice') {
    (async () => {
      if (msg.hours === 0) {
        await chrome.storage.local.set({ noticeDisabled: true });
      } else {
        await chrome.storage.local.set({
          noticeMutedUntil: Date.now() + Number(msg.hours) * 3600 * 1000
        });
      }
      sendResponse({ ok: true });
    })();
    return true;
  }

  // Статус лицензии для попапа.
  if (msg.type === 'getLicense') {
    (async () => {
      const lic = await getLicenseStatus();
      const { licenseAttempts = 0, licenseLockUntil = 0 } =
        await chrome.storage.local.get(['licenseAttempts', 'licenseLockUntil']);
      const now = Date.now();
      sendResponse({
        active: lic.active,
        trial: lic.trial,
        daysLeft: lic.daysLeft,
        reason: lic.reason,
        locked: now < licenseLockUntil,
        lockLeftMin: now < licenseLockUntil
          ? Math.ceil((licenseLockUntil - now) / 60000) : 0,
        attemptsLeft: Math.max(0, L.MAX_ATTEMPTS - licenseAttempts)
      });
    })();
    return true;
  }

  // Активация кода с лимитом попыток (записи 023311, 023402).
  if (msg.type === 'activateLicense') {
    (async () => {
      const now = Date.now();
      const st = await chrome.storage.local.get(
        ['licenseAttempts', 'licenseLockUntil']);
      let attempts = st.licenseAttempts || 0;
      const lockUntil = st.licenseLockUntil || 0;

      // Действует таймаут после исчерпания попыток.
      if (now < lockUntil) {
        sendResponse({
          ok: false, locked: true,
          lockLeftMin: Math.ceil((lockUntil - now) / 60000)
        });
        return;
      }

      const code = String(msg.code || '');

      // Локальная проверка + точка серверной валидации.
      const res = await L.verifyOnline(code);
      if (res.ok) {
        const enc = await L.encrypt(L.parse(code));
        // Срок: из подписанного кода (res.exp) или год по умолчанию.
        const defaultExpiry = now + 365 * 24 * 3600 * 1000;
        const expiresAt = (res.exp && res.exp * 1000 > now) ? res.exp * 1000 : defaultExpiry;
        await chrome.storage.local.set({
          licenseKeyEnc: enc,
          licenseActivatedAt: now,
          licenseExpiresAt: expiresAt,
          licenseAttempts: 0,
          licenseLockUntil: 0
        });
        registerScripts();
        applyRules();
        setupExpiryAlarm();
        sendResponse({
          ok: true,
          expiresAt: new Date(expiresAt).toISOString().slice(0, 10)
        });
        return;
      }

      // Неверный код — списываем попытку.
      attempts += 1;
      const patch = { licenseAttempts: attempts };
      let locked = false, lockLeftMin = 0;
      if (attempts >= L.MAX_ATTEMPTS) {
        patch.licenseLockUntil = now + L.LOCKOUT_MS;
        patch.licenseAttempts = 0;      // сброс счётчика, отсчёт таймаута пошёл
        locked = true;
        lockLeftMin = Math.ceil(L.LOCKOUT_MS / 60000);
      }
      await chrome.storage.local.set(patch);
      sendResponse({
        ok: false, locked, lockLeftMin,
        attemptsLeft: Math.max(0, L.MAX_ATTEMPTS - attempts)
      });
    })();
    return true;
  }

  // Сброс лицензии (для теста и смены ключа).
  if (msg.type === 'clearLicense') {
    (async () => {
      await chrome.storage.local.remove(['licenseKeyEnc', 'licenseActivatedAt']);
      registerScripts();
      applyRules();
      sendResponse({ ok: true });
    })();
    return true;
  }

  // Справочник угроз и советы для уведомлений (записи 021400, 021256).
  if (msg.type === 'getReference') {
    sendResponse({ threats: P.THREATS, tips: P.TIPS });
    return true;
  }

  // ── Управление списком исключений (whitelist) ───────────────────────
  // На этих доменах защита не применяется — чтобы не ломать работу сайтов.
  if (msg.type === 'getWhitelist') {
    (async () => {
      const { whitelist = [] } = await chrome.storage.local.get('whitelist');
      sendResponse({ whitelist });
    })();
    return true;
  }

  if (msg.type === 'addWhitelist') {
    (async () => {
      const domain = String(msg.domain || '').trim().toLowerCase()
        .replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      if (!domain) { sendResponse({ ok: false }); return; }
      const { whitelist = [] } = await chrome.storage.local.get('whitelist');
      if (!whitelist.includes(domain)) {
        whitelist.push(domain);
        await chrome.storage.local.set({ whitelist });
      }
      sendResponse({ ok: true, whitelist });
    })();
    return true;
  }

  if (msg.type === 'removeWhitelist') {
    (async () => {
      const domain = String(msg.domain || '').trim().toLowerCase();
      const { whitelist = [] } = await chrome.storage.local.get('whitelist');
      const next = whitelist.filter(d => d !== domain);
      await chrome.storage.local.set({ whitelist: next });
      sendResponse({ ok: true, whitelist: next });
    })();
    return true;
  }

  // Проверка, входит ли домен активной вкладки в исключения (для попапа).
  if (msg.type === 'checkCurrentSite') {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        let host = '';
        if (tab && tab.url) {
          try { host = new URL(tab.url).hostname.replace(/^www\./, ''); } catch (e) {}
        }
        const { whitelist = [], siteRules = {} } = await chrome.storage.local.get(
          ['whitelist', 'siteRules']);
        const excluded = whitelist.some(d => host === d || host.endsWith('.' + d));
        const siteLevel = siteRules[host] || null; // null = дефолт
        sendResponse({ host, excluded, siteLevel });
      } catch (e) {
        sendResponse({ host: '', excluded: false, siteLevel: null });
      }
    })();
    return true;
  }

  // Установить уровень для конкретного сайта.
  if (msg.type === 'setSiteRule') {
    (async () => {
      const domain = String(msg.domain || '').trim().toLowerCase()
        .replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      if (!domain) { sendResponse({ ok: false }); return; }
      const { siteRules = {} } = await chrome.storage.local.get('siteRules');
      const level = String(msg.level || '');
      if (level === '' || level === 'default') {
        delete siteRules[domain];  // вернуть к дефолту
      } else {
        siteRules[domain] = level; // 'off', '1'..'5'
      }
      await chrome.storage.local.set({ siteRules });
      // Если 'off' — также добавить в whitelist для совместимости.
      const { whitelist = [] } = await chrome.storage.local.get('whitelist');
      if (level === 'off' && !whitelist.includes(domain)) {
        whitelist.push(domain);
        await chrome.storage.local.set({ whitelist });
      } else if (level !== 'off') {
        const next = whitelist.filter(d => d !== domain);
        if (next.length !== whitelist.length) await chrome.storage.local.set({ whitelist: next });
      }
      sendResponse({ ok: true, siteRules });
    })();
    return true;
  }

  // Получить все per-site правила.
  if (msg.type === 'getSiteRules') {
    (async () => {
      const { siteRules = {} } = await chrome.storage.local.get('siteRules');
      sendResponse({ siteRules });
    })();
    return true;
  }

  // ── Проверка URL-безопасности ──────────────────────────────────────
  // Встроенный список известных фишинговых и вредоносных паттернов.
  // Это НЕ антивирус — это проверка репутации домена по локальному списку.
  // Для полноценной проверки нужна интеграция с API (VirusTotal,
  // Google Safe Browsing) — точка расширения checkUrlOnline() ниже.
  if (msg.type === 'checkUrlSafety') {
    (async () => {
      const url = String(msg.url || '');
      let host = '';
      try { host = new URL(url).hostname.toLowerCase(); } catch (e) {}
      if (!host) { sendResponse({ safe: true }); return; }
      const result = checkUrlLocal(host);
      // Точка расширения: когда появится API-ключ, здесь будет запрос.
      // const online = await checkUrlOnline(url);
      sendResponse(result);
    })();
    return true;
  }

  // Всплывающие советы каждые 30 минут. Воркер решает, пора ли показать,
  // и выдаёт следующий совет по кругу в перемешанном порядке.
  if (msg.type === 'getTip') {
    (async () => {
      const now = Date.now();
      const {
        tipsDisabled = false, tipsMutedUntil = 0,
        tipsLastShown = 0, tipsOrder = null, tipsPos = 0
      } = await chrome.storage.local.get([
        'tipsDisabled', 'tipsMutedUntil', 'tipsLastShown', 'tipsOrder', 'tipsPos'
      ]);

      if (tipsDisabled || now < tipsMutedUntil) {
        sendResponse({ show: false });
        return;
      }
      // 30 минут с прошлого показа.
      if (now - tipsLastShown < 30 * 60 * 1000) {
        sendResponse({ show: false });
        return;
      }

      // Перемешанный порядок советов; когда кончился — мешаем заново.
      let order = tipsOrder, pos = tipsPos;
      if (!order || !order.length || pos >= order.length) {
        order = shuffleTips(P.TIPS.length);
        pos = 0;
      }
      const tip = P.TIPS[order[pos]];

      await chrome.storage.local.set({
        tipsLastShown: now, tipsOrder: order, tipsPos: pos + 1
      });
      sendResponse({ show: true, tip });
    })();
    return true;
  }

  if (msg.type === 'muteTips') {
    (async () => {
      if (msg.hours === 0) {
        await chrome.storage.local.set({ tipsDisabled: true });
      } else {
        await chrome.storage.local.set({
          tipsMutedUntil: Date.now() + Number(msg.hours) * 3600 * 1000
        });
      }
      sendResponse({ ok: true });
    })();
    return true;
  }
});

// ---- Инициализация ---------------------------------------------------------

// ── Локальная проверка безопасности URL ───────────────────────────────
// Паттерны известных фишинговых и вредоносных доменов. Не заменяет
// антивирус, но ловит типовые угрозы: фишинг банков, подделки соцсетей,
// криптоскам. Список расширяется при обновлении плагина.
const UNSAFE_PATTERNS = [
  // Типичные фишинговые паттерны
  /^(login|secure|verify|update|account|banking)\..+\.(tk|ml|ga|cf|gq|buzz)$/,
  /paypal.*\.(ru|cn|tk|ml|ga|xyz)/,
  /apple.*id.*\.(tk|ml|ga|xyz|buzz)/,
  /microsoft.*login.*\.(tk|ml|ga|xyz)/,
  /google.*verify.*\.(tk|ml|xyz)/,
  // Криптоскам
  /free.?bitcoin|crypto.?give.?away|elon.?musk.?crypto/i,
  // Кейлоггеры и RAT
  /\.(exe|scr|bat|cmd|vbs)\./,
];

// Известные вредоносные домены (компактный набор; в продакшене — внешний список).
const UNSAFE_DOMAINS = new Set([
  'malware-traffic-analysis.net', 'urlhaus.abuse.ch',
  // Тестовые домены EICAR для проверки
  'amtso.org', 'wicar.org',
]);

function checkUrlLocal(host) {
  if (UNSAFE_DOMAINS.has(host)) {
    return { safe: false, reason: 'known_malware', host };
  }
  for (const pat of UNSAFE_PATTERNS) {
    if (pat.test(host)) {
      return { safe: false, reason: 'phishing_pattern', host, pattern: pat.source };
    }
  }
  return { safe: true, host };
}

// Точка расширения для API-проверки (Google Safe Browsing, VirusTotal).
// Когда появится API-ключ, раскомментировать и подставить.
// async function checkUrlOnline(url) {
//   const API_KEY = 'YOUR_KEY';
//   const resp = await fetch('https://safebrowsing.googleapis.com/v4/threatMatches:find?key=' + API_KEY, {
//     method: 'POST', body: JSON.stringify({
//       client: { clientId: 'belyaev-dnt', clientVersion: '5.2.0' },
//       threatInfo: { threatTypes: ['MALWARE','SOCIAL_ENGINEERING','UNWANTED_SOFTWARE'],
//                     platformTypes: ['ANY_PLATFORM'], threatEntryTypes: ['URL'],
//                     threatEntries: [{ url }] }
//     })
//   });
//   const data = await resp.json();
//   return { safe: !data.matches, matches: data.matches || [] };
// }

async function init() {
  const cur = await chrome.storage.local.get(['isOn', 'level', 'installedAt']);
  const patch = {};
  if (cur.isOn === undefined) patch.isOn = false;
  if (cur.level === undefined) patch.level = P.DEFAULT_LEVEL;
  if (cur.installedAt === undefined) patch.installedAt = Date.now();
  if (Object.keys(patch).length) await chrome.storage.local.set(patch);

  await registerScripts();
  await applyRules();
  setupExpiryAlarm();
  checkLicenseExpiry();
}

// ── Еженедельные напоминания за месяц до истечения ────────────────────
// chrome.alarms срабатывает раз в неделю. При каждом срабатывании
// проверяем, осталось ли <= 30 дней, и если да — уведомляем.

function setupExpiryAlarm() {
  try {
    chrome.alarms.create('bdnt-expiry-check', { periodInMinutes: 7 * 24 * 60 });
  } catch (e) {}
}

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'bdnt-expiry-check') {
    checkLicenseExpiry();
  }
});

async function checkLicenseExpiry() {
  try {
    const lic = await getLicenseStatus();

    // Лицензия истекла — понижаем и уведомляем.
    if (lic.reason === 'license_expired') {
      registerScripts();
      applyRules();
      notify('Срок лицензии истёк',
        'Уровни 3–5 отключены. Продлите лицензию для восстановления полной защиты. ' +
        'Уровни 1–2 работают бесплатно.');
      return;
    }

    // Лицензия активна, но осталось <= 30 дней — напоминаем раз в неделю.
    if (lic.reason === 'licensed' && lic.daysLeft !== null && lic.daysLeft <= 30) {
      const { lastExpiryReminder = 0 } =
        await chrome.storage.local.get('lastExpiryReminder');
      const now = Date.now();
      if (now - lastExpiryReminder < 6 * 24 * 3600 * 1000) return; // не чаще раза в 6 дней
      await chrome.storage.local.set({ lastExpiryReminder: now });
      notify('Лицензия истекает ' + lic.endDate,
        'Осталось ' + lic.daysLeft + ' ' +
        (lic.daysLeft === 1 ? 'день' : lic.daysLeft < 5 ? 'дня' : 'дней') +
        '. Продлите заранее, чтобы не терять защиту уровней 3–5.');
      return;
    }

    // Пробный период.
    if (lic.reason === 'trial' && lic.daysLeft <= 3) {
      notify('Пробный период заканчивается',
        'Осталось ' + lic.daysLeft + ' ' +
        (lic.daysLeft === 1 ? 'день' : 'дня') + '. После этого уровни 3–5 требуют лицензии.');
    }
  } catch (e) {}
}

function notify(title, message) {
  try {
    if (chrome.notifications && chrome.notifications.create) {
      chrome.notifications.create('bdnt-lic-' + Date.now(), {
        type: 'basic', iconUrl: 'icons/icon_128x128.png',
        title: 'Belyaev DNT — ' + title, message
      });
    }
  } catch (e) {}
}

// ── Per-site уровни защиты ───────────────────────────────────────────
// siteRules: { "bank.ru": "off", "secret.org": "4", "work.com": "1" }
// Дополняет whitelist (который считается siteRule = 'off').
// Каждый домен с кастомным уровнем получает отдельную регистрацию
// content-script, что сохраняет синхронность подмены.

chrome.runtime.onInstalled.addListener(init);
chrome.runtime.onStartup.addListener(init);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.isOn || changes.level || changes.whitelist || changes.siteRules) {
    registerScripts();
    applyRules();
  }
});

init();
