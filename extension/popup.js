const statusBadge = document.querySelector("#shieldStatus");
const statusText = document.querySelector("#statusText");
const emergencyBtn = document.querySelector("#emergencyBtn");
const currentRiskTag = document.querySelector("#currentRiskTag");
const patternInsightText = document.querySelector("#patternInsightText");
const gitaQuote = document.querySelector("#gitaQuote");
const gitaMeta = document.querySelector("#gitaMeta");
const riskHourList = document.querySelector("#riskHourList");
const lockForm = document.querySelector("#lockForm");
const domainInput = document.querySelector("#domainInput");
const lockCount = document.querySelector("#lockCount");
const lockList = document.querySelector("#lockList");

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function daysLeft(timestamp) {
  return Math.max(
    1,
    Math.ceil((timestamp - Date.now()) / (24 * 60 * 60 * 1000))
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sendMessage(payload) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(payload, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!response?.ok) {
        reject(new Error(response?.error || "Flow Breaker request failed."));
        return;
      }

      resolve(response);
    });
  });
}

function renderPattern(pattern) {
  const safePattern = pattern || {
    insight:
      "Shield presses and blocked-page visits will train your risk-hour map.",
    currentCount: 0,
    rankedHours: [],
    gitaCard: {
      verse: "Bhagavad Gita 2.47",
      line: "Your power is in the action you choose now.",
    },
  };
  const gitaCard = safePattern.gitaCard || {
    verse: "Bhagavad Gita 2.47",
    line: "Your power is in the action you choose now.",
  };

  patternInsightText.textContent = safePattern.insight;
  gitaQuote.textContent = gitaCard.line;
  gitaMeta.textContent = gitaCard.verse;
  currentRiskTag.textContent = safePattern.currentCount > 0 ? "RISK NOW" : "WATCHING";
  currentRiskTag.classList.toggle("active", safePattern.currentCount > 0);

  riskHourList.innerHTML = "";

  if (!safePattern.rankedHours.length) {
    riskHourList.innerHTML =
      '<div class="empty">No risk-hour history yet. Your next blocked redirect or shield press will start the pattern map.</div>';
    return;
  }

  const maxCount = safePattern.rankedHours[0].count || 1;

  safePattern.rankedHours.forEach((bucket) => {
    const width = Math.max(12, Math.round((bucket.count / maxCount) * 100));
    const item = document.createElement("div");
    item.className = "risk-hour-item";
    item.innerHTML = `
      <strong>${escapeHtml(bucket.window || `Hour ${bucket.hour}`)}</strong>
      <p>${bucket.count} signal(s) | ${bucket.shieldCount} shield press(es) | ${
      bucket.attemptCount
    } blocked attempt(s)</p>
      <div class="risk-bar" aria-hidden="true"><span style="width:${width}%"></span></div>
    `;
    riskHourList.appendChild(item);
  });
}

function renderLocks(locks, shieldActive, pattern) {
  statusBadge.textContent = shieldActive ? "ACTIVE" : "READY";
  statusBadge.classList.toggle("active", shieldActive);
  lockCount.textContent = String(locks.length);
  renderPattern(pattern);

  if (shieldActive) {
    const emergencyLock = locks.find((lock) => lock.source === "Emergency Shield");
    statusText.textContent = emergencyLock
      ? `Emergency Shield is enforcing strict blocks until ${formatDate(
          emergencyLock.expiresAt
        )}.`
      : "Emergency Shield is active.";
  } else {
    statusText.textContent =
      "Press Emergency Shield to lock the adult-domain list instantly.";
  }

  lockList.innerHTML = "";

  if (!locks.length) {
    lockList.innerHTML =
      '<div class="empty">No active locks yet. Add one now before your mind starts negotiating.</div>';
    return;
  }

  locks.forEach((lock) => {
    const item = document.createElement("div");
    item.className = "lock-item";
    item.innerHTML = `
      <strong>${escapeHtml(lock.domain)}</strong>
      <p>${escapeHtml(lock.source)} | ${daysLeft(lock.expiresAt)} days left</p>
      <p>Unlocks automatically ${formatDate(lock.expiresAt)}</p>
    `;
    lockList.appendChild(item);
  });
}

async function refreshStatus() {
  const response = await sendMessage({ type: "GET_STATUS" });
  renderLocks(
    response.locks || [],
    Boolean(response.shieldActive),
    response.pattern
  );
}

emergencyBtn.addEventListener("click", async () => {
  emergencyBtn.disabled = true;
  emergencyBtn.textContent = "Locking...";

  try {
    const response = await sendMessage({ type: "LOCK_EMERGENCY" });
    renderLocks(response.locks || [], true, response.pattern);
    emergencyBtn.textContent = "Emergency Shield";
  } catch (error) {
    statusText.textContent = error.message;
    emergencyBtn.textContent = "Try again";
  } finally {
    emergencyBtn.disabled = false;
  }
});

lockForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const domain = domainInput.value.trim();

  if (!domain) {
    return;
  }

  try {
    const response = await sendMessage({ type: "LOCK_DOMAIN", domain });
    domainInput.value = "";
    renderLocks(
      response.locks || [],
      Boolean(response.shieldActive),
      response.pattern
    );
  } catch (error) {
    statusText.textContent = error.message;
  }
});

refreshStatus().catch((error) => {
  statusText.textContent = error.message;
});
