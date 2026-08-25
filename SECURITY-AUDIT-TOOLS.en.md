# Belyaev DNT v5.9.2 - security review methodology and tools

This file honestly describes **exactly what** was checked in the code
before release: what was actually done as part of this audit, and what's
additionally recommended before publishing to the Chrome Web Store / Opera
Add-ons / Yandex Store. There's no padded "checkbox" list here - every item
below was either actually applied, or explicitly marked as a recommendation.

## Part 1. Tools and methods applied in this audit

1. **Ripgrep (`rg`) - full-text search across the codebase.**
 Used regular expressions to search for dangerous constructs: `eval(`,
 `new Function`, `document.write`, `innerHTML`/`outerHTML`,
 `postMessage`, `Math.random` in places where cryptographically strong
 randomness matters, etc. - across all `.js`/`.json`/`.html` build files.
2. **Manual line-by-line code review.** Every file of the extension -
 `manifest.json`, `background.js`, `engine.js` and all content scripts,
 `lib/*.js`, `popup/*` - was read in full, not skimmed; the logic was
 verified by hand, not just by grepping.
3. **Variable scope/closure tracing.** This is exactly how the main bug
 of the release was found and confirmed -
 `ReferenceError: seed is not defined`: traced which closure each
 variable (`seed`, `nextNoise`, `wrap`, `randId`) was declared in and
 exactly where it was called from.
4. **DOM output flow audit (innerHTML vs textContent).** Every use of
 `innerHTML` in the project was checked for its data source:
 static markup/hardcoded strings - acceptable;
 data that depends on the page/URL/user input -
 must go through `textContent` or `createElement`+`textContent`.
5. **Content-Security-Policy audit for extension pages.**
 Checked `manifest.json` against the Manifest V3 policy
 (`script-src 'self'` by default for `chrome-extension://` pages,
 with no way to allow `'unsafe-inline'`) - this is how the inline-script
 bug in `test.html` was found.
6. **`manifest.json` / permissions audit.** Checked `permissions`,
 `host_permissions`, `web_accessible_resources`,
 `content_scripts` (`matches`, `all_frames`, `world`, `run_at`) for
 excess scope and compliance with the principle of least privilege.
7. **PowerShell (`Get-FileHash`, `Compare-Object`, `Select-String`,
 `Get-ChildItem`) - integrity and build comparison.** Used to compare
 several copies of the code in the package (found that the distributed
 ZIP was built from an **outdated** copy of `engine.js`, while a fixed
 copy was sitting right next to it), and to compute SHA-256 checksums
 (see `CHECKSUMS_SHA256.txt`).
8. **Comparative diff analysis between versions (regression check).**
 Line-by-line comparison of several copies of the same file within the
 package
 (`chrome-yandex-opera/engine.js` vs
 `belyaev-dnt-v5.9.1 (chrome-yandex-opera)/chrome-yandex-opera/engine.js`)
 - this is how it was confirmed which copy has the fix and which doesn't.
9. **Cryptographic primitives review.** `lib/license.js` was checked for
 its randomness source (`crypto.getRandomValues` with a `Math.random()`
 fallback used only on non-security-critical paths), the algorithm and
 mode (AES-GCM via the Web Crypto API), IV generation, and comparison
 constant-timeness - whether any secret comparison anywhere uses an
 unsafe `==`/`!=` instead of a constant-time comparison.
10. **Network egress audit.** Every place where the extension talks to
 the network was listed and checked: the domain list used for blocking
 (Peter Lowe's list, HTTPS, `AbortController` + a 15 s timeout), the
 license server (`https://belyaev.expert/bdnt-api`, 8 s timeout, API key
 in the header rather than the URL) - both over HTTPS, both handling
 network failure gracefully without breaking functionality.
11. **Race condition check between `chrome.storage` (async) and
 `document_start` content scripts (sync).** This is how the
 "dynamic protection" mode not switching was found.
12. **Localization check for `_locales/en` and `_locales/ru`** for
 structural key consistency (no keys used in code but missing from the
 locale's JSON).
13. **Functional check via the built-in self-check page**
 (`test.html` → after the fix, `test.js`) - which also serves as the
 extension's own QA tool: it shows the difference between the real and
 spoofed `navigator`/`screen`/`canvas`/`WebGL` values.

## Part 2. Additionally recommended before publishing to app stores

These tools weren't run as part of the current (local, static) audit - the
environment has no access to a live browser or the internet - but they're
standard practice before publishing a browser extension, and are
recommended to the project owner:

14. **Chrome DevTools / Yandex Browser DevTools / Opera DevTools**
 (`F12` → Console, Network, Application → Storage) - live testing in
 the target browsers: the exact place where the user saw the bugs in
 the screenshot (`chrome://extensions` → "Errors").
15. **`chrome://extensions` → "Errors" / "Manifest overview"** - the
 manifest validator and runtime-error viewer built into the browser
 itself, identical for Chrome, Yandex Browser and Opera (all three run
 on Chromium).
16. **Chrome Web Store Developer Dashboard - automatic review on
 publish** (static analysis of the manifest, permissions, remote code,
 obfuscation) - a mandatory step before an actual store release.
17. **CRXcavator / crx.dev (or an equivalent)** - an independent scan of
 published `.crx`/`.zip` extension packages for excessive permissions
 and known unsafe patterns.
18. **VirusTotal (scanning the package's ZIP archive)** - a reputation
 check of the built archive before publicly distributing a download link.
19. **ESLint** (e.g. with `eslint-plugin-no-unsanitized`) - a linter
 that would automatically catch the "variable in the wrong scope" bug
 class and potential DOM-XSS sinks during development, before manual
 review.
20. **web-ext lint** (Mozilla's tool, applicable to MV3 packages with
 some caveats) - an additional static check of the extension's structure.

## Summary for this release

Out of what's listed in Part 1 (13 items, actually applied), 6 defects
were found and fixed in the code - see [CHANGELOG.md](CHANGELOG.md) and the
"Version history" section in [DEVELOPMENT.md](DEVELOPMENT.md) for details.
The most serious one was a critical break of the entire digital-fingerprint
spoofing engine at protection levels 2-5, reproducing the
`ReferenceError: seed is not defined` error from the user's screenshot.
