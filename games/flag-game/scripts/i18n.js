// i18n.js — translations (en / he)

const I18N = {
  en: {
    // App
    app_title: 'Flag Flow Arena',
    app_subtitle: 'Test your world knowledge — flags, countries & capitals!',
    app_how: 'Pick a player, choose a mode, then enter the arena.',
    lang_toggle: 'עברית',

    // Dashboard sections
    players_title: 'Players',
    players_add_placeholder: 'New player name...',
    players_add_btn: 'Add',
    players_empty: 'No players yet. Add one above!',
    players_max: 'Maximum 10 players reached.',
    players_name_taken: 'That name is already taken.',
    players_name_empty: 'Enter a name first.',
    pick_icon: 'Pick an icon',
    icon_change: 'Change',

    // Player card actions
    btn_select: 'Select',
    btn_edit: 'Edit',
    btn_delete: 'Delete',
    btn_save: 'Save',
    btn_cancel: 'Cancel',
    selected_badge: 'Selected',

    // Mode
    mode_title: 'Mode',
    mode_chill: 'Chill',
    mode_chill_desc: 'Relaxed play, no timer, no lives. Learn and explore.',
    mode_bruce: 'Bruce Lee',
    mode_bruce_desc: 'Fast, 3 lives, 8-second timer. How long can you survive?',

    // Game type
    gametype_title: 'Game Type',
    gametype_flag: 'Flags → Country',
    gametype_flag_desc: 'See a flag, pick the country.',
    gametype_capital: 'Country → Capital',
    gametype_capital_desc: 'See a country, pick its capital.',
    gametype_continent: 'Continent Explorer',
    gametype_continent_desc: 'Pick a continent, guess capitals. Chill only.',
    gametype_continent_locked: 'Not available in Bruce Lee mode.',

    // Enter arena
    btn_enter: 'Enter Arena',
    enter_hint_player: 'Select a player first.',
    enter_hint_mode: 'Choose a mode.',
    enter_hint_type: 'Choose a game type.',

    // Leaderboard
    leaderboard_title: 'Leaderboard',
    leaderboard_empty: 'No games played yet.',
    leaderboard_points: 'Points',
    leaderboard_streak: 'Best streak',
    leaderboard_sessions: 'Sessions',
    leaderboard_medals: 'Medals',
    leaderboard_correct: 'Correct',

    // Medals gallery
    medals_title: 'Medal Gallery',
    medals_earned: '×{{count}} earned',
    medals_none: 'Not earned yet',

    // Game page — top bar
    back_btn: '← Dashboard',
    game_mode_chill: 'Chill',
    game_mode_bruce: 'Bruce Lee',
    game_type_flag: 'Flag',
    game_type_capital: 'Capital',
    game_type_continent: 'Continent',

    // Prep panel
    prep_title: 'Ready?',
    prep_player: 'Player',
    prep_mode: 'Mode',
    prep_type: 'Game Type',
    prep_continent: 'Continent',
    btn_start: '▶ Start',
    btn_zoom_normal: 'Normal view',
    btn_zoom_expand: 'Expand flag',
    continent_all: 'All continents',
    continent_europe: 'Europe',
    continent_asia: 'Asia',
    continent_africa: 'Africa',
    continent_north_america: 'North America',
    continent_south_america: 'South America',
    continent_oceania: 'Oceania',

    // Game board
    flag_alt_suffix: 'flag',
    flag_prompt: 'Which country does this flag belong to?',
    capital_prompt: 'What is the capital of',
    lives_label: 'Lives',
    score_label: 'Score',
    streak_label: 'Streak',
    timer_label: 'Time',
    correct_label: 'Correct',
    btn_next: 'Next →',

    // Feedback
    feedback_correct: '{{name}} — Correct! {{medals}}',
    feedback_wrong: 'Not quite. The answer was {{country}}.',
    feedback_timeout: 'Time\'s up! The answer was {{country}}.',
    feedback_bruce_life: '{{lives}} {{heart}} left.',
    feedback_bruce_out: 'Game over! Final score: {{score}}',
    heart_singular: 'life',
    heart_plural: 'lives',

    // Game over
    gameover_title: 'Game Over',
    gameover_score: 'Score',
    gameover_correct: 'Correct',
    gameover_wrong: 'Wrong',
    gameover_streak: 'Best streak',
    gameover_medals: 'Medals earned',
    btn_play_again: '▶ Play Again',
    btn_back_dashboard: '← Dashboard',

    // Achievements
    ach_hot3_name: 'Hot 3',
    ach_hot3_desc: '3 correct answers in a row.',
    ach_shock5_name: 'Shock 5',
    ach_shock5_desc: '5 correct answers in a row.',
    ach_dragon8_name: 'Shadow Dragon',
    ach_dragon8_desc: '8 correct answers in a row.',
    ach_flash_name: 'Flash Pick',
    ach_flash_desc: 'Correct answer in under 2 seconds (Bruce Lee).',
    ach_flawless_name: 'Flawless Fighter',
    ach_flawless_desc: 'Complete a Bruce Lee run without losing a life.',
    ach_flag_ninja_name: 'Flag Ninja',
    ach_flag_ninja_desc: '10 correct flags in a row.',
    ach_capital_scout_name: 'Capital Scout',
    ach_capital_scout_desc: '10 capitals correct in one session.',
    ach_continent_master_name: 'Continent Master',
    ach_continent_master_desc: '5 correct in a row in Continent Explorer mode.',

    // Errors / misc
    error_no_session: 'No session config found. Go back to the dashboard.',
    error_load: 'Failed to load game data.',
    saved: 'Saved!',
  },

  he: {
    app_title: 'זירת הדגלים',
    app_subtitle: 'בחן את הידע שלך — דגלים, מדינות ובירות!',
    app_how: 'בחר שחקן, בחר מצב, ואז כנס לזירה.',
    lang_toggle: 'English',

    players_title: 'שחקנים',
    players_add_placeholder: 'שם שחקן חדש...',
    players_add_btn: 'הוסף',
    players_empty: 'אין שחקנים עדיין. הוסף אחד!',
    players_max: 'הגעת למקסימום 10 שחקנים.',
    players_name_taken: 'השם הזה כבר קיים.',
    players_name_empty: 'הכנס שם תחילה.',
    pick_icon: 'בחר אייקון',
    icon_change: 'שנה',

    btn_select: 'בחר',
    btn_edit: 'ערוך',
    btn_delete: 'מחק',
    btn_save: 'שמור',
    btn_cancel: 'ביטול',
    selected_badge: 'נבחר',

    mode_title: 'מצב משחק',
    mode_chill: 'רגוע',
    mode_chill_desc: 'משחק נינוח, ללא טיימר, ללא חיים. למד וגלה.',
    mode_bruce: 'ברוס לי',
    mode_bruce_desc: 'מהיר, 3 חיים, 8 שניות. כמה זמן תשרוד?',

    gametype_title: 'סוג משחק',
    gametype_flag: 'דגלים ← מדינה',
    gametype_flag_desc: 'ראה דגל, בחר מדינה.',
    gametype_capital: 'מדינה ← בירה',
    gametype_capital_desc: 'ראה מדינה, בחר בירה.',
    gametype_continent: 'סייר יבשות',
    gametype_continent_desc: 'בחר יבשת, נחש בירות. מצב רגוע בלבד.',
    gametype_continent_locked: 'לא זמין במצב ברוס לי.',

    btn_enter: 'כנס לזירה',
    enter_hint_player: 'בחר שחקן תחילה.',
    enter_hint_mode: 'בחר מצב משחק.',
    enter_hint_type: 'בחר סוג משחק.',

    leaderboard_title: 'טבלת שיאים',
    leaderboard_empty: 'עדיין לא שיחקו.',
    leaderboard_points: 'נקודות',
    leaderboard_streak: 'רצף טוב ביותר',
    leaderboard_sessions: 'סשנים',
    leaderboard_medals: 'מדליות',
    leaderboard_correct: 'נכון',

    medals_title: 'גלריית מדליות',
    medals_earned: '×{{count}} הושגו',
    medals_none: 'טרם הושגה',

    back_btn: '← לוח בקרה',
    game_mode_chill: 'רגוע',
    game_mode_bruce: 'ברוס לי',
    game_type_flag: 'דגלים',
    game_type_capital: 'בירות',
    game_type_continent: 'יבשות',

    prep_title: 'מוכן?',
    prep_player: 'שחקן',
    prep_mode: 'מצב',
    prep_type: 'סוג משחק',
    prep_continent: 'יבשת',
    btn_start: '▶ התחל',
    btn_zoom_normal: 'תצוגה רגילה',
    btn_zoom_expand: 'הגדל דגל',
    continent_all: 'כל היבשות',
    continent_europe: 'אירופה',
    continent_asia: 'אסיה',
    continent_africa: 'אפריקה',
    continent_north_america: 'צפון אמריקה',
    continent_south_america: 'דרום אמריקה',
    continent_oceania: 'אוקיאניה',

    flag_alt_suffix: 'דגל',
    flag_prompt: 'לאיזו מדינה שייך הדגל הזה?',
    capital_prompt: 'מה הבירה של',
    lives_label: 'חיים',
    score_label: 'ניקוד',
    streak_label: 'רצף',
    timer_label: 'זמן',
    correct_label: 'נכון',
    btn_next: 'הבא →',

    feedback_correct: '{{name}} — נכון! {{medals}}',
    feedback_wrong: 'לא נכון. התשובה הייתה {{country}}.',
    feedback_timeout: 'הזמן נגמר! התשובה הייתה {{country}}.',
    feedback_bruce_life: 'נשארו {{lives}} {{heart}}.',
    feedback_bruce_out: 'נגמר! ניקוד סופי: {{score}}',
    heart_singular: 'לב',
    heart_plural: 'לבבות',

    gameover_title: 'המשחק נגמר',
    gameover_score: 'ניקוד',
    gameover_correct: 'נכון',
    gameover_wrong: 'שגוי',
    gameover_streak: 'רצף טוב ביותר',
    gameover_medals: 'מדליות שהושגו',
    btn_play_again: '▶ שחק שוב',
    btn_back_dashboard: '← לוח בקרה',

    ach_hot3_name: 'חם 3',
    ach_hot3_desc: '3 תשובות נכונות ברצף.',
    ach_shock5_name: 'הלם 5',
    ach_shock5_desc: '5 תשובות נכונות ברצף.',
    ach_dragon8_name: 'דרקון הצללים',
    ach_dragon8_desc: '8 תשובות נכונות ברצף.',
    ach_flash_name: 'בחירת בזק',
    ach_flash_desc: 'תשובה נכונה בפחות מ-2 שניות (ברוס לי).',
    ach_flawless_name: 'לוחם מושלם',
    ach_flawless_desc: 'סיים סשן ברוס לי ללא אובדן חיים.',
    ach_flag_ninja_name: 'נינג\'ת דגלים',
    ach_flag_ninja_desc: '10 דגלים נכונים ברצף.',
    ach_capital_scout_name: 'סייר בירות',
    ach_capital_scout_desc: '10 בירות נכונות בסשן אחד.',
    ach_continent_master_name: 'אדון יבשות',
    ach_continent_master_desc: '5 נכונות ברצף במצב סייר יבשות.',

    error_no_session: 'לא נמצאה הגדרת סשן. חזור ללוח הבקרה.',
    error_load: 'שגיאה בטעינת נתוני המשחק.',
    saved: 'נשמר!',
  }
};

