import {
  DEFAULT_GOALS,
  EMERGENCY_DOMAINS,
  GITA_LIBRARY,
  LOCK_DURATION_MS,
  MAX_RISK_EVENTS,
  RISK_LOOKBACK_MS,
} from "../data/flowContent";

function createId(prefix = "flow") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toDateKey(timestamp) {
  return new Date(timestamp).toDateString();
}

function formatHour(hour) {
  const safeHour = ((hour % 24) + 24) % 24;
  const period = safeHour >= 12 ? "PM" : "AM";
  const hour12 = safeHour % 12 === 0 ? 12 : safeHour % 12;
  return `${hour12} ${period}`;
}

export function formatHourWindow(hour) {
  return `${formatHour(hour)} - ${formatHour(hour + 1)}`;
}

export function formatCountdown(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, "0");
  const seconds = String(safeSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function normalizeDomain(input) {
  const trimmed = String(input || "")
    .trim()
    .toLowerCase();

  if (!trimmed) {
    return "";
  }

  try {
    const candidate = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    return new URL(candidate).hostname.replace(/^www\./, "");
  } catch {
    return trimmed
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .trim();
  }
}

export function createInitialState(now = Date.now()) {
  return {
    createdAt: now,
    shield: {
      activeUntil: null,
      lastActivatedAt: null,
      lastWinAt: null,
    },
    focus: {
      selectedMinutes: 25,
      remainingSeconds: 25 * 60,
      running: false,
      sessions: [],
    },
    goals: DEFAULT_GOALS.map((goal, index) => ({
      id: createId(`goal-${index}`),
      title: goal.title,
      horizon: goal.horizon,
      area: goal.area,
      completed: false,
      createdAt: now + index,
    })),
    locks: [],
    journal: [],
    patterns: {
      events: [],
      verseIndex: 0,
    },
    stats: {
      urgesBeaten: 0,
      slipCount: 0,
      lastSlipAt: null,
    },
  };
}

export function sanitizeLoadedState(rawState, fallbackState = createInitialState()) {
  if (!rawState || typeof rawState !== "object") {
    return fallbackState;
  }

  return {
    ...fallbackState,
    ...rawState,
    shield: {
      ...fallbackState.shield,
      ...(rawState.shield || {}),
    },
    focus: {
      ...fallbackState.focus,
      ...(rawState.focus || {}),
      sessions: Array.isArray(rawState.focus?.sessions) ? rawState.focus.sessions : [],
    },
    goals: Array.isArray(rawState.goals) ? rawState.goals : fallbackState.goals,
    locks: Array.isArray(rawState.locks) ? rawState.locks : [],
    journal: Array.isArray(rawState.journal) ? rawState.journal : [],
    patterns: {
      ...fallbackState.patterns,
      ...(rawState.patterns || {}),
      events: Array.isArray(rawState.patterns?.events)
        ? rawState.patterns.events
        : [],
    },
    stats: {
      ...fallbackState.stats,
      ...(rawState.stats || {}),
    },
  };
}

export function getActiveLocks(appState, now = Date.now()) {
  return [...(appState.locks || [])]
    .filter((lock) => lock.expiresAt > now)
    .sort((left, right) => left.expiresAt - right.expiresAt);
}

export function pruneExpiredLocks(appState, now = Date.now()) {
  return {
    ...appState,
    locks: getActiveLocks(appState, now),
    shield: {
      ...appState.shield,
      activeUntil:
        appState.shield.activeUntil && appState.shield.activeUntil > now
          ? appState.shield.activeUntil
          : null,
    },
  };
}

export function getCurrentStreakDays(appState, now = Date.now()) {
  const streakStart = appState.stats.lastSlipAt || appState.createdAt || now;
  return Math.max(0, Math.floor((now - streakStart) / (24 * 60 * 60 * 1000)));
}

export function getTodayFocusMinutes(appState, now = Date.now()) {
  const todayKey = toDateKey(now);
  return (appState.focus.sessions || [])
    .filter((session) => toDateKey(session.completedAt) === todayKey)
    .reduce((total, session) => total + session.minutes, 0);
}

export function getTopGoals(appState) {
  return [...(appState.goals || [])]
    .sort((left, right) => {
      if (left.completed !== right.completed) {
        return Number(left.completed) - Number(right.completed);
      }
      return right.createdAt - left.createdAt;
    })
    .slice(0, 3);
}

export function addRiskEvent(appState, eventType, label, now = Date.now()) {
  const cutoff = now - RISK_LOOKBACK_MS;
  const nextEvents = [
    {
      id: createId("event"),
      eventType,
      label,
      hour: new Date(now).getHours(),
      createdAt: now,
    },
    ...(appState.patterns?.events || []),
  ]
    .filter((eventItem) => eventItem.createdAt >= cutoff)
    .slice(0, MAX_RISK_EVENTS);

  return {
    ...appState,
    patterns: {
      ...(appState.patterns || {}),
      events: nextEvents,
    },
  };
}

export function lockDomainFor21Days(
  appState,
  rawDomain,
  source = "Manual 21-day lock",
  now = Date.now()
) {
  const domain = normalizeDomain(rawDomain);

  if (!domain) {
    return pruneExpiredLocks(appState, now);
  }

  const activeLocks = getActiveLocks(appState, now);
  const existingLock = activeLocks.find((lock) => lock.domain === domain);
  const expiresAt = now + LOCK_DURATION_MS;

  const nextLocks = existingLock
    ? activeLocks.map((lock) =>
        lock.domain === domain
          ? {
              ...lock,
              source,
              updatedAt: now,
              expiresAt: Math.max(lock.expiresAt, expiresAt),
            }
          : lock
      )
    : [
        {
          id: createId("lock"),
          domain,
          source,
          createdAt: now,
          updatedAt: now,
          expiresAt,
        },
        ...activeLocks,
      ];

  return {
    ...pruneExpiredLocks(appState, now),
    locks: nextLocks.sort((left, right) => left.expiresAt - right.expiresAt),
  };
}

export function activateEmergencyShield(appState, now = Date.now()) {
  const lockedState = EMERGENCY_DOMAINS.reduce(
    (nextState, domain) =>
      lockDomainFor21Days(nextState, domain, "Emergency Shield", now),
    appState
  );
  const withPattern = addRiskEvent(
    lockedState,
    "Emergency Shield",
    "Emergency Shield pressed",
    now
  );

  return {
    ...withPattern,
    shield: {
      ...withPattern.shield,
      activeUntil: now + LOCK_DURATION_MS,
      lastActivatedAt: now,
    },
    focus: {
      ...withPattern.focus,
      running: false,
    },
  };
}

export function markUrgeVictory(appState, now = Date.now()) {
  return {
    ...appState,
    shield: {
      ...appState.shield,
      lastWinAt: now,
    },
    stats: {
      ...appState.stats,
      urgesBeaten: (appState.stats.urgesBeaten || 0) + 1,
    },
    journal: [
      {
        id: createId("journal"),
        context: "Emergency Shield used and urge defeated",
        mood: "Determined",
        intensity: 7,
        response: "Moved away from the phone and returned to a goal task.",
        createdAt: now,
      },
      ...(appState.journal || []),
    ],
  };
}

export function addGoal(appState, title, horizon = "Today", area = "Discipline", now = Date.now()) {
  const cleanTitle = String(title || "").trim();

  if (!cleanTitle) {
    return appState;
  }

  return {
    ...appState,
    goals: [
      {
        id: createId("goal"),
        title: cleanTitle,
        horizon,
        area,
        completed: false,
        createdAt: now,
      },
      ...(appState.goals || []),
    ],
  };
}

export function toggleGoal(appState, goalId) {
  return {
    ...appState,
    goals: (appState.goals || []).map((goal) =>
      goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
    ),
  };
}

export function addJournalEntry(
  appState,
  context,
  mood,
  intensity,
  response,
  now = Date.now()
) {
  const nextState = {
    ...appState,
    journal: [
      {
        id: createId("journal"),
        context: String(context || "").trim(),
        mood,
        intensity,
        response: String(response || "").trim(),
        createdAt: now,
      },
      ...(appState.journal || []),
    ],
  };

  return addRiskEvent(nextState, "Trigger Journal", String(context || "").trim(), now);
}

export function logSlip(appState, now = Date.now()) {
  const nextState = {
    ...appState,
    stats: {
      ...appState.stats,
      slipCount: (appState.stats.slipCount || 0) + 1,
      lastSlipAt: now,
    },
    journal: [
      {
        id: createId("journal"),
        context: "Slip logged and recovery reset started",
        mood: "Committed",
        intensity: 6,
        response:
          "Reset immediately without shame and returned to the shield and focus system.",
        createdAt: now,
      },
      ...(appState.journal || []),
    ],
  };

  return addRiskEvent(nextState, "Slip Reset", "Slip reset logged", now);
}

export function updateFocusPreset(appState, minutes) {
  return {
    ...appState,
    focus: {
      ...appState.focus,
      selectedMinutes: minutes,
      remainingSeconds: minutes * 60,
      running: false,
    },
  };
}

export function startFocus(appState) {
  return {
    ...appState,
    focus: {
      ...appState.focus,
      running: true,
    },
  };
}

export function pauseFocus(appState) {
  return {
    ...appState,
    focus: {
      ...appState.focus,
      running: false,
    },
  };
}

export function resetFocus(appState) {
  return {
    ...appState,
    focus: {
      ...appState.focus,
      running: false,
      remainingSeconds: appState.focus.selectedMinutes * 60,
    },
  };
}

export function tickFocus(appState, now = Date.now()) {
  if (!appState.focus.running) {
    return appState;
  }

  const nextSeconds = Math.max(0, appState.focus.remainingSeconds - 1);

  if (nextSeconds > 0) {
    return {
      ...appState,
      focus: {
        ...appState.focus,
        remainingSeconds: nextSeconds,
      },
    };
  }

  return {
    ...appState,
    focus: {
      ...appState.focus,
      running: false,
      remainingSeconds: appState.focus.selectedMinutes * 60,
      sessions: [
        ...(appState.focus.sessions || []),
        {
          id: createId("session"),
          minutes: appState.focus.selectedMinutes,
          completedAt: now,
        },
      ],
    },
  };
}

export function cycleGitaVerse(appState) {
  return {
    ...appState,
    patterns: {
      ...(appState.patterns || {}),
      verseIndex:
        ((Number(appState.patterns?.verseIndex) || 0) + 1) % GITA_LIBRARY.length,
    },
  };
}

export function getPatternRadar(appState, now = Date.now()) {
  const cutoff = now - RISK_LOOKBACK_MS;
  const currentHour = new Date(now).getHours();
  const currentDateKey = toDateKey(now);
  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    window: formatHourWindow(hour),
    count: 0,
    shieldCount: 0,
    journalCount: 0,
    slipCount: 0,
    labels: [],
    hasPriorDaySignal: false,
  }));

  (appState.patterns?.events || [])
    .filter((eventItem) => eventItem.createdAt >= cutoff)
    .forEach((eventItem) => {
      const bucket = buckets[eventItem.hour];
      bucket.count += 1;
      bucket.shieldCount += eventItem.eventType === "Emergency Shield" ? 1 : 0;
      bucket.journalCount += eventItem.eventType === "Trigger Journal" ? 1 : 0;
      bucket.slipCount += eventItem.eventType === "Slip Reset" ? 1 : 0;
      bucket.hasPriorDaySignal =
        bucket.hasPriorDaySignal ||
        toDateKey(eventItem.createdAt) !== currentDateKey;

      if (eventItem.label && !bucket.labels.includes(eventItem.label)) {
        bucket.labels.push(eventItem.label);
      }
    });

  const rankedHours = buckets
    .filter((bucket) => bucket.count > 0)
    .sort((left, right) => right.count - left.count || left.hour - right.hour)
    .slice(0, 5);

  const currentBucket = buckets[currentHour];
  const gitaCard =
    GITA_LIBRARY[
      Math.abs(((appState.patterns?.verseIndex || 0) + currentHour) % GITA_LIBRARY.length)
    ];
  const topGoal =
    (appState.goals || []).find((goal) => !goal.completed)?.title ||
    "one meaningful goal task";
  const reminderHours = rankedHours.filter((bucket) => bucket.hasPriorDaySignal);

  return {
    currentBucket,
    rankedHours,
    reminderHours,
    gitaCard,
    riskBadge:
      currentBucket.count > 0 && currentBucket.hasPriorDaySignal
        ? "RISK HOUR NOW"
        : reminderHours.length
          ? "GUARD ACTIVE"
          : "LEARNING",
    insight:
      currentBucket.count > 0 && currentBucket.hasPriorDaySignal
        ? `${currentBucket.window} is a learned danger window. Do this now: ${gitaCard.practice}`
        : rankedHours[0]
          ? `Top risk window so far: ${rankedHours[0].window}. Prepare with: ${gitaCard.practice}`
          : "No pattern yet. Press Emergency Shield honestly and log triggers so the app can learn your danger hours.",
    coachPlan: `1. Remember ${gitaCard.verse}: ${gitaCard.line}
2. Do this immediately: ${gitaCard.practice}
3. Begin this task for 5 minutes: ${topGoal}
4. If the urge returns, hit Emergency Shield again and leave the phone physically.`,
  };
}
