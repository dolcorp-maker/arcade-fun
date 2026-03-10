// storage.js — profile + session persistence (localStorage only, GitHub Pages)

const STORAGE_KEYS = {
  profiles: 'flagGame_profiles',
  sessionConfig: 'flagGame_sessionConfig',
};
const APP_VERSION = 'v3.0.0';

// ── Profile helpers ─────────────────────────────────────────────────────────

function makeProfile(name, icon = '🎮') {
  return {
    id: generateId(),
    name: String(name).trim(),
    icon,
    stats: {
      bestRunScore: 0,
      totalCorrect: 0,
      totalWrong: 0,
      totalSessions: 0,
      chillSessions: 0,
      bruceSessions: 0,
      bestStreak: 0,
      bestBruceStreak: 0,
      fastestCorrectMs: null,
      bruceWins: 0,
    },
    medals: {
      hot3: 0, shock5: 0, dragon8: 0, flashPick: 0,
      flawless: 0, flagNinja: 0, capitalScout: 0, continentMaster: 0,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function normalizeProfile(raw) {
  const base = makeProfile(raw.name || 'Unknown', raw.icon || '🎮');
  return {
    ...base,
    id: raw.id || base.id,
    name: raw.name || base.name,
    icon: raw.icon || base.icon,
    stats: { ...base.stats, ...(raw.stats || {}) },
    medals: { ...base.medals, ...(raw.medals || {}) },
    createdAt: raw.createdAt || base.createdAt,
    updatedAt: raw.updatedAt || base.updatedAt,
  };
}

// ── Load / Save profiles ─────────────────────────────────────────────────────

async function loadProfiles() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.profiles) || '[]');
    if (Array.isArray(raw)) return raw.map(normalizeProfile);
  } catch (_) {}
  return [];
}

async function saveProfiles(profiles) {
  localStorage.setItem(STORAGE_KEYS.profiles, JSON.stringify(profiles));
}

// ── Session config (dashboard → game handoff) ────────────────────────────────

function saveSessionConfig(config) {
  localStorage.setItem(STORAGE_KEYS.sessionConfig, JSON.stringify(config));
}

function loadSessionConfig() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.sessionConfig) || 'null');
  } catch (_) { return null; }
}

function clearSessionConfig() {
  localStorage.removeItem(STORAGE_KEYS.sessionConfig);
}

// ── Beacon flush (for chill mode on page leave) ──────────────────────────────

function beaconProfiles(profiles) {
  localStorage.setItem(STORAGE_KEYS.profiles, JSON.stringify(profiles));
}