let _lang = 'en';

function setLang(lang) {
  _lang = (lang === 'he') ? 'he' : 'en';
  document.documentElement.lang = _lang;
  document.documentElement.dir = _lang === 'he' ? 'rtl' : 'ltr';
}

function getLang() { return _lang; }

function t(key, vars = {}) {
  const table = I18N[_lang] || I18N.en;
  const template = table[key] ?? I18N.en[key] ?? key;
  return Object.entries(vars).reduce((msg, [k, v]) => {
    return msg.replaceAll(`{{${k}}}`, String(v));
  }, template);
}

function countryLabel(entry) {
  if (!entry) return '';
  return (_lang === 'he' && entry.countryHe) ? entry.countryHe :
         (_lang === 'he' && entry.nameHe) ? entry.nameHe :
         entry.country || entry.name || '';
}

function capitalLabel(entry) {
  if (!entry) return '';
  return (_lang === 'he' && entry.capitalHe) ? entry.capitalHe : entry.capital || '';
}

function continentLabel(continent) {
  const map = {
    'Europe': t('continent_europe'),
    'Asia': t('continent_asia'),
    'Africa': t('continent_africa'),
    'North America': t('continent_north_america'),
    'South America': t('continent_south_america'),
    'Oceania': t('continent_oceania'),
  };
  return map[continent] || continent;
}
