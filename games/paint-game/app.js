/* ============================================================
   Coloring Fun v2 — app.js
   Phase 1: Magic Photo Studio
   Phase 2: Sticker & Scene Builder
   Phase 3: Living Gallery & Rewards
   ============================================================ */

"use strict";

// Capture blueimp's loadImage immediately (before any function hoisting can shadow it)
const blueimpLoadImage = window.loadImage;

// ============================================================
// AI LINE-ART ENGINE — onnxruntime-web config
// ============================================================
if (typeof ort !== "undefined") {
  // Point ORT at exact runtime assets next to this app.
  // A prefix string can be re-resolved relative to ort.min.js and end up as /libs/libs/.
  const ortBaseUrl = new URL("./libs/", window.location.href);
  ort.env.wasm.wasmPaths = {
    "ort-wasm-simd-threaded.wasm": new URL("ort-wasm-simd-threaded.wasm", ortBaseUrl).href,
    "ort-wasm-simd-threaded.mjs": new URL("ort-wasm-simd-threaded.mjs", ortBaseUrl).href,
    "ort-wasm-simd-threaded.jsep.mjs": new URL("ort-wasm-simd-threaded.jsep.mjs", ortBaseUrl).href,
    "ort-wasm-simd-threaded.jsep.wasm": new URL("ort-wasm-simd-threaded.jsep.wasm", ortBaseUrl).href
  };
  ort.env.wasm.numThreads = 1; // single-threaded; avoids SharedArrayBuffer requirement
  ort.env.wasm.proxy = false;
}
let _ortSession = null; // lazy-loaded ONNX inference session

