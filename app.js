const STORAGE_KEY = "flow-breaker-state-v1";
const LOCK_DAYS = 21;
const LOCK_DURATION_MS = LOCK_DAYS * 24 * 60 * 60 * 1000;
const RESCUE_SECONDS = 60;
const RISK_LOOKBACK_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_RISK_EVENTS = 500;

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
      "Your control is over disciplined action, not over chasing the reward or the urge.",
    practice:
      "Close the tempting tab, open your first priority, and do one focused 5-minute sprint.",
  },
  {
    verse: "Bhagavad Gita 6.5",
    line:
      "Lift yourself by your own mind; do not let the mind pull you downward.",
    practice:
      "Stand up, drink water, take 10 slow breaths, then restart the focus timer.",
  },
  {
    verse: "Bhagavad Gita 2.14",
    line:
      "Sensations come and go; stay steady and do not obey every wave that appears.",
    practice:
      "Wait 90 seconds without touching the phone and let the urge peak pass by itself.",
  },
  {
    verse: "Bhagavad Gita 3.8",
    line:
      "Do the work that must be done; purposeful action is stronger than passive drifting.",
    practice:
      "Write the exact task you are avoiding and complete the smallest possible first step now.",
  },
  {
    verse: "Bhagavad Gita 2.48",
    line:
      "Hold steadiness in success and discomfort; that balanced mind is real yoga.",
    practice:
      "Return to posture, breathe slowly, and continue your planned work block without bargaining.",
  },
];

const dom = {
  focusTodayMetric: document.querySelector("#focusTodayMetric"),
  streakMetric: document.querySelector("#streakMetric"),
  activeLocksMetric: document.querySelector("#activeLocksMetric"),
  urgeWinsMetric: document.querySelector("#urgeWinsMetric"),
  panicButton: document.querySelector("#panicButton"),
  activateEmergencyBtn: document.querySelector("#activateEmergencyBtn"),
  shieldStateTitle: document.querySelector("#shieldStateTitle"),
  shieldBadge: document.querySelector("#shieldBadge"),
  shieldMessage: document.querySelector("#shieldMessage"),
  rescueCountdown: document.querySelector("#rescueCountdown"),
  rescueSteps: document.querySelector("#rescueSteps"),
  urgeDefeatedBtn: document.querySelector("#urgeDefeatedBtn"),
  focusModeLabel: document.querySelector("#focusModeLabel"),
  focusTimerLabel: document.querySelector("#focusTimerLabel"),
  focusTimerSubtext: document.querySelector("#focusTimerSubtext"),
  presetButtons: Array.from(document.querySelectorAll(".preset-btn")),
  startFocusBtn: document.querySelector("#startFocusBtn"),
  pauseFocusBtn: document.querySelector("#pauseFocusBtn"),
  resetFocusBtn: document.querySelector("#resetFocusBtn"),
  distractionForm: document.querySelector("#distractionForm"),
  distractionNote: document.querySelector("#distractionNote"),
  distractionList: document.querySelector("#distractionList"),
  blockSiteForm: document.querySelector("#blockSiteForm"),
  siteToBlock: document.querySelector("#siteToBlock"),
  vaultStatusText: document.querySelector("#vaultStatusText"),
  blockList: document.querySelector("#blockList"),
  copyRulesBtn: document.querySelector("#copyRulesBtn"),
  goalForm: document.querySelector("#goalForm"),
  goalTitle: document.querySelector("#goalTitle"),
  goalHorizon: document.querySelector("#goalHorizon"),
  goalArea: document.querySelector("#goalArea"),
  priorityList: document.querySelector("#priorityList"),
  goalList: document.querySelector("#goalList"),
  completedGoalsMetric: document.querySelector("#completedGoalsMetric"),
  coachForm: document.querySelector("#coachForm"),
  coachPrompt: document.querySelector("#coachPrompt"),
  coachOutput: document.querySelector("#coachOutput"),
  journalForm: document.querySelector("#journalForm"),
  triggerContext: document.querySelector("#triggerContext"),
  triggerMood: document.querySelector("#triggerMood"),
  triggerIntensity: document.querySelector("#triggerIntensity"),
  triggerResponse: document.querySelector("#triggerResponse"),
  journalList: document.querySelector("#journalList"),
  journalCountMetric: document.querySelector("#journalCountMetric"),
  accountabilityForm: document.querySelector("#accountabilityForm"),
  partnerName: document.querySelector("#partnerName"),
  partnerContact: document.querySelector("#partnerContact"),
  accountabilitySummary: document.querySelector("#accountabilitySummary"),
  copyReportBtn: document.querySelector("#copyReportBtn"),
  logSlipBtn: document.querySelector("#logSlipBtn"),
  slipMetric: document.querySelector("#slipMetric"),
  installAppBtn: document.querySelector("#installAppBtn"),
  riskNudgeBadge: document.querySelector("#riskNudgeBadge"),
  riskInsightTitle: document.querySelector("#riskInsightTitle"),
  riskInsightText: document.querySelector("#riskInsightText"),
  riskHourList: document.querySelector("#riskHourList"),
  gitaQuoteText: document.querySelector("#gitaQuoteText"),
  gitaVerseMeta: document.querySelector("#gitaVerseMeta"),
  gitaPracticeText: document.querySelector("#gitaPracticeText"),
  refreshGitaBtn: document.querySelector("#refreshGitaBtn"),
};

