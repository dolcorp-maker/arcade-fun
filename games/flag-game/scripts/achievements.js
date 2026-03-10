// achievements.js — medal definitions and granting logic

const ACHIEVEMENTS = [
  { id: 'hot3',           icon: '🔥', nameKey: 'ach_hot3_name',           descKey: 'ach_hot3_desc' },
  { id: 'shock5',         icon: '⚡', nameKey: 'ach_shock5_name',         descKey: 'ach_shock5_desc' },
  { id: 'dragon8',        icon: '🐉', nameKey: 'ach_dragon8_name',        descKey: 'ach_dragon8_desc' },
  { id: 'flashPick',      icon: '💨', nameKey: 'ach_flash_name',          descKey: 'ach_flash_desc' },
  { id: 'flawless',       icon: '🛡️', nameKey: 'ach_flawless_name',       descKey: 'ach_flawless_desc' },
  { id: 'flagNinja',      icon: '🥷', nameKey: 'ach_flag_ninja_name',     descKey: 'ach_flag_ninja_desc' },
  { id: 'capitalScout',   icon: '🗺️', nameKey: 'ach_capital_scout_name',  descKey: 'ach_capital_scout_desc' },
  { id: 'continentMaster',icon: '🌍', nameKey: 'ach_continent_master_name',descKey: 'ach_continent_master_desc' },
];

function getAchievement(id) {
  return ACHIEVEMENTS.find(a => a.id === id) || null;
}

function getMedalCount(profile) {
  return Object.values(profile.medals || {}).reduce((s, v) => s + (v || 0), 0);
}

// Grant medals based on run state after a correct answer.
// Returns array of achievement objects that were just earned.
// run: { streak, fastUnderFiveStreak, correct, sessionCapitalCorrect, mode, gameType, stillFlawless }
function grantAchievements(run, elapsedMs, mode, gameType, profile) {
  const earned = [];

  function award(id) {
    const ach = getAchievement(id);
    if (!ach) return;
    profile.medals[id] = (profile.medals[id] || 0) + 1;
    run.sessionMedals = (run.sessionMedals || 0) + 1;
    earned.push(ach);
  }

  if (run.streak === 3)  award('hot3');
  if (run.streak === 5)  award('shock5');
  if (run.streak === 8)  award('dragon8');
  if (run.streak === 10 && gameType === 'flag-country') award('flagNinja');
  if (mode === 'bruce' && elapsedMs < 2000) award('flashPick');
  if (gameType !== 'flag-country' && run.sessionCapitalCorrect === 10) award('capitalScout');
  if (gameType === 'continent-capital' && run.streak === 5) award('continentMaster');

  return earned;
}

// Call at bruce session end if player never lost a life
function grantFlawless(profile) {
  const ach = getAchievement('flawless');
  if (!ach) return null;
  profile.medals.flawless = (profile.medals.flawless || 0) + 1;
  return ach;
}
