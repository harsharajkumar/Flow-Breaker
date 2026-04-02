# Chrome Web Store Privacy Answers

Use these paste-ready answers in the Chrome Developer Dashboard.

## Single purpose description

Flow Breaker Shield helps users avoid adult-content browsing and protect focus by blocking adult websites, auto-detecting clearly adult pages, locking those domains for 21 days, and showing local recovery-oriented reminders during historically high-risk time windows.

## Permission justifications

### storage justification

Used to store the user's local 21-day block list, lock expiry timestamps, locally learned risk-hour events, and Gita reminder state in Chrome extension storage. This data stays on the user's device and is not sent to an external server.

### alarms justification

Used to periodically remove expired 21-day lock rules and to check whether the current hour matches a previously learned high-risk window so the extension can trigger a local reminder at the right time.

### notifications justification

Used to show local, non-advertising risk-hour reminders and Bhagavad Gita motivation when the current time matches a learned high-risk browsing window or when Emergency Shield is activated.

### declarativeNetRequest justification

Used to enforce the extension's website blocking rules by redirecting locked adult domains to Flow Breaker's local block screen until each domain's 21-day lock expires.

### Host permission justification

Required so the extension can run its on-page detector on any visited website, identify clearly adult pages regardless of domain, auto-lock that domain for 21 days, and redirect blocked visits to the local Flow Breaker block page. Page title, meta tags, URL path, and visible page text are analyzed locally only and are not transmitted to a server.

## Remote code

Choose: No, I am not using Remote code

Justification:

All JavaScript, HTML, CSS, and image assets are packaged inside the extension bundle. The extension does not load external scripts, remote WebAssembly, CDN code, or execute strings through eval().

## Data usage checkboxes

Select these:

- Web history
- User activity
- Website content

Do not select these, based on the current code:

- Personally identifiable information
- Health information
- Financial and payment information
- Authentication information
- Personal communications
- Location

## Certification checkboxes

Check all three:

- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

## Privacy policy

Chrome requires a privacy policy because this extension handles user data. Use the policy page in this repo:

`privacy-policy.html`

If you publish the repo with GitHub Pages, paste that public URL into the Privacy policy field.

Official Chrome docs:

- https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
- https://developer.chrome.com/docs/webstore/program-policies/quality-guidelines
- https://developer.chrome.com/docs/webstore/program-policies/privacy
