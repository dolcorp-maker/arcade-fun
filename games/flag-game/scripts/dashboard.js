// dashboard.js — Dashboard page logic

const PLAYER_ICONS = ['🎮','🥷','🦁','🐉','🦊','🐺','🐯','🦄','🦅','🌟','🔥','⚡'];
const MAX_PLAYERS = 100;

const dash = {
  profiles: [],
  selectedId: null,
  mode: null,
  gameType: null,
  editingId: null,
  pendingIcon: PLAYER_ICONS[0],
};

// ── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  dash.profiles = await loadProfiles();
  const savedLang = localStorage.getItem('flagGame_lang') || 'en';
  setLang(savedLang);
  bindEvents();
  applyLang();
  renderAll();
}

// ── Events ────────────────────────────────────────────────────────────────────

function bindEvents() {
  // Language
  document.getElementById('langBtn').addEventListener('click', () => {
    const next = getLang() === 'en' ? 'he' : 'en';
    setLang(next);
    localStorage.setItem('flagGame_lang', next);
    applyLang();
    renderAll();
  });

  // Add player
  document.getElementById('addPlayerBtn').addEventListener('click', addPlayer);
  document.getElementById('newPlayerName').addEventListener('keydown', e => {
    if (e.key === 'Enter') addPlayer();
  });

  // Mode buttons
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      dash.mode = btn.dataset.mode;
      // Deselect continent if switching to bruce
      if (dash.mode === 'bruce' && dash.gameType === 'continent-capital') {
        dash.gameType = null;
      }
      renderModeButtons();
      renderGameTypeButtons();
      updateEnterBtn();
    });
  });

  // Game type buttons
  document.querySelectorAll('.gametype-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      dash.gameType = btn.dataset.type;
      renderGameTypeButtons();
      updateEnterBtn();
    });
  });

  // Enter arena
  document.getElementById('enterBtn').addEventListener('click', enterArena);
}

// ── Add / Edit / Delete players ───────────────────────────────────────────────

function addPlayer() {
  const input = document.getElementById('newPlayerName');
  const name = cleanName(input.value);
  const feedback = document.getElementById('playerFeedback');

  if (!name) { showFeedback(feedback, t('players_name_empty'), 'bad'); return; }
  if (dash.profiles.length >= MAX_PLAYERS) { showFeedback(feedback, t('players_max'), 'bad'); return; }
  if (dash.profiles.some(p => sameName(p.name, name))) {
    showFeedback(feedback, t('players_name_taken'), 'bad'); return;
  }

  const icon = dash.pendingIcon || PLAYER_ICONS[0];
  const profile = makeProfile(input.value.trim(), icon);
  dash.profiles.push(profile);
  dash.selectedId = profile.id;
  input.value = '';
  dash.pendingIcon = PLAYER_ICONS[0];
  saveProfiles(dash.profiles);
  showFeedback(feedback, '✅ ' + profile.name, 'good');
  renderPlayerList();
  renderLeaderboard();
  updateEnterBtn();
}

function selectPlayer(id) {
  dash.selectedId = id;
  renderPlayerList();
  updateEnterBtn();
}

function startEditPlayer(id) {
  dash.editingId = id;
  renderPlayerList();
}

function saveEditPlayer(id) {
  const nameInput = document.getElementById(`edit-name-${id}`);
  const newName = nameInput ? cleanName(nameInput.value) : '';
  const profile = dash.profiles.find(p => p.id === id);
  if (!profile) return;
  if (!newName) return;
  if (dash.profiles.some(p => p.id !== id && sameName(p.name, newName))) {
    const fb = document.getElementById('playerFeedback');
    showFeedback(fb, t('players_name_taken'), 'bad');
    return;
  }
  const iconEl = document.querySelector(`#edit-icons-${id} .icon-opt.selected`);
  profile.name = nameInput.value.trim();
  profile.icon = iconEl ? iconEl.dataset.icon : profile.icon;
  profile.updatedAt = Date.now();
  if (dash.selectedId === id) dash.selectedId = id; // keep selected
  dash.editingId = null;
  saveProfiles(dash.profiles);
  renderPlayerList();
  renderLeaderboard();
}

function cancelEdit() {
  dash.editingId = null;
  renderPlayerList();
}

