function getEnabledPool(){return ALL_WORDS.filter(w=>state.enabledIds.has(w.id));}
function getPool(){const enabled=getEnabledPool(); const cat=state.category==='all'?enabled:enabled.filter(function(w){ return w.cat===state.category; }); const max=currentDifficulty(); let pool=cat.filter(function(w){ return w.level<=max; }); const simplePool=pool.filter(isSimpleWord); if(simplePool.length>=4) pool=simplePool; if(pool.length<4) pool=cat.length>=4?cat:enabled; const fallbackSimple=pool.filter(isSimpleWord); if(fallbackSimple.length>=4) pool=fallbackSimple; return pool;}

function startMode(mode){
  state.mode=mode;
  $('homeScreen').classList.add('hidden');
  $('gameScreen').classList.remove('hidden');
  const listenLayout=$('listenLayout');
  const memoryLayout=$('memoryLayout');
  const lettersLayout=$('lettersLayout');
  if(listenLayout) listenLayout.classList.toggle('hidden', mode==='memory' || mode==='letters');
  if(memoryLayout) memoryLayout.classList.toggle('hidden', mode!=='memory');
  if(lettersLayout) lettersLayout.classList.toggle('hidden', mode!=='letters');
  updateChallengeVisibility();
  updateHud();
  if(mode==='memory') buildMemory();
  else if(mode==='letters') nextLetterRound(false);
  else nextRound(true);
}
function clearRoundSpeakTimeout(){ if(state.roundSpeakTimeout) clearTimeout(state.roundSpeakTimeout); state.roundSpeakTimeout=null; }
function goHome(){clearRepeat(); clearRoundSpeakTimeout(); clearChallengeTimer(); hardStopSpeech(); $('gameScreen').classList.add('hidden'); $('homeScreen').classList.remove('hidden'); $('resultOverlay').classList.remove('show'); renderHome();}
function refreshHomeIfVisible(){ if(!$('homeScreen').classList.contains('hidden')) renderHome(); }
function clearRepeat(){if(state.repeatTimer) clearInterval(state.repeatTimer); state.repeatTimer=null;}
function startRepeatLoop(){clearRepeat(); if(!state.autoPlay||!state.current) return; state.repeatTimer=setInterval(()=>repeatWord(false), state.repeatMs);}
function toggleAutoPlay(){state.autoPlay=!state.autoPlay; $('autoPlayLabel').textContent='⏱️ חזרה אוטומטית: '+(state.autoPlay?'פועלת':'כבויה'); if(state.autoPlay) startRepeatLoop(); else { clearRepeat(); hardStopSpeech(); }}
function updateChallengeVisibility(){ $('challengeWrap').classList.toggle('show', state.mode==='challenge'); if(state.mode!=='challenge') $('challengeProgress').style.width='0%'; }
function clearChallengeTimer(){ if(state.challengeTick) clearInterval(state.challengeTick); if(state.challengeTimeout) clearTimeout(state.challengeTimeout); state.challengeTick=null; state.challengeTimeout=null; state.challengeDeadline=0; state.challengeRoundMs=0; }
function getChallengeRoundMs(){ const difficulty=currentDifficulty(); const innerStage=(state.round-1)%8; return Math.max(2600, Math.round((8200-((difficulty-1)*1200)-(innerStage*180)))); }
function paintChallengeBar(){ if(state.mode!=='challenge'||!state.challengeRoundMs) return; const left=Math.max(0,state.challengeDeadline-Date.now()); $('challengeProgress').style.width=((left/state.challengeRoundMs)*100)+'%'; }
function onChallengeTimeout(){ if(state.mode!=='challenge'||!state.current||$('resultOverlay').classList.contains('show')) return; clearRepeat(); clearRoundSpeakTimeout(); clearChallengeTimer(); document.querySelectorAll('.choice').forEach(function(b){ b.dataset.locked='1'; if(b.querySelector('.h').textContent===state.current.he) b.classList.add('correct'); }); state.streak=0; showResult(false,'נגמר הזמן. זו הייתה המילה '+state.current.he+'.'); speakSequence([{text:'נגמר הזמן',lang:'he-IL'},{text:state.current.en,lang:'en-US'},{text:state.current.he,lang:'he-IL'}]); updateHud(); refreshHomeIfVisible(); }
function startChallengeTimer(){ clearChallengeTimer(); updateChallengeVisibility(); if(state.mode!=='challenge'||!state.current) return; state.challengeRoundMs=getChallengeRoundMs(); state.challengeDeadline=Date.now()+state.challengeRoundMs; paintChallengeBar(); state.challengeTick=setInterval(paintChallengeBar,80); state.challengeTimeout=setTimeout(onChallengeTimeout,state.challengeRoundMs+20); }
function nextRound(first=false){clearRepeat(); clearRoundSpeakTimeout(); clearChallengeTimer(); hardStopSpeech(); updateChallengeVisibility(); const pool=getPool(); if(pool.length<4){showResult(false,'אין מספיק מילים פעילות. פתחו עוד מילים בהגדרות ההורה.'); return;} state.current=pick(pool); const wrong=shuffle(pool.filter(x=>x.id!==state.current.id)).slice(0,3); state.options=shuffle([state.current,...wrong]); $('mascot').textContent=PETS[state.pet].icon; $('petTop').textContent=PETS[state.pet].name; $('previewEmoji').textContent='❓'; $('previewHe').textContent='מופיע אחרי תשובה'; $('speechTitle').textContent=state.mode==='challenge'?'מהר, יש אתגר!':'הקשיבי למילה באנגלית'; $('speechLine').textContent='המילה תחזור אוטומטית כל כמה שניות עד שנבחרת תשובה'; $('questionText').textContent='הקשיבי למילה ובחרי את האימוג׳י הנכון'; $('liveDifficulty').textContent=currentDifficulty(); renderChoices(); updateProgress(); startChallengeTimer(); state.roundSpeakTimeout=setTimeout(()=>repeatWord(true), first?350:50); startRepeatLoop();}
function renderChoices(){ $('choices').innerHTML=''; state.options.forEach(opt=>{ const btn=document.createElement('button'); btn.className='choice'; btn.innerHTML=`<div class="e">${opt.emoji}</div><div class="h">${opt.he}</div>`; btn.onclick=()=>answer(opt,btn); $('choices').appendChild(btn); }); }
function answer(opt, el){ if(el.dataset.locked) return; clearRepeat(); clearRoundSpeakTimeout(); clearChallengeTimer(); document.querySelectorAll('.choice').forEach(function(b){ b.dataset.locked='1'; }); const ok=opt.id===state.current.id; const praiseWord=pick(PRAISE); document.getElementById('previewEmoji').textContent=state.current.emoji; document.getElementById('previewHe').textContent=state.current.he+' ('+state.current.en+')'; if(ok){ el.classList.add('correct'); state.stars+=state.mode==='challenge'?2:1; state.streak+=1; if(state.streak%5===0) state.chests+=1; if(state.stars>0&&state.stars%4===0&&state.unlockedStickers<STICKERS.length) state.unlockedStickers+=1; burst(el); confetti(26); floatText('יששש!', el.getBoundingClientRect()); const msg=praiseWord+' '+state.current.en+' זה '+state.current.he+'.'; showResult(true,msg); speakSequence([{text:praiseWord,lang:'he-IL'},{text:state.current.en,lang:'en-US'},{text:state.current.he,lang:'he-IL'}]); } else { el.classList.add('wrong'); state.streak=0; Array.from(document.querySelectorAll('.choice')).forEach(function(b){ if(b.querySelector('.h').textContent===state.current.he) b.classList.add('correct'); }); const gentleWord=pick(GENTLE); const msg=gentleWord+' זו הייתה המילה '+state.current.he+'.'; showResult(false,msg); speakSequence([{text:gentleWord,lang:'he-IL'},{text:state.current.en,lang:'en-US'},{text:state.current.he,lang:'he-IL'}]); } updateHud(); refreshHomeIfVisible(); }
function repeatWord(manual){ if(state.current && !$('resultOverlay').classList.contains('show')){ speak(state.current.en,'en-US'); if(manual) floatText(state.current.en, $('previewEmoji').getBoundingClientRect(), '#fff3ad'); } }
function showHint(){ if(state.current) floatText(state.current.he, document.getElementById('previewEmoji').getBoundingClientRect(), '#ffd24f'); }
function openDisclaimer(){ document.getElementById('infoOverlay').classList.add('show'); }
function closeDisclaimer(){ hardStopSpeech(); document.getElementById('infoOverlay').classList.remove('show'); }
function updateHud(){ $('stars').textContent=state.stars; $('streak').textContent=state.streak; $('round').textContent=state.round; $('chests').textContent=state.chests; $('petTop').textContent=PETS[state.pet].name; $('liveDifficulty').textContent=currentDifficulty(); }
function updateProgress(){ $('progress').style.width=`${((state.round-1)%8)/8*100}%`; }
function showResult(ok,text){ $('resultEmoji').textContent=ok?pick(['🎉','🌟','🥳','✨']):pick(['💛','🙂','🌈']); $('resultTitle').textContent=ok?pick(PRAISE):'עוד ניסיון'; $('resultText').textContent=text; $('resultOverlay').classList.add('show'); }
function closeResult(next){
  hardStopSpeech();
  clearRepeat();
  clearRoundSpeakTimeout();
  $('resultOverlay').classList.remove('show');
  document.querySelectorAll('.choice').forEach(function(b){ delete b.dataset.locked; });
  if(next){
    if(state.mode==='memory'){ renderMemory(); return; }
    if(state.mode==='letters'){ nextLetterRound(true); return; }
    state.round+=1;
    nextRound();
    return;
  }
  if(state.mode==='challenge'){ startChallengeTimer(); return; }
  if(state.current && state.mode!=='memory' && state.autoPlay) startRepeatLoop();
}

