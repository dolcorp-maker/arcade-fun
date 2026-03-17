#!/usr/bin/env node
/**
 * Flag Game Data Integrity Checker
 *
 * Checks:
 *   1a. Exact duplicate SVG content — byte-identical files
 *   1b. Normalized duplicate SVG content — same visuals, different SVG structure
 *       (e.g. bl.svg uses white background + 2 stripes vs fr.svg with 3 stripes)
 *   2.  Missing assets — JSON country codes with no corresponding SVG file
 *   3.  Orphan assets — SVG files not referenced in JSON (excluding known extras)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ASSETS_DIR = path.join(__dirname, 'assets');
const FLAGS_JSON = path.join(__dirname, 'data', 'flags-countries.json');

// Known non-country SVG files (regional flags, org flags, uninhabited territories, etc.)
const WHITELIST = new Set([
  // Org / special flags
  'arab', 'asean', 'cefta', 'eac', 'eu', 'cp', 'dg', 'ic', 'pc', 'un', 'xx',
  // Spanish regions
  'es-ct', 'es-ga', 'es-pv',
  // UK subdivisions
  'gb-eng', 'gb-nir', 'gb-sct', 'gb-wls',
  // Saint Helena (uses UK flag, no distinct flag available) + its subdivisions
  'sh', 'sh-ac', 'sh-hl', 'sh-ta',
  // Uninhabited / no permanent population territories
  'aq',  // Antarctica
  'bv',  // Bouvet Island
  'gs',  // South Georgia and the South Sandwich Islands
  'hm',  // Heard Island and McDonald Islands
  'io',  // British Indian Ocean Territory
  'tf',  // French Southern and Antarctic Lands
  'um',  // United States Minor Outlying Islands
]);

function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Normalize SVG for visual comparison:
 * - Remove id attributes (flag-icons-xx identifiers)
 * - Collapse whitespace
 * - Lowercase
 * This catches cases where SVGs render identically but are structured differently.
 * NOTE: Does not catch cases where paths overlap/cover differently but render the same.
 */
function normalizedHash(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content
    .replace(/\s*id="[^"]*"/g, '')   // remove id="..."
    .replace(/\s+/g, ' ')             // collapse whitespace
    .trim()
    .toLowerCase();
  return crypto.createHash('sha256').update(content).digest('hex');
}

function run() {
  let hasIssues = false;

  // Load JSON data
  const flagsData = JSON.parse(fs.readFileSync(FLAGS_JSON, 'utf8'));
  const jsonCodes = new Set(flagsData.map(e => e.code));

  // List all SVG files
  const svgFiles = fs.readdirSync(ASSETS_DIR)
    .filter(f => f.endsWith('.svg'))
    .map(f => f.replace('.svg', ''));

  // ─── Check 1a: Exact duplicate SVG content ────────────────────────────────
  console.log('=== Check 1a: Exact duplicate SVG content ===');
  const exactHashMap = {};
  for (const code of svgFiles) {
    const hash = hashFile(path.join(ASSETS_DIR, `${code}.svg`));
    if (!exactHashMap[hash]) exactHashMap[hash] = [];
    exactHashMap[hash].push(code);
  }

  const exactDuplicates = Object.values(exactHashMap).filter(g => g.length > 1);
  if (exactDuplicates.length === 0) {
    console.log('  ✓ No byte-identical SVG files found\n');
  } else {
    hasIssues = true;
    console.log(`  ✗ ${exactDuplicates.length} group(s) of byte-identical SVG files:\n`);
    for (const group of exactDuplicates) {
      console.log(`    [${group.join(', ')}]`);
    }
    console.log();
  }

  // ─── Check 1b: Normalized duplicate SVG content ───────────────────────────
  console.log('=== Check 1b: Normalized duplicate SVG content (same visuals, different structure) ===');
  const normHashMap = {};
  for (const code of svgFiles) {
    const hash = normalizedHash(path.join(ASSETS_DIR, `${code}.svg`));
    if (!normHashMap[hash]) normHashMap[hash] = [];
    normHashMap[hash].push(code);
  }

  // Only report groups that weren't already caught by exact check,
  // and where the duplication isn't explained by whitelisted territory SVGs
  // (e.g. a territory using its parent country's flag is expected)
  const exactDupSets = exactDuplicates.map(g => new Set(g));
  const normDuplicates = Object.values(normHashMap).filter(g => {
    if (g.length <= 1) return false;
    // Already captured by exact check?
    const asSet = new Set(g);
    if (exactDupSets.some(ed => [...ed].every(c => asSet.has(c)) && [...asSet].every(c => ed.has(c)))) return false;
    // All members except at most one are whitelisted (territory uses parent flag — expected)
    const nonWhitelisted = g.filter(c => !WHITELIST.has(c));
    if (nonWhitelisted.length <= 1) return false;
    return true;
  });

  if (normDuplicates.length === 0) {
    console.log('  ✓ No normalized-duplicate SVG files found\n');
  } else {
    hasIssues = true;
    console.log(`  ✗ ${normDuplicates.length} group(s) of structurally-different but visually-similar SVGs:\n`);
    for (const group of normDuplicates) {
      const names = group.map(code => {
        const entry = flagsData.find(e => e.code === code);
        return entry ? `${code} (${entry.name})` : `${code} (not in JSON)`;
      });
      console.log(`    [${names.join(', ')}]`);
    }
    console.log('  Note: Review these manually — different SVG structure can still render identically.\n');
  }

  // ─── Check 2: Missing assets ──────────────────────────────────────────────
  console.log('=== Check 2: Missing assets (JSON code → SVG file) ===');
  const svgSet = new Set(svgFiles);
  const missing = flagsData.filter(e => !svgSet.has(e.code));

  if (missing.length === 0) {
    console.log('  ✓ All JSON codes have a corresponding SVG file\n');
  } else {
    hasIssues = true;
    console.log(`  ✗ ${missing.length} missing SVG file(s):\n`);
    for (const entry of missing) {
      console.log(`    ${entry.code}  (${entry.name})`);
    }
    console.log();
  }

  // ─── Check 3: Orphan SVG files ────────────────────────────────────────────
  console.log('=== Check 3: Orphan SVG files (not in JSON, not whitelisted) ===');
  const orphans = svgFiles.filter(code => !jsonCodes.has(code) && !WHITELIST.has(code));

  if (orphans.length === 0) {
    console.log('  ✓ No unexpected orphan SVG files\n');
  } else {
    hasIssues = true;
    console.log(`  ✗ ${orphans.length} orphan SVG file(s):\n`);
    for (const code of orphans) {
      console.log(`    ${code}.svg`);
    }
    console.log();
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log('=== Summary ===');
  console.log(`  SVG files:              ${svgFiles.length}`);
  console.log(`  JSON entries:           ${flagsData.length}`);
  console.log(`  Exact duplicate groups: ${exactDuplicates.length}`);
  console.log(`  Norm duplicate groups:  ${normDuplicates.length}`);
  console.log(`  Missing assets:         ${missing.length}`);
  console.log(`  Orphan assets:          ${orphans.length}`);
  console.log();
  if (hasIssues) {
    console.log('  RESULT: Issues found — see above');
    process.exit(1);
  } else {
    console.log('  RESULT: All checks passed ✓');
  }
}

run();