const defaultState = () => {
  const createdAt = Date.now();

  return {
    createdAt,
    shield: {
      activeUntil: null,
      lastActivatedAt: null,
      rescueSecondsLeft: RESCUE_SECONDS,
      lastWinAt: null,
    },
    focus: {
      selectedMinutes: 50,
      remainingSeconds: 50 * 60,
      running: false,
      startedAt: null,
      sessions: [],
      distractions: [],
    },
    blocks: [],
    goals: [
      {
        id: crypto.randomUUID(),
        title: "Protect my attention and study with intensity today",
        horizon: "Today",
        area: "Discipline",
        completed: false,
        createdAt,
      },
      {
        id: crypto.randomUUID(),
        title: "Build career momentum through one meaningful project milestone",
        horizon: "This Week",
        area: "Career",
        completed: false,
        createdAt: createdAt + 1,
      },
      {
        id: crypto.randomUUID(),
        title: "Train body and mind so discipline becomes automatic",
        horizon: "This Year",
        area: "Health",
        completed: false,
        createdAt: createdAt + 2,
      },
    ],
    journal: [],
    accountability: {
      partnerName: "",
      partnerContact: "",
    },
    patterns: {
      events: [],
      lastNudgeKey: "",
      verseIndex: 0,
    },
    stats: {
      urgesBeaten: 0,
      slipCount: 0,
      lastSlipAt: null,
    },
  };
};

let state = loadState();
let focusInterval = null;
let rescueInterval = null;
let deferredInstallPrompt = null;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return defaultState();
    }

    const parsed = JSON.parse(raw);
    const merged = {
      ...defaultState(),
      ...parsed,
      shield: { ...defaultState().shield, ...parsed.shield },
      focus: { ...defaultState().focus, ...parsed.focus },
      accountability: {
        ...defaultState().accountability,
        ...parsed.accountability,
      },
      patterns: {
        ...defaultState().patterns,
        ...parsed.patterns,
      },
      stats: { ...defaultState().stats, ...parsed.stats },
    };

    merged.blocks = Array.isArray(parsed.blocks) ? parsed.blocks : [];
    merged.goals = Array.isArray(parsed.goals) ? parsed.goals : [];
    merged.journal = Array.isArray(parsed.journal) ? parsed.journal : [];
    merged.focus.sessions = Array.isArray(parsed.focus?.sessions)
      ? parsed.focus.sessions
      : [];
    merged.focus.distractions = Array.isArray(parsed.focus?.distractions)
      ? parsed.focus.distractions
      : [];
    merged.patterns.events = Array.isArray(parsed.patterns?.events)
      ? parsed.patterns.events
      : [];

    return merged;
  } catch (error) {
    console.warn("Flow Breaker state reset because saved data was invalid.", error);
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function pruneExpiredLocks() {
  const now = Date.now();
  state.blocks = state.blocks.filter((block) => block.expiresAt > now);

  if (state.shield.activeUntil && state.shield.activeUntil <= now) {
    state.shield.activeUntil = null;
  }
}

function formatCountdown(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function daysLeft(expiresAt) {
  return Math.max(1, Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)));
}

function getTodayFocusMinutes() {
  const todayKey = new Date().toDateString();
  return state.focus.sessions
    .filter((session) => new Date(session.completedAt).toDateString() === todayKey)
    .reduce((total, session) => total + session.minutes, 0);
}

function getCurrentStreakDays() {
  const streakStart = state.stats.lastSlipAt || state.createdAt;
  const elapsedMs = Date.now() - streakStart;
  return Math.max(0, Math.floor(elapsedMs / (24 * 60 * 60 * 1000)));
}

function getActiveBlocks() {
  pruneExpiredLocks();
  return [...state.blocks].sort((a, b) => a.expiresAt - b.expiresAt);
}

function formatHourLabel(hour) {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return date.toLocaleTimeString([], { hour: "numeric" });
}

function formatHourWindow(hour) {
  const nextHour = (hour + 1) % 24;
  return `${formatHourLabel(hour)}-${formatHourLabel(nextHour)}`;
}

function recordRiskEvent(eventType, label) {
  const createdAt = Date.now();
  const cutoff = createdAt - RISK_LOOKBACK_MS;

  state.patterns.events.unshift({
    id: crypto.randomUUID(),
    eventType,
    label,
    hour: new Date(createdAt).getHours(),
    createdAt,
  });

  state.patterns.events = state.patterns.events
    .filter((eventItem) => eventItem.createdAt >= cutoff)
    .slice(0, MAX_RISK_EVENTS);
}

