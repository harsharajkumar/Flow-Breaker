# Flow Breaker Mobile

React Native / Expo version of Flow Breaker with:

- no login
- no subscription
- on-device local data only
- Emergency Shield
- 21-day domain lock vault
- risk-hour pattern radar
- Bhagavad Gita motivation
- focus timer
- goals + trigger journal

## Run on your phone today

From `mobile-app/`:

```bash
npm install
npx expo install expo-notifications @react-native-async-storage/async-storage
npm start
```

Then scan the QR code with Expo Go on your phone.

## Fastest iPhone install path today

For same-day phone testing on April 2, 2026, Expo Go or a TestFlight build is
faster than waiting for a public App Store review.

Public App Store release still requires:

1. Apple Developer Program account
2. App Store Connect app record
3. EAS/iOS build upload
4. Apple review approval

## Important blocker note

This React Native app stores your 21-day lock rules and learns risk-hour patterns,
but a normal Expo app cannot force Safari and every other browser app to obey
those rules system-wide on iPhone by itself.

To get true iPhone-wide website enforcement, the next build step is a native iOS
content blocker / Screen Time style extension target. The current app is ready
as the core UI + local brain.
