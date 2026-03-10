// game.js — Game page logic

const TIMER_SEC = 8;
const CONTINENTS = ['Europe','Asia','Africa','North America','South America','Oceania'];

// ── State ─────────────────────────────────────────────────────────────────────

let config = null;     // session config from dashboard
let profiles = [];     // all profiles
let profile = null;    // current player's profile

let run = null;        // active run state (null when not started)
let zoomed = false;
let currentQuestion = null;

// Chill stats checkpoint debounce
const debouncedSaveProfile = debounce(_persistProfile, 300);

// ── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  config = loadSessionConfig();
  if (!config) { showError(t('error_no_session')); return; }

  setLang(config.lang || 'en');
  applyTopBar();
  applyPrepPanel();

  try {
    profiles = await loadProfiles();
    profile = profiles.find(p => p.id === config.playerId);
    if (!profile) {
      // Player deleted between sessions — create fresh
      profile = makeProfile(config.playerName, config.playerIcon);
      profiles.push(profile);
    }
    await loadFlagsData();
    await loadCapitalsData();
  } catch (err) {
    showError(t('error_load'));
    return;
  }

  bindEvents();
  renderMedalGallery(); // in gameover area
}

// ── Events ────────────────────────────────────────────────────────────────────

function bindEvents() {
  document.getElementById('backBtn').addEventListener('click', leaveGame);
  document.getElementById('startBtn').addEventListener('click', startGame);
  document.getElementById('nextBtn').addEventListener('click', nextQuestion);
  document.getElementById('playAgainBtn').addEventListener('click', playAgain);
  document.getElementById('backToDashBtn').addEventListener('click', () => { window.location.href = 'index.html'; });

  // Zoom toggles
  document.getElementById('zoomToggle').addEventListener('click', toggleZoom);
  document.getElementById('zoomInGame').addEventListener('click', toggleZoom);

  // Continent picker
  if (config.gameType === 'continent-capital') {
    const sel = document.getElementById('continentSelect');
    CONTINENTS.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = continentLabel(c);
      sel.appendChild(opt);
    });
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (!run || run.gameOver) return;
      const nextBtn = document.getElementById('nextBtn');
      if (!nextBtn.classList.contains('hidden') && !nextBtn.disabled) nextQuestion();
    }
    const idx = ['1','2','3','4'].indexOf(e.key);
    if (idx !== -1 && run && !run.gameOver && !run.questionResolved && currentQuestion) {
      const btn = document.querySelectorAll('#answersGrid .answer-btn')[idx];
      if (btn && !btn.disabled) btn.click();
    }
  });

  // Flush stats on leave
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && run && config.mode === 'chill') {
      _flushProfile();
    }
  });
  window.addEventListener('pagehide', () => {
    if (run && config.mode === 'chill') _flushProfile();
  });
}

// ── Top bar / Prep ────────────────────────────────────────────────────────────

function applyTopBar() {
  document.getElementById('backBtn').textContent = t('back_btn');
  document.getElementById('topPlayerIcon').textContent = config.playerIcon;
  document.getElementById('topPlayerName').textContent = config.playerName;
  document.getElementById('modePill').textContent = config.mode === 'bruce' ? t('game_mode_bruce') : t('game_mode_chill');
  const typeKey = config.gameType === 'flag-country' ? 'game_type_flag' :
                  config.gameType === 'country-capital' ? 'game_type_capital' : 'game_type_continent';
  document.getElementById('typePill').textContent = t(typeKey);
}

function applyPrepPanel() {
  document.getElementById('prepTitle').textContent = t('prep_title');
  document.getElementById('prepPlayerLabel').textContent = t('prep_player');
  document.getElementById('prepPlayerValue').textContent = `${config.playerIcon} ${config.playerName}`;
  document.getElementById('prepModeLabel').textContent = t('prep_mode');
  document.getElementById('prepModeValue').textContent = config.mode === 'bruce' ? t('mode_bruce') : t('mode_chill');
  document.getElementById('prepTypeLabel').textContent = t('prep_type');
  const typeName = config.gameType === 'flag-country' ? t('gametype_flag') :
                   config.gameType === 'country-capital' ? t('gametype_capital') : t('gametype_continent');
  document.getElementById('prepTypeValue').textContent = typeName;
  document.getElementById('startBtn').textContent = t('btn_start');
  document.getElementById('zoomToggle').textContent = t('btn_zoom_expand');

  if (config.gameType === 'continent-capital') {
    document.getElementById('prepContinentRow').style.display = '';
    document.getElementById('prepContinentLabel').textContent = t('prep_continent');
  }
}

