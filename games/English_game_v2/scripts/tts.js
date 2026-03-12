// ─────────────────────────────────────────────────────────────────────────────
// tts.js — Text-to-Speech module for English Galaxy Deluxe
//
// Public API:
//   loadVoices()                        — load + auto-pick best voices
//   getVoicesByLang(langPrefix)         — e.g. 'en' or 'he'
//   pickBestVoice(langPrefix, names[])  — find best available voice
//   speakText(text, lang, options)      — speak a single string
//   speakSequence([{text, lang}, ...])  — speak items in order
//   stopSpeech()                        — cancel all speech immediately
//
// Also exposes speak() and hardStopSpeech() for backward compat with game.js
// ─────────────────────────────────────────────────────────────────────────────

const speechApi = (typeof window !== 'undefined' && 'speechSynthesis' in window)
  ? window.speechSynthesis : null;

let voices = [];

// ── Settings (persisted to localStorage) ─────────────────────────────────────
const ttsStorageKey = 'english-galaxy-tts-v1';
let ttsRate      = 0.82;
let ttsEnVoiceName = '';
let ttsHeVoiceName = '';

function loadTtsSettings() {
  try {
    const raw = localStorage.getItem(ttsStorageKey);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (typeof s.rate === 'number') ttsRate = s.rate;
    if (s.enVoice) ttsEnVoiceName = s.enVoice;
    if (s.heVoice) ttsHeVoiceName = s.heVoice;
  } catch(e) {}
}

function saveTtsSettings() {
  localStorage.setItem(ttsStorageKey, JSON.stringify({
    rate: ttsRate,
    enVoice: ttsEnVoiceName,
    heVoice: ttsHeVoiceName
  }));
}

// ── Voice management ──────────────────────────────────────────────────────────

function loadVoices() {
  if (!speechApi) return;
  const v = speechApi.getVoices();
  if (v.length) voices = v;
  // Auto-pick best voices only if not already saved by user
  if (!ttsEnVoiceName) {
    const best = pickBestVoice('en', ['Google US English', 'Samantha', 'Alex', 'Microsoft David']);
    if (best) ttsEnVoiceName = best.name;
  }
  if (!ttsHeVoiceName) {
    const best = pickBestVoice('he', ['Carmit', 'Google Hebrew', 'Microsoft Asaf']);
    if (best) ttsHeVoiceName = best.name;
  }
  renderAudioSettings();
}

function getVoicesByLang(langPrefix) {
  return voices.filter(v => v.lang && v.lang.toLowerCase().startsWith(langPrefix.toLowerCase()));
}

// Pick best voice for a language. Tries preferredNames first, falls back to first available.
function pickBestVoice(langPrefix, preferredNames) {
  const pool = getVoicesByLang(langPrefix);
  if (!pool.length) return null;
  for (const name of (preferredNames || [])) {
    const match = pool.find(v => v.name.includes(name));
    if (match) return match;
  }
  return pool[0];
}

// ── Internal queue (robust watchdog + retry system) ───────────────────────────

let speechToken = 0;
let speechRetryTimer   = null;
let speechWatchdogTimer = null;
let speechStartTimer   = null;
let speechQueue = [];
let lastSpeechKey = '';
let lastSpeechAt  = 0;

function clearSpeechTimers() {
  if (speechRetryTimer)    clearTimeout(speechRetryTimer);
  if (speechWatchdogTimer) clearTimeout(speechWatchdogTimer);
  if (speechStartTimer)    clearTimeout(speechStartTimer);
  speechRetryTimer = speechWatchdogTimer = speechStartTimer = null;
}

function _recoverSpeech() {
  if (!speechApi) return;
  try {
    if (!voices.length) voices = speechApi.getVoices();
    if (speechApi.paused) speechApi.resume();
  } catch(e) {}
}

