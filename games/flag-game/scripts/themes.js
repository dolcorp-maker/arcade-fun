// themes.js — theme switching and persistence

const THEMES = ['dark', 'light', 'neon'];
const THEME_ICONS = { dark: '🌙', light: '☀️', neon: '⚡' };
const THEME_KEY = 'flagGame_theme';

function loadTheme() {
  try { return localStorage.getItem(THEME_KEY) || 'dark'; } catch (_) { return 'dark'; }
}

function saveTheme(theme) {
  try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('themeToggleBtn');
  if (btn) {
    btn.textContent = THEME_ICONS[theme] || '🌙';
    btn.title = theme.charAt(0).toUpperCase() + theme.slice(1) + ' theme — click to change';
  }
}

function cycleTheme() {
  const current = loadTheme();
  const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
  saveTheme(next);
  applyTheme(next);
}

// Wire up button once DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  applyTheme(loadTheme());
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.addEventListener('click', cycleTheme);
});