// ── Game start ────────────────────────────────────────────────────────────────

function startGame() {
  // For continent mode, read selected continent
  if (config.gameType === 'continent-capital') {
    config.continent = document.getElementById('continentSelect').value || CONTINENTS[0];
  }

  initRun();
  profile.stats.totalSessions += 1;
  if (config.mode === 'chill') profile.stats.chillSessions += 1;
  else profile.stats.bruceSessions += 1;

  document.getElementById('prepPanel').classList.add('hidden');
  document.getElementById('gameBoard').classList.remove('hidden');

  applyStatBar();
  nextQuestion();
}

function initRun() {
  run = {
    lives: config.mode === 'bruce' ? 3 : Infinity,
    score: 0,
    streak: 0,
    bestStreak: 0,
    correct: 0,
    wrong: 0,
    timerLeft: TIMER_SEC,
    timerId: null,
    gameOver: false,
    questionStart: 0,
    fastUnderFiveStreak: 0,
    sessionCapitalCorrect: 0,
    sessionMedals: 0,
    stillFlawless: true,
    currentQuestionId: 0,
    questionResolved: false,
  };
}

function applyStatBar() {
  const isBruce = config.mode === 'bruce';
  document.getElementById('heartsWrap').style.display = isBruce ? '' : 'none';
  document.getElementById('scoreBox').style.display  = isBruce ? '' : 'none';
  document.getElementById('timerBarWrap').style.display = isBruce ? '' : 'none';
  document.getElementById('timerBox').style.display  = isBruce ? '' : 'none';

  document.getElementById('scoreLbl').textContent   = t('score_label');
  document.getElementById('streakLbl').textContent  = t('streak_label');
  document.getElementById('correctLbl').textContent = t('correct_label');
  document.getElementById('timerLbl').textContent   = t('timer_label');

  renderHearts();
  updateStatDisplay();
}

// ── Question loop ─────────────────────────────────────────────────────────────

function nextQuestion() {
  if (!run || run.gameOver) return;
  clearTimer();
  run.questionResolved = false;
  run.currentQuestionId += 1;
  const qId = run.currentQuestionId;

  currentQuestion = buildQuestion(config.gameType, config.continent);

  document.getElementById('nextBtn').classList.add('hidden');
  setFeedback('', 'neutral');
  renderQuestion(currentQuestion);

  run.questionStart = performance.now();
  if (config.mode === 'bruce') startTimer(qId);
}

function renderQuestion(q) {
  const flagStage = document.getElementById('flagStage');
  const textPrompt = document.getElementById('textPrompt');

  if (q.promptType === 'flag') {
    flagStage.classList.remove('hidden');
    textPrompt.classList.add('hidden');
    const img = document.getElementById('flagImg');
    img.src = `assets/${q.promptImageCode}.svg`;
    img.alt = `${countryLabel(q.correct)} ${t('flag_alt_suffix')}`;
    flagStage.classList.toggle('expanded', zoomed);
    document.getElementById('zoomInGame').classList.remove('hidden');
  } else {
    flagStage.classList.add('hidden');
    textPrompt.classList.remove('hidden');
    document.getElementById('zoomInGame').classList.add('hidden');
    document.getElementById('textPromptLabel').textContent = t('capital_prompt');
    document.getElementById('textPromptValue').textContent = countryLabel(q.correct);
    const contEl = document.getElementById('textPromptContinent');
    if (config.continent) {
      contEl.classList.remove('hidden');
      contEl.textContent = continentLabel(config.continent);
    } else {
      contEl.classList.add('hidden');
    }
  }

  const grid = document.getElementById('answersGrid');
  grid.innerHTML = q.options.map((opt, i) => {
    const label = q.promptType === 'flag' ? countryLabel(opt) : capitalLabel(opt);
    return `
      <button class="answer-btn" data-code="${escapeAttr(opt.code)}" data-idx="${i}">
        <span class="answer-num">${i + 1}</span>
        <span>${escapeHtml(label)}</span>
      </button>`;
  }).join('');

  grid.querySelectorAll('.answer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      handleAnswerClick(btn.dataset.code, btn, run.currentQuestionId);
    });
  });
}

// ── Answer handling ───────────────────────────────────────────────────────────

function handleAnswerClick(code, btn, qId) {
  if (run.currentQuestionId !== qId) return;
  if (run.questionResolved || run.gameOver || !currentQuestion) return;
  const elapsedMs = performance.now() - run.questionStart;
  const isCorrect = code === currentQuestion.correct.code;
  resolveQuestion({ result: isCorrect ? 'correct' : 'wrong', selectedBtn: btn, elapsedMs });
}

