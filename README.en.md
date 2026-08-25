# Belyaev DNT - cyber protection and privacy right in your browser

**Belyaev DNT** is a lightweight extension for Chrome, Yandex Browser, Firefox and Opera that helps protect users from common web threats: digital tracking, intrusive ads, hidden trackers, fraudulent links and dangerous pop-ups.

Every visit to a website leaves technical traces: browser parameters, screen characteristics, timezone, GPU data, cookies and other signals. Ad platforms, analytics services and attackers can use them to build a digital profile, track activity and prepare more convincing phishing attacks. Belyaev DNT reduces the amount of such data and makes it harder to identify a user online.
It's not just an ad blocker. Belyaev DNT combines several layers of protection in one extension:

- blocks advertising, analytics and tracking requests;
- hides intrusive banners and prevents some unwanted pop-ups;
- counters browser fingerprinting - the collection of a unique digital fingerprint of the browser;
- analyzes website addresses and warns about phishing, suspicious domains, malicious downloads and fraud schemes;
- lets you set a separate protection level for each site - for example, stricter for email, financial services and work systems;
- explains to the user which threats were detected and what action the protection took.

Belyaev DNT works locally in the browser and doesn't require complex setup. The user gets a clear protection status indicator, a counter of blocked elements and warnings only when there's an actual risk.
<img width="1503" height="639" alt="image" src="https://github.com/user-attachments/assets/858e6f18-44af-47ac-8425-c9b2af7b586c" />

## 📦 Release `belyaev-dnt-v5.9.2`

**Compatibility:** Google Chrome · Yandex Browser · Opera
**Archive size:** 124 KB

```text
belyaev-dnt-v5.9.2 (chrome-yandex-opera).zip
```

### Checksums

| Algorithm | Hash |
|---|---|
| SHA-1 | `21669364ea35b5c5b607eca8e34a56754724349f` |
| SHA-256 | `ecde17afea660013b779a8dcaf4cfc07dd121e3a2f5fd98329085167caccc91b` |
| SHA-512 | `7e7642e25e13227e178d6b71d8f4476ae6bbe1d33d770d9bf4ff45da786b3705d96f7679979ca436b3124fd69a8a76564e8284c492c7ded097e309ae71de74bf` |

> To verify file integrity and authenticity, it's recommended to use **SHA-256** or **SHA-512**.