// ============================================================
// DRAWINGS CATALOGUE
// ============================================================
function prettifyDrawingName(fileName) {
  return fileName
    .replace(/\.svg$/i, "")
    .replace(/\b\d+x\d+\b/gi, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildDrawingCategory(folderName, files) {
  return {
    id: folderName,
    label: folderName,
    previewSrc: `assets/drawings/${folderName}/${files[0]}`,
    drawings: files.map((file) => ({
      id: `${folderName}/${file.replace(/\.svg$/i, "")}`,
      label: prettifyDrawingName(file),
      src: `assets/drawings/${folderName}/${file}`,
      category: folderName
    }))
  };
}

const DRAWING_CATEGORIES = [
  buildDrawingCategory("ANIMALS", [
    "chicks.svg",
    "fish.svg",
    "lion.svg",
    "monkey.svg",
    "post_friends.svg",
    "snial.svg"
  ]),
  buildDrawingCategory("BLUE", [
    "Happy-Bluey-Standing-In-Backyard-Coloring-Sheet.svg",
    "Rusty-Coloring-Sheet-For-Kids.svg"
  ]),
  buildDrawingCategory("Doodles", [
    "castle.svg",
    "cheff.svg",
    "doodles1.svg",
    "doodles2.svg",
    "snowman.svg",
    "target.svg"
  ]),
  buildDrawingCategory("GABY", [
    "Baby-Box-Making-Art.svg",
    "Cakey_s-Cupcake-Cousins-Coloring-In.svg",
    "Catrat-And-Mercat-Holding-Hands-Coloring-Sheet.svg",
    "Coloring-Page-Of-Baby-Box-For-Preschoolers.svg",
    "Coloring-Page-Of-Gabby_s-Dollhouse-Poster.svg",
    "Gabby-And-Cat-Friends-Riding-In-Carlita.svg",
    "Gabby-Dancing-With-Pandy-And-DJ-Catnip-Coloring-Page.svg",
    "Gabby_s-Dollhouse-Poster-Coloring-Page.svg",
    "Halloween-Themed-Gabby_s-Dollhouse-Coloring-Sheet.svg",
    "Mama-Box-With-Baby-Box.svg",
    "Outline-Of-Cakey-Cat-Coloring-Sheet.svg",
    "Outline-Of-Gabby-To-Color.svg",
    "Pillow-Cat-Sleeping-Coloring-Page.svg",
    "Super-CatRat-To-Color.svg"
  ]),
  buildDrawingCategory("MANDALA", [
    "1-love.svg",
    "2-dig.svg",
    "gate.svg",
    "leaf.svg",
    "mandala1.svg",
    "mandala2.svg"
  ]),
  buildDrawingCategory("People", [
    "clown.svg",
    "girl_bike.svg",
    "indians_kano.svg",
    "man_guitar.svg"
  ]),
  buildDrawingCategory("SPONJ", [
    "Coloring-Page-Of-Patrik-The-Starfish-For-Kids-1583x2048.svg",
    "Coloring-Page-Of-Sandy-The-Squirrel-1583x2048.svg",
    "Coloring-Page-Of-SpongeBob-And-Patrik-Celebrating-1583x2048.svg",
    "Easy-SpongeBob-SquarePants-Coloring-Page-For-Kids-1583x2048.svg",
    "Happy-SpongeBob-Coloring-Page-1583x2048.svg"
  ])
];

const DRAWINGS = DRAWING_CATEGORIES.flatMap(category => category.drawings);

// ============================================================
// COLOR PALETTE
// ============================================================
const PALETTE = [
  { hex: "#ff595e", label: "Red"        },
  { hex: "#ff924c", label: "Orange"     },
  { hex: "#ffca3a", label: "Yellow"     },
  { hex: "#8ac926", label: "Green"      },
  { hex: "#1982c4", label: "Blue"       },
  { hex: "#6a4c93", label: "Purple"     },
  { hex: "#ff84c1", label: "Pink"       },
  { hex: "#52c7ea", label: "Cyan"       },
  { hex: "#7d5a50", label: "Brown"      },
  { hex: "#222222", label: "Black"      },
  { hex: "#ffffff", label: "White"      },
  { hex: "#2d6a4f", label: "Dark Green" },
  { hex: "#f4a261", label: "Peach"      },
  { hex: "#e63946", label: "Crimson"    },
  { hex: "#a8dadc", label: "Sky Blue"   },
];

// ============================================================
// STICKERS
// ============================================================
const STICKERS = ["⭐","❤️","🌸","🌈","🦋","☀️","☁️","✨","🎈","👑"];

// ============================================================
// PHOTO PROCESSING PRESETS (Phase 1 — renamed + new config)
// ============================================================
const PRESETS = {
  easy:  { blurRadius: 7, contrast: true,  edgeThreshold: 12, dilate: 5, gapClose: 2, noiseRemoval: 50 },
  bold:  { blurRadius: 4, contrast: true,  edgeThreshold: 28, dilate: 3, gapClose: 1, noiseRemoval: 30 },
  clean: { blurRadius: 2, contrast: false, edgeThreshold: 50, dilate: 1, gapClose: 0, noiseRemoval: 10 },
};

// ============================================================
// STATE
// ============================================================
const state = {
  screen:               "home",
  selectedColor:        "#ff595e",
  fillMode:             "solid",     // "solid" | "rainbow" | "glitter" | "sticker"
  stickerMode:          false,
  pendingSticker:       null,        // emoji string or null
  stickers:             [],          // [{emoji, x, y}]
  selectedStickerIdx:   -1,
  history:              [],
  maxHistory:           20,
  sourceType:           null,        // "drawing" | "photo"
  currentDrawingId:     null,        // "CATEGORY/file-name" without .svg
  activeDrawingCategory: null,
  photoPreset:          "easy",
  photoSourceData:      null,        // data URL of original uploaded photo
  pendingPhotoImg:      null,        // img/canvas from blueimp, before style chosen
  canvasWidth:          1024,
  canvasHeight:         768,
  celebrationTriggered: false,
  zoom:                 1,
  panX:                 0,
  panY:                 0,
};

// ============================================================
// DOM REFS
// ============================================================
const $id = id => document.getElementById(id);

const paintCanvas   = $id("paintCanvas");
const stickerCanvas = $id("stickerCanvas");
const lineCanvas    = $id("lineCanvas");
const effectsCanvas = $id("effectsCanvas");
const maskCanvas    = $id("maskCanvas");

const paintCtx   = paintCanvas.getContext("2d",   { willReadFrequently: true });
const stickerCtx = stickerCanvas.getContext("2d");
const lineCtx    = lineCanvas.getContext("2d",    { willReadFrequently: true });
const effectsCtx = effectsCanvas.getContext("2d");
const maskCtx    = maskCanvas.getContext("2d",    { willReadFrequently: true });

let statusTimer = null;

// ============================================================
// CANVAS SIZING + LAYOUT
// ============================================================
function initCanvases() {
  const W = state.canvasWidth;
  const H = state.canvasHeight;
  [paintCanvas, stickerCanvas, lineCanvas, effectsCanvas, maskCanvas].forEach(c => {
    c.width  = W;
    c.height = H;
  });
  paintCtx.imageSmoothingEnabled   = false;
  maskCtx.imageSmoothingEnabled    = false;
  lineCtx.imageSmoothingEnabled    = true;
  lineCtx.imageSmoothingQuality    = "high";
  stickerCtx.imageSmoothingEnabled = true;

  fitCanvasToStage();
}

function fitCanvasToStage() {
  const stage = $id("canvas-stage");
  const sw    = stage.clientWidth;
  const sh    = stage.clientHeight;
  const ratio = Math.min(sw / state.canvasWidth, sh / state.canvasHeight);
  const dw    = Math.floor(state.canvasWidth  * ratio);
  const dh    = Math.floor(state.canvasHeight * ratio);
  const left  = Math.floor((sw - dw) / 2);
  const top   = Math.floor((sh - dh) / 2);
  [paintCanvas, stickerCanvas, lineCanvas, effectsCanvas].forEach(c => {
    c.style.width  = dw + "px";
    c.style.height = dh + "px";
    c.style.left   = left + "px";
    c.style.top    = top  + "px";
  });
}

window.addEventListener("resize", fitCanvasToStage);

// Scroll wheel zoom on canvas stage (desktop)
$id("canvas-stage").addEventListener("wheel", e => {
  if (state.screen !== "editor") return;
  e.preventDefault();
  if (e.deltaY < 0) zoomIn(); else zoomOut();
}, { passive: false });

// ============================================================
// ZOOM & PAN
// ============================================================
const ZOOM_STEPS = [1, 2, 3, 4];

function applyCanvasZoom() {
  const inner = $id("canvas-inner");
  if (!inner) return; // guard: old cached HTML without canvas-inner
  inner.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`;
  const label = $id("zoom-label");
  if (label) label.textContent = state.zoom === 1 ? "1×" : state.zoom + "×";
}

function clampPan() {
  const stage = $id("canvas-stage");
  const maxX  = stage.clientWidth  * (state.zoom - 1) / 2;
  const maxY  = stage.clientHeight * (state.zoom - 1) / 2;
  state.panX  = Math.max(-maxX, Math.min(maxX, state.panX));
  state.panY  = Math.max(-maxY, Math.min(maxY, state.panY));
}

function zoomIn() {
  const next = ZOOM_STEPS.find(z => z > state.zoom);
  if (next) { state.zoom = next; clampPan(); applyCanvasZoom(); }
}

function zoomOut() {
  const prev = [...ZOOM_STEPS].reverse().find(z => z < state.zoom);
  if (prev) {
    state.zoom = prev;
    if (state.zoom === 1) { state.panX = 0; state.panY = 0; }
    clampPan();
    applyCanvasZoom();
  }
}

function resetZoom() {
  state.zoom = 1; state.panX = 0; state.panY = 0;
  applyCanvasZoom();
}

// ============================================================
// SCREEN NAVIGATION
// ============================================================
function showScreen(name) {
  state.screen = name;
  ["home", "editor", "gallery"].forEach(s => {
    const el = $id("screen-" + s);
    el.classList.toggle("active", s === name);
  });
  // Show zoom controls only in editor; reset zoom when leaving editor
  const zoomEl = $id("zoom-controls");
  if (zoomEl) zoomEl.style.display = name === "editor" ? "flex" : "none";
  if (name !== "editor") resetZoom();
}

// ============================================================
// STATUS PILL
// ============================================================
function showStatus(msg, duration = 2200) {
  const pill = $id("status-pill");
  pill.textContent = msg;
  pill.style.display = "block";
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    pill.style.display = "none";
    pill.classList.remove("celebration");
  }, duration);
}

// ============================================================
// LOADING OVERLAY
// ============================================================
function showLoading(msg) {
  let el = $id("loading-overlay");
  if (!el) {
    el = document.createElement("div");
    el.id = "loading-overlay";
    el.innerHTML = `<div class="spinner"></div><div id="loading-msg"></div>`;
    document.body.appendChild(el);
  }
  $id("loading-msg").textContent = msg || "Loading…";
  el.style.display = "flex";
}

function hideLoading() {
  const el = $id("loading-overlay");
  if (el) el.style.display = "none";
}

// ============================================================
// PALETTE
// ============================================================
function renderPalette() {
  const container = $id("palette");
  container.innerHTML = "";
  PALETTE.forEach(({ hex, label }) => {
    const btn = document.createElement("button");
    btn.className = "swatch" + (hex === state.selectedColor ? " selected" : "");
    btn.style.background = hex;
    btn.title = label;
    btn.setAttribute("aria-label", label);
    btn.addEventListener("click", () => selectColor(hex));
    container.appendChild(btn);
  });
}

function selectColor(hex) {
  state.selectedColor = hex;
  renderPalette();
}

// ============================================================
// DRAWING PICKER
// ============================================================
function openDrawingPicker() {
  state.activeDrawingCategory = null;
  $id("drawing-picker").style.display = "flex";
  updateDrawingPickerHeader();
  renderDrawingGrid();
}

function closeDrawingPicker() {
  state.activeDrawingCategory = null;
  $id("drawing-picker").style.display = "none";
}

function updateDrawingPickerHeader() {
  const title = $id("picker-title");
  const backBtn = $id("btn-picker-back");

  if (!state.activeDrawingCategory) {
    title.textContent = "Choose a Category";
    backBtn.style.display = "none";
    return;
  }

  title.textContent = state.activeDrawingCategory;
  backBtn.style.display = "inline-flex";
}

function renderDrawingGrid() {
  const grid = $id("drawing-grid");
  grid.innerHTML = "";

  if (!state.activeDrawingCategory) {
    DRAWING_CATEGORIES.forEach(({ id, label, previewSrc, drawings }) => {
      const btn = document.createElement("button");
      btn.className = "drawing-thumb";
      btn.setAttribute("aria-label", "Open " + label + " category");

      const img = document.createElement("img");
      img.src = previewSrc;
      img.alt = label;
      img.loading = "lazy";

      btn.appendChild(img);
      btn.addEventListener("click", () => {
        state.activeDrawingCategory = id;
        updateDrawingPickerHeader();
        renderDrawingGrid();
      });
      grid.appendChild(btn);
    });
    return;
  }

  const category = DRAWING_CATEGORIES.find(item => item.id === state.activeDrawingCategory);
  if (!category) {
    state.activeDrawingCategory = null;
    updateDrawingPickerHeader();
    renderDrawingGrid();
    return;
  }

  category.drawings.forEach(({ id, label, src }) => {
    const btn = document.createElement("button");
    btn.className = "drawing-thumb";
    btn.setAttribute("aria-label", "Choose " + label);
    btn.title = label;

    const img = document.createElement("img");
    img.src = src;
    img.alt = label;
    img.loading = "lazy";

    btn.appendChild(img);
    btn.addEventListener("click", () => {
      closeDrawingPicker();
      loadBuiltinDrawing(id, label);
    });
    grid.appendChild(btn);
  });
}

// ============================================================
// LOAD BUILT-IN DRAWING
// ============================================================
function loadBuiltinDrawing(id, label) {
  showLoading("Loading…");
  showScreen("editor");
  $id("editor-title").textContent = label || id;
  $id("photo-presets").style.display = "none";

  state.sourceType          = "drawing";
  state.currentDrawingId    = id;
  state.history             = [];
  state.stickers            = [];
  state.selectedStickerIdx  = -1;
  state.celebrationTriggered = false;

  loadSVG(`assets/drawings/${id}.svg`)
    .then(img => {
      clearAllCanvases();
      renderLineArt(img);
      buildMask();
      hideLoading();
      fitCanvasToStage();
      autosave();
    })
    .catch(err => {
      hideLoading();
      showStatus("Could not load drawing");
      console.error(err);
    });
}

function loadSVG(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load: " + src));
    img.src = src;
  });
}

// ============================================================
// RENDER LINE ART
// ============================================================
function renderLineArt(img) {
  // IMPORTANT: do NOT fill with white — lineCanvas must stay transparent
  lineCtx.clearRect(0, 0, state.canvasWidth, state.canvasHeight);
  lineCtx.drawImage(img, 0, 0, state.canvasWidth, state.canvasHeight);
}

// ============================================================
// BUILD MASK FROM LINE CANVAS
// ============================================================
function buildMask() {
  const W = state.canvasWidth;
  const H = state.canvasHeight;
  const lineData = lineCtx.getImageData(0, 0, W, H);
  const src = lineData.data;
  const maskData = maskCtx.createImageData(W, H);
  const dst = maskData.data;

  for (let i = 0; i < src.length; i += 4) {
    const r = src[i], g = src[i+1], b = src[i+2], a = src[i+3];
    const luminance  = 0.299*r + 0.587*g + 0.114*b;
    const isBoundary = (a > 128) && (luminance < 90);
    if (isBoundary) {
      dst[i] = dst[i+1] = dst[i+2] = 0;
      dst[i+3] = 255;
    } else {
      dst[i] = dst[i+1] = dst[i+2] = 255;
      dst[i+3] = 255;
    }
  }
  maskCtx.putImageData(maskData, 0, 0);
}

// ============================================================
// CLEAR ALL CANVASES
// ============================================================
function clearAllCanvases() {
  paintCtx.clearRect(0, 0, state.canvasWidth, state.canvasHeight);
  lineCtx.clearRect(0, 0, state.canvasWidth, state.canvasHeight);
  maskCtx.clearRect(0, 0, state.canvasWidth, state.canvasHeight);
  stickerCtx.clearRect(0, 0, state.canvasWidth, state.canvasHeight);
  effectsCtx.clearRect(0, 0, state.canvasWidth, state.canvasHeight);
}

// ============================================================
// FILL TOOL
// ============================================================
function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function canvasEventCoords(e) {
  const rect   = lineCanvas.getBoundingClientRect();
  const scaleX = state.canvasWidth  / rect.width;
  const scaleY = state.canvasHeight / rect.height;
  const clientX = e.clientX !== undefined ? e.clientX : (e.touches ? e.touches[0].clientX : 0);
  const clientY = e.clientY !== undefined ? e.clientY : (e.touches ? e.touches[0].clientY : 0);
  return {
    x: Math.floor((clientX - rect.left) * scaleX),
    y: Math.floor((clientY - rect.top)  * scaleY),
  };
}

function doFill(x, y) {
  const W = state.canvasWidth;
  const H = state.canvasHeight;
  if (x < 0 || x >= W || y < 0 || y >= H) return;

  const maskImageData = maskCtx.getImageData(0, 0, W, H);
  const maskPx = maskImageData.data;
  const idx = (y * W + x) * 4;
  if (maskPx[idx] < 128) return; // clicked on a boundary

  pushHistory();

  const maskCopy = new Uint8ClampedArray(maskPx);
  const marker = { r: 1, g: 2, b: 3, a: 255 };
  floodfill(maskCopy, x, y, marker, 32, W, H);

  const paintImageData = paintCtx.getImageData(0, 0, W, H);
  const paintPx = paintImageData.data;
  const { r, g, b } = hexToRgb(state.selectedColor);

  // Collect all flooded pixel indices
  const filledPixels = [];
  for (let i = 0; i < maskCopy.length; i += 4) {
    if (maskCopy[i] === 1 && maskCopy[i+1] === 2 && maskCopy[i+2] === 3) {
      filledPixels.push(i);
    }
  }

  if (filledPixels.length === 0) {
    state.history.pop();
    return;
  }

  if (state.fillMode === "solid") {
    for (let k = 0; k < filledPixels.length; k++) {
      const i = filledPixels[k];
      paintPx[i]   = r;
      paintPx[i+1] = g;
      paintPx[i+2] = b;
      paintPx[i+3] = 255;
    }
    paintCtx.putImageData(paintImageData, 0, 0);

  } else if (state.fillMode === "rainbow") {
    // Compute bounding box of the filled region
    let minX = W, maxX = 0;
    for (let k = 0; k < filledPixels.length; k++) {
      const pixIdx = filledPixels[k] / 4;
      const px = pixIdx % W;
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
    }
    const regionW = Math.max(1, maxX - minX);

    // Rainbow: Red→Orange→Yellow→Green→Blue→Purple
    const rainbowColors = [
      [255,  59,  94],  // Red    (#ff595e)
      [255, 146,  76],  // Orange (#ff924c)
      [255, 202,  58],  // Yellow (#ffca3a)
      [138, 201,  38],  // Green  (#8ac926)
      [ 25, 130, 196],  // Blue   (#1982c4)
      [106,  76, 147],  // Purple (#6a4c93)
    ];

    function getRainbowColor(t) {
      // t in [0,1]
      const segments = rainbowColors.length - 1;
      const pos = t * segments;
      const seg = Math.min(Math.floor(pos), segments - 1);
      const f   = pos - seg;
      const c0  = rainbowColors[seg];
      const c1  = rainbowColors[seg + 1];
      return [
        Math.round(c0[0] + (c1[0] - c0[0]) * f),
        Math.round(c0[1] + (c1[1] - c0[1]) * f),
        Math.round(c0[2] + (c1[2] - c0[2]) * f),
      ];
    }

    for (let k = 0; k < filledPixels.length; k++) {
      const i = filledPixels[k];
      const pixIdx = i / 4;
      const px = pixIdx % W;
      const t  = (px - minX) / regionW;
      const [cr, cg, cb] = getRainbowColor(t);
      paintPx[i]   = cr;
      paintPx[i+1] = cg;
      paintPx[i+2] = cb;
      paintPx[i+3] = 255;
    }
    paintCtx.putImageData(paintImageData, 0, 0);

  } else if (state.fillMode === "glitter") {
    // Solid fill first
    for (let k = 0; k < filledPixels.length; k++) {
      const i = filledPixels[k];
      paintPx[i]   = r;
      paintPx[i+1] = g;
      paintPx[i+2] = b;
      paintPx[i+3] = 255;
    }
    paintCtx.putImageData(paintImageData, 0, 0);
    startGlitterEffect(filledPixels, W);
  }

  autosave();
  checkCompletion();
}

// ============================================================
// GLITTER EFFECT
// ============================================================
function startGlitterEffect(filledPixels, W) {
  const numParticles = Math.min(80, Math.max(20, Math.floor(filledPixels.length / 60)));
  const particles = [];

  // Sample random positions from the filled region
  const step = Math.max(1, Math.floor(filledPixels.length / numParticles));
  for (let k = 0; k < numParticles; k++) {
    const i = filledPixels[(k * step) % filledPixels.length];
    const pixIdx = i / 4;
    const px = pixIdx % W;
    const py = Math.floor(pixIdx / W);
    particles.push({
      x: px, y: py,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: 1.0,
      size: 2 + Math.random() * 3,
      hue: Math.floor(Math.random() * 360),
    });
  }

  const startTime = performance.now();
  const duration  = 1500;

  function animateGlitter(now) {
    const elapsed = now - startTime;
    const progress = elapsed / duration;
    if (progress >= 1) {
      effectsCtx.clearRect(0, 0, state.canvasWidth, state.canvasHeight);
      return;
    }

    effectsCtx.clearRect(0, 0, state.canvasWidth, state.canvasHeight);
    for (let p of particles) {
      p.x    += p.vx;
      p.y    += p.vy;
      p.life  = 1 - progress;
      p.hue  += 5;
      effectsCtx.globalAlpha = p.life;
      effectsCtx.fillStyle   = `hsl(${p.hue},100%,65%)`;
      effectsCtx.beginPath();
      effectsCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      effectsCtx.fill();
    }
    effectsCtx.globalAlpha = 1;
    requestAnimationFrame(animateGlitter);
  }

  requestAnimationFrame(animateGlitter);
}

// ============================================================
// STICKER SYSTEM
// ============================================================
function renderStickers() {
  const W = state.canvasWidth;
  const H = state.canvasHeight;
  const defaultSz = Math.floor(W / 14);
  stickerCtx.clearRect(0, 0, W, H);
  stickerCtx.textAlign    = "center";
  stickerCtx.textBaseline = "middle";

  state.stickers.forEach((s, idx) => {
    const sz  = s.size || defaultSz;
    const rot = s.rotation || 0;
    stickerCtx.font = `${sz}px serif`;

    if (idx === state.selectedStickerIdx) {
      const half = Math.floor(sz * 0.6);
      // Selection box — drawn in sticker's rotated local space
      stickerCtx.save();
      stickerCtx.translate(s.x, s.y);
      stickerCtx.rotate(rot);
      stickerCtx.strokeStyle = "#ff8c42";
      stickerCtx.lineWidth   = 4;
      stickerCtx.strokeRect(-half, -half, half * 2, half * 2);
      stickerCtx.restore();

      // Handle world position: local corner (half, half) rotated to world
      const hx = s.x + half * (Math.cos(rot) - Math.sin(rot));
      const hy = s.y + half * (Math.sin(rot) + Math.cos(rot));
      stickerCtx.beginPath();
      stickerCtx.arc(hx, hy, 14, 0, Math.PI * 2);
      stickerCtx.fillStyle = "#ff8c42";
      stickerCtx.fill();
      stickerCtx.strokeStyle = "#fff";
      stickerCtx.lineWidth   = 2;
      stickerCtx.stroke();
    }

    // Emoji — drawn in sticker's rotated local space
    stickerCtx.save();
    stickerCtx.translate(s.x, s.y);
    stickerCtx.rotate(rot);
    stickerCtx.fillText(s.emoji, 0, 0);
    stickerCtx.restore();
  });
}

function findStickerAt(x, y) {
  const defaultSz = Math.floor(state.canvasWidth / 14);
  for (let i = state.stickers.length - 1; i >= 0; i--) {
    const s  = state.stickers[i];
    const sz = s.size || defaultSz;
    const r  = Math.floor(sz * 0.6);
    const dx = x - s.x;
    const dy = y - s.y;
    if (Math.sqrt(dx*dx + dy*dy) <= r) return i;
  }
  return -1;
}

function findResizeHandleAt(x, y) {
  const idx = state.selectedStickerIdx;
  if (idx < 0) return -1;
  const s    = state.stickers[idx];
  const sz   = s.size || Math.floor(state.canvasWidth / 14);
  const rot  = s.rotation || 0;
  const half = Math.floor(sz * 0.6);
  const hx   = s.x + half * (Math.cos(rot) - Math.sin(rot));
  const hy   = s.y + half * (Math.sin(rot) + Math.cos(rot));
  const dx   = x - hx;
  const dy   = y - hy;
  return Math.sqrt(dx*dx + dy*dy) <= 22 ? idx : -1;
}

function placeSticker(x, y) {
  if (!state.pendingSticker) return;
  state.stickers.push({ emoji: state.pendingSticker, x, y, size: Math.floor(state.canvasWidth / 14), rotation: 0 });
  state.selectedStickerIdx = state.stickers.length - 1;
  renderStickers();
  autosave();
}

function deleteSelectedSticker() {
  if (state.selectedStickerIdx < 0 || state.selectedStickerIdx >= state.stickers.length) return;
  state.stickers.splice(state.selectedStickerIdx, 1);
  state.selectedStickerIdx = -1;
  renderStickers();
  autosave();
}

function renderStickerTray() {
  const grid = $id("sticker-grid");
  grid.innerHTML = "";
  STICKERS.forEach(emoji => {
    const btn = document.createElement("button");
    btn.className = "sticker-emoji";
    btn.textContent = emoji;
    btn.setAttribute("aria-label", "Add " + emoji + " sticker");
    btn.addEventListener("click", () => {
      state.pendingSticker = emoji;
      // Highlight selected emoji button
      grid.querySelectorAll(".sticker-emoji").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
    grid.appendChild(btn);
  });
}

function toggleStickerMode(on) {
  state.stickerMode = on;
  const tray = $id("sticker-tray");
  tray.style.display = on ? "flex" : "none";
  if (!on) {
    state.pendingSticker     = null;
    state.selectedStickerIdx = -1;
    renderStickers();
  }
}

// ============================================================
// FILL MODE BUTTONS
// ============================================================
function setFillMode(mode) {
  state.fillMode = mode;
  document.querySelectorAll(".fill-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });
  if (mode === "sticker") {
    toggleStickerMode(true);
  } else {
    toggleStickerMode(false);
  }
}

// ============================================================
// POINTER EVENTS ON LINE CANVAS
// ============================================================
let _pointerStart     = null;  // {x, y} canvas coords at touch start
let _dragStickerIdx   = -1;    // index of sticker being dragged, or -1
let _resizeStickerIdx = -1;    // index of sticker being resized, or -1
let _resizeInitDist   = 0;     // distance from center to pointer at resize start
let _resizeInitSize   = 0;     // sticker.size at resize start
let _dragging         = false;
let _lastClientPos    = null;  // {x, y} raw client coords, for pan delta
const _activePointers = new Map(); // pointerId → {x,y} for pinch detection
let _pinchStartDist = 0;
let _pinchStartZoom = 1;

lineCanvas.addEventListener("pointerdown", e => {
  e.preventDefault();
  lineCanvas.setPointerCapture(e.pointerId);
  _activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  // Two-finger pinch starts — don't begin fill
  if (_activePointers.size === 2) {
    const [p1, p2] = [..._activePointers.values()];
    _pinchStartDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    _pinchStartZoom = state.zoom;
    _pointerStart   = null;
    return;
  }

  const { x, y } = canvasEventCoords(e);
  _pointerStart   = { x, y };
  _lastClientPos  = { x: e.clientX, y: e.clientY };
  _dragging         = false;
  _dragStickerIdx   = -1;
  _resizeStickerIdx = -1;

  if (state.stickerMode) {
    const rIdx = findResizeHandleAt(x, y);
    if (rIdx >= 0) {
      _resizeStickerIdx = rIdx;
      const s = state.stickers[rIdx];
      _resizeInitDist = Math.sqrt((x - s.x) ** 2 + (y - s.y) ** 2);
      _resizeInitSize = s.size || Math.floor(state.canvasWidth / 14);
    } else {
      const hitIdx = findStickerAt(x, y);
      if (hitIdx >= 0) {
        _dragStickerIdx          = hitIdx;
        state.selectedStickerIdx = hitIdx;
        renderStickers();
      }
    }
  }
});

lineCanvas.addEventListener("pointermove", e => {
  e.preventDefault();
  _activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  // Two-finger pinch — scale zoom
  if (_activePointers.size >= 2) {
    const [p1, p2] = [..._activePointers.values()];
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    if (_pinchStartDist > 0) {
      const raw = _pinchStartZoom * (dist / _pinchStartDist);
      state.zoom = ZOOM_STEPS.reduce((a, b) => Math.abs(b - raw) < Math.abs(a - raw) ? b : a);
      clampPan();
      applyCanvasZoom();
    }
    return;
  }

  if (!_pointerStart) return;
  const { x, y } = canvasEventCoords(e);
  const dx = x - _pointerStart.x;
  const dy = y - _pointerStart.y;

  if (!_dragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
    _dragging = true;
  }

  if (_dragging) {
    if (_resizeStickerIdx >= 0 && state.stickerMode) {
      // Resize + rotate sticker via single handle
      // Angle from center to pointer → sticker rotation (handle sits at 45° in local space)
      // Distance from center to pointer → sticker size  (handle sits at half*√2 from center)
      const s  = state.stickers[_resizeStickerIdx];
      const dx = x - s.x, dy = y - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 4) {
        s.rotation = Math.atan2(dy, dx) - Math.PI / 4;
        const minSz = Math.floor(state.canvasWidth / 28);
        const maxSz = Math.floor(state.canvasWidth / 4);
        s.size = Math.min(maxSz, Math.max(minSz,
          Math.round(dist / (0.6 * Math.SQRT2))));
        renderStickers();
      }
    } else if (_dragStickerIdx >= 0 && state.stickerMode) {
      // Drag sticker
      state.stickers[_dragStickerIdx].x = x;
      state.stickers[_dragStickerIdx].y = y;
      renderStickers();
    } else if (state.zoom > 1) {
      // Pan canvas
      state.panX += e.clientX - _lastClientPos.x;
      state.panY += e.clientY - _lastClientPos.y;
      clampPan();
      applyCanvasZoom();
    }
  }
  _lastClientPos = { x: e.clientX, y: e.clientY };
});

lineCanvas.addEventListener("pointerup", e => {
  e.preventDefault();
  _activePointers.delete(e.pointerId);
  _pinchStartDist = 0;

  if (!_pointerStart) return;
  const { x, y } = canvasEventCoords(e);
  const wasDrag = _dragging;
  _dragging     = false;

  if (state.stickerMode) {
    if (_resizeStickerIdx >= 0) {
      _resizeStickerIdx = -1;
      autosave();
    } else if (_dragStickerIdx >= 0) {
      if (wasDrag) {
        // Finished drag — finalize sticker position
        autosave();
      }
      _dragStickerIdx = -1;
    } else if (!wasDrag && state.pendingSticker) {
      // Tap on empty space — place sticker
      placeSticker(x, y);
    } else if (!wasDrag) {
      // Tap on empty space with no pending sticker — deselect
      state.selectedStickerIdx = -1;
      renderStickers();
    }
  } else {
    // Fill only on tap (not drag — drag pans when zoomed)
    if (!wasDrag) {
      doFill(x, y);
    }
  }

  _pointerStart = null;
});

lineCanvas.addEventListener("pointercancel", e => {
  _activePointers.delete(e.pointerId);
  _pinchStartDist   = 0;
  _pointerStart     = null;
  _dragging         = false;
  _resizeStickerIdx = -1;
});

// ============================================================
// UNDO / HISTORY
// ============================================================
function pushHistory() {
  const snap = paintCtx.getImageData(0, 0, state.canvasWidth, state.canvasHeight);
  state.history.push(snap);
  if (state.history.length > state.maxHistory) state.history.shift();
}

function undo() {
  if (state.history.length === 0) { showStatus("Nothing to undo"); return; }
  const snap = state.history.pop();
  paintCtx.putImageData(snap, 0, 0);
  autosave();
}

// ============================================================
// CLEAR
// ============================================================
function clearPaint() {
  if (!confirm("Clear all your colors?")) return;
  state.history              = [];
  state.stickers             = [];
  state.selectedStickerIdx   = -1;
  state.celebrationTriggered = false;
  paintCtx.clearRect(0, 0, state.canvasWidth, state.canvasHeight);
  stickerCtx.clearRect(0, 0, state.canvasWidth, state.canvasHeight);
  autosave();
}

// ============================================================
// PRINT COLORED PAGE
// ============================================================
function printColored() {
  const exp     = document.createElement("canvas");
  exp.width     = state.canvasWidth;
  exp.height    = state.canvasHeight;
  const ctx     = exp.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, exp.width, exp.height);
  ctx.drawImage(paintCanvas,   0, 0);
  ctx.drawImage(stickerCanvas, 0, 0);
  ctx.drawImage(lineCanvas,    0, 0);

  const dataUrl = exp.toDataURL("image/png");

  const w = window.open("", "_blank");
  if (!w) return; // popup blocked — nothing to do

  w.document.write(`<!DOCTYPE html>
<html>
<head>
<style>
  @page { size: auto; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; background: #fff; }
  img {
    display: block;
    width: 100%;
    height: 100vh;
    object-fit: contain;
    page-break-inside: avoid;
  }
</style>
</head>
<body>
<img src="${dataUrl}">
<p style="text-align:center;font-size:9pt;color:#bbb;margin-top:6px">Printed from Coloring Fun &middot; All artwork stays on your device</p>
<script>
  window.onload = function() {
    window.print();
    window.onafterprint = function() { window.close(); };
  };
</script>
</body>
</html>`);
  w.document.close();
}

// ============================================================
// DOWNLOAD PNG
// ============================================================
function downloadImage() {
  const exp     = document.createElement("canvas");
  exp.width     = state.canvasWidth;
  exp.height    = state.canvasHeight;
  const ctx     = exp.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, exp.width, exp.height);
  ctx.drawImage(paintCanvas,   0, 0);
  ctx.drawImage(stickerCanvas, 0, 0);
  ctx.drawImage(lineCanvas,    0, 0);

  const now   = new Date();
  const stamp = now.getFullYear().toString()
    + String(now.getMonth() + 1).padStart(2, "0")
    + String(now.getDate()).padStart(2, "0") + "-"
    + String(now.getHours()).padStart(2, "0")
    + String(now.getMinutes()).padStart(2, "0");

  exp.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement("a");
    a.href     = url;
    a.download = `yeah-${stamp}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showStatus("Downloaded!");
  }, "image/png");
}

// ============================================================
// SAVE TO MY ART GALLERY
// ============================================================
function saveImage() {
  saveToGallery();
  showStatus("Saved to My Art! 🎉");
}

// ============================================================
// LOCAL AUTOSAVE
// ============================================================
let autosaveTimer = null;

function autosave() {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(_doAutosave, 500);
}

function _doAutosave() {
  try {
    const data = {
      sourceType:       state.sourceType,
      currentDrawingId: state.currentDrawingId,
      selectedColor:    state.selectedColor,
      photoPreset:      state.photoPreset,
      paintSnapshot:    paintCanvas.toDataURL(),
      stickers:         JSON.stringify(state.stickers),
    };
    if (state.sourceType === "photo") {
      data.lineSnapshot    = lineCanvas.toDataURL();
      data.photoSourceData = state.photoSourceData;
    }
    localStorage.setItem("coloringfun_v1_session", JSON.stringify(data));
  } catch (e) {
    console.warn("Autosave failed:", e);
  }
}

function hasSavedSession() {
  return !!localStorage.getItem("coloringfun_v1_session");
}

function resumeSession() {
  const raw = localStorage.getItem("coloringfun_v1_session");
  if (!raw) return;
  let data;
  try { data = JSON.parse(raw); } catch (e) { return; }

  state.selectedColor       = data.selectedColor    || state.selectedColor;
  state.photoPreset         = data.photoPreset      || "easy";
  state.sourceType          = data.sourceType;
  state.currentDrawingId    = data.currentDrawingId;
  state.photoSourceData     = data.photoSourceData  || null;
  state.stickers            = [];
  state.celebrationTriggered = false;

  try {
    if (data.stickers) state.stickers = JSON.parse(data.stickers);
  } catch (e) {}

  showLoading("Resuming…");
  showScreen("editor");
  renderPalette();

  const restorePaint = paintSnap => {
    if (!paintSnap) return Promise.resolve();
    return loadSVG(paintSnap).then(img => paintCtx.drawImage(img, 0, 0));
  };

  if (data.sourceType === "drawing" && data.currentDrawingId) {
    const drawing = DRAWINGS.find(d => d.id === data.currentDrawingId);
    $id("editor-title").textContent = drawing ? drawing.label : data.currentDrawingId;
    $id("photo-presets").style.display = "none";

    loadSVG(`assets/drawings/${data.currentDrawingId}.svg`)
      .then(img => {
        clearAllCanvases();
        renderLineArt(img);
        buildMask();
        return restorePaint(data.paintSnapshot);
      })
      .then(() => {
        renderStickers();
        hideLoading();
        fitCanvasToStage();
      })
      .catch(() => hideLoading());

  } else if (data.sourceType === "photo" && data.lineSnapshot) {
    $id("editor-title").textContent = "My Photo";
    $id("photo-presets").style.display = "flex";
    setActivePreset(data.photoPreset || "easy");

    loadSVG(data.lineSnapshot)
      .then(lineImg => {
        clearAllCanvases();
        // Photo mode: draw the snapshot directly (no white fillRect on lineCanvas)
        lineCtx.drawImage(lineImg, 0, 0);
        buildMask();
        return restorePaint(data.paintSnapshot);
      })
      .then(() => {
        renderStickers();
        hideLoading();
        fitCanvasToStage();
      })
      .catch(() => hideLoading());
  } else {
    hideLoading();
  }
}

// ============================================================
// BACK BUTTON
// ============================================================
function goBack() {
  if (state.history.length > 0) {
    if (!confirm("Go back? Your unsaved colors will be lost.")) return;
  }
  state.history = [];
  setFillMode("solid");
  showScreen("home");
  updateResumeButton();
}

function updateResumeButton() {
  $id("btn-resume").style.display = hasSavedSession() ? "block" : "none";
}

// ============================================================
// PHOTO MODE — Phase 1 new flow
// ============================================================
function openPhotoInput() {
  $id("photo-input").value = "";
  $id("photo-input").click();
}

function onPhotoSelected(e) {
  const file = e.target.files[0];
  if (!file) return;

  showLoading("Loading photo…");

  blueimpLoadImage(
    file,
    imgOrCanvas => {
      hideLoading();
      state.pendingPhotoImg  = imgOrCanvas;
      state.photoPreset      = "easy";
      openPhotoStylePicker(imgOrCanvas);
    },
    {
      maxWidth:    state.canvasWidth,
      maxHeight:   state.canvasHeight,
      orientation: true,
      canvas:      true,
    }
  );
}

function openPhotoStylePicker(img) {
  // Reset style buttons
  document.querySelectorAll(".style-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.style === "easy");
  });
  $id("photo-style-picker").style.display = "flex";
  updateStylePreview(img, "easy");
}