function getLetterShadow(word){
  if(!word) return '_';
  return word.split('').map(function(ch,i){
    if(i===0) return ch.toUpperCase();
    return /[A-Za-z]/.test(ch) ? '_' : ch;
  }).join(' ');
}
function updateLetterProgress(){
  const progressEl=$('letterProgress');
  if(progressEl){
    const total=(LETTER_WORDS&&LETTER_WORDS.length)?LETTER_WORDS.length:0;
    progressEl.textContent=state.letterFlipped.size+'/'+total;
  }
}
function renderLetterBoard(){
  const board=$('letterBoard');
  if(!board || !LETTER_WORDS || !LETTER_WORDS.length) return;
  board.innerHTML=LETTER_WORDS.map(function(entry,i){
    const flipped=state.letterFlipped.has(i)?' flipped':'';
    const active=i===state.letterIndex?' active':'';
    return `<button class="letter-tile${flipped}${active}" data-index="${i}" onclick="revealLetterCard(${i}, this)">
      <span class="letter-tile-inner">
        <span class="letter-face front">${entry.letter}</span>
        <span class="letter-face back"><span class="tile-emoji">${entry.emoji||'✨'}</span><span class="tile-word">${entry.word}</span><span class="tile-he">${entry.he}</span></span>
      </span>
    </button>`;
  }).join('');
  updateLetterProgress();
}
function speakLetter(){
  if(!state.letterEntry) return;
  const letterPrompt=state.letterEntry.letter.toLowerCase();
  speakSequence([{text:letterPrompt,lang:'en-US'}]);
}
function playCurrentLetterWord(){
  if(!state.letterEntry) return;
  revealLetterWord();
}
function revealLetterCard(index, el){
  if(!LETTER_WORDS[index]) return;
  hardStopSpeech();
  state.letterIndex=index;
  state.letterEntry=LETTER_WORDS[index];
  state.letterRevealed=true;
  state.letterFlipped.add(index);
  renderLetterRound();
  if(el){
    const board=$('letterBoard');
    if(board) board.querySelectorAll('.letter-tile.active').forEach(function(n){ n.classList.remove('active'); });
    el.classList.add('active');
    el.classList.add('flipped');
  }
  revealLetterWord();
}
function revealLetterWord(){
  if(!state.letterEntry) return;
  state.letterRevealed=true;
  state.letterFlipped.add(state.letterIndex);
  updateLetterProgress();
  const emojiEl=$('letterWordEmoji');
  const enEl=$('letterWordEn');
  const heEl=$('letterWordHe');
  const wrap=$('letterRevealBox');
  if(emojiEl) emojiEl.textContent=state.letterEntry.emoji||'✨';
  if(enEl) enEl.textContent=state.letterEntry.word;
  if(enEl) enEl.classList.remove('shadow');
  if(heEl) heEl.textContent='פירוש: '+state.letterEntry.he;
  if(wrap) wrap.classList.add('show');
  const tile=document.querySelector('.letter-tile[data-index="'+state.letterIndex+'"]');
  if(tile){ tile.classList.add('flipped'); tile.classList.add('active'); }
  speakSequence([
    {text:state.letterEntry.word,lang:'en-US'},
    {text:'בעברית '+state.letterEntry.he,lang:'he-IL'}
  ]);
}
function renderLetterRound(){
  const entry=state.letterEntry;
  if(!entry) return;
  const letterEl=$('letterChar');
  const hintEl=$('letterHint');
  const emojiEl=$('letterWordEmoji');
  const enEl=$('letterWordEn');
  const heEl=$('letterWordHe');
  const wrap=$('letterRevealBox');
  if(letterEl) letterEl.textContent=entry.letter;
  if(hintEl) hintEl.textContent='אות '+entry.letter+' - לחצו על אות בלוח כדי לסובב ולגלות מילה.';
  if(emojiEl) emojiEl.textContent='❔';
  if(enEl) enEl.textContent=getLetterShadow(entry.word);
  if(enEl) enEl.classList.add('shadow');
  if(heEl) heEl.textContent='פירוש: ?';
  if(wrap) wrap.classList.add('show');
}
function resetLetterBoard(){
  state.letterFlipped.clear();
  state.letterIndex=0;
  nextLetterRound(false);
}
function nextLetterRound(advance=true){
  clearRepeat();
  clearRoundSpeakTimeout();
  clearChallengeTimer();
  hardStopSpeech();
  updateChallengeVisibility();
  if(!LETTER_WORDS || !LETTER_WORDS.length) return;
  if(advance) state.letterIndex=(state.letterIndex+1)%LETTER_WORDS.length;
  state.letterEntry=LETTER_WORDS[state.letterIndex];
  state.letterRevealed=false;
  renderLetterRound();
  renderLetterBoard();
  setTimeout(speakLetter, 120);
}