function resolveQuestion({ result, selectedBtn, elapsedMs }) {
  if (run.questionResolved || run.gameOver) return;
  run.questionResolved = true;
  clearTimer();

  const correct = currentQuestion.correct;

  if (result === 'correct') {
    run.streak += 1;
    run.bestStreak = Math.max(run.bestStreak, run.streak);
    run.correct += 1;
    run.fastUnderFiveStreak = (config.mode === 'bruce' && elapsedMs <= 5000) ? run.fastUnderFiveStreak + 1 : 0;
    if (config.gameType !== 'flag-country') run.sessionCapitalCorrect += 1;

    if (config.mode === 'bruce') {
      const pts = calculatePoints(run.streak, elapsedMs);
      run.score += pts;
    }

    if (selectedBtn) selectedBtn.classList.add('correct');
    disableAnswers();

    const medals = grantAchievements(run, elapsedMs, config.mode, config.gameType, profile);
    const medalStr = medals.map(m => m.icon).join(' ');
    setFeedback(t('feedback_correct', { name: config.playerName, medals: medalStr }), 'spark');
    updateStatDisplay();

    if (config.mode === 'bruce') {
      setTimeout(nextQuestion, 900);
    } else {
      // Chill
      document.getElementById('nextBtn').classList.remove('hidden');
      debouncedSaveProfile();
    }

  } else {
    // wrong or timeout
    run.streak = 0;
    run.fastUnderFiveStreak = 0;
    run.wrong += 1;
    run.stillFlawless = false;

    if (selectedBtn) selectedBtn.classList.add('wrong');
    highlightCorrectAnswer();
    disableAnswers();

    const correctLabel = currentQuestion.promptType === 'flag'
      ? countryLabel(correct)
      : capitalLabel(correct);

    if (config.mode === 'bruce') {
      run.lives -= 1;
      renderHearts();
      updateStatDisplay();

      if (run.lives <= 0) {
        const msgKey = result === 'timeout' ? 'feedback_timeout' : 'feedback_wrong';
        setFeedback(t(msgKey, { country: correctLabel }), 'bad');
        setTimeout(gameOver, 1400);
        return;
      }
      const livesWord = run.lives === 1 ? t('heart_singular') : t('heart_plural');
      setFeedback(
        t('feedback_wrong', { country: correctLabel }) + '  ' + t('feedback_bruce_life', { lives: run.lives, heart: livesWord }),
        'bad'
      );
      setTimeout(nextQuestion, 1400);
    } else {
      // Chill
      const msgKey = result === 'timeout' ? 'feedback_timeout' : 'feedback_wrong';
      setFeedback(t(msgKey, { country: correctLabel }), 'bad');
      document.getElementById('nextBtn').classList.remove('hidden');
      debouncedSaveProfile();
    }
  }
}

// ── Timer ─────────────────────────────────────────────────────────────────────

function startTimer(qId) {
  run.timerLeft = TIMER_SEC;
  renderTimerBar();
  run.timerId = setInterval(() => {
    if (run.currentQuestionId !== qId) { clearInterval(run.timerId); return; }
    run.timerLeft -= 1;
    renderTimerBar();
    if (run.timerLeft <= 0) {
      clearInterval(run.timerId);
      if (!run.questionResolved) {
        resolveQuestion({ result: 'timeout', selectedBtn: null, elapsedMs: TIMER_SEC * 1000 });
      }
    }
  }, 1000);
}

function clearTimer() {
  if (run && run.timerId) { clearInterval(run.timerId); run.timerId = null; }
}

function renderTimerBar() {
  const bar = document.getElementById('timerBar');
  const valEl = document.getElementById('timerVal');
  if (!bar) return;
  const pct = Math.max(0, (run.timerLeft / TIMER_SEC)) * 100;
  bar.style.width = `${pct}%`;
  bar.classList.toggle('urgent', run.timerLeft <= 3);
  if (valEl) valEl.textContent = Math.max(0, run.timerLeft);
}

// ── Game Over ─────────────────────────────────────────────────────────────────