function closePhotoStylePicker() {
  $id("photo-style-picker").style.display = "none";
}

function updateStylePreview(img, preset) {
  const PW = 320;
  const PH = 240;
  const previewCanvas = $id("style-preview-canvas");
  const previewCtx    = previewCanvas.getContext("2d", { willReadFrequently: true });

  // Process at small size for fast preview (classic pipeline — instant)
  const thickEdges = processPhotoClassic(img, preset, PW, PH);

  // Build RGBA for preview: edges → black opaque, non-edges → white opaque
  const imgData = previewCtx.createImageData(PW, PH);
  const d = imgData.data;
  for (let i = 0; i < thickEdges.length; i++) {
    const b4 = i * 4;
    if (thickEdges[i] > 0) {
      d[b4] = d[b4+1] = d[b4+2] = 0;   d[b4+3] = 255;
    } else {
      d[b4] = d[b4+1] = d[b4+2] = 255; d[b4+3] = 255;
    }
  }
  previewCtx.putImageData(imgData, 0, 0);
}

function processPhotoClassic(imgOrCanvas, preset, W, H) {
  const cfg = PRESETS[preset] || PRESETS.easy;

  const off    = document.createElement("canvas");
  off.width    = W;
  off.height   = H;
  const offCtx = off.getContext("2d");
  offCtx.fillStyle = "#ffffff";
  offCtx.fillRect(0, 0, W, H);

  const srcW = imgOrCanvas.width  || imgOrCanvas.naturalWidth;
  const srcH = imgOrCanvas.height || imgOrCanvas.naturalHeight;
  const scale = Math.min(W / srcW, H / srcH);
  const dx = (W - srcW * scale) / 2;
  const dy = (H - srcH * scale) / 2;
  offCtx.drawImage(imgOrCanvas, dx, dy, srcW * scale, srcH * scale);

  const imageData = offCtx.getImageData(0, 0, W, H);

  let gray = toGrayscale(imageData);
  if (cfg.contrast) gray = normalizeContrast(gray);
  gray = boxBlur(gray, W, H, cfg.blurRadius);
  const edges    = sobelEdges(gray, W, H);
  let   binEdges = threshold(edges, cfg.edgeThreshold);
  if (cfg.noiseRemoval > 0) binEdges = removeSmallNoise(binEdges, W, H, cfg.noiseRemoval);
  if (cfg.gapClose > 0)     binEdges = closeLineGaps(binEdges, W, H, cfg.gapClose);
  const thickEdges = dilate(binEdges, W, H, cfg.dilate);

  return thickEdges;
}

