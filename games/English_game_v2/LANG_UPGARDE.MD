Build a lightweight speech layer for the existing static HTML “English learning” game running on GitHub Pages.

Goal:
Add free client-side text-to-speech for both English and Hebrew, with no backend and no paid APIs.

Requirements:

Use the browser Web Speech API (speechSynthesis) only.

Support:

speak English word

speak Hebrew translation

optionally speak both in sequence after a correct answer

Auto-detect available voices on the user’s device.

Prefer one English voice and one Hebrew voice automatically.

Add fallback handling if Hebrew voice is unavailable.

Save selected voices and speech rate in localStorage.

Stop any currently playing speech before starting new speech.

If popup/modal closes or screen changes, cancel speech immediately.

UI additions:

Small audio settings section or modal.

English voice dropdown.

Hebrew voice dropdown.

Speech rate slider.

Test buttons:

test English

test Hebrew

Implementation notes:

Create a dedicated JS module, for example tts.js.

Functions to include:

loadVoices()

getVoicesByLang(langPrefix)

pickBestVoice(langPrefix, preferredNames)

speakText(text, lang, options)

speakSequence([{text, lang}, ...])

stopSpeech()

Use speechSynthesis.getVoices() and voiceschanged.

Filter English with en, Hebrew with he.

Use safe defaults when exact preferred voices do not exist.

Behavior:

On app load:

load voices

restore saved settings

pick best available English and Hebrew voices

On correct answer:

optionally speak English word

short delay

speak Hebrew translation

On navigation / modal close / new playback:

call speechSynthesis.cancel()

Fallback:
If no Hebrew voice exists:

disable Hebrew playback gracefully

show small note in settings: “Hebrew voice depends on browser/device support”

Code quality:

Keep it framework-free and simple.

No backend.

No external API calls.

Compatible with GitHub Pages.

Clean integration with current game structure.

Deliverables:

Updated HTML/JS/CSS files.

TTS module integrated into current game.

Minimal settings UI.

Clear comments showing where correct-answer speech is triggered.