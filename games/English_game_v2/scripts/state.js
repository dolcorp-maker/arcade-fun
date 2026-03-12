const $=id=>document.getElementById(id);
const state={mode:null,category:'all',current:null,options:[],stars:0,streak:0,round:1,chests:0,pet:0,sound:true,autoPlay:true,repeatMs:5200,repeatTimer:null,roundSpeakTimeout:null,challengeTick:null,challengeTimeout:null,challengeDeadline:0,challengeRoundMs:0,unlockedStickers:2,enabledIds:new Set(),memoryDeck:[],memoryFlipped:[],memoryMatches:0,letterIndex:0,letterEntry:null,letterRevealed:false,letterFlipped:new Set()};

function shuffle(arr){const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a;}
function pick(arr){return arr[Math.floor(Math.random()*arr.length)];}
function norm(s){return (s||'').toLowerCase().trim();}
function isSimpleWord(w){ return w.en.indexOf(' ')===-1 && w.en.indexOf('-')===-1 && w.en.length<=12; }
function currentDifficulty(){return Math.min(4, 1+Math.floor((state.round-1)/8));}
function loadSettings(){const raw=sessionStorage.getItem(storageKey); if(raw){try{state.enabledIds=new Set(JSON.parse(raw));}catch(e){}} if(!state.enabledIds.size) ALL_WORDS.forEach(w=>state.enabledIds.add(w.id));}
function saveSettings(){sessionStorage.setItem(storageKey, JSON.stringify([...state.enabledIds]));}