function confirmPhotoStyle() {
  if (!state.pendingPhotoImg) return;
  closePhotoStylePicker();

  const preset = state.photoPreset;
  showLoading("Making your coloring page… ✨");

  // Save original data URL for re-processing
  const srcW   = state.pendingPhotoImg.width  || state.pendingPhotoImg.naturalWidth;
  const srcH   = state.pendingPhotoImg.height || state.pendingPhotoImg.naturalHeight;
  const offTemp = document.createElement("canvas");
  offTemp.width  = srcW;
  offTemp.height = srcH;
  offTemp.getContext("2d").drawImage(state.pendingPhotoImg, 0, 0);
  state.photoSourceData = offTemp.toDataURL("image/jpeg", 0.85);

  showScreen("editor");
  $id("editor-title").textContent = "My Photo";
  $id("photo-presets").style.display = "flex";

  state.sourceType          = "photo";
  state.currentDrawingId    = null;
  state.history             = [];
  state.stickers            = [];
  state.selectedStickerIdx  = -1;
  state.celebrationTriggered = false;

  // Use setTimeout to allow UI to update before heavy processing
  setTimeout(async () => {
    await processPhotoAi(state.pendingPhotoImg, preset);
    state.pendingPhotoImg = null;
  }, 30);
}

// ============================================================
// IMAGE PROCESSING PIPELINE
// ============================================================