function getRiskHourStats() {
  const cutoff = Date.now() - RISK_LOOKBACK_MS;
  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: 0,
    shieldCount: 0,
    journalCount: 0,
    labels: [],
  }));

  state.patterns.events
    .filter((eventItem) => eventItem.createdAt >= cutoff)
    .forEach((eventItem) => {
      const bucket = buckets[eventItem.hour];
      bucket.count += 1;

      if (eventItem.eventType === "Emergency Shield") {
        bucket.shieldCount += 1;
      }

      if (eventItem.eventType === "Trigger Journal") {
        bucket.journalCount += 1;
      }

      if (eventItem.label && !bucket.labels.includes(eventItem.label)) {
        bucket.labels.push(eventItem.label);
      }
    });

  const rankedHours = buckets
    .filter((bucket) => bucket.count > 0)
    .sort((a, b) => b.count - a.count || a.hour - b.hour);

  return {
    buckets,
    rankedHours,
    totalEvents: rankedHours.reduce((total, bucket) => total + bucket.count, 0),
    currentHour: new Date().getHours(),
  };
}

function getGitaCard(hourOffset = 0) {
  const baseIndex = Number(state.patterns.verseIndex) || 0;
  const index = Math.abs((baseIndex + hourOffset) % GITA_LIBRARY.length);
  return GITA_LIBRARY[index];
}

function normalizeDomain(input) {
  const trimmed = input.trim().toLowerCase();

  if (!trimmed) {
    return "";
  }

  try {
    const candidate = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    const url = new URL(candidate);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return trimmed
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .trim();
  }
}

function addBlock(domain, sourceLabel) {
  const normalized = normalizeDomain(domain);

  if (!normalized) {
    return false;
  }

  const expiresAt = Date.now() + LOCK_DURATION_MS;
  const existingBlock = state.blocks.find((block) => block.domain === normalized);

  if (existingBlock) {
    existingBlock.expiresAt = Math.max(existingBlock.expiresAt, expiresAt);
    existingBlock.source = sourceLabel;
    existingBlock.updatedAt = Date.now();
  } else {
    state.blocks.push({
      id: crypto.randomUUID(),
      domain: normalized,
      source: sourceLabel,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiresAt,
    });
  }

  return true;
}

function activateEmergencyShield() {
  const now = Date.now();
  let addedCount = 0;

  EMERGENCY_DOMAINS.forEach((domain) => {
    if (addBlock(domain, "Emergency Shield")) {
      addedCount += 1;
    }
  });

  state.shield.activeUntil = now + LOCK_DURATION_MS;
  state.shield.lastActivatedAt = now;
  state.shield.rescueSecondsLeft = RESCUE_SECONDS;
  state.focus.running = false;
  recordRiskEvent("Emergency Shield", "Emergency Shield pressed in dashboard");

  clearInterval(focusInterval);
  focusInterval = null;
  startRescueProtocol();
  saveState();
  renderAll();

  showToast(
    `Emergency Shield active. ${addedCount} adult domains are locked for 21 days and the rescue protocol has started.`
  );
}

function startRescueProtocol() {
  clearInterval(rescueInterval);
  dom.rescueCountdown.textContent = `${state.shield.rescueSecondsLeft}s`;

  rescueInterval = setInterval(() => {
    state.shield.rescueSecondsLeft = Math.max(
      0,
      state.shield.rescueSecondsLeft - 1
    );
    dom.rescueCountdown.textContent = `${state.shield.rescueSecondsLeft}s`;

    if (state.shield.rescueSecondsLeft <= 0) {
      clearInterval(rescueInterval);
      rescueInterval = null;
      dom.rescueCountdown.textContent = "Ready";
      showToast("Rescue protocol complete. Start one tiny action toward a goal now.");
    }

    saveState();
  }, 1000);
}

function markUrgeDefeated() {
  state.stats.urgesBeaten += 1;
  state.shield.lastWinAt = Date.now();
  state.journal.unshift({
    id: crypto.randomUUID(),
    context: "Emergency urge interrupted with Shield + 60-second protocol",
    mood: "Determined",
    intensity: "7",
    response: "Moved away from the screen and returned to a goal task.",
    createdAt: Date.now(),
  });
  saveState();
  renderAll();
  showToast("Logged as a win. Your identity is built by actions like this.");
}