**Contact:** belyaev.pro@mail.ru · [belyaev.expert](https://belyaev.expert)
## What the user gets

- Less ad noise and tracking from analytics and ad networks.
- A browser fingerprint that's harder to correlate.
- Warnings about suspicious and dangerous URLs before the user interacts with the page.
- Protection from aggressive pop-ups and hidden ad scripts.
- The ability to set a separate protection level for banking, email, work services, social networks or any other domains.
- Control without complex terminology: protection status, number of blocked elements, notifications about the extension's actions and clear recommendations.

## Key features

| Area | How Belyaev DNT works | User value |
|---|---|---|
| Anti-tracking | Blocks 41 analytics and tracking network domains via Declarative Net Request | Reduces behavioral data collection and cross-site tracking |
| Anti-advertising | Blocks 42 ad networks at the network level and hides ad elements on the page | Cleaner pages, fewer distracting banners and ad scripts |
| Anti-fingerprinting | Forms a variable browser profile: User-Agent, Client Hints, screen, GPU, WebGL, canvas, audio, timezone and other signals | Makes it harder to build a stable digital profile of the user |
| URL check | Checks the domain and URL path against local lists, patterns and heuristics | Helps recognize phishing, crypto scams, suspicious downloads and site spoofing |
| Pop-up blocking | Restricts `window.open`: the action is only allowed after an actual click, tap or Enter | Protects against intrusive windows, redirects and some fraud scenarios |
| WebRTC and storage protection | At higher levels, adds extra measures for WebRTC, fonts, audio and storage isolation | Reduces the risk of technical identifier leaks and cross-site correlation |
| Per-site policy | Lets you choose a protection level from 1 to 5, or disable the extension for a specific domain | A balance between security, privacy and compatibility with business services |
| Password hygiene | Suggests strength requirements when entering a password | Helps form more resilient credentials right at the moment of registration |
| Security education | Gives tips to users and companies, and explains common threats | Improves digital literacy without separate training or interface overload |

## Link checking: protection before the click

Belyaev DNT is not positioned as antivirus software and doesn't scan files. Its job is to assess **reputational and technical risk signals in a website's address**: the domain, URL structure, path and characteristic phishing signs.

When a page opens, the extension forms a clear verdict:

- **Safe** - the address doesn't trigger any flags; a short green status is shown.
- **Suspicious** - risk signs were found: a suspicious domain zone, punycode, an IP address instead of a domain, excessive subdomain nesting, similarity to known brands, or a dangerous URL path.
- **Dangerous** - a confirmed malicious domain or a critical pattern was found. Page loading is stopped, and the user sees a red screen explaining the threat, possible consequences and a choice: leave the site or knowingly proceed.

This approach is especially useful against scenarios where the attack doesn't start with a malicious file but with a convincing link: a fake Microsoft, Apple ID, PayPal, crypto wallet, corporate web portal page, or an "urgent" letter from support.

## Five protection levels

Belyaev DNT doesn't make you choose between "turn off completely" and "break half the websites." Protection scales from basic privacy to a strict mode for users with an elevated threat model.

| Level | Mode | Who it's for | What it includes |
|---|---|---|---|
| 1 | Basic protection | For everyday browsing | DNT, Sec-GPC, blocking of trackers, ads and pop-ups |
| 2 | Confident protection | For most users | Everything from level 1, plus protection for User-Agent, Client Hints, screen parameters, canvas and WebGL |
| 3 | Enhanced protection | For work with sensitive data | Additional protection against audio fingerprinting, fonts, WebRTC and storage isolation |
| 4 | Maximum protection | For isolated scenarios and private access | Additional removal of the Authorization header |
| 5 | Paranoid | For users with a high need for anonymization | Variable substitution of tracking cookies and the strictest protection profile |

Levels 1 and 2 are available for free, forever. All features can be evaluated during a 14-day trial period, after which you can choose the licensing mode that fits.

## Technology you can trust

Belyaev DNT is built as a compact, transparent product: about 290 KB, with no third-party bundlers or dependencies, built on modern **Manifest V3**.

The architecture is designed for local operation in the browser:

- Blocking rules are applied via `declarativeNetRequest`, with no need to send browsing history to an external server.
- URL checking uses local lists, regular expressions and heuristics.
- Anti-fingerprinting mechanisms work through variable profiles, forming up to **143,360 combinations** of browser and device parameters.
- The licensing mechanism uses AES-GCM and HMAC.
- An extension point is provided for connecting online verification via the Google Safe Browsing API when needed.

## UX that doesn't get in the way

Security should be visible at the moment of risk and unobtrusive during normal work. That's why Belyaev DNT shows the user exactly as much information as needed:

- a counter of blocked elements right on the extension icon;
- cards explaining exactly what the protection blocked;
- clear status banners for address checks;
- a dark theme that automatically follows system settings;
- a three-screen onboarding flow for a quick start;
- license expiration reminders with no unexpected shutdowns;
- visual status indication: a surfer on a globe, sharks when protection is off, and a shield when it's active.

## Landing page positioning

> **Belyaev DNT - your personal digital protection loop in the browser.**
> Block ads and trackers, make fingerprint collection harder, recognize suspicious links in time and manage the privacy level for each site.
>
> Fast. Local. Transparent. No unnecessary dependencies.

**Belyaev DNT** helps users not just "hide ads," but regain control over who is watching their actions online, and how.

## Incident examples:

## 1. Electronic Arts breach via a stolen Slack cookie

In 2021, attackers gained access to Electronic Arts' internal Slack using a stolen employee session cookie. According to a Motherboard/Vice investigation, the cookie was bought on an underground marketplace for about $10. The session let the attackers log into the internal corporate messenger as a legitimate user, after which they used social engineering against the IT team to expand access.

The attack resulted in the theft of game source code and internal EA tools; the company publicly confirmed the incident and the theft of source code and tools. Key lesson: a session cookie can effectively be the equivalent of authentication already completed. If an attacker obtains a valid token, a password may not be needed at all, and MFA-based protection can be bypassed at the session-reuse stage. (https://is-systems.org/blog_article/11663578061)

## 2. Okta: session tokens from HAR files led to account takeovers

In October 2023, attackers gained access to Okta's support ticketing system - Okta being an IAM, SSO and MFA provider. Among the materials customers uploaded to tickets were HAR files - browser session logs. Such files can contain cookies and active session tokens if they aren't scrubbed before being sent to support.

According to Okta and independent researchers, attackers extracted data from HAR files and then used valid session tokens to attempt takeovers of legitimate customer sessions. In particular, BeyondTrust detected an attempt to log into an Okta administrator account using a cookie stolen from the support system. Data from 134 customers was affected, and session hijacking was confirmed at at least five organizations. (https://krebsonsecurity.com/2023/10/hackers-stole-access-tokens-from-oktas-support-unit/)

**Practical takeaway:** access to ticketing systems, browser logs, HTTP traffic dumps and diagnostic archives must be treated as access to secrets. Sharing HAR files without redaction can expose tokens, cookies, authorization headers and personal data.

## 3. Uber: corporate access takeover after a contractor account compromise

In September 2022, Uber suffered a large-scale intrusion into its internal systems. The attacker used compromised contractor credentials, then triggered a wave of multi-factor authentication push requests. After a series of notifications, the attacker posed as an IT support representative and convinced the victim to approve one of the MFA requests.

Having obtained a valid authenticated session, the attacker was able to move through internal tools, including Slack and Google Workspace. The incident wasn't a classic cookie theft, but it demonstrates the same fundamental risk: once a valid session is hijacked or MFA is successfully passed, an attacker acts on behalf of a legitimate user. (https://assets.kpmg.com/content/dam/kpmgsites/in/pdf/2022/09/27-september-2022-lessons-to-learn-from-the-uber-security-breach.pdf.coredownload.inline.pdf)

## 4. Biostar 2: exposure of a biometric access control system

In 2019, researchers found an openly accessible database belonging to Suprema's Biostar 2 platform - a biometric system for controlling physical access to premises. It was used to manage entry to offices, buildings and secured zones. Researchers reported about 23 GB of data and nearly 30 million records, including employee details, photos, access history, unencrypted credentials, and biometric templates/fingerprints of more than a million people.

This isn't a confirmed "attackers physically entered a data center using a stolen fingerprint" scenario, but it's a real and highly illustrative incident involving access-control infrastructure. A biometric leak is especially dangerous because a password can be changed, but a fingerprint can't. If biometric data is used for access to critical facilities, compromising the related system becomes a risk not just to privacy, but to physical security as well. (https://www.bbc.com/news/technology-49343774)

## 5. Breach of the Philippine election commission database: PII and 15.8 million fingerprints

In 2016, the systems of the Philippine election commission - Comelec - were compromised. After the website was defaced, attackers published a database of about 338-340 GB. It contained personal data of approximately 54-55 million registered voters: full names, birth dates, addresses, contact details, as well as information on overseas voters, including passport data. A Trend Micro investigation also found about 15.8 million fingerprint records.

This case demonstrates the scale of consequences from compromising a centralized store of sensitive data. Such datasets enable precise spear phishing, identity fraud, account-recovery attacks and long-term correlation of data about people. Biometric identifiers remain a problem for years: they can't be "reissued" as easily as a password or an access token. (https://www.theguardian.com/technology/2016/apr/11/philippine-electoral-records-breached-government-hack)

> Belyaev DNT does not replace EDR, antivirus, MFA, a password manager or an enterprise security system. It's an additional protection layer in the browser - at the exact point where a user opens links, enters data and interacts with web services.
