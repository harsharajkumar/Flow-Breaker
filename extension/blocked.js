const gitaQuoteText = document.querySelector("#gitaQuoteText");
const gitaVerseText = document.querySelector("#gitaVerseText");
const gitaActionText = document.querySelector("#gitaActionText");
const riskPatternText = document.querySelector("#riskPatternText");

function sendMessage(payload) {
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

async function hydrateBlockPage() {
  const note = document.referrer
    ? `Blocked redirect from ${document.referrer}`
    : "Blocked redirect page opened";

  const response =
    (await sendMessage({ type: "LOG_BLOCKED_PAGE_VIEW", note })) ||
    (await sendMessage({ type: "GET_STATUS" }));

  if (!response?.pattern?.gitaCard) {
    return;
  }

  gitaQuoteText.textContent = response.pattern.gitaCard.line;
  gitaVerseText.textContent = response.pattern.gitaCard.verse;
  gitaActionText.textContent = response.pattern.gitaCard.practice;
  riskPatternText.textContent = response.pattern.insight;
}

hydrateBlockPage();
