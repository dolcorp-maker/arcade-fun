// ============================================================
// Coloring Fun v1 — sw.js
// Cache-first service worker for offline support
// ============================================================

const CACHE_NAME = "coloring-fun-v3";

const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./libs/ort.min.js",
  "./libs/ort-wasm-simd-threaded.wasm",
  "./libs/ort-wasm-simd-threaded.mjs",
  "./libs/ort-wasm-simd-threaded.jsep.mjs",
  "./libs/ort-wasm-simd-threaded.jsep.wasm",
  "./models/informative-drawings.onnx",
  "./libs/load-image.min.js",
  "./libs/jsfeat-min.js",
  "./libs/floodfill.min.js",
  // Categorized drawings
  "./assets/drawings/ANIMALS/chicks.svg",
  "./assets/drawings/ANIMALS/fish.svg",
  "./assets/drawings/ANIMALS/lion.svg",
  "./assets/drawings/ANIMALS/monkey.svg",
  "./assets/drawings/ANIMALS/post_friends.svg",
  "./assets/drawings/ANIMALS/snial.svg",
  "./assets/drawings/BLUE/Happy-Bluey-Standing-In-Backyard-Coloring-Sheet.svg",
  "./assets/drawings/BLUE/Rusty-Coloring-Sheet-For-Kids.svg",
  "./assets/drawings/Doodles/castle.svg",
  "./assets/drawings/Doodles/cheff.svg",
  "./assets/drawings/Doodles/doodles1.svg",
  "./assets/drawings/Doodles/doodles2.svg",
  "./assets/drawings/Doodles/snowman.svg",
  "./assets/drawings/Doodles/target.svg",
  "./assets/drawings/GABY/Baby-Box-Making-Art.svg",
  "./assets/drawings/GABY/Cakey_s-Cupcake-Cousins-Coloring-In.svg",
  "./assets/drawings/GABY/Catrat-And-Mercat-Holding-Hands-Coloring-Sheet.svg",
  "./assets/drawings/GABY/Coloring-Page-Of-Baby-Box-For-Preschoolers.svg",
  "./assets/drawings/GABY/Coloring-Page-Of-Gabby_s-Dollhouse-Poster.svg",
  "./assets/drawings/GABY/Gabby-And-Cat-Friends-Riding-In-Carlita.svg",
  "./assets/drawings/GABY/Gabby-Dancing-With-Pandy-And-DJ-Catnip-Coloring-Page.svg",
  "./assets/drawings/GABY/Gabby_s-Dollhouse-Poster-Coloring-Page.svg",
  "./assets/drawings/GABY/Halloween-Themed-Gabby_s-Dollhouse-Coloring-Sheet.svg",
  "./assets/drawings/GABY/Mama-Box-With-Baby-Box.svg",
  "./assets/drawings/GABY/Outline-Of-Cakey-Cat-Coloring-Sheet.svg",
  "./assets/drawings/GABY/Outline-Of-Gabby-To-Color.svg",
  "./assets/drawings/GABY/Pillow-Cat-Sleeping-Coloring-Page.svg",
  "./assets/drawings/GABY/Super-CatRat-To-Color.svg",
  "./assets/drawings/MANDALA/1-love.svg",
  "./assets/drawings/MANDALA/2-dig.svg",
  "./assets/drawings/MANDALA/gate.svg",
  "./assets/drawings/MANDALA/leaf.svg",
  "./assets/drawings/MANDALA/mandala1.svg",
  "./assets/drawings/MANDALA/mandala2.svg",
  "./assets/drawings/People/clown.svg",
  "./assets/drawings/People/girl_bike.svg",
  "./assets/drawings/People/indians_kano.svg",
  "./assets/drawings/People/man_guitar.svg",
  "./assets/drawings/SPONJ/Coloring-Page-Of-Patrik-The-Starfish-For-Kids-1583x2048.svg",
  "./assets/drawings/SPONJ/Coloring-Page-Of-Sandy-The-Squirrel-1583x2048.svg",
  "./assets/drawings/SPONJ/Coloring-Page-Of-SpongeBob-And-Patrik-Celebrating-1583x2048.svg",
  "./assets/drawings/SPONJ/Easy-SpongeBob-SquarePants-Coloring-Page-For-Kids-1583x2048.svg",
  "./assets/drawings/SPONJ/Happy-SpongeBob-Coloring-Page-1583x2048.svg",
  // Icons
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
];

// Install: cache the app shell
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activate: delete old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first, fallback to network, fallback to index.html
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Cache valid responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }
      });
    })
  );
});
