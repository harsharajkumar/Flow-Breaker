export const LOCK_DAYS = 21;
export const LOCK_DURATION_MS = LOCK_DAYS * 24 * 60 * 60 * 1000;
export const RESCUE_SECONDS = 60;
export const RISK_LOOKBACK_MS = 30 * 24 * 60 * 60 * 1000;
export const MAX_RISK_EVENTS = 500;
export const MAX_LOCKS_VISIBLE = 8;

export const EMERGENCY_DOMAINS = [
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

export const GITA_LIBRARY = [
  {
    verse: "Bhagavad Gita 2.47",
    line:
      "Your power is in disciplined action, not in surrendering to every reward signal.",
    practice:
      "Put the phone down, open your #1 goal, and do one clean 5-minute sprint.",
  },
  {
    verse: "Bhagavad Gita 6.5",
    line:
      "Lift yourself by your own mind; do not let the same mind pull you downward.",
    practice:
      "Stand up, drink water, take 10 slow breaths, then restart with one focused task.",
  },
  {
    verse: "Bhagavad Gita 2.14",
    line:
      "Sensations come and go like waves. Stay steady instead of obeying the impulse.",
    practice:
      "Wait 90 seconds, change rooms, splash cold water, and let the urge peak pass.",
  },
  {
    verse: "Bhagavad Gita 3.8",
    line:
      "Do the work that must be done. Purposeful action is stronger than drifting.",
    practice:
      "Write the task you are avoiding in one sentence and begin the smallest next step.",
  },
  {
    verse: "Bhagavad Gita 2.48",
    line:
      "Hold balance in discomfort and success. That steady discipline is real strength.",
    practice:
      "Sit upright, slow your breathing, and stay inside one 25-minute focus block.",
  },
];

export const DEFAULT_GOALS = [
  {
    title: "Study deeply for 2 hours and protect my attention today",
    horizon: "Today",
    area: "Study",
  },
  {
    title: "Ship one meaningful project milestone this week",
    horizon: "This Week",
    area: "Career",
  },
  {
    title: "Build a disciplined identity stronger than urges",
    horizon: "Life Mission",
    area: "Discipline",
  },
];

export const MOODS = ["Stressed", "Lonely", "Bored", "Tired", "Anxious", "Focused"];
export const FOCUS_PRESETS = [25, 50, 90];
