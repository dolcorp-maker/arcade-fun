// utils.js — shared utility functions

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function debounce(fn, ms) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

function cleanName(name) {
  return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function sameName(a, b) {
  return cleanName(a) === cleanName(b);
}

function unique(arr) {
  return [...new Set(arr)];
}

function generateId() {
  return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