function startFocusTimer() {
  if (state.focus.running) {
    return;
  }

  state.focus.running = true;
  state.focus.startedAt = Date.now();
  saveState();
  renderFocus();

  clearInterval(focusInterval);
  focusInterval = setInterval(() => {
    state.focus.remainingSeconds = Math.max(0, state.focus.remainingSeconds - 1);

    if (state.focus.remainingSeconds <= 0) {
      const minutes = state.focus.selectedMinutes;
      state.focus.sessions.push({
        id: crypto.randomUUID(),
        minutes,
        completedAt: Date.now(),
      });
      state.focus.running = false;
      state.focus.startedAt = null;
      state.focus.remainingSeconds = state.focus.selectedMinutes * 60;
      clearInterval(focusInterval);
      focusInterval = null;
      showToast(`Focus block complete. ${minutes} clean minutes added to today.`);
      saveState();
      renderAll();
      return;
    }

    saveState();
    renderFocus();
  }, 1000);
}

function pauseFocusTimer() {
  state.focus.running = false;
  state.focus.startedAt = null;
  clearInterval(focusInterval);
  focusInterval = null;
  saveState();
  renderFocus();
}

function resetFocusTimer() {
  state.focus.running = false;
  state.focus.startedAt = null;
  state.focus.remainingSeconds = state.focus.selectedMinutes * 60;
  clearInterval(focusInterval);
  focusInterval = null;
  saveState();
  renderFocus();
}

function setFocusPreset(minutes) {
  state.focus.selectedMinutes = minutes;
  state.focus.running = false;
  state.focus.startedAt = null;
  state.focus.remainingSeconds = minutes * 60;
  clearInterval(focusInterval);
  focusInterval = null;
  saveState();
  renderAll();
}

function renderMetrics() {
  dom.focusTodayMetric.textContent = `${getTodayFocusMinutes()}m`;
  dom.streakMetric.textContent = `${getCurrentStreakDays()} days`;
  dom.activeLocksMetric.textContent = getActiveBlocks().length.toString();
  dom.urgeWinsMetric.textContent = state.stats.urgesBeaten.toString();
  dom.completedGoalsMetric.textContent = `${
    state.goals.filter((goal) => goal.completed).length
  } done`;
  dom.journalCountMetric.textContent = `${state.journal.length} logs`;
  dom.slipMetric.textContent = `${state.stats.slipCount} slips logged`;
}

function renderShield() {
  const shieldActive =
    Boolean(state.shield.activeUntil) && state.shield.activeUntil > Date.now();

  dom.shieldBadge.textContent = shieldActive ? "ACTIVE" : "READY";
  dom.shieldBadge.classList.toggle("active", shieldActive);
  dom.shieldStateTitle.textContent = shieldActive
    ? "Shield is blocking danger"
    : "Shield standing by";

  if (shieldActive) {
    dom.shieldMessage.textContent = `Emergency Shield is live until ${formatDate(
      state.shield.activeUntil
    )}. Adult domains in the emergency list are locked and cannot be manually removed before expiry.`;
  } else if (state.shield.lastWinAt) {
    dom.shieldMessage.textContent = `Last urge win: ${formatDate(
      state.shield.lastWinAt
    )}. If another wave hits, press the shield immediately and move your body.`;
  } else {
    dom.shieldMessage.textContent =
      "One press locks the default adult-domain list for 21 days and starts a 60-second urge interruption protocol.";
  }

  dom.rescueCountdown.textContent =
    rescueInterval && state.shield.rescueSecondsLeft > 0
      ? `${state.shield.rescueSecondsLeft}s`
      : "60s";
}

function renderFocus() {
  dom.focusTimerLabel.textContent = formatCountdown(state.focus.remainingSeconds);
  dom.focusModeLabel.textContent = `${state.focus.selectedMinutes} min flow`;
  dom.focusTimerSubtext.textContent = state.focus.running
    ? "Stay here. One task. One clean block."
    : "Ready for one clean session";

  dom.presetButtons.forEach((button) => {
    const minutes = Number(button.dataset.minutes);
    button.classList.toggle("active", minutes === state.focus.selectedMinutes);
  });

  dom.distractionList.innerHTML = "";

  if (!state.focus.distractions.length) {
    dom.distractionList.innerHTML =
      '<li class="empty-state">No parked distractions. Keep the mind clean and continue the work.</li>';
    return;
  }

  state.focus.distractions.slice(0, 6).forEach((item) => {
    const li = document.createElement("li");
    li.className = "distraction-item";
    li.innerHTML = `
      <div>
        <p class="item-title">${escapeHtml(item.note)}</p>
        <p class="item-meta">Parked ${formatDate(item.createdAt)}</p>
      </div>
      <button type="button" class="mini-action" data-clear-distraction="${
        item.id
      }">Done</button>
    `;
    dom.distractionList.appendChild(li);
  });
}

