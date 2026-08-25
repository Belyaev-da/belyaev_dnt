# Belyaev DNT

Extension for Chrome, Yandex Browser and Opera: protection from digital
tracking, ad and tracker blocking, website address checking.

**Version:** 5.9.2 · **Manifest V3** · ~290 KB · no bundlers or dependencies

**Author:** Dmitry Belyaev · belyaev.pro@mail.ru · [belyaev.expert](https://belyaev.expert)

---

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [URL Safety module](#url-safety-module)
- [Ad and pop-up blocking](#ad-and-pop-up-blocking)
- [Protection levels and per-site rules](#protection-levels)
- [Licensing](#licensing)
- [Development setup](#development-setup)
- [Publishing to the Chrome Web Store](#publishing-to-the-chrome-web-store)
- [Publishing to Opera Add-ons](#publishing-to-opera-add-ons)
- [Version history](#version-history)
- [Honest limitations](#honest-limitations)

---

## Features

| Feature | Description |
|---|---|
| Fingerprint spoofing | 143,360 combinations: browser, screen, hardware, timezone, GPU, canvas/audio noise |
| Tracker blocking | 41 analytics network domains (DNR) |
| Ad blocking | 42 ad networks (DNR) + cosmetic banner hiding |
| Pop-up blocking | window.open doesn't fire without user action |
| Address checking | Verdict on page load: safe / suspicious / dangerous |
| Per-site levels | A custom level (1-5 or "off") for each domain |
| Password hints | Strength requirements shown when a password field is focused |
| Tips and threats | 30 tips (for users / companies), 17 threats |
| Onboarding | Three screens on first launch |
| Badge counter | Number of blocked items shown on the toolbar icon |
| Dark theme | Follows system settings automatically |
| Animated logo | A surfer on a globe: sharks (OFF) / shield (ON) |
| License term | Days remaining, monthly reminders, auto-downgrade |

---

## Architecture

### Synchronous injection (key advantage)

```
service worker
  └─ chrome.scripting.registerContentScripts([
       js: ['world/mode-{static|dynamic}.js', 'world/levelN.js', 'engine.js'],
       runAt: 'document_start',
       world: 'MAIN'
     ])
```

`mode-*.js` sets `window.__BDNT_MODE__`, `levelN.js` sets
`window.__BDNT_LEVEL__`, `engine.js` reads both synchronously. There's no
`chrome.*`, `await`, `.then()` in the critical path. The site never gets a
chance to capture the real fingerprint. Both markers are chosen by the
service worker based on `chrome.storage` BEFORE registration - they aren't
read by the MAIN-world script itself, which has no access to `chrome.*` APIs.

### Files

```
manifest.json          Manifest V3
background.js          Service worker: DNR, license, URL check, per-site
engine.js              Spoofing engine (GENERATED from belyaev/inject.js)
world/level1..5.js     Level markers
world/mode-static.js   "Static protection" mode marker
world/mode-dynamic.js  "Dynamic protection" mode marker
lib/profiles.js        Profiles, pools, domain lists, tips, threats
lib/license.js         Codes, AES-GCM, HMAC
lib/emblem.js          SVG emblem + animated scene
urlsafety.js           Verdict banner + blocking screen
adblock.js             Cosmetic ad hiding
notice.js              "What was blocked" card
tips.js                Tips every 30 minutes
passwordtips.js        Hints on password fields
cookieconsent.js       ISOLATED: finds the cookie banner, checks state
formguard-main.js      MAIN: intercepts form .value before submit (detection)
formguard.js           ISOLATED: checks protection state + UI notifications
test.html / test.js    Self-check page (opened from "About")
popup/                 UI (onboarding, dark theme)
```

---

## URL Safety module

**This is NOT antivirus software.** The extension doesn't scan files or
check signatures. The module performs a reputational check of the address -
it analyzes the domain name and the URL path.

### Data sources (all local)

1. **UNSAFE_DOMAINS** - a built-in list of confirmed malicious domains
 with a text explanation.
2. **HOST_PATTERNS** - 7 regular expressions for phishing domains
 (impersonating PayPal, Apple ID, Microsoft, crypto scams, etc.).
3. **PATH_PATTERNS** - 2 patterns for dangerous paths (direct links to
.exe/.apk files, CMS vulnerability exploitation).
4. **Heuristics** - free domain zones (.tk/.ml/.ga), subdomain nesting >4,
 IP instead of a domain, punycode.

### Three verdict levels

- **safe** → green banner (8 sec)
- **suspicious** → yellow banner (14 sec) with a list of reasons
- **dangerous** → `window.stop()` + a red blocking screen explaining the
 reason, the consequences, and buttons "Leave site" / "Accept the risk"

The extension point `checkUrlOnline()` is ready for the Google Safe Browsing API.

---

## Ad and pop-up blocking

Three independent layers:

1. **Network** - 42 ad networks are blocked via declarativeNetRequest.
2. **Cosmetic** - CSS + MutationObserver hides banners on the page.
3. **JS heuristic** - `window.open` is only allowed within 1.2 sec
 after a trusted click/tap/Enter.

---

## Protection levels

| Lvl | Name | License | Adds |
|---|---|---|---|
| 1 | Basic | free | DNT, Sec-GPC, tracker/ad/pop-up blocking |
| 2 | Confident | free | UA, Client Hints, screen, canvas, WebGL, 143k variations |
| 3 | Enhanced | licensed | Audio, fonts, WebRTC, storage isolation |
| 4 | Maximum | licensed | Removes the Authorization header |
| 5 | Paranoid | licensed | Variable substitution of tracking cookies |

Per-site rules: each domain is assigned its own level.

---

## Licensing

- Levels 1-2 are free forever.
- 14-day trial period (all levels).
- A license with an expiration date; days remaining are shown in the UI.
- Reminders 30 days out (weekly, via chrome.alarms).
- On expiration - automatic downgrade to level 2.
- Format: `BDNT-XXXXX-XXXXX-XXXXX-XXXXX-CC`, AES-GCM, 3 attempts.
- The code is verified by the license server (`POST /api/verify`); the
 installation is re-checked against the server once a week, so a license
 revocation is actually applied across all of a client's devices, not just
 at first activation. If the server is temporarily unreachable, the
 extension works in offline mode and doesn't block the user.

---

## Development setup

**Chrome:** `chrome://extensions` → "Developer mode" →
"Load unpacked" → select the folder.

**Yandex Browser:** `browser://extensions` → same steps.

**Opera:** `opera://extensions` → "Developer mode" →
"Load unpacked" → select the folder.

---

## Publishing to the Chrome Web Store

### Preparation

1. **Developer account.** Register at the
 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
 One-time fee - **$5**.

2. **Icons and screenshots.**
 - Store icon: 128×128 px (already have it: `icons/icon_128x128.png`).
 - Promo tile: 440×280 px (small) - prepare separately.
 - Screenshots: 1280×800 or 640×400, at least 1, 3-5 recommended
 (popup, blocking, notification, onboarding).

3. **ZIP archive.** Just the contents of the extension folder, no extra files:
   ```
   cd belyaev-dnt
   zip -r ../belyaev-dnt.zip . -x "*.DS_Store" "README*" "*.md"
   ```

### Publishing

1. Open the [Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Click **"New item"** → upload the ZIP.
3. Fill in the listing:
 - **Name:** Belyaev DNT - Anti-Tracking Protection
 - **Short description** (up to 132 characters): "Digital fingerprint
 spoofing, tracker and ad blocking, address checking. 143,360 variations."
 - **Detailed description:** copy the "Features" section from README.md.
 - **Category:** Productivity or Privacy & Security.
 - **Language:** Russian (+ English, if localized).
4. Upload screenshots and the promo image.
5. Fill in the **Privacy Policy** - a page on belyaev.expert with the text
 "The extension does not collect or transmit personal data. All data is
 processed locally on the device." is enough.
6. In the **Permissions justification** section, explain each permission:
 - `storage` - stores settings and the license.
 - `declarativeNetRequest` - blocks trackers and ads.
 - `scripting` - registers content scripts for fingerprint spoofing.
 - `tabs` - determines the active tab's domain for per-site rules.
 - `notifications` - license expiration reminders.
 - `alarms` - schedules periodic checks.
 - `webRequest` / `webRequestBlocking` - Firefox version only.
7. Click **"Submit for review"**.

### Timelines and common rejection reasons

- First review: **1-5 business days** (sometimes up to 2 weeks).
- Common rejection reasons:
 - **"Broad host permissions"** - `<all_urls>` needs justification.
 Write: "The extension modifies HTTP request headers on all sites to
 protect against tracking (DNT, Sec-GPC, Client Hints). This isn't
 possible without broad permissions."
 - **"Missing privacy policy"** - a link to the policy is mandatory.
 - **"Deceptive behavior"** - don't claim "full anonymity,"
 write "reduces the amount of data collected" instead.
- Updates after publication are reviewed faster (hours, not days).

---

## Publishing to Opera Add-ons

### Preparation

Opera is Chromium-based, so **the same ZIP** works without changes.

1. **Account.** Register at the
 [Opera Add-ons Developer Portal](https://addons.opera.com/developer/).
 Free, no fee.

2. **Icons and screenshots** - same requirements as Chrome:
 64×64 or 128×128 icon, at least 1 screenshot.

### Publishing

1. Open the [Opera Developer Portal](https://addons.opera.com/developer/).
2. Click **"Submit Extension"** → upload the ZIP.
3. Fill in the listing (same as Chrome).
4. In the **"Permissions"** section, explain each permission (as for Chrome).
5. Submit for review.

### Opera specifics

- Review usually takes **3-7 business days**.
- Opera automatically checks compatibility with the Chromium API.
- `declarativeNetRequest` is fully supported.
- If the extension is already on the Chrome Web Store, you can link to it -
 this speeds up the review.
- Opera GX (the gaming version) uses the same catalog.

---

## Version history

### 5.9.2 - fingerprint spoofing restored and bugfixes

External audit (code + behavior in Chromium 145 at all five levels).
Found and fixed:

- **Critical bug: fingerprint spoofing didn't work at any paid level
 (2-5).** `applyBehaviorNoise()` and `applyTrackerPoisoning()`
 (added in 5.9.0) were declared and called OUTSIDE `apply()`, but used
 `seed`/`nextNoise`/`wrap`/`randId` - variables that only exist inside
 `apply()`. At level 2+, the very first line threw
 `ReferenceError: seed is not defined`, which stopped execution of the
 whole IIFE BEFORE `apply()` was called - the engine didn't spoof
 `navigator`, `screen`, timezone, canvas/WebGL, etc. at all. Meanwhile
 the HTTP headers (a separate mechanism - DNR) kept being spoofed as
 normal, so the JS fingerprint and the headers diverged: the user became
 more identifiable than without the extension. Level 1 didn't show the
 bug because there `spoofNavigator=false` and `applyBehaviorNoise()`
 returns before the first problematic line. Fixed: both functions and the
 shared `randId()` were moved inside `apply()`, called at its end, wrapped
 in `try/catch`.
- **`cookieconsent.js` clicked buttons outside cookie banners.** The
 selector `button[class*="reject"]` and text search ("reject", "decline",
 etc.) weren't scoped to the banner - on any page with a button like
 "Reject changes," "Reject payment," or "Decline" (a calendar invite),
 the script clicked it automatically ~1.2-6 s after load, without user
 involvement. Removed `button[class*="reject"]` from the selector list;
 text search now only looks for buttons inside containers with
 `cookie`/`consent`/`gdpr` in the id/class/aria-label.
- **`formguard.js` couldn't detect `.value` reads before form submission.**
 The interceptor lived in the ISOLATED world, and
 `Object.defineProperty(el, 'value', …)` there only overrides the getter
 on the ISOLATED-world DOM element wrapper - page scripts (MAIN world)
 don't see it and keep reading value directly. Split into
 `formguard-main.js` (MAIN, the actual interception and detection) and
 `formguard.js` (ISOLATED, protection-state check via `chrome.runtime` +
 UI notifications); connected via a `CustomEvent` on `window`.
- **"Dynamic protection" mode didn't turn on.** `mode.js` read
 `protectionMode` from `chrome.storage` asynchronously and set a
 data-attribute on `<html>`, while `engine.js` (a separate MAIN-world
 script at `document_start`) runs synchronously and finishes before the
 callback arrives - the attribute didn't exist yet at read time. On top
 of that, switching the mode in the popup just wrote to storage and
 didn't re-register any scripts. Fixed following the same pattern as
 `world/levelN.js`: added `world/mode-static.js` / `world/mode-dynamic.js`
 - the service worker inserts the right file into the same synchronous
 `js[]` array before `engine.js`; `protectionMode` was added to the list
 of storage changes that trigger script re-registration. The obsolete
 `mode.js` was removed from the build - it wasn't referenced in any
 `content_scripts` section of `manifest.json` and never ran.
- **`test.html` (the self-check page) didn't work at all.** An inline
 `<script>` inside the page was blocked by the Content-Security-Policy
 that Chromium enforces on extension pages in Manifest V3
 (`script-src 'self'`, with no way to relax it to `'unsafe-inline'` even
 via `content_security_policy` in `manifest.json`). In the console:
 *"Executing inline script violates the following Content Security
 Policy directive 'script-src 'self''… The action has been blocked"* -
 the results table stayed empty at any protection level, which also
 masked diagnosis of the main bug (fingerprint spoofing). The code was
 moved into an external `test.js`, loaded via `<script src="test.js">`;
 CSP allows scripts from the extension's own origin.

### 5.9.1 - security audit and bugfixes

Scheduled code audit (client + license server). Found and fixed:

- **Bug: `removeEventListener` didn't remove mouse/keyboard handlers.**
 Behavioral anti-fingerprinting (5.9.0) overrode
 `EventTarget.prototype.addEventListener` for mouse/keyboard, but didn't
 override `removeEventListener` - when removing a handler, the browser
 looked it up by function reference, while in reality a different wrapper
 object was subscribed, so `removeEventListener` silently did nothing.
 The standard add/remove listener pattern appears on almost every
 interactive site (drag&drop, modals, canvas, reusable SPA components) -
 the bug accumulated dangling handlers and leaked memory on every page
 at protection level 2+ (the default level). Fixed: a wrapper registry on
 a WeakMap, `removeEventListener` finds and removes the right one, and
 repeated `addEventListener` calls with the same target+type+fn+capture
 no longer duplicate (matching the native API's behavior).
- **XSS pattern (defense in depth) on the dangerous-site blocking
 screen.** `urlsafety.js` inserted the block reason text into `innerHTML`
 via `${reasonText}` instead of `textContent`. Right now all reason texts
 are hardcoded on the background.js side and don't contain data from the
 URL, so it isn't directly exploitable today - but it's the same bug
 class already fixed as a real XSS on the license screen (5.4.3).
 Replaced with `textContent` so a future why-text containing part of a
 URL/host doesn't silently reopen the hole.
- **Weakened settings import validation.** `siteRules`/`whitelistMeta`
 were only checked as "is this an object," with no check on the keys
 (domain) or values (protection level/date). A specially crafted settings
 file could inject arbitrary levels or an inflated list. Added domain
 validation via regex + length (matching the approach used for external
 filter lists), allowed level values, and a limit on the number of entries.
- **Dead code: tracker-beacon poisoning never fired.**
 `applyTrackerPoisoning()` overrode `navigator.sendBeacon` with a
 "poisoning" wrapper, but a few lines further down `apply()`
 unconditionally overrode it again with full blocking (`blockBeacon` is
 on at all levels 1-5) - the poisoning wrapper was never invoked. Not a
 vulnerability (blocking is stricter than poisoning), but it didn't match
 what the version history described. Added a condition: poisoning is only
 set up if `blockBeacon` is off.
- **License server: rate limiting and IP logging didn't actually work.**
 Flask receives all requests through nginx on `127.0.0.1`, so
 `request.remote_addr` was always `"127.0.0.1"` - the rate limit
 (60 requests/min) effectively became one shared limit for all clients
 combined instead of a per-client limit, and the `ip_address` column in
 `verify_log`/`activations` was useless for auditing (same address
 everywhere). Added `ProxyFix` (trusting exactly one hop of
 `X-Forwarded-For` from our own nginx).
- **License server: API key and password comparison wasn't constant-time.**
 `require_api_key` compared the key with `!=`, `verify_password` compared
 the password hash with `==`; both were switched to
 `hmac.compare_digest`, matching what was already done for the JWT
 signature in `verify_token`.
- **License server: the rate-limit dictionary grew without bound.**
 `_rate` was never cleared for IPs that stopped sending requests - on a
 process that runs for weeks (systemd, `Restart=always`), that's a slow
 memory leak. Added periodic cleanup of empty entries.

### 5.9.0 - breakthrough features

- **Behavioral anti-fingerprinting.** Micro-noise added to mouse
 coordinates, keyboard timing, and scroll behavior. No other extension
 does this. Next-generation trackers can't correlate sessions by behavior.
- **Tracker profile poisoning.** Instead of blocking analytics requests -
 substituting the parameters (_ga, _fbp, utm_*). The tracker thinks it
 collected data, but the profile is poisoned with random values.
- **Automatic cookie banner handler.** Automatically clicks "Reject" on
 GDPR banners from the 10 major CMP platforms (OneTrust, Cookiebot,
 Didomi, Yandex, etc.). If no reject button is found, the banner is left
 alone.
- **Site privacy rating (A-F).** The notification card shows a privacy
 score: from A (0 trackers) to F (20+ trackers).

### 5.9.0 - user data protection

- **Data breach check.** When entering an email or password on a site
 that previously had a breach (LinkedIn, Facebook, Adobe, VK, Rambler,
 Mail.ru and 14 others), a warning is shown: the year of the breach, the
 number of affected accounts, and what data was exposed. Recommends a
 unique password and 2FA. The check is fully local - the email is never
 sent anywhere.
- **Form pre-submit theft protection.** Detects when third-party scripts
 read data entered into a form before the "Submit" button is pressed.
 This is common practice among marketing platforms that users are
 unaware of: even if you change your mind and don't submit the form, the
 data has already been sent. The plugin shows exactly which domains are
 reading your input.
- Interception mechanism: overriding the `value` getter for email/tel/name
 fields with call-stack analysis to identify the source of the read.

### 5.8.0 - intelligent adaptation

- **Built-in protection test.** An HTML page inside the extension: shows
 all fingerprint parameters, marks the spoofed ones in green, tests
 behavioral anti-fingerprinting on mouse movement. No external sites
 needed.
- **Context-adaptive protection.** Detects the site type (bank, CRM,
 social network, marketplace, Google Workspace) by DOM and domain. If the
 current level might break the site, shows a suggestion with an
 explanation and an "Apply recommended level" button.
- **Smart exception suggestions.** Detects signs of a broken site
 (blocked/cors/denied JS errors, empty iframes) and offers to lower the
 level to 1 with one click. Reloads the page after applying.
- All innerHTML calls containing user data were replaced with textContent.

### 5.7.0 - static/dynamic protection mode

- **Protection mode switch.** Static (default) - a stable profile per
 domain, sites work smoothly. Dynamic - a new profile on every load,
 maximum protection against session linking.
- A button on the main screen explaining when each mode is better.
- The mode persists across sessions and can be exported/imported.
- mode.js: the ISOLATED content script passes the mode via a data
 attribute on <html>, engine.js reads it synchronously.

### 5.6.0 - per-site level fix and UX

**Critical bug:** per-site levels didn't work - with a global level of 5
and a site set to level 1, the site would still break. Cause: the DNR
tracker-blocking rules only excluded domains with an "off" status, not
domains with a lowered level. Now all per-site domains are added to
`excludedInitiatorDomains`, and DNR blocking isn't applied to sites that
have their own rule.

- Explanation added for Export/Import settings.
- Several sites for testing protection (BrowserLeaks, Whoer, EFF, Pixelscan).
- A dark/light theme toggle button.

### 5.4.3 - security audit

**Fixed 10 defects:**

- XSS vector on the license screen: innerHTML replaced with DOM building.
- External filter lists: added domain validation (regex, length <255).
- Settings import: added data type validation - arbitrary values can no
 longer be loaded via JSON.
- Filter list fetch: added a 15-sec timeout (AbortController).
- Per-site rules: checkCurrentSite didn't find the rule for subdomains -
 fixed (sub.example.com now inherits the example.com rule).
- getNoticeState: per-site rules weren't applied to content scripts -
 ads were still hidden on excluded sites (fixed earlier, verified again).
- PerformanceObserver in notice.js was never disconnected - a resource
 leak.
- MutationObserver in passwordtips.js ran forever after being shown once.
- MutationObserver in adblock.js triggered a sweep on every mutation
 with no debounce - slowed down dynamic pages. Added a 300 ms debounce.
- urlsafety: sessionStorage might not have been written before the
 reload after "Accept the risk" - added a 50 ms delay.

### 5.5.1

- **Updatable filter lists.** Peter Lowe's list (~3,000 domains) is
 downloaded once a day. Merged with the 83 built-in domains. A manual
 update button on the "About" screen. If there's no network, the
 built-in lists still work.
- **Weekly "Your Privacy" report.** A once-a-week notification: total
 blocked count, number of trackers, top tracker.
- **Settings import/export.** Export to JSON, import from a file - for
 deploying to multiple machines. "About" screen → "Settings".
- **Built-in protection test.** A "Test protection" button opens
 BrowserLeaks, where the user can see what's been spoofed.
- Filter list status (built-in + external, last update date).

### 5.4.2

- **Onboarding** on first install (3 slides in the popup).
- **Badge counter** of blocked items on the extension icon.
- **Dark theme** - missing variables filled in, full support.
- **Animated logo** - a surfer on a globe: a green shield with bricks
 (ON), a red globe with sharks (OFF).
- The "Add" button in per-site rules moved below the fields.
- License: removed the start date, only days remaining shown.
- Blocking history: total counter, "Tracker"/"Ad" badges.

### 5.4.0

- Code audit: fixed 4 defects (per-site in getNoticeState, innerHTML with
 host, unbounded blockedLog, exe pattern matching domain instead of path).
- Reworked the URL-checking engine: 3 verdict levels, separated host/path
 patterns, heuristics, clear explanations.

### 5.3.0

- Ad blocking (42 domains) and pop-up blocking (window.open without a gesture).
- Cosmetic banner hiding (adblock.js).
- Visible URL protection: banner + blocking screen.
- Hints on password fields.
- 30 tips with audience filtering, 17 threats.
- Detailed breakdown of blocked trackers.
- License dates, dynamic version shown in "About".
- Fixed a duplicate script ID (registration queue).

### 5.2.0

- License term (start/end/remaining).
- Weekly reminders starting a month before expiration.
- Auto-downgrade to level 2 on expiration.
- Per-site protection levels.
- Basic URL-checking engine.

### 5.1.0

- Variation pool: 7,776 → 143,360 (canvas/audio noise axis).
- Excluded sites (whitelist) via excludeMatches.

### 5.0.0

- First Manifest V3 version.
- Synchronous MAIN-world injection.
- 5 protection levels, licensing, DNR rules.

---

## Honest limitations

- **The IP address is always visible** - a VPN/proxy is needed for that.
- **Logging into an account** identifies you more reliably than any
 fingerprint.
- **The fact of spoofing is detectable** (CreepJS, Pixelscan). A large
 variation pool protects against linking visits together, not against
 detecting that spoofing is happening.
- **Address checking ≠ antivirus** - there's no file system access.
- **The license is client-side** - not protected against modification
 of the code on disk.

---

**Contact:** belyaev.pro@mail.ru · [belyaev.expert](https://belyaev.expert)