// Build a SpeechSynthesisUtterance using saved voice preferences + rate
function _makeUtterance(text, lang) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang  = lang || 'en-US';
  u.rate  = ttsRate;
  u.pitch = u.lang.startsWith('en') ? 1.08 : 1.0;

  const isEn = u.lang.toLowerCase().startsWith('en');
  const isHe = u.lang.toLowerCase().startsWith('he');

  let voice = null;
  if (isEn && ttsEnVoiceName) voice = voices.find(v => v.name === ttsEnVoiceName);
  if (isHe && ttsHeVoiceName) voice = voices.find(v => v.name === ttsHeVoiceName);
  // Fallback: first voice matching the language
  if (!voice) {
    voice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(u.lang.slice(0,2).toLowerCase()));
  }
  if (voice) u.voice = voice;
  return u;
}

function _playSpeechQueue(token, retry) {
  if (token !== speechToken || !state.sound || !speechApi) return;
  while (speechQueue.length && !((speechQueue[0].text || '').trim())) speechQueue.shift();
  if (!speechQueue.length) return;
  _recoverSpeech();
  if ((speechApi.speaking || speechApi.pending) && retry < 2) {
    speechRetryTimer = setTimeout(function() { _playSpeechQueue(token, retry + 1); }, 55);
    return;
  }
  const item = speechQueue[0];
  const text = (item.text || '').trim();
  const lang = item.lang || 'en-US';
  const u = _makeUtterance(text, lang);
  let done = false;
  const finish = function(tryRetry) {
    if (done) return;
    done = true;
    if (speechWatchdogTimer) clearTimeout(speechWatchdogTimer);
    speechWatchdogTimer = null;
    if (token !== speechToken) return;
    if (tryRetry && retry < 1) {
      try { speechApi.cancel(); } catch(e) {}
      speechRetryTimer = setTimeout(function() { _playSpeechQueue(token, retry + 1); }, 130);
      return;
    }
    speechQueue.shift();
    _playSpeechQueue(token, 0);
  };
  u.onend  = function() { finish(false); };
  u.onerror = function() { finish(true); };
  const watchdogMs = Math.max(1600, Math.min(7000, 1200 + text.length * 160));
  speechWatchdogTimer = setTimeout(function() { finish(true); }, watchdogMs);
  try { speechApi.speak(u); } catch(e) { finish(true); }
}