function renderBlocks() {
  const activeBlocks = getActiveBlocks();
  dom.blockList.innerHTML = "";

  if (state.shield.activeUntil && state.shield.activeUntil > Date.now()) {
    dom.vaultStatusText.textContent = `Strict lock is active until ${formatDate(
      state.shield.activeUntil
    )}. Any new site you add will be locked for 21 days from the moment you submit it.`;
  } else {
    dom.vaultStatusText.textContent =
      "No active emergency lock yet. Add a site or press the shield.";
  }

  if (!activeBlocks.length) {
    dom.blockList.innerHTML =
      '<div class="empty-state">No websites are currently locked. If an urge appears, press Emergency Shield before negotiating with it.</div>';
    return;
  }

  activeBlocks.forEach((block) => {
    const row = document.createElement("div");
    row.className = "block-item";
    row.innerHTML = `
      <div>
        <strong>${escapeHtml(block.domain)}</strong>
        <p class="item-meta">Source: ${escapeHtml(
          block.source
        )} | Locked until ${formatDate(block.expiresAt)}</p>
      </div>
      <div class="block-status-row">
        <span class="lock-pill active">${daysLeft(block.expiresAt)} days left</span>
      </div>
    `;
    dom.blockList.appendChild(row);
  });
}

function renderGoals() {
  const sortedGoals = [...state.goals].sort((a, b) => {
    if (a.completed !== b.completed) {
      return Number(a.completed) - Number(b.completed);
    }
    return b.createdAt - a.createdAt;
  });

  const topThree = sortedGoals.filter((goal) => !goal.completed).slice(0, 3);
  dom.priorityList.innerHTML = "";
  dom.goalList.innerHTML = "";

  if (!topThree.length) {
    dom.priorityList.innerHTML =
      '<div class="empty-state">Add 1-3 priorities that make you proud by tonight.</div>';
  } else {
    topThree.forEach((goal, index) => {
      const item = document.createElement("div");
      item.className = "priority-item";
      item.innerHTML = `
        <div>
          <p class="item-title">${index + 1}. ${escapeHtml(goal.title)}</p>
          <p class="item-meta">${escapeHtml(goal.horizon)} | ${escapeHtml(
        goal.area
      )}</p>
        </div>
        <button type="button" class="mini-action" data-toggle-goal="${goal.id}">
          Mark done
        </button>
      `;
      dom.priorityList.appendChild(item);
    });
  }

  if (!sortedGoals.length) {
    dom.goalList.innerHTML =
      '<div class="empty-state">Your goal list is empty. Add the goals that deserve your focus more than your impulses.</div>';
    return;
  }

  sortedGoals.forEach((goal) => {
    const item = document.createElement("div");
    item.className = `goal-item ${goal.completed ? "completed" : ""}`;
    item.innerHTML = `
      <div>
        <p class="item-title">${escapeHtml(goal.title)}</p>
        <p class="item-meta">${escapeHtml(goal.horizon)} | ${escapeHtml(
      goal.area
    )} | Added ${formatDate(goal.createdAt)}</p>
      </div>
      <div class="goal-status-row">
        <span class="status-pill ${goal.completed ? "done" : "pending"}">
          ${goal.completed ? "DONE" : "ACTIVE"}
        </span>
        <button type="button" class="mini-action" data-toggle-goal="${goal.id}">
          ${goal.completed ? "Undo" : "Done"}
        </button>
        <button type="button" class="mini-danger" data-delete-goal="${goal.id}">
          Delete
        </button>
      </div>
    `;
    dom.goalList.appendChild(item);
  });
}

function renderJournal() {
  dom.journalList.innerHTML = "";

  if (!state.journal.length) {
    dom.journalList.innerHTML =
      '<div class="empty-state">No trigger logs yet. The first pattern you write down becomes easier to beat.</div>';
    return;
  }

  state.journal.slice(0, 8).forEach((entry) => {
    const card = document.createElement("div");
    card.className = "journal-item";
    card.innerHTML = `
      <div>
        <p class="item-title">${escapeHtml(entry.context)}</p>
        <p class="item-meta">Mood: ${escapeHtml(entry.mood)} | Intensity ${
      entry.intensity
    }/10 | ${formatDate(entry.createdAt)}</p>
        <p class="item-meta">${escapeHtml(entry.response)}</p>
      </div>
      <button type="button" class="mini-danger" data-delete-journal="${entry.id}">
        Delete
      </button>
    `;
    dom.journalList.appendChild(card);
  });
}

function renderAccountability() {
  dom.partnerName.value = state.accountability.partnerName;
  dom.partnerContact.value = state.accountability.partnerContact;

  const partnerName = state.accountability.partnerName.trim();
  const partnerContact = state.accountability.partnerContact.trim();

  if (!partnerName && !partnerContact) {
    dom.accountabilitySummary.textContent =
      "Add a trusted friend, mentor, or therapist contact so your weekly report has a destination.";
    return;
  }

  dom.accountabilitySummary.textContent = `Partner saved: ${
    partnerName || "Unnamed partner"
  }${partnerContact ? ` | ${partnerContact}` : ""}. Use “Copy weekly report” to send your latest streak, focus, and block stats.`;
}