function toGrayscale(imageData) {
  const src = imageData.data;
  const len = imageData.width * imageData.height;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    const j = i * 4;
    out[i] = Math.round(0.299 * src[j] + 0.587 * src[j+1] + 0.114 * src[j+2]);
  }
  return out;
}

function normalizeContrast(gray) {
  let minV = 255, maxV = 0;
  for (let i = 0; i < gray.length; i++) {
    if (gray[i] < minV) minV = gray[i];
    if (gray[i] > maxV) maxV = gray[i];
  }
  const range = maxV - minV;
  if (range < 1) return gray;
  const out = new Uint8Array(gray.length);
  for (let i = 0; i < gray.length; i++) {
    out[i] = Math.round(((gray[i] - minV) / range) * 255);
  }
  return out;
}

function boxBlur(gray, W, H, radius) {
  if (radius < 1) return gray;
  const r   = Math.max(1, Math.floor(radius));
  const tmp = new Uint8Array(gray.length);
  const out = new Uint8Array(gray.length);

  for (let y = 0; y < H; y++) {
    const base = y * W;
    for (let x = 0; x < W; x++) {
      let sum = 0, count = 0;
      for (let dx = -r; dx <= r; dx++) {
        const nx = x + dx;
        if (nx >= 0 && nx < W) { sum += gray[base + nx]; count++; }
      }
      tmp[base + x] = count > 0 ? Math.round(sum / count) : 0;
    }
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let sum = 0, count = 0;
      for (let dy = -r; dy <= r; dy++) {
        const ny = y + dy;
        if (ny >= 0 && ny < H) { sum += tmp[ny * W + x]; count++; }
      }
      out[y * W + x] = count > 0 ? Math.round(sum / count) : 0;
    }
  }
  return out;
}

