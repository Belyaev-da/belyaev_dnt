# Belyaev DNT - release changelog

Short version for this specific release. Full version history is in
[DEVELOPMENT.md](DEVELOPMENT.md#version-history).

## 5.9.2 (2026-08-18) - "chrome-yandex-opera" build, verified and packaged

This is the first version built as an install-ready package. The `5.9.2`
source branch already contained some of the bugfixes below, but the
distributed ZIP (`belyaev-dnt-v5.9.1 (chrome-yandex-opera).zip`) was still
built from an **old, unfixed** copy of the code - that's the one users were
installing in their browsers, and that's where the errors were observed in
the `chrome://extensions` → "Errors" console:

```
Executing inline script violates the following Content Security Policy
directive 'script-src 'self''... The action has been blocked.
Uncaught ReferenceError: seed is not defined   (×5)
```

### Fixed in this release

1. **`seed is not defined` - the fingerprint-spoofing engine didn't work at
 levels 2-5** (i.e. everywhere except the minimal level 1). The functions
 `applyBehaviorNoise()`/`applyTrackerPoisoning()` were declared and
 called outside `apply()`, but used variables (`seed`, `nextNoise`,
 `wrap`, `randId`) that only existed inside it. The very first access
 to `seed` threw a `ReferenceError`, which halted execution of the
 whole script BEFORE `apply()` was called - neither the User-Agent, nor
 the screen, timezone, or canvas/WebGL were spoofed, even though the
 HTTP headers (a separate mechanism) kept changing. This made the
 user **more identifiable** than without the extension at all
 (the JS fingerprint and headers diverged). The most serious defect
 in this release. → `engine.js`
2. **CSP blocked the self-check page `test.html` entirely.**
 An inline `<script>` is forbidden by the `script-src 'self'` policy
 that Chromium applies to all extension pages in Manifest V3, so the
 results table stayed empty. The code was moved into an external
 `test.js`. → `test.html`, new file `test.js`
3. **`cookieconsent.js` clicked buttons outside cookie banners** -
 the selector `button[class*="reject"]` and text search ("reject",
 "decline" and similar) weren't scoped to the banner and could click,
 for example, "Reject payment" or "Decline" in a calendar invite.
 Text search is now scoped to containers with `cookie`/`consent`/`gdpr`
 in the id/class/aria-label.
4. **Form field data-theft detection didn't work.** The `.value`
 interceptor lived in the ISOLATED world and couldn't see reads coming
 from page scripts (MAIN world). Split into `formguard-main.js` (MAIN,
 interception) and `formguard.js` (ISOLATED, state check + UI),
 connected via `CustomEvent`.
5. **The "Dynamic protection" toggle in the popup didn't do anything.**
 The mode was read asynchronously after the engine had already run
 synchronously at `document_start`, and switching the mode didn't
 re-register the scripts. Added `world/mode-static.js` /
 `world/mode-dynamic.js` following the same pattern as protection
 levels; `protectionMode` was added to the list of storage changes
 that trigger re-registration.
6. Removed the unused file `mode.js` - it wasn't referenced in any
 `content_scripts` section of the manifest, dead code.

### Not changed

- The logic of protection levels 1-5, ad/tracker blocking (DNR rules),
 the format and verification of license codes, and localization -
 unchanged in content, only repackaged along with the bugfixes above.
- `firefox/` and `server/` from the parent package `v5.9.1-full` are not
 included in this release - the task scope was the `chrome-yandex-opera`
 build (Chrome, Yandex Browser, Opera - all Chromium-based, no separate
 build needed for Yandex/Opera, the same Manifest V3 package fits all three).

### Release files

- `belyaev-dnt-v5.9.2 (chrome-yandex-opera)/` - the extension's source
 files, ready to load via "Load unpacked" (chrome://extensions,
 browser://extensions, opera://extensions - developer mode is enabled
 the same way in all three).
- `belyaev-dnt-v5.9.2 (chrome-yandex-opera).zip` - the same package as an archive.
- `CHECKSUMS_SHA256.txt` - checksums for integrity verification.
- `SECURITY-AUDIT-TOOLS.md` - the methodology and list of tools used
 to check security (≥ 10).
- `DEVELOPMENT.md` - full technical documentation and version history.

### How to verify the bug is actually fixed

1. Install the package, enable protection (any level 2-5).
2. Open `chrome://extensions` → the extension's card → "Errors" -
 the list should be empty (the "Errors" button won't be shown at all
 if there are zero errors).
3. In the extension popup, open "About" → test sites →
 the built-in self-check page: a green banner should appear at the
 top ("✓ engine.js applied..."), and the table below should fill in
 with values different from the real ones while protection is enabled.