function deletePlayer(id) {
  dash.profiles = dash.profiles.filter(p => p.id !== id);
  if (dash.selectedId === id) dash.selectedId = null;
  if (dash.editingId === id) dash.editingId = null;
  saveProfiles(dash.profiles);
  renderPlayerList();
  renderLeaderboard();
  updateEnterBtn();
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderAll() {
  renderPlayerList();
  renderModeButtons();
  renderGameTypeButtons();
  renderLeaderboard();
  renderMedalGallery();
  updateEnterBtn();
}

function applyLang() {
  document.getElementById('langBtn').textContent = t('lang_toggle');
  document.getElementById('appTitle').textContent = t('app_title');
  document.getElementById('heroTitle').textContent = t('app_title');
  document.getElementById('heroSubtitle').textContent = t('app_subtitle');
  document.getElementById('heroHow').textContent = t('app_how');
  document.getElementById('playersSectionTitle').textContent = t('players_title');
  document.getElementById('modeSectionTitle').textContent = t('mode_title');
  document.getElementById('gametypeSectionTitle').textContent = t('gametype_title');
  document.getElementById('leaderboardTitle').textContent = t('leaderboard_title');
  document.getElementById('medalsTitle').textContent = t('medals_title');
  document.getElementById('enterBtn').textContent = t('btn_enter');
  document.getElementById('newPlayerName').placeholder = t('players_add_placeholder');
  document.getElementById('addPlayerBtn').textContent = t('players_add_btn');
  document.getElementById('leaderboardEmpty').textContent = t('leaderboard_empty');
  // mode buttons
  document.querySelector('[data-mode="chill"] .mode-btn-title').textContent = t('mode_chill');
  document.querySelector('[data-mode="chill"] .mode-btn-desc').textContent = t('mode_chill_desc');
  document.querySelector('[data-mode="bruce"] .mode-btn-title').textContent = t('mode_bruce');
  document.querySelector('[data-mode="bruce"] .mode-btn-desc').textContent = t('mode_bruce_desc');
  // game type buttons
  document.querySelector('[data-type="flag-country"] .gametype-title').textContent = t('gametype_flag');
  document.querySelector('[data-type="flag-country"] .gametype-desc').textContent = t('gametype_flag_desc');
  document.querySelector('[data-type="country-capital"] .gametype-title').textContent = t('gametype_capital');
  document.querySelector('[data-type="country-capital"] .gametype-desc').textContent = t('gametype_capital_desc');
  document.querySelector('[data-type="continent-capital"] .gametype-title').textContent = t('gametype_continent');
  document.querySelector('[data-type="continent-capital"] .gametype-desc').textContent = t('gametype_continent_desc');
  document.getElementById('continentLocked').textContent = t('gametype_continent_locked');
}

function renderPlayerList() {
  const list = document.getElementById('playerList');
  const countEl = document.getElementById('playerCount');
  countEl.textContent = `${dash.profiles.length} / ${MAX_PLAYERS}`;

  if (!dash.profiles.length) {
    list.innerHTML = `<div class="muted">${escapeHtml(t('players_empty'))}</div>`;
    return;
  }

  list.innerHTML = dash.profiles.map(profile => {
    const isSelected = profile.id === dash.selectedId;
    const isEditing  = profile.id === dash.editingId;
    const medals = getMedalCount(profile);
    const pts = profile.stats.bestRunScore;

    if (isEditing) {
      const iconOpts = PLAYER_ICONS.map(icon =>
        `<button class="icon-opt${icon === profile.icon ? ' selected' : ''}" data-icon="${escapeAttr(icon)}" title="${escapeAttr(icon)}">${icon}</button>`
      ).join('');
      return `
        <div class="player-card edit-mode">
          <div class="player-edit-form" style="flex:1;">
            <div class="player-edit-row">
              <input type="text" id="edit-name-${profile.id}" value="${escapeAttr(profile.name)}" maxlength="24" />
            </div>
            <div class="icon-picker" id="edit-icons-${profile.id}">${iconOpts}</div>
            <div class="player-edit-row">
              <button class="btn-ghost" onclick="saveEditPlayer('${profile.id}')">${t('btn_save')}</button>
              <button class="btn-ghost" onclick="cancelEdit()">${t('btn_cancel')}</button>
            </div>
          </div>
        </div>`;
    }

    return `
      <div class="player-card${isSelected ? ' selected' : ''}" onclick="selectPlayer('${profile.id}')">
        <div class="player-avatar">${escapeHtml(profile.icon)}</div>
        <div class="player-info">
          <div class="player-name">${escapeHtml(profile.name)}${isSelected ? ` <span class="pill">${t('selected_badge')}</span>` : ''}</div>
          <div class="player-stats-mini">🏅 ${medals} &nbsp;·&nbsp; ${pts} pts &nbsp;·&nbsp; streak ${profile.stats.bestStreak}</div>
        </div>
        <div class="player-actions" onclick="event.stopPropagation()">
          <button class="btn-icon" title="${t('btn_edit')}" onclick="startEditPlayer('${profile.id}')">✏️</button>
          <button class="btn-icon" title="${t('btn_delete')}" onclick="deletePlayer('${profile.id}')">🗑️</button>
        </div>
      </div>`;
  }).join('');

  // Bind icon picker clicks in edit forms
  document.querySelectorAll('[id^="edit-icons-"] .icon-opt').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      btn.closest('.icon-picker').querySelectorAll('.icon-opt').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
}

function renderModeButtons() {
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === dash.mode);
  });
}