function sobelEdges(gray, W, H) {
  const edges = new Uint8Array(gray.length);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const tl = gray[(y-1)*W + (x-1)], tc = gray[(y-1)*W + x], tr = gray[(y-1)*W + (x+1)];
      const ml = gray[ y   *W + (x-1)],                          mr = gray[ y   *W + (x+1)];
      const bl = gray[(y+1)*W + (x-1)], bc = gray[(y+1)*W + x], br = gray[(y+1)*W + (x+1)];
      const gx = -tl - 2*ml - bl + tr + 2*mr + br;
      const gy = -tl - 2*tc - tr + bl + 2*bc + br;
      edges[y*W + x] = Math.min(255, Math.round(Math.sqrt(gx*gx + gy*gy)));
    }
  }
  return edges;
}

function threshold(edges, thresh) {
  const out = new Uint8Array(edges.length);
  for (let i = 0; i < edges.length; i++) {
    out[i] = edges[i] >= thresh ? 255 : 0;
  }
  return out;
}

function removeSmallNoise(bin, W, H, minSize) {
  // BFS connected component labeling — remove components smaller than minSize
  const visited = new Uint8Array(bin.length);
  const out     = new Uint8Array(bin.length);

  for (let start = 0; start < bin.length; start++) {
    if (bin[start] === 0 || visited[start]) continue;
    // BFS
    const queue = [start];
    const component = [start];
    visited[start] = 1;
    let head = 0;

    while (head < queue.length) {
      const cur  = queue[head++];
      const cx   = cur % W;
      const cy   = Math.floor(cur / W);
      const nbrs = [
        cy > 0     ? cur - W : -1,
        cy < H - 1 ? cur + W : -1,
        cx > 0     ? cur - 1 : -1,
        cx < W - 1 ? cur + 1 : -1,
      ];
      for (let nb of nbrs) {
        if (nb >= 0 && !visited[nb] && bin[nb] === 255) {
          visited[nb] = 1;
          queue.push(nb);
          component.push(nb);
        }
      }
    }

    if (component.length >= minSize) {
      for (let idx of component) out[idx] = 255;
    }
  }
  return out;
}

function erode(bin, W, H, passes) {
  let src = bin;
  for (let p = 0; p < passes; p++) {
    const dst = new Uint8Array(src.length);
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const i = y*W + x;
        // Pixel stays white only if all 4-neighbors are also white
        if (src[i] && src[i-1] && src[i+1] && src[i-W] && src[i+W]) {
          dst[i] = 255;
        }
      }
    }
    src = dst;
  }
  return src;
}

function dilate(bin, W, H, passes) {
  let src = bin;
  for (let p = 0; p < passes; p++) {
    const dst = new Uint8Array(src.length);
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const i = y*W + x;
        if (src[i] || src[i-1] || src[i+1] || src[i-W] || src[i+W]) {
          dst[i] = 255;
        }
      }
    }
    src = dst;
  }
  return src;
}

function closeLineGaps(bin, W, H, passes) {
  // Morphological closing: dilate then erode
  const dilated = dilate(bin, W, H, passes);
  return erode(dilated, W, H, passes);
}

// Shared: write edge array to lineCanvas + maskCanvas
function renderEdgesToCanvases(thickEdges, W, H) {
  const lineImgData = lineCtx.createImageData(W, H);
  const maskImgData = maskCtx.createImageData(W, H);
  const ld = lineImgData.data;
  const md = maskImgData.data;

  for (let i = 0; i < thickEdges.length; i++) {
    const isEdge = thickEdges[i] > 0;
    const b4 = i * 4;
    if (isEdge) {
      ld[b4] = ld[b4+1] = ld[b4+2] = 0;   ld[b4+3] = 255;
      md[b4] = md[b4+1] = md[b4+2] = 0;   md[b4+3] = 255;
    } else {
      ld[b4] = ld[b4+1] = ld[b4+2] = 0;   ld[b4+3] = 0;
      md[b4] = md[b4+1] = md[b4+2] = 255; md[b4+3] = 255;
    }
  }

  clearAllCanvases();
  lineCtx.putImageData(lineImgData, 0, 0);
  maskCtx.putImageData(maskImgData, 0, 0);
  setActivePreset(state.photoPreset);
}

