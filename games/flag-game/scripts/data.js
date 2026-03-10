// data.js — load datasets and build questions

let _flagsData = [];    // [{code, name, nameHe}]
let _capsData = [];     // [{code, country, countryHe, capital, capitalHe, continent}]

async function loadFlagsData() {
  const res = await fetch(`data/flags-countries.json?v=${APP_VERSION}`);
  _flagsData = await res.json();
  return _flagsData;
}

async function loadCapitalsData() {
  const res = await fetch(`data/countries-capitals.json?v=${APP_VERSION}`);
  _capsData = await res.json();
  return _capsData;
}

function getFlagsData() { return _flagsData; }
function getCapsData() { return _capsData; }

// ── Question builder ─────────────────────────────────────────────────────────
// Returns: { promptType, promptText, promptImageCode, correct, options[4] }
// promptType: 'flag' | 'text'
// correct / options items: the raw dataset entry for the correct answer

function buildQuestion(gameType, continent = null) {
  switch (gameType) {
    case 'flag-country':   return _buildFlagQuestion();
    case 'country-capital': return _buildCapitalQuestion(null);
    case 'continent-capital': return _buildCapitalQuestion(continent);
    default: return _buildFlagQuestion();
  }
}

function _buildFlagQuestion() {
  if (_flagsData.length < 4) throw new Error('Not enough flag data');
  const correct = pickRandom(_flagsData);
  const distractors = _pickDistinctDistractors(_flagsData, correct, 3, e => e.code);
  const options = shuffleArray([correct, ...distractors]);
  return {
    promptType: 'flag',
    promptText: null,
    promptImageCode: correct.code,
    correct,
    options,
  };
}

function _buildCapitalQuestion(continent) {
  const pool = continent
    ? _capsData.filter(e => e.continent === continent)
    : _capsData;
  if (pool.length < 4) {
    // fallback: use full pool for distractors
    if (_capsData.length < 4) throw new Error('Not enough capitals data');
    const correct = pickRandom(pool.length > 0 ? pool : _capsData);
    const distractors = _pickDistinctDistractors(_capsData, correct, 3, e => e.code);
    return _makeCapitalQuestion(correct, distractors, continent);
  }
  const correct = pickRandom(pool);
  const distractors = _pickDistinctDistractors(pool.length >= 4 ? pool : _capsData, correct, 3, e => e.code);
  return _makeCapitalQuestion(correct, distractors, continent);
}

function _makeCapitalQuestion(correct, distractors, continent) {
  const options = shuffleArray([correct, ...distractors]);
  return {
    promptType: 'text',
    promptText: correct,   // the entry itself — game.js uses countryLabel()
    promptImageCode: null,
    continent,
    correct,
    options,
  };
}

// Pick `count` entries from `pool` distinct from `exclude` by `keyFn`
function _pickDistinctDistractors(pool, exclude, count, keyFn) {
  const excludeKey = keyFn(exclude);
  const candidates = shuffleArray(pool.filter(e => keyFn(e) !== excludeKey));
  return candidates.slice(0, count);
}