function gameOver() {
  if (run.gameOver) return;
  run.gameOver = true;
  clearTimer();

  // Grant flawless if applicable
  let flawlessMedal = null;
  if (config.mode === 'bruce' && run.stillFlawless && run.correct >= 5) {
    flawlessMedal = grantFlawless(profile);
  }

  // Save stats to profile
  profile.stats.bestRunScore   = Math.max(profile.stats.bestRunScore, run.score);
  profile.stats.totalCorrect  += run.correct;
  profile.stats.totalWrong    += run.wrong;
  profile.stats.bestStreak     = Math.max(profile.stats.bestStreak, run.bestStreak);
  if (config.mode === 'bruce') {
    profile.stats.bestBruceStreak = Math.max(profile.stats.bestBruceStreak, run.bestStreak);
    if (run.lives > 0) profile.stats.bruceWins += 1;
  }
  profile.updatedAt = Date.now();

  _persistProfile();

  // Render overlay
  const allMedals = [];
  if (flawlessMedal) allMedals.push(flawlessMedal.icon);
  // collect medals earned this run from profile delta not tracked elsewhere
  document.getElementById('gameoverTitle').textContent = t('gameover_title');
  document.getElementById('gameoverMedals').textContent = allMedals.join(' ');
  document.getElementById('gameoverStats').innerHTML = `
    <div class="gameover-stat">
      <div class="gameover-stat-label">${t('gameover_score')}</div>
      <div class="gameover-stat-value">${run.score}</div>
    </div>
    <div class="gameover-stat">
      <div class="gameover-stat-label">${t('gameover_correct')}</div>
      <div class="gameover-stat-value">${run.correct}</div>
    </div>
    <div class="gameover-stat">
      <div class="gameover-stat-label">${t('gameover_wrong')}</div>
      <div class="gameover-stat-value">${run.wrong}</div>
    </div>
    <div class="gameover-stat">
      <div class="gameover-stat-label">${t('gameover_streak')}</div>
      <div class="gameover-stat-value">${run.bestStreak}</div>
    </div>
  `;
  document.getElementById('playAgainBtn').textContent = t('btn_play_again');
  document.getElementById('backToDashBtn').textContent = t('btn_back_dashboard');
  document.getElementById('gameoverOverlay').classList.remove('hidden');
}

function playAgain() {
  document.getElementById('gameoverOverlay').classList.add('hidden');
  document.getElementById('gameBoard').classList.add('hidden');
  document.getElementById('prepPanel').classList.remove('hidden');
  run = null;
  currentQuestion = null;
}

// ── Chill: leave game ─────────────────────────────────────────────────────────

function leaveGame() {
  if (run && !run.gameOver && config.mode === 'chill') {
    // Save incremental stats before leaving
    profile.stats.totalCorrect  += run.correct;
    profile.stats.totalWrong    += run.wrong;
    profile.stats.bestStreak     = Math.max(profile.stats.bestStreak, run.bestStreak);
    profile.updatedAt = Date.now();
    _flushProfile();
  }
  window.location.href = 'index.html';
}

// ── Render helpers ────────────────────────────────────────────────────────────

function renderHearts() {
  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById(`h${i}`);
    if (el) el.classList.toggle('lost', i > run.lives);
  }
}

function updateStatDisplay() {
  document.getElementById('scoreVal').textContent  = run.score;
  document.getElementById('streakVal').textContent = run.streak;
  document.getElementById('correctVal').textContent = run.correct;
}

function highlightCorrectAnswer() {
  document.querySelectorAll('#answersGrid .answer-btn').forEach(btn => {
    if (btn.dataset.code === currentQuestion.correct.code) btn.classList.add('correct');
  });
}

function disableAnswers() {
  document.querySelectorAll('#answersGrid .answer-btn').forEach(btn => {
    btn.disabled = true;
  });
}

function setFeedback(msg, tone = 'neutral') {
  const el = document.getElementById('gameFeedback');
  el.textContent = msg;
  el.className = `feedback ${tone} game-feedback`;
}

function toggleZoom() {
  zoomed = !zoomed;
  const stage = document.getElementById('flagStage');
  if (stage) stage.classList.toggle('expanded', zoomed);
  const label = zoomed ? t('btn_zoom_normal') : t('btn_zoom_expand');
  document.getElementById('zoomToggle').textContent = label;
}

function showError(msg) {
  document.getElementById('prepPanel').classList.add('hidden');
  document.getElementById('errorPanel').classList.remove('hidden');
  document.getElementById('errorMsg').textContent = msg;
}

// ── Profile persistence ───────────────────────────────────────────────────────

async function _persistProfile() {
  const idx = profiles.findIndex(p => p.id === profile.id);
  if (idx !== -1) profiles[idx] = profile;
  else profiles.push(profile);
  await saveProfiles(profiles);
}

function _flushProfile() {
  const idx = profiles.findIndex(p => p.id === profile.id);
  if (idx !== -1) profiles[idx] = profile;
  else profiles.push(profile);
  beaconProfiles(profiles);
}

function renderMedalGallery() {
  // Could add a mini gallery in gameover — omitted for brevity, handled by gameover overlay
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

init();