function _queueSpeech(items, interrupt) {
  if (!state.sound || !speechApi || !Array.isArray(items) || !items.length) return;
  const normalized = items
    .map(i => ({ text: (i && i.text ? String(i.text) : '').trim(), lang: i && i.lang ? i.lang : 'en-US' }))
    .filter(i => !!i.text);
  if (!normalized.length) return;
  const key = normalized.map(i => i.lang + '|' + i.text).join('||');
  const now = Date.now();
  if (key === lastSpeechKey && (now - lastSpeechAt) < 260) return;
  lastSpeechKey = key;
  lastSpeechAt  = now;
  if (interrupt) stopSpeech();
  const token = ++speechToken;
  speechQueue = normalized;
  if (interrupt) {
    speechStartTimer = setTimeout(function() { _playSpeechQueue(token, 0); }, 70);
  } else {
    _playSpeechQueue(token, 0);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

// Stop any currently playing speech immediately
// Called on: modal close, screen change, new playback
function stopSpeech() {
  speechToken += 1;
  speechQueue = [];
  clearSpeechTimers();
  if (!speechApi) return;
  try {
    speechApi.cancel();
    if (speechApi.paused) speechApi.resume();
    speechApi.cancel();
  } catch(e) {}
}

// Speak a single text string
// options: { interrupt: bool }
function speakText(text, lang, options) {
  if (!text) return;
  const interrupt = !options || options.interrupt !== false;
  _queueSpeech([{ text: text, lang: lang || 'en-US' }], interrupt);
}

// Speak multiple items in sequence: [{text, lang}, ...]
function speakSequence(items) {
  _queueSpeech(items, true);
}

// ── Backward-compat aliases (used by game.js) ─────────────────────────────────
function speak(text, lang, interrupt) {
  if (lang === undefined) lang = 'en-US';
  if (interrupt === undefined) interrupt = true;
  if (!text) return;
  _queueSpeech([{ text: text, lang: lang }], interrupt);
}
function hardStopSpeech() { stopSpeech(); }

// ── Settings UI ───────────────────────────────────────────────────────────────

function renderAudioSettings() {
  const panel = document.getElementById('audioSettingsPanel');
  if (!panel) return;

  const enVoices = getVoicesByLang('en');
  const heVoices = getVoicesByLang('he');
  const hasHe    = heVoices.length > 0;

  const enOptions = enVoices.map(v =>
    `<option value="${v.name}" ${v.name === ttsEnVoiceName ? 'selected' : ''}>${v.name}</option>`
  ).join('');

  const heOptions = hasHe
    ? heVoices.map(v =>
        `<option value="${v.name}" ${v.name === ttsHeVoiceName ? 'selected' : ''}>${v.name}</option>`
      ).join('')
    : '<option>— אין קולות עבריים —</option>';

  panel.innerHTML = `
    <h2>🔊 הגדרות קול</h2>
    <div class="settings-wrap" style="grid-template-columns:1fr 1fr;gap:14px">
      <div class="settings-left">
        <label for="enVoiceSelect" style="font-weight:900;font-size:.9rem;color:#fff3ad">קול באנגלית</label>
        <select id="enVoiceSelect" name="en_voice" onchange="ttsSetEnVoice(this.value)"
          style="width:100%;margin-top:6px;padding:8px 12px;border:none;border-radius:14px">
          ${enVoices.length ? enOptions : '<option>— אין קולות אנגלית —</option>'}
        </select>
        <button class="tiny-btn" style="margin-top:10px"
          onclick="speakText('Hello! This is a test.','en-US')">🔊 בדיקה אנגלית</button>
      </div>
      <div class="settings-right">
        <label for="heVoiceSelect" style="font-weight:900;font-size:.9rem;color:#fff3ad">קול בעברית
          ${!hasHe ? '<span style="color:#ff9f72;font-size:.8rem"> — לא זמין</span>' : ''}
        </label>
        <select id="heVoiceSelect" name="he_voice" onchange="ttsSetHeVoice(this.value)"
          ${!hasHe ? 'disabled' : ''}
          style="width:100%;margin-top:6px;padding:8px 12px;border:none;border-radius:14px;${!hasHe ? 'opacity:.45' : ''}">
          ${heOptions}
        </select>
        <button class="tiny-btn" style="margin-top:10px"
          onclick="speakText('שלום, זה בדיקה.','he-IL')"
          ${!hasHe ? 'disabled style="opacity:.45"' : ''}>🔊 בדיקה עברית</button>
        ${!hasHe ? '<div style="font-size:.8rem;color:#ffb86d;margin-top:8px">קול עברי תלוי בתמיכת הדפדפן/המכשיר שלך</div>' : ''}
      </div>
    </div>
    <div style="margin-top:14px">
      <label for="ttsRateRange" style="font-weight:900;font-size:.9rem;color:#fff3ad">
        מהירות דיבור: <strong id="rateLabel">${ttsRate.toFixed(2)}</strong>
      </label>
      <input id="ttsRateRange" name="tts_rate" type="range" min="0.5" max="1.5" step="0.05" value="${ttsRate}"
        oninput="ttsSetRate(this.value)"
        style="width:100%;margin-top:8px;accent-color:var(--mint);cursor:pointer">
      <div style="display:flex;justify-content:space-between;font-size:.8rem;color:#b0a8e8;margin-top:4px">
        <span>איטי 🐢</span><span>רגיל</span><span>מהיר 🐇</span>
      </div>
    </div>
  `;
}

function ttsSetEnVoice(name) {
  ttsEnVoiceName = name;
  saveTtsSettings();
}

function ttsSetHeVoice(name) {
  ttsHeVoiceName = name;
  saveTtsSettings();
}

function ttsSetRate(val) {
  ttsRate = parseFloat(val);
  const lbl = document.getElementById('rateLabel');
  if (lbl) lbl.textContent = ttsRate.toFixed(2);
  saveTtsSettings();
}

// ── Init: register voiceschanged ──────────────────────────────────────────────
if (speechApi) {
  speechApi.onvoiceschanged = function() { loadVoices(); };
}
