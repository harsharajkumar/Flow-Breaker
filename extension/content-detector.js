const FLOW_BREAKER_SAFE_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "docs.expo.dev",
  "developer.chrome.com",
]);

const SAFE_CONTEXT_PATTERN =
  /\b(quit porn|porn addiction recovery|porn addiction|nofap|therapy|therapist|counseling|counselling|mental health|recovery program|support group|bhagavad gita|flow breaker)\b/i;

const HOST_ADULT_PATTERN =
  /(^|[.\-_])(porn|xxx|sex|sexy|nude|nudes|naked|hentai|erotic|escort|camgirl|camsex|onlyfans|xvideos|xnxx|xhamster|redtube|brazzers|spankbang|chaturbate|bongacams|stripchat|eporner|youporn|tube8|beeg|motherless|tnaflix|drtuber|hqporner|nsfw)([.\-_]|$)/i;

const CONTENT_PATTERNS = [
  {
    pattern:
      /\b(free porn|watch porn|xxx videos|sex videos|nude pics|hot nudes|cam sex|live sex|adult videos|hentai porn|onlyfans leaks)\b/i,
    score: 5,
  },
  {
    pattern:
      /\b(blowjob|handjob|anal|hardcore|fetish|milf|bdsm|cumshot|orgasm|pussy|dick|boobs|tits|lesbian porn)\b/i,
    score: 3,
  },
  {
    pattern:
      /\b(18\+|nsfw|explicit adult|uncensored sex|adult entertainment)\b/i,
    score: 2,
  },
];

let flowBreakerDetectorRunning = false;

function shouldSkipHost(hostname) {
  if (!hostname) {
    return true;
  }

  if (FLOW_BREAKER_SAFE_HOSTS.has(hostname)) {
    return true;
  }

  return (
    hostname.endsWith(".gov") ||
    hostname.endsWith(".edu") ||
    (hostname.endsWith(".org") &&
      /therapy|recovery|support|health/i.test(hostname))
  );
}

function getMetaText() {
  const title = document.title || "";
  const description =
    document
      .querySelector('meta[name="description"], meta[property="og:description"]')
      ?.getAttribute("content") || "";
  const keywords =
    document.querySelector('meta[name="keywords"]')?.getAttribute("content") || "";
  const bodyText = (document.body?.innerText || "").slice(0, 12000);

  return `${title}\n${description}\n${keywords}\n${bodyText}`;
}

function scoreAdultContent(hostname, pathname, pageText) {
  let score = 0;
  const reasons = [];
  const normalizedHost = hostname.replace(/^www\./, "");

  if (HOST_ADULT_PATTERN.test(normalizedHost)) {
    score += 6;
    reasons.push(`adult keyword in domain: ${normalizedHost}`);
  }

  if (/(^|[/?#&=_-])(porn|xxx|hentai|nsfw|sex)([/?#&=_-]|$)/i.test(pathname)) {
    score += 3;
    reasons.push("adult keyword in URL path");
  }

  CONTENT_PATTERNS.forEach((rule) => {
    if (rule.pattern.test(pageText)) {
      score += rule.score;
      reasons.push(`page text matched ${rule.pattern.source.slice(0, 40)}...`);
    }
  });

  return { score, reasons, normalizedHost };
}

function sendDetectorMessage(payload) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(payload, (response) => {
      if (chrome.runtime.lastError || !response?.ok) {
        resolve(null);
        return;
      }

      resolve(response);
    });
  });
}

async function runAdultDetector() {
  if (flowBreakerDetectorRunning) {
    return;
  }

  flowBreakerDetectorRunning = true;
  try {
    const hostname = window.location.hostname.replace(/^www\./, "");
    const pathname = `${window.location.pathname}${window.location.search}`;

    if (shouldSkipHost(hostname)) {
      return;
    }

    const pageText = getMetaText();

    if (
      SAFE_CONTEXT_PATTERN.test(pageText) ||
      SAFE_CONTEXT_PATTERN.test(hostname)
    ) {
      return;
    }

    const detection = scoreAdultContent(hostname, pathname, pageText);

    if (detection.score < 6) {
      return;
    }

    const response = await sendDetectorMessage({
      type: "AUTO_DETECT_ADULT_SITE",
      domain: detection.normalizedHost,
      note: `Auto-detected ${detection.normalizedHost} | score ${
        detection.score
      } | ${detection.reasons.join("; ")}`,
    });

    if (response?.ok !== false) {
      window.location.assign(chrome.runtime.getURL("blocked.html"));
    }
  } finally {
    flowBreakerDetectorRunning = false;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", runAdultDetector, { once: true });
} else {
  runAdultDetector();
}

setInterval(runAdultDetector, 4000);