function buildMemory(){ clearRepeat(); clearRoundSpeakTimeout(); clearChallengeTimer(); updateChallengeVisibility(); const base=shuffle(getPool()).slice(0,6); const deck=shuffle([...base.map((w,i)=>({id:`e${i}`,pair:w.id,type:'emoji',emoji:w.emoji,word:w.en,he:w.he})),...base.map((w,i)=>({id:`w${i}`,pair:w.id,type:'word',emoji:w.emoji,word:w.en,he:w.he}))]); state.memoryDeck=deck; state.memoryFlipped=[]; state.memoryMatches=0; renderMemory(); }
function renderMemory(){ $('memoryGrid').innerHTML=''; state.memoryDeck.forEach(card=>{ const btn=document.createElement('button'); const show=card.open||card.matched; btn.className=`memory-card ${show?'':'face-down'} ${card.matched?'matched':''}`; if(show){btn.innerHTML=card.type==='emoji'?`<div class="emoji">${card.emoji}</div><div class="word">${card.he}</div>`:`<div class="word" style="font-size:1.2rem">${card.word}</div><div style="font-size:.8rem;color:#6a7290">${card.he}</div>`;} else btn.innerHTML='🌟'; btn.onclick=()=>flipMemory(card.id); $('memoryGrid').appendChild(btn); }); }
function flipMemory(id){ const card=state.memoryDeck.find(c=>c.id===id); if(!card||card.open||card.matched||state.memoryFlipped.length===2) return; card.open=true; if(card.type==='word') speak(card.word,'en-US'); state.memoryFlipped.push(card); renderMemory(); if(state.memoryFlipped.length===2){ const [a,b]=state.memoryFlipped; if(a.pair===b.pair && a.type!==b.type) setTimeout(()=>{a.matched=b.matched=true; a.open=b.open=true; state.memoryFlipped=[]; state.memoryMatches+=1; state.stars+=1; confetti(16); showResult(true,`זוג מושלם! ${a.word} = ${a.he}`); speak('זוג מושלם!','he-IL'); updateHud(); renderMemory(); if(state.memoryMatches===6){state.chests+=1; showResult(true,'המשחק הושלם! התקבל אוצר מתנה.');}},500); else setTimeout(()=>{a.open=false; b.open=false; state.memoryFlipped=[]; renderMemory();},800); } }
function openChest(){ if(state.chests<1){ showResult(false,'עדיין אין אוצר פתוח. כל 5 תשובות נכונות ברצף נותנות אוצר.'); speak('עדיין אין אוצר פתוח','he-IL'); return; } state.chests-=1; const r=pick(REWARDS); state.stars+=2; confetti(40); showResult(true,`נפתח אוצר והתקבלו ${r.name} ${r.icon} ועוד 2 כוכבים!`); speak('נפתח אוצר!','he-IL'); renderHome(); updateHud(); }
