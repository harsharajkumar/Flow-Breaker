# Flow Breaker

Flow Breaker is a focus and self-control system built around one principle:
your goals matter more than temporary urges.

This workspace now includes:

- A full web app / PWA dashboard in the project root.
- A Chrome/Edge extension in `extension/` that enforces Emergency Shield and
  21-day domain locks in the browser.
- A React Native / Expo mobile app in `mobile-app/` with no login, no
  subscription, local-only storage, pattern radar, and Bhagavad Gita reminders.

## Features

- Emergency Urge Shield that bulk-locks a curated adult-domain list for 21 days.
- Manual website locking for 21 days with no early-unlock button in the UI.
- Auto-detection in the browser extension that scans domain/title/page text for
  clear adult-content signals, skips recovery/therapy pages, and locks the
  domain for 21 days.
- Deep work timer with 25 / 50 / 90 minute sessions.
- Distraction parking list during focus sessions.
- Goal engine with top-3 priorities and completion tracking.
- Trigger journal for urge pattern tracking.
- Danger Pattern Radar that learns your repeated risk hours and gives a Gita-based action reminder.
- Accountability partner storage and weekly report copy.
- Shame-free slip logging with streak reset.
- Local AI Coach Lite that generates a private reset plan from your current goals and recent triggers.
- PWA manifest + service worker for installable app behavior.

## Run the web app

From this folder:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

You can also open `index.html` directly, but serving over localhost is better for
PWA/service-worker behavior.

## Install the blocker extension

1. Open Chrome or Edge.
2. Go to `chrome://extensions`.
3. Enable Developer Mode.
4. Click “Load unpacked”.
5. Select the `extension/` folder from this project.

After that:

- Press the extension’s Emergency Shield button to lock the adult-domain list immediately.
- Enter any domain in the extension popup to lock it for the next 21 days.
- If you visit a page that is clearly detected as porn/adult content, the
  extension auto-locks that domain for 21 days and redirects to the Flow Breaker
  block screen.
- Locked domains redirect to the Flow Breaker block page.
- Blocked redirects and Emergency Shield presses are timestamped so the extension can learn risky hours and send a proactive Gita reminder in that window.
- Expired locks are automatically cleaned; no early-unlock UI is provided.

If the extension is already installed and you change files in `extension/`, open
`chrome://extensions` and click the extension’s reload button.

## Important technical note

The web app manages your goals, journal, timer, and local block rules, but a normal
website alone cannot force every other browser tab or mobile app to obey those
rules.

That is why this project also includes the browser extension for real browser-level
blocking. If you want device-wide phone protection next, the next step is a
native Android/iOS blocker using Screen Time / Device Admin / local VPN or DNS
filtering.

## Run the mobile app on your phone

From `mobile-app/`:

```bash
npm install
npx expo install expo-notifications @react-native-async-storage/async-storage
npm start
```

Scan the QR code with Expo Go.

### App Store note

For today, April 2, 2026, Expo Go or TestFlight is the fastest way to install
on your own phone immediately. A public App Store listing still depends on Apple
review and an Apple Developer Program account, so same-day public release is not
guaranteed.

## Suggested next upgrades

- Add a backend login system and encrypted sync.
- Sync the web app’s pattern radar and the extension’s blocked-attempt radar into one shared profile.
- Add a trusted accountability email/SMS sender.
- Build a native Android app with VPN/DNS-based blocking.
- Add a custom AI coach backed by a private model API.
# Flow-Breaker
