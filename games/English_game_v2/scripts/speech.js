const speechApi=(typeof window!=='undefined' && 'speechSynthesis' in window)?window.speechSynthesis:null;
let voices=speechApi?speechApi.getVoices():[];
if(speechApi) speechApi.onvoiceschanged=()=>{voices=speechApi.getVoices();};
let speechToken=0;
let speechRetryTimer=null;
let speechWatchdogTimer=null;
let speechStartTimer=null;
let speechQueue=[];
let lastSpeechKey='';
let lastSpeechAt=0;

function clearSpeechTimers(){ if(speechRetryTimer) clearTimeout(speechRetryTimer); if(speechWatchdogTimer) clearTimeout(speechWatchdogTimer); if(speechStartTimer) clearTimeout(speechStartTimer); speechRetryTimer=null; speechWatchdogTimer=null; speechStartTimer=null; }
function hardStopSpeech(){ speechToken+=1; speechQueue=[]; clearSpeechTimers(); if(!speechApi) return; try{ speechApi.cancel(); if(speechApi.paused) speechApi.resume(); speechApi.cancel(); }catch(e){} }
function recoverSpeech(){ if(!speechApi) return; try{ if(!voices.length) voices=speechApi.getVoices(); if(speechApi.paused) speechApi.resume(); }catch(e){} }
function makeUtterance(text,lang){ const u=new SpeechSynthesisUtterance(text); u.lang=lang||'en-US'; u.rate=u.lang.startsWith('en')?0.7:0.88; u.pitch=u.lang.startsWith('en')?1.08:1; const voice=voices.find(v=>v.lang&&v.lang.toLowerCase().startsWith(u.lang.slice(0,2).toLowerCase())); if(voice) u.voice=voice; return u; }
function playSpeechQueue(token,retry){ if(token!==speechToken||!state.sound||!speechApi) return; while(speechQueue.length && !((speechQueue[0].text||'').trim())) speechQueue.shift(); if(!speechQueue.length) return; recoverSpeech(); if((speechApi.speaking||speechApi.pending) && retry<2){ speechRetryTimer=setTimeout(function(){ playSpeechQueue(token,retry+1); },55); return; } const item=speechQueue[0]; const text=(item.text||'').trim(); const lang=item.lang||'en-US'; const u=makeUtterance(text,lang); let done=false; const finish=function(tryRetry){ if(done) return; done=true; if(speechWatchdogTimer) clearTimeout(speechWatchdogTimer); speechWatchdogTimer=null; if(token!==speechToken) return; if(tryRetry && retry<1){ try{ speechApi.cancel(); }catch(e){} speechRetryTimer=setTimeout(function(){ playSpeechQueue(token,retry+1); },130); return; } speechQueue.shift(); playSpeechQueue(token,0); }; u.onend=function(){ finish(false); }; u.onerror=function(){ finish(true); }; const watchdogMs=Math.max(1600,Math.min(7000,1200+text.length*160)); speechWatchdogTimer=setTimeout(function(){ finish(true); },watchdogMs); try{ speechApi.speak(u); }catch(e){ finish(true); } }
function queueSpeech(items,interrupt=true){ if(!state.sound||!speechApi||!Array.isArray(items)||!items.length) return; const normalized=items.map(function(i){ return {text:(i&&i.text?String(i.text):'').trim(),lang:i&&i.lang?i.lang:'en-US'}; }).filter(function(i){ return !!i.text; }); if(!normalized.length) return; const key=normalized.map(function(i){ return i.lang+'|'+i.text; }).join('||'); const now=Date.now(); if(key===lastSpeechKey && (now-lastSpeechAt)<260) return; lastSpeechKey=key; lastSpeechAt=now; if(interrupt) hardStopSpeech(); const token=++speechToken; speechQueue=normalized; if(interrupt){ speechStartTimer=setTimeout(function(){ playSpeechQueue(token,0); },70); } else playSpeechQueue(token,0); }
function speak(text,lang='en-US',interrupt=true){ if(!text) return; queueSpeech([{text:text,lang:lang}],interrupt); }
function speakSequence(items){ queueSpeech(items,true); }
