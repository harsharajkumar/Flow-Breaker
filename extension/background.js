const LOCK_DAYS = 21;
const LOCK_DURATION_MS = LOCK_DAYS * 24 * 60 * 60 * 1000;
const RISK_LOOKBACK_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_RISK_EVENTS = 500;
const STORAGE_LOCKS_KEY = "flowBreakerLocks";
const STORAGE_META_KEY = "flowBreakerMeta";
const STORAGE_EVENTS_KEY = "flowBreakerRiskEvents";
const CLEANUP_ALARM = "flow-breaker-cleanup";
const RISK_REMINDER_ALARM = "flow-breaker-risk-reminder";

const EMERGENCY_DOMAINS = [
  "pornhub.com",
  "xvideos.com",
  "xnxx.com",
  "redtube.com",
  "youporn.com",
  "xhamster.com",
  "spankbang.com",
  "tube8.com",
  "eporner.com",
  "brazzers.com",
  "onlyfans.com",
  "chaturbate.com",
  "cam4.com",
  "bongacams.com",
  "stripchat.com",
  "livejasmin.com",
  "manyvids.com",
  "erome.com",
  "tnaflix.com",
  "drtuber.com",
  "gotporn.com",
  "hqporner.com",
  "beeg.com",
  "motherless.com",
  "literotica.com",
];

const GITA_LIBRARY = [
  {
    verse: "Bhagavad Gita 2.47",
    line:
      "Your power is in the action you choose now, not in obeying every reward signal.",
    practice:
      "Leave the tab, sit upright, and do one 5-minute task from your highest goal.",
  },
  {
    verse: "Bhagavad Gita 6.5",
    line:
      "Raise yourself through your own mind; do not let the mind become your enemy.",
    practice:
      "Put the phone away, take 10 calm breaths, and restart with one clean action.",
  },
  {
    verse: "Bhagavad Gita 2.14",
    line:
      "Pleasure and discomfort are passing waves; steadiness matters more than reaction.",
    practice:
      "Delay for 90 seconds, walk to another room, drink water, and let the urge fall.",
  },
  {
    verse: "Bhagavad Gita 3.8",
    line:
      "Do the duty in front of you; focused action is better than drifting in avoidance.",
    practice:
      "Write one sentence about the task you are avoiding and begin that exact task now.",
  },
  {
    verse: "Bhagavad Gita 2.48",
    line:
      "Stay balanced in discomfort and success; that steady discipline is real strength.",
    practice:
      "Reset posture, slow your breathing, and work for 10 minutes without negotiating.",
  },
];

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(CLEANUP_ALARM, { periodInMinutes: 60 });
  chrome.alarms.create(RISK_REMINDER_ALARM, { periodInMinutes: 15 });
  syncRules();
  maybeSendRiskReminder();
});

chrome.runtime.onStartup.addListener(() => {
  syncRules();
  maybeSendRiskReminder();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === CLEANUP_ALARM) {
    syncRules();
  }

  if (alarm.name === RISK_REMINDER_ALARM) {
    maybeSendRiskReminder();
  }
});

chrome.notifications.onClicked.addListener((notificationId) => {
  if (!notificationId.startsWith("flow-breaker-risk-")) {
    return;
  }

  chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message)
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((error) =>
      sendResponse({
        ok: false,
        error: error?.message || "Flow Breaker extension request failed.",
      })
    );

  return true;
});

async function handleMessage(message) {
  switch (message?.type) {
    case "LOCK_EMERGENCY":
      await lockDomains(EMERGENCY_DOMAINS, "Emergency Shield");
      await recordRiskEvent(
        "Emergency Shield",
        "Emergency Shield pressed in extension"
      );
      break;
    case "LOCK_DOMAIN":
      await lockDomains([message.domain], "Manual 21-day lock");
      break;
    case "AUTO_DETECT_ADULT_SITE":
      await lockDomains([message.domain], "Auto-detected adult page");
      await recordRiskEvent(
        "Auto-detected block",
        message.note || `Auto-detected adult page: ${message.domain}`
      );
      break;
    case "LOG_BLOCKED_PAGE_VIEW":
      await recordRiskEvent(
        "Blocked site attempt",
        message.note || "Blocked redirect page opened"
      );
      break;
    case "GET_STATUS":
      break;
    default:
      throw new Error("Unknown extension request.");
  }

  return getStatusPayload();
}

