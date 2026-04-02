# Flow Breaker Shield Chrome Web Store Release

## What is ready

- Manifest V3 extension code in `extension/`
- PNG icon set in `extension/icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`
- Emergency Shield manual blocking
- Auto-detection + 21-day auto-locking
- Local-only risk-hour learning
- Bhagavad Gita motivation and reminders

## Build upload ZIP

From the project root:

```bash
mkdir -p release
cd extension
zip -r -X ../release/flow-breaker-shield-v1.0.0.zip .
```

Upload `release/flow-breaker-shield-v1.0.0.zip` to the Chrome Developer
Dashboard.

## Chrome Web Store submission steps

Google’s publishing flow is:

1. Register a Chrome Web Store developer account.
2. Open the Chrome Developer Dashboard.
3. Click **Add new item**.
4. Upload the extension ZIP.
5. Fill **Store Listing**, **Privacy**, **Distribution**, and **Test Instructions**.
6. Submit for review.

Official docs:

- [Publish in the Chrome Web Store](https://developer.chrome.com/docs/webstore/publish/)
- [Prepare your extension](https://developer.chrome.com/docs/webstore/prepare/)
- [Chrome Web Store Program Policies](https://developer.chrome.com/docs/webstore/program-policies/policies)

## Store listing draft

### Name

Flow Breaker Shield

### Short description

Emergency adult-site blocking, 21-day website locks, risk-hour detection, and
Gita-based focus reminders.

### Detailed description

Flow Breaker Shield helps people interrupt destructive browsing loops and return
to meaningful work.

Core features:

- One-tap Emergency Shield that instantly locks a curated adult-site list
- Auto-detection of clearly adult pages and 21-day domain locking
- Manual domain locking for 21 days with no early-unlock button
- Block-page redirect with a 60-second reset protocol
- Local pattern learning that identifies high-risk hours
- Bhagavad Gita-based motivational reminders during learned risk windows

Privacy-first design:

- No login
- No subscription
- No remote tracking or analytics
- Risk history and lock data stay in local Chrome extension storage

## Privacy tab draft

### Single purpose

Help users avoid adult-content browsing and protect focus by blocking websites,
learning risky time windows locally, and showing recovery-oriented reminders.

### Host permission justification

The extension requests access to all sites so it can detect clearly adult pages
regardless of domain, auto-lock those domains for 21 days, and redirect blocked
pages to Flow Breaker’s reset screen.

### Data usage disclosure

The extension analyzes domain names, page titles, and page text locally in the
browser to detect adult-content pages. It stores only local block rules and
timestamped risk events in `chrome.storage.local`. No browsing data, journal
data, or usage analytics are transmitted to an external server.

## Test instructions draft

1. Load the extension and click the toolbar icon.
2. Press **Emergency Shield** and confirm the default adult-site list appears in
   Active blocked domains.
3. Manually add a test domain and verify it receives a 21-day lock.
4. Open a clearly adult domain and verify the extension redirects to
   `blocked.html`.
5. Open the popup again and confirm Pattern Radar shows the detected risk-hour
   signal and a Bhagavad Gita reminder.

## Review timing note

Google’s docs say most extensions are reviewed within about three days, but
review can take longer depending on complexity and policy checks, so public
availability is not guaranteed the same day you submit.