function renderGameTypeButtons() {
  const isBruce = dash.mode === 'bruce';
  document.querySelectorAll('.gametype-btn').forEach(btn => {
    const type = btn.dataset.type;
    const isContinent = type === 'continent-capital';
    const locked = isContinent && isBruce;
    btn.disabled = locked;
    btn.classList.toggle('active', type === dash.gameType && !locked);
    document.getElementById('continentLocked').classList.toggle('hidden', !locked);
  });
}

function renderLeaderboard() {
  const el = document.getElementById('leaderboard');
  const sorted = [...dash.profiles]
    .filter(p => p.stats.totalSessions > 0)
    .sort((a, b) => b.stats.bestRunScore - a.stats.bestRunScore || b.stats.bestStreak - a.stats.bestStreak);

  if (!sorted.length) {
    el.innerHTML = `<div class="muted">${escapeHtml(t('leaderboard_empty'))}</div>`;
    return;
  }
  el.innerHTML = sorted.map((p, i) => {
    const medals = getMedalCount(p);
    return `
      <div class="leader-row${i === 0 ? ' top' : ''}">
        <div class="leader-rank">${i === 0 ? '👑' : i + 1}</div>
        <div class="leader-name">${escapeHtml(p.icon)} ${escapeHtml(p.name)}</div>
        <div class="leader-stat">${p.stats.bestRunScore}<div class="leader-label">${t('leaderboard_points')}</div></div>
        <div class="leader-stat">${p.stats.bestStreak}<div class="leader-label">${t('leaderboard_streak')}</div></div>
        <div class="leader-stat">🏅 ${medals}<div class="leader-label">${t('leaderboard_medals')}</div></div>
        <div class="leader-stat">${p.stats.totalSessions}<div class="leader-label">${t('leaderboard_sessions')}</div></div>
      </div>`;
  }).join('');
}

function renderMedalGallery() {
  const el = document.getElementById('medalGallery');
  const selected = dash.profiles.find(p => p.id === dash.selectedId);
  el.innerHTML = ACHIEVEMENTS.map(ach => {
    const count = selected ? (selected.medals[ach.id] || 0) : 0;
    const earned = count > 0;
    return `
      <div class="medal-card">
        <div class="medal-icon">${ach.icon}</div>
        <div class="medal-info">
          <div class="medal-name">${escapeHtml(t(ach.nameKey))}</div>
          <div class="medal-desc">${escapeHtml(t(ach.descKey))}</div>
          <div class="medal-count ${earned ? 'earned' : 'not-earned'}">
            ${earned ? t('medals_earned', { count }) : t('medals_none')}
          </div>
        </div>
      </div>`;
  }).join('');
}

function updateEnterBtn() {
  const btn = document.getElementById('enterBtn');
  const hint = document.getElementById('enterHint');
  const profile = dash.profiles.find(p => p.id === dash.selectedId);
  if (!profile) { btn.disabled = true; hint.textContent = t('enter_hint_player'); return; }
  if (!dash.mode)     { btn.disabled = true; hint.textContent = t('enter_hint_mode');   return; }
  if (!dash.gameType) { btn.disabled = true; hint.textContent = t('enter_hint_type');   return; }
  btn.disabled = false;
  hint.textContent = `${profile.icon} ${profile.name} · ${t('mode_' + dash.mode)} · ${t('gametype_' + dash.gameType.replace(/-/g, '_'))}`;
}

function showFeedback(el, msg, tone = 'neutral') {
  el.textContent = msg;
  el.className = `feedback ${tone}`;
  setTimeout(() => { el.textContent = ''; el.className = 'feedback neutral'; }, 2500);
}

// ── Enter Arena ───────────────────────────────────────────────────────────────

function enterArena() {
  const profile = dash.profiles.find(p => p.id === dash.selectedId);
  if (!profile || !dash.mode || !dash.gameType) return;
  const config = {
    playerId: profile.id,
    playerName: profile.name,
    playerIcon: profile.icon,
    mode: dash.mode,
    gameType: dash.gameType,
    continent: null,
    lang: getLang(),
    startedAt: Date.now(),
  };
  saveSessionConfig(config);
  window.location.href = 'game.html';
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

init();