async function getState() {
  const data = await chrome.storage.local.get([
    STORAGE_LOCKS_KEY,
    STORAGE_META_KEY,
    STORAGE_EVENTS_KEY,
  ]);
  const locks = Array.isArray(data[STORAGE_LOCKS_KEY])
    ? data[STORAGE_LOCKS_KEY]
    : [];
  const events = Array.isArray(data[STORAGE_EVENTS_KEY])
    ? data[STORAGE_EVENTS_KEY]
    : [];
  const meta = {
    nextRuleId: 1000,
    lastRiskReminderKey: "",
    ...(data[STORAGE_META_KEY] || {}),
  };

  return { locks, events, meta };
}

async function saveState(locks, events, meta) {
  await chrome.storage.local.set({
    [STORAGE_LOCKS_KEY]: locks,
    [STORAGE_EVENTS_KEY]: events,
    [STORAGE_META_KEY]: meta,
  });
}

function normalizeDomain(input) {
  const trimmed = String(input || "")
    .trim()
    .toLowerCase();

  if (!trimmed) {
    return "";
  }

  try {
    const candidate = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    const parsed = new URL(candidate);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return trimmed
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .trim();
  }
}

function formatHourLabel(hour) {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return date.toLocaleTimeString([], { hour: "numeric" });
}

function formatHourWindow(hour) {
  return `${formatHourLabel(hour)}-${formatHourLabel((hour + 1) % 24)}`;
}

function pickGitaCard(hour) {
  return GITA_LIBRARY[Math.abs(hour % GITA_LIBRARY.length)];
}

function buildPatternSummary(events) {
  const cutoff = Date.now() - RISK_LOOKBACK_MS;
  const currentHour = new Date().getHours();
  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: 0,
    shieldCount: 0,
    attemptCount: 0,
    labels: [],
  }));

  events
    .filter((eventItem) => eventItem.createdAt >= cutoff)
    .forEach((eventItem) => {
      const bucket = buckets[eventItem.hour];
      bucket.count += 1;

      if (eventItem.eventType === "Emergency Shield") {
        bucket.shieldCount += 1;
      }

      if (eventItem.eventType === "Blocked site attempt") {
        bucket.attemptCount += 1;
      }

      if (eventItem.eventType === "Auto-detected block") {
        bucket.attemptCount += 1;
      }

      if (eventItem.label && !bucket.labels.includes(eventItem.label)) {
        bucket.labels.push(eventItem.label);
      }
    });

  const rankedHours = buckets
    .filter((bucket) => bucket.count > 0)
    .sort((a, b) => b.count - a.count || a.hour - b.hour)
    .slice(0, 5)
    .map((bucket) => ({
      ...bucket,
      window: formatHourWindow(bucket.hour),
    }));
  const currentBucket = buckets[currentHour];
  const gitaCard = pickGitaCard(currentHour);
  const nextRiskWindow = rankedHours[0]
    ? formatHourWindow(rankedHours[0].hour)
    : "No learned window yet";

  return {
    currentHour,
    currentWindow: formatHourWindow(currentHour),
    currentCount: currentBucket.count,
    rankedHours,
    nextRiskWindow,
    gitaCard,
    insight:
      currentBucket.count > 0
        ? `${currentBucket.count} past urge signal(s) happened around ${formatHourWindow(
            currentHour
          )}. Do this now: ${gitaCard.practice}`
        : rankedHours[0]
          ? `Your strongest learned risk window is ${nextRiskWindow}. Prepare early with this action: ${gitaCard.practice}`
          : "No pattern learned yet. Press Emergency Shield or let blocked redirects get logged honestly.",
  };
}

