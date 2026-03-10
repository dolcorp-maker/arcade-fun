// scoring.js — point calculation for Bruce Lee mode

const TIMER_MAX_SEC = 8;

// base 100 + streak bonus + speed bonus (up to 50)
function calculatePoints(streak, elapsedMs) {
  const base = 100;
  const streakBonus = Math.max(0, (streak - 1) * 20);
  const elapsedSec = elapsedMs / 1000;
  const speedRatio = Math.max(0, 1 - elapsedSec / TIMER_MAX_SEC);
  const speedBonus = Math.round(speedRatio * 50);
  return base + streakBonus + speedBonus;
}