// Load the ONNX model once; reuse session for subsequent calls
async function loadAiModel() {
  if (_ortSession) return _ortSession;
  _ortSession = await ort.InferenceSession.create("./models/informative-drawings.onnx");
  return _ortSession;
}

// Run AI inference: returns Uint8Array of grayscale [outW*outH] where 255=line, 0=background
async function runAiLineArtModel(imgOrCanvas, outW, outH) {
  const SIZE = 512;

  // 1. Letterbox source into 512×512
  const off = document.createElement("canvas");
  off.width = off.height = SIZE;
  const ctx = off.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SIZE, SIZE);
  const srcW = imgOrCanvas.width || imgOrCanvas.naturalWidth;
  const srcH = imgOrCanvas.height || imgOrCanvas.naturalHeight;
  const scale = Math.min(SIZE / srcW, SIZE / srcH);
  ctx.drawImage(imgOrCanvas,
    (SIZE - srcW * scale) / 2, (SIZE - srcH * scale) / 2,
    srcW * scale, srcH * scale);

  // 2. Build NCHW Float32 tensor normalised [0,1]
  const pixels = ctx.getImageData(0, 0, SIZE, SIZE).data;
  const input  = new Float32Array(3 * SIZE * SIZE);
  for (let i = 0; i < SIZE * SIZE; i++) {
    input[i]               = pixels[i * 4]     / 255; // R
    input[i + SIZE * SIZE]   = pixels[i * 4 + 1] / 255; // G
    input[i + SIZE * SIZE * 2] = pixels[i * 4 + 2] / 255; // B
  }
  const tensor = new ort.Tensor("float32", input, [1, 3, SIZE, SIZE]);

  // 3. Inference
  const session    = await loadAiModel();
  const inputName  = session.inputNames[0];
  const outputName = session.outputNames[0];
  const results    = await session.run({ [inputName]: tensor });
  const output     = results[outputName].data; // Float32Array, shape [1,1,512,512]

  // 4. Model output: near 0 = line (dark), near 1 = background (light). Invert → 255=line.
  const gray512 = new Uint8Array(SIZE * SIZE);
  for (let i = 0; i < SIZE * SIZE; i++) {
    gray512[i] = Math.round((1 - Math.max(0, Math.min(1, output[i]))) * 255);
  }

  // 5. Scale 512×512 → outW×outH via canvas (browser bilinear)
  const scaleCanvas = document.createElement("canvas");
  scaleCanvas.width = SIZE; scaleCanvas.height = SIZE;
  const scaleCtx = scaleCanvas.getContext("2d");
  const imgData  = scaleCtx.createImageData(SIZE, SIZE);
  for (let i = 0; i < SIZE * SIZE; i++) {
    const v = gray512[i];
    imgData.data[i * 4]     = v;
    imgData.data[i * 4 + 1] = v;
    imgData.data[i * 4 + 2] = v;
    imgData.data[i * 4 + 3] = 255;
  }
  scaleCtx.putImageData(imgData, 0, 0);

  const outCanvas = document.createElement("canvas");
  outCanvas.width = outW; outCanvas.height = outH;
  outCanvas.getContext("2d").drawImage(scaleCanvas, 0, 0, outW, outH);
  const outPixels = outCanvas.getContext("2d").getImageData(0, 0, outW, outH).data;

  const grayscale = new Uint8Array(outW * outH);
  for (let i = 0; i < outW * outH; i++) grayscale[i] = outPixels[i * 4];
  return grayscale;
}

// Apply preset post-processing to AI grayscale output (same params as classic pipeline)
function postProcessAiOutput(grayscale, W, H, preset) {
  const cfg = PRESETS[preset] || PRESETS.easy;
  let bin = threshold(grayscale, cfg.edgeThreshold);
  if (cfg.noiseRemoval > 0) bin = removeSmallNoise(bin, W, H, cfg.noiseRemoval);
  if (cfg.gapClose > 0)     bin = closeLineGaps(bin, W, H, cfg.gapClose);
  return dilate(bin, W, H, cfg.dilate);
}

// Main photo processing entry point — AI by default, falls back to classic
async function processPhotoAi(imgOrCanvas, preset) {
  const W = state.canvasWidth;
  const H = state.canvasHeight;
  try {
    if (typeof ort === "undefined") throw new Error("ORT not loaded");
    const grayscale  = await runAiLineArtModel(imgOrCanvas, W, H);
    const thickEdges = postProcessAiOutput(grayscale, W, H, preset);
    renderEdgesToCanvases(thickEdges, W, H);
  } catch (err) {
    console.error("AI inference failed — error details:", err);
    console.error("ORT available:", typeof ort, "| session:", _ortSession);
    showStatus("Using Fast Mode… (check console for error)");
    const thickEdges = processPhotoClassic(imgOrCanvas, preset, W, H);
    renderEdgesToCanvases(thickEdges, W, H);
  }
  hideLoading();
  fitCanvasToStage();
  autosave();
}

function onPresetChange(preset) {
  if (state.sourceType !== "photo") return;
  state.photoPreset = preset;
  setActivePreset(preset);

  if (state.photoSourceData) {
    showLoading("Applying preset…");
    state.history = [];
    loadSVG(state.photoSourceData)
      .then(img => processPhotoAi(img, preset))
      .catch(() => hideLoading());
  } else {
    showStatus("Upload your photo again to apply this preset");
  }
}

function setActivePreset(preset) {
  document.querySelectorAll(".preset-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.preset === preset);
  });
  state.photoPreset = preset;
}

// ============================================================
// GALLERY — Phase 3
// ============================================================
const GALLERY_KEY      = "coloringfun_gallery";
const GALLERY_MAX      = 10;

function galleryGetAll() {
  try {
    return JSON.parse(localStorage.getItem(GALLERY_KEY) || "[]");
  } catch (e) { return []; }
}

function gallerySave(entries) {
  try {
    localStorage.setItem(GALLERY_KEY, JSON.stringify(entries));
  } catch (e) {
    console.warn("Gallery save failed:", e);
  }
}

function galleryDelete(id) {
  const entries = galleryGetAll().filter(e => e.id !== id);
  gallerySave(entries);
}

function saveToGallery() {
  // Create 200x150 thumbnail: white bg + paint + stickers + line
  const thumb    = document.createElement("canvas");
  thumb.width    = 200;
  thumb.height   = 150;
  const tCtx     = thumb.getContext("2d");
  tCtx.fillStyle = "#ffffff";
  tCtx.fillRect(0, 0, 200, 150);
  tCtx.drawImage(paintCanvas,   0, 0, 200, 150);
  tCtx.drawImage(stickerCanvas, 0, 0, 200, 150);
  tCtx.drawImage(lineCanvas,    0, 0, 200, 150);

  const thumbnail = thumb.toDataURL("image/jpeg", 0.7);

  const now     = new Date();
  const dateStr = now.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  let name = "Coloring";
  if (state.sourceType === "drawing" && state.currentDrawingId) {
    const d = DRAWINGS.find(x => x.id === state.currentDrawingId);
    if (d) name = d.label;
  } else if (state.sourceType === "photo") {
    name = "My Photo";
  }

  const entry = {
    id:           Date.now().toString(),
    name,
    date:         dateStr,
    thumbnail,
    paintData:    paintCanvas.toDataURL("image/png"),
    lineData:     state.sourceType === "photo" ? lineCanvas.toDataURL("image/png") : null,
    stickersData: JSON.stringify(state.stickers),
    sourceType:   state.sourceType,
    drawingId:    state.currentDrawingId,
    photoPreset:  state.photoPreset,
    photoSourceData: state.sourceType === "photo" ? state.photoSourceData : null,
  };

  const entries = galleryGetAll();
  entries.unshift(entry);
  if (entries.length > GALLERY_MAX) entries.length = GALLERY_MAX;
  gallerySave(entries);
}

function openGalleryScreen() {
  showScreen("gallery");
  renderGalleryGrid();
}