function renderPatternRadar() {
  const stats = getRiskHourStats();
  const currentBucket = stats.buckets[stats.currentHour];
  const topBucket = stats.rankedHours[0];
  const gitaCard = getGitaCard(stats.currentHour);

  dom.gitaQuoteText.textContent = gitaCard.line;
  dom.gitaVerseMeta.textContent = gitaCard.verse;
  dom.gitaPracticeText.textContent = gitaCard.practice;

  dom.riskHourList.innerHTML = "";

  if (!stats.totalEvents) {
    dom.riskNudgeBadge.textContent = "Learning";
    dom.riskNudgeBadge.classList.remove("active");
    dom.riskInsightTitle.textContent = "Pattern tracker is warming up";
    dom.riskInsightText.textContent =
      "Press Emergency Shield whenever an urge rises and keep writing trigger logs. After a few entries, Flow Breaker will identify your high-risk hours and nudge you before that window.";
    dom.riskHourList.innerHTML =
      '<div class="empty-state">No risk-hour history yet. Your next honest log starts the pattern map.</div>';
    return;
  }

  if (currentBucket.count > 0) {
    dom.riskNudgeBadge.textContent = "Risk hour now";
    dom.riskNudgeBadge.classList.add("active");
    dom.riskInsightTitle.textContent = `This hour is a learned danger window: ${formatHourWindow(
      stats.currentHour
    )}`;
    dom.riskInsightText.textContent = `${
      currentBucket.count
    } past event(s) happened around this time. Do this now: ${
      gitaCard.practice
    }`;
  } else {
    dom.riskNudgeBadge.textContent = "Monitoring";
    dom.riskNudgeBadge.classList.remove("active");
    dom.riskInsightTitle.textContent = `Highest risk window so far: ${formatHourWindow(
      topBucket.hour
    )}`;
    dom.riskInsightText.textContent = `${topBucket.count} past event(s) cluster there. Main trigger notes: ${
      topBucket.labels.slice(0, 2).join(", ") || "not labeled yet"
    }. When that hour approaches, use this Gita reset: ${gitaCard.practice}`;
  }

  const maxCount = topBucket.count;
  stats.rankedHours.slice(0, 5).forEach((bucket) => {
    const riskPercent = Math.max(14, Math.round((bucket.count / maxCount) * 100));
    const card = document.createElement("div");
    card.className = "risk-item";
    card.innerHTML = `
      <div class="risk-row">
        <div>
          <p class="item-title">${formatHourWindow(bucket.hour)}</p>
          <p class="item-meta">${bucket.count} event(s) | ${
      bucket.shieldCount
    } shield press(es) | ${bucket.journalCount} journal log(s)</p>
        </div>
        <span class="status-pill ${
          bucket.hour === stats.currentHour ? "pending" : "done"
        }">${bucket.hour === stats.currentHour ? "NOW" : "WATCH"}</span>
      </div>
      <div class="risk-track" aria-hidden="true">
        <div class="risk-fill" style="width:${riskPercent}%"></div>
      </div>
    `;
    dom.riskHourList.appendChild(card);
  });
}

function renderCoachResponse() {
  const recentTrigger = state.journal[0]?.context || "No trigger logged yet";
  const topGoal =
    state.goals.find((goal) => !goal.completed)?.title ||
    "Choose one goal and define the next 5-minute action";
  const stats = getRiskHourStats();
  const currentBucket = stats.buckets[stats.currentHour];
  const gitaCard = getGitaCard(stats.currentHour);
  const shieldStatus =
    state.shield.activeUntil && state.shield.activeUntil > Date.now()
      ? "Emergency Shield is active, so your job is to move into work before the mind negotiates."
      : "Emergency Shield is ready. If the urge is strong, activate it first, then move your body.";

  dom.coachOutput.textContent = `Reset plan:
1. Name the truth: this urge is temporary, but your goals compound.
2. ${shieldStatus}
3. Start this next action for 5 minutes only: ${topGoal}
4. Remove the trigger environment. Stand up, leave the room, drink water, and put your phone away.
5. Recent trigger pattern to watch: ${recentTrigger}
6. Time warning: ${
    currentBucket.count > 0
      ? `${formatHourWindow(stats.currentHour)} is already a learned danger window.`
      : stats.rankedHours[0]
        ? `Your top historical risk window is ${formatHourWindow(
            stats.rankedHours[0].hour
          )}.`
        : "No risk-hour pattern detected yet."
  }
7. Gita reminder (${gitaCard.verse}): ${gitaCard.line}
8. Action from that teaching: ${gitaCard.practice}`;
}

function renderAll() {
  pruneExpiredLocks();
  renderMetrics();
  renderShield();
  renderFocus();
  renderBlocks();
  renderGoals();
  renderJournal();
  renderAccountability();
  renderPatternRadar();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3600);
}