async function recordRiskEvent(eventType, label) {
  const now = Date.now();
  const cutoff = now - RISK_LOOKBACK_MS;
  const { locks, events, meta } = await getState();
  const nextEvents = [
    {
      id: `event-${now}-${Math.random().toString(16).slice(2)}`,
      eventType,
      label,
      hour: new Date(now).getHours(),
      createdAt: now,
    },
    ...events,
  ]
    .filter((eventItem) => eventItem.createdAt >= cutoff)
    .slice(0, MAX_RISK_EVENTS);

  await saveState(locks, nextEvents, meta);
}

async function lockDomains(domains, source) {
  const now = Date.now();
  const { locks, events, meta } = await getState();
  const activeMap = new Map(
    locks
      .filter((lock) => lock.expiresAt > now)
      .map((lock) => [lock.domain, lock])
  );
  let nextRuleId = Number(meta.nextRuleId) || 1000;

  domains.forEach((domainInput) => {
    const domain = normalizeDomain(domainInput);
    if (!domain) {
      return;
    }

    const expiresAt = now + LOCK_DURATION_MS;
    const existing = activeMap.get(domain);

    if (existing) {
      existing.expiresAt = Math.max(existing.expiresAt, expiresAt);
      existing.updatedAt = now;
      existing.source = source;
      activeMap.set(domain, existing);
      return;
    }

    activeMap.set(domain, {
      id: nextRuleId,
      domain,
      source,
      createdAt: now,
      updatedAt: now,
      expiresAt,
    });
    nextRuleId += 1;
  });

  const nextLocks = [...activeMap.values()].sort((a, b) => a.expiresAt - b.expiresAt);
  await saveState(nextLocks, events, { ...meta, nextRuleId });
}

async function syncRules() {
  const now = Date.now();
  const { locks, events, meta } = await getState();
  const activeLocks = locks.filter((lock) => lock.expiresAt > now);

  await saveState(activeLocks, events, meta);

  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existingRules.map((rule) => rule.id);
  const addRules = activeLocks.map((lock) => ({
    id: lock.id,
    priority: 1,
    action: {
      type: "redirect",
      redirect: {
        extensionPath: "/blocked.html",
      },
    },
    condition: {
      urlFilter: `||${lock.domain}^`,
      resourceTypes: ["main_frame"],
    },
  }));

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules,
  });

  return activeLocks;
}

async function maybeSendRiskReminder() {
  const { locks, events, meta } = await getState();
  const summary = buildPatternSummary(events);
  const todayKey = new Date().toDateString();
  const hasPriorDayPattern = events.some(
    (eventItem) =>
      eventItem.hour === summary.currentHour &&
      new Date(eventItem.createdAt).toDateString() !== todayKey
  );
  const reminderKey = `${todayKey}-${summary.currentHour}`;

  if (
    summary.currentCount === 0 ||
    !hasPriorDayPattern ||
    meta.lastRiskReminderKey === reminderKey
  ) {
    return;
  }

  try {
    await chrome.notifications.create(`flow-breaker-risk-${reminderKey}`, {
      type: "basic",
      iconUrl: "icon128.png",
      title: `Flow Breaker: danger window ${summary.currentWindow}`,
      message: `${summary.gitaCard.practice} Gita ${summary.gitaCard.verse}: ${summary.gitaCard.line}`,
      priority: 2,
    });
  } catch (error) {
    console.info("Flow Breaker risk reminder skipped.", error);
  }

  await saveState(locks, events, {
    ...meta,
    lastRiskReminderKey: reminderKey,
  });
}

async function getStatusPayload() {
  const locks = await syncRules();
  const { events } = await getState();
  const pattern = buildPatternSummary(events);

  return {
    locks,
    pattern,
    shieldActive: locks.some((lock) => lock.source === "Emergency Shield"),
  };
}