function renderGalleryGrid() {
  const grid  = $id("gallery-grid");
  const empty = $id("gallery-empty");
  const entries = galleryGetAll();

  grid.innerHTML = "";

  if (entries.length === 0) {
    grid.style.display  = "none";
    empty.style.display = "flex";
    return;
  }

  grid.style.display  = "grid";
  empty.style.display = "none";

  entries.forEach(entry => {
    const card = document.createElement("div");
    card.className = "gallery-item";

    const img    = document.createElement("img");
    img.className = "gallery-item-thumb";
    img.src       = entry.thumbnail;
    img.alt       = entry.name;

    const meta = document.createElement("div");
    meta.className = "gallery-item-meta";

    const nameEl = document.createElement("div");
    nameEl.className   = "gallery-item-name";
    nameEl.textContent = entry.name;

    const dateEl = document.createElement("div");
    dateEl.className   = "gallery-item-date";
    dateEl.textContent = entry.date;

    meta.appendChild(nameEl);
    meta.appendChild(dateEl);

    const delBtn = document.createElement("button");
    delBtn.className   = "gallery-item-delete";
    delBtn.textContent = "🗑 Delete";
    delBtn.addEventListener("click", ev => {
      ev.stopPropagation();
      if (confirm(`Delete "${entry.name}"?`)) {
        galleryDelete(entry.id);
        renderGalleryGrid();
      }
    });

    card.appendChild(img);
    card.appendChild(meta);
    card.appendChild(delBtn);

    // Tap card → open in editor
    card.addEventListener("click", () => openArtworkFromGallery(entry));

    grid.appendChild(card);
  });
}

function openArtworkFromGallery(entry) {
  showLoading("Opening artwork…");
  showScreen("editor");

  state.sourceType          = entry.sourceType;
  state.currentDrawingId    = entry.drawingId || null;
  state.photoPreset         = entry.photoPreset || "easy";
  state.history             = [];
  state.stickers            = [];
  state.celebrationTriggered = false;

  try {
    if (entry.stickersData) state.stickers = JSON.parse(entry.stickersData);
  } catch (e) {}

  if (entry.sourceType === "photo") {
    state.photoSourceData = entry.photoSourceData || null;
  }

  const restorePaint = () => {
    if (!entry.paintData) return Promise.resolve();
    return loadSVG(entry.paintData).then(img => paintCtx.drawImage(img, 0, 0));
  };

  if (entry.sourceType === "drawing" && entry.drawingId) {
    const drawing = DRAWINGS.find(d => d.id === entry.drawingId);
    $id("editor-title").textContent = drawing ? drawing.label : entry.drawingId;
    $id("photo-presets").style.display = "none";

    loadSVG(`assets/drawings/${entry.drawingId}.svg`)
      .then(img => {
        clearAllCanvases();
        renderLineArt(img);
        buildMask();
        return restorePaint();
      })
      .then(() => {
        renderStickers();
        hideLoading();
        fitCanvasToStage();
        autosave();
      })
      .catch(() => hideLoading());

  } else if (entry.sourceType === "photo" && entry.lineData) {
    $id("editor-title").textContent = "My Photo";
    $id("photo-presets").style.display = "flex";
    setActivePreset(entry.photoPreset || "easy");

    loadSVG(entry.lineData)
      .then(lineImg => {
        clearAllCanvases();
        lineCtx.drawImage(lineImg, 0, 0);
        buildMask();
        return restorePaint();
      })
      .then(() => {
        renderStickers();
        hideLoading();
        fitCanvasToStage();
        autosave();
      })
      .catch(() => hideLoading());
  } else {
    hideLoading();
  }
}

// ============================================================
// COMPLETION DETECTION + CELEBRATION — Phase 3
// ============================================================
function checkCompletion() {
  if (state.celebrationTriggered) return;

  const W = state.canvasWidth;
  const H = state.canvasHeight;

  const maskData  = maskCtx.getImageData(0, 0, W, H).data;
  const paintData = paintCtx.getImageData(0, 0, W, H).data;

  let fillable = 0;
  let colored  = 0;

  for (let i = 0; i < maskData.length; i += 4) {
    // Fillable = white in maskCanvas
    if (maskData[i] > 128) {
      fillable++;
      // Colored = has paint (alpha > 0)
      if (paintData[i+3] > 0) {
        colored++;
      }
    }
  }

  if (fillable === 0) return;
  const ratio = colored / fillable;
  if (ratio >= 0.80) {
    state.celebrationTriggered = true;
    triggerCelebration();
  }
}

function triggerCelebration() {
  // Show celebration status
  const pill = $id("status-pill");
  pill.textContent = "Amazing work!";
  pill.style.display = "block";
  pill.classList.add("celebration");
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    pill.style.display = "none";
    pill.classList.remove("celebration");
  }, 4000);

  // Create confetti container
  const container = document.createElement("div");
  container.className = "confetti-container";
  document.body.appendChild(container);

  const colors = [
    "#ff595e","#ff924c","#ffca3a","#8ac926",
    "#1982c4","#6a4c93","#ff84c1","#52c7ea",
  ];

  for (let i = 0; i < 60; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";

    const left     = Math.random() * 100;
    const duration = 2.5 + Math.random() * 2.0;
    const delay    = Math.random() * 1.0;
    const color    = colors[Math.floor(Math.random() * colors.length)];
    const width    = 8 + Math.floor(Math.random() * 8);
    const height   = 12 + Math.floor(Math.random() * 8);

    piece.style.cssText = `
      left: ${left}%;
      top: 0;
      width: ${width}px;
      height: ${height}px;
      background: ${color};
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
    `;

    container.appendChild(piece);
  }

  setTimeout(() => {
    if (container.parentNode) container.parentNode.removeChild(container);
  }, 4500);
}

// ============================================================
// EVENT LISTENERS
// ============================================================
function bindEvents() {
  // Home screen
  $id("btn-choose-drawing").addEventListener("click", openDrawingPicker);
  $id("btn-use-photo").addEventListener("click", openPhotoInput);
  $id("btn-resume").addEventListener("click", resumeSession);
  $id("btn-open-gallery").addEventListener("click", openGalleryScreen);

  // Drawing picker
  $id("btn-picker-close").addEventListener("click", closeDrawingPicker);
  $id("btn-picker-back").addEventListener("click", () => {
    state.activeDrawingCategory = null;
    updateDrawingPickerHeader();
    renderDrawingGrid();
  });
  $id("drawing-picker").addEventListener("click", e => {
    if (e.target === $id("drawing-picker")) closeDrawingPicker();
  });

  // Photo style picker
  $id("btn-style-picker-close").addEventListener("click", closePhotoStylePicker);
  $id("photo-style-picker").addEventListener("click", e => {
    if (e.target === $id("photo-style-picker")) closePhotoStylePicker();
  });
  document.querySelectorAll(".style-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const preset = btn.dataset.style;
      state.photoPreset = preset;
      document.querySelectorAll(".style-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.style === preset);
      });
      if (state.pendingPhotoImg) {
        updateStylePreview(state.pendingPhotoImg, preset);
      }
    });
  });
  $id("btn-use-page").addEventListener("click", confirmPhotoStyle);

  // Gallery screen
  $id("btn-gallery-back").addEventListener("click", () => {
    showScreen("home");
    updateResumeButton();
  });

  // Editor
  $id("btn-back").addEventListener("click", goBack);
  $id("btn-save").addEventListener("click", saveImage);
  $id("btn-download").addEventListener("click", downloadImage);
  $id("btn-print").addEventListener("click", printColored);
  $id("btn-undo").addEventListener("click", undo);
  $id("btn-clear").addEventListener("click", clearPaint);

  // Zoom controls
  $id("btn-zoom-in").addEventListener("click", zoomIn);
  $id("btn-zoom-out").addEventListener("click", zoomOut);
  $id("zoom-label").addEventListener("click", resetZoom); // tap label to reset

  // Privacy modal
  $id("btn-privacy").addEventListener("click", () => {
    $id("privacy-modal").style.display = "flex";
  });
  $id("btn-privacy-close").addEventListener("click", () => {
    $id("privacy-modal").style.display = "none";
  });
  $id("privacy-modal").addEventListener("click", e => {
    if (e.target === $id("privacy-modal")) $id("privacy-modal").style.display = "none";
  });

  // Photo file input
  $id("photo-input").addEventListener("change", onPhotoSelected);

  // Photo preset buttons
  document.querySelectorAll(".preset-btn").forEach(btn => {
    btn.addEventListener("click", () => onPresetChange(btn.dataset.preset));
  });

  // Fill mode buttons
  document.querySelectorAll(".fill-btn").forEach(btn => {
    btn.addEventListener("click", () => setFillMode(btn.dataset.mode));
  });

  // Sticker delete button
  $id("btn-delete-sticker").addEventListener("click", deleteSelectedSticker);

  // Keyboard shortcuts
  document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault();
      undo();
    }
  });
}

// ============================================================
// SERVICE WORKER
// ============================================================
function registerSW() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
      .catch(err => console.warn("SW registration failed:", err));
  }
}

// ============================================================
// INIT
// ============================================================
function init() {
  initCanvases();
  renderPalette();
  renderStickerTray();
  bindEvents();
  updateResumeButton();
  registerSW();
}

init();