function maybeSendPatternNudge() {
  const stats = getRiskHourStats();
  const currentBucket = stats.buckets[stats.currentHour];
  const todayKey = new Date().toDateString();
  const hasPriorDayPattern = state.patterns.events.some(
    (eventItem) =>
      eventItem.hour === stats.currentHour &&
      new Date(eventItem.createdAt).toDateString() !== todayKey
  );

  if (!currentBucket || currentBucket.count === 0 || !hasPriorDayPattern) {
    return;
  }

  const nudgeKey = `${new Date().toDateString()}-${stats.currentHour}`;

  if (state.patterns.lastNudgeKey === nudgeKey) {
    return;
  }

  const gitaCard = getGitaCard(stats.currentHour);
  const topGoal =
    state.goals.find((goal) => !goal.completed)?.title ||
    "your next meaningful task";
  const message = `${formatHourWindow(
    stats.currentHour
  )} is one of your risk windows. Gita ${gitaCard.verse}: ${
    gitaCard.line
  } Do this now: ${topGoal}.`;

  if (
    document.visibilityState === "hidden" &&
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    new Notification("Flow Breaker risk-hour nudge", {
      body: `${gitaCard.practice} ${message}`,
      icon: "./icon.svg",
    });
  } else {
    showToast(`${gitaCard.practice} ${message}`);
  }

  state.patterns.lastNudgeKey = nudgeKey;
  saveState();
  renderPatternRadar();
}

async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
  } catch {
    showToast("Copy failed in this browser. You can still select and copy manually.");
  }
}

function buildWeeklyReport() {
  const activeBlocks = getActiveBlocks();
  const topGoals = state.goals
    .filter((goal) => !goal.completed)
    .slice(0, 3)
    .map((goal, index) => `${index + 1}. ${goal.title}`)
    .join("\n");
  const triggerSummary = state.journal
    .slice(0, 3)
    .map(
      (entry, index) =>
        `${index + 1}. ${entry.context} | Mood: ${entry.mood} | Response: ${entry.response}`
    )
    .join("\n");

  return `Flow Breaker Weekly Report

Clean streak: ${getCurrentStreakDays()} days
Focus completed today: ${getTodayFocusMinutes()} minutes
Total urges beaten: ${state.stats.urgesBeaten}
Total slips logged: ${state.stats.slipCount}
Active website locks: ${activeBlocks.length}

Top active goals:
${topGoals || "No active goals saved yet."}

Recent trigger logs:
${triggerSummary || "No trigger logs saved yet."}

Accountability partner:
${state.accountability.partnerName || "Not set"}${
    state.accountability.partnerContact
      ? ` | ${state.accountability.partnerContact}`
      : ""
  }
`;
}

function addDistraction(note) {
  const trimmed = note.trim();
  if (!trimmed) {
    return;
  }

  state.focus.distractions.unshift({
    id: crypto.randomUUID(),
    note: trimmed,
    createdAt: Date.now(),
  });

  state.focus.distractions = state.focus.distractions.slice(0, 20);
  saveState();
  renderFocus();
}

function toggleGoal(goalId) {
  const goal = state.goals.find((item) => item.id === goalId);
  if (!goal) return;
  goal.completed = !goal.completed;
  goal.updatedAt = Date.now();
  saveState();
  renderAll();
}

function deleteGoal(goalId) {
  state.goals = state.goals.filter((goal) => goal.id !== goalId);
  saveState();
  renderAll();
}

function deleteJournalEntry(entryId) {
  state.journal = state.journal.filter((entry) => entry.id !== entryId);
  saveState();
  renderAll();
}

function clearDistraction(distractionId) {
  state.focus.distractions = state.focus.distractions.filter(
    (item) => item.id !== distractionId
  );
  saveState();
  renderFocus();
}

function logSlip() {
  const confirmed = window.confirm(
    "Log a slip and restart your clean streak from this exact moment? No shame. Just data and a reset."
  );

  if (!confirmed) {
    return;
  }

  state.stats.slipCount += 1;
  state.stats.lastSlipAt = Date.now();
  state.journal.unshift({
    id: crypto.randomUUID(),
    context: "Slip logged and recovery reset started",
    mood: "Committed",
    intensity: "6",
    response: "Restarted streak immediately and recommitted to blocking and focus routines.",
    createdAt: Date.now(),
  });
  recordRiskEvent("Trigger Journal", "Slip reset logged");
  saveState();
  renderAll();
  showToast("Streak reset without shame. Your next decision matters most.");
}

function bindEvents() {
  dom.panicButton.addEventListener("click", activateEmergencyShield);
  dom.activateEmergencyBtn.addEventListener("click", activateEmergencyShield);
  dom.urgeDefeatedBtn.addEventListener("click", markUrgeDefeated);
  dom.refreshGitaBtn.addEventListener("click", () => {
    state.patterns.verseIndex =
      ((Number(state.patterns.verseIndex) || 0) + 1) % GITA_LIBRARY.length;
    saveState();
    renderPatternRadar();
    showToast("New Gita reminder loaded.");
  });
  dom.startFocusBtn.addEventListener("click", startFocusTimer);
  dom.pauseFocusBtn.addEventListener("click", pauseFocusTimer);
  dom.resetFocusBtn.addEventListener("click", resetFocusTimer);

  dom.presetButtons.forEach((button) => {
    button.addEventListener("click", () =>
      setFocusPreset(Number(button.dataset.minutes))
    );
  });

  dom.distractionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addDistraction(dom.distractionNote.value);
    dom.distractionNote.value = "";
  });

  dom.distractionList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-clear-distraction]");
    if (button) {
      clearDistraction(button.dataset.clearDistraction);
    }
  });

  dom.blockSiteForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const normalizedDomain = normalizeDomain(dom.siteToBlock.value);

    if (!normalizedDomain) {
      showToast("Please enter a valid domain.");
      return;
    }

    addBlock(normalizedDomain, "Manual 21-day lock");
    dom.siteToBlock.value = "";
    saveState();
    renderAll();
    showToast(`${normalizedDomain} is locked for the next 21 days.`);
  });

  dom.copyRulesBtn.addEventListener("click", () => {
    const domains = getActiveBlocks().map((block) => `0.0.0.0 ${block.domain}`);

    if (!domains.length) {
      showToast("No active lock rules to copy yet.");
      return;
    }

    copyText(
      domains.join("\n"),
      "Block rules copied. These can be pasted into a hosts/DNS blocker setup."
    );
  });

  dom.goalForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = dom.goalTitle.value.trim();

    if (!title) {
      showToast("Write a goal worth protecting.");
      return;
    }

    state.goals.unshift({
      id: crypto.randomUUID(),
      title,
      horizon: dom.goalHorizon.value,
      area: dom.goalArea.value,
      completed: false,
      createdAt: Date.now(),
    });
    dom.goalTitle.value = "";
    saveState();
    renderAll();
    showToast("Goal saved. Put one action block on the timer now.");
  });

  dom.priorityList.addEventListener("click", (event) => {
    const toggleButton = event.target.closest("[data-toggle-goal]");
    if (toggleButton) {
      toggleGoal(toggleButton.dataset.toggleGoal);
    }
  });

  dom.goalList.addEventListener("click", (event) => {
    const toggleButton = event.target.closest("[data-toggle-goal]");
    const deleteButton = event.target.closest("[data-delete-goal]");

    if (toggleButton) {
      toggleGoal(toggleButton.dataset.toggleGoal);
    }

    if (deleteButton) {
      deleteGoal(deleteButton.dataset.deleteGoal);
    }
  });

  dom.coachForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const prompt = dom.coachPrompt.value.trim();
    renderCoachResponse(prompt);
    dom.coachPrompt.value = "";
  });

  dom.journalForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const triggerContext = dom.triggerContext.value.trim();
    const triggerResponse = dom.triggerResponse.value.trim();

    state.journal.unshift({
      id: crypto.randomUUID(),
      context: triggerContext,
      mood: dom.triggerMood.value,
      intensity: dom.triggerIntensity.value,
      response: triggerResponse,
      createdAt: Date.now(),
    });
    recordRiskEvent("Trigger Journal", triggerContext);
    dom.journalForm.reset();
    dom.triggerMood.value = "Stressed";
    dom.triggerIntensity.value = "3";
    saveState();
    renderAll();
    showToast("Trigger log saved. Patterns become easier to break when tracked.");
  });

  dom.journalList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-journal]");
    if (button) {
      deleteJournalEntry(button.dataset.deleteJournal);
    }
  });

  dom.accountabilityForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.accountability.partnerName = dom.partnerName.value.trim();
    state.accountability.partnerContact = dom.partnerContact.value.trim();
    saveState();
    renderAccountability();
    showToast("Accountability partner saved.");
  });

  dom.copyReportBtn.addEventListener("click", () => {
    copyText(buildWeeklyReport(), "Weekly report copied.");
  });

  dom.logSlipBtn.addEventListener("click", logSlip);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    dom.installAppBtn.hidden = false;
  });

  dom.installAppBtn.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    dom.installAppBtn.hidden = true;
  });
}

function bootstrapServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      console.info("Service worker registration skipped in this environment.");
    });
  });
}

bindEvents();
pruneExpiredLocks();
saveState();
renderAll();
maybeSendPatternNudge();

if (state.focus.running && state.focus.remainingSeconds > 0) {
  startFocusTimer();
}

if (state.shield.rescueSecondsLeft > 0 && state.shield.rescueSecondsLeft < RESCUE_SECONDS) {
  startRescueProtocol();
}

bootstrapServiceWorker();

setInterval(maybeSendPatternNudge, 60 * 1000);
