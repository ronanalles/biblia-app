const {books,daily,topics,plans}=window.IR_DATA;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const STORAGE='ir-state-v2', CACHE='ir-chapters-v2';
const defaults={version:2,reading:{bookId:'JHN',chapter:3,scroll:0},library:{},history:{},plans:{},settings:{theme:'light',font:20,line:1.8,readable:false,wakeLock:false},activity:[]};
let state=loadState(), chapterCache=loadJSON(CACHE,{}), currentBook=bookById(state.reading.bookId)||bookById('JHN'), currentChapter=state.reading.chapter||3, verses=[], selectedVerse=null, searchFilter='all', libraryFilter='all', deferredInstall=null, audioIndex=-1, audioPaused=false, wakeLock=null, touchStartX=0;

function loadJSON(key,fallback){try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}}
function loadState(){
  const saved=loadJSON(STORAGE,null); if(saved)return deepMerge(structuredClone(defaults),saved);
  const old=loadJSON('ir-saved',[]), last=loadJSON('ir-last',null), fresh=structuredClone(defaults);
  if(last){fresh.reading.bookId=last.book;fresh.reading.chapter=last.chapter}
  old.forEach(v=>{fresh.library[`${v.bookId}-${v.chapter}-${v.verse}`]={...v,saved:true,highlight:null,note:'',updated:Date.now()}});return fresh;
}
function deepMerge(target,source){for(const k in source){if(source[k]&&typeof source[k]==='object'&&!Array.isArray(source[k]))target[k]=deepMerge(target[k]||{},source[k]);else target[k]=source[k]}return target}
function persist(){localStorage.setItem(STORAGE,JSON.stringify(state))}
function bookById(id){return books.find(b=>b.id===id)}
function refKey(bookId,chapter,verse){return `${bookId}-${chapter}-${verse}`}
function chapterKey(bookId,chapter){return `${bookId}-${chapter}`}
function normalize(s=''){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'')}
function escapeHTML(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function closeDialog(d){if(d?.open)d.close()}
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>el.classList.remove('show'),2200)}

function showView(name,options={}){
  stopAudio(); $$('.view').forEach(v=>v.classList.remove('active'));$(`#${name}View`).classList.add('active');
  $$('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  if(!options.keepScroll)window.scrollTo({top:0,behavior:'smooth'});
  if(name==='reader')loadChapter();if(name==='saved')renderLibrary();if(name==='plans')renderPlans();if(name==='home')renderHome();if(name==='search')setTimeout(()=>$('#searchInput').focus(),100);
}
$$('[data-view]').forEach(el=>el.addEventListener('click',()=>showView(el.dataset.view)));
$('#continueCard').addEventListener('click',()=>showView('reader'));$('#continueCard').addEventListener('keydown',e=>{if(e.key==='Enter')showView('reader')});

async function loadChapter(force=false){
  currentBook=bookById(currentBook.id)||books[0];currentChapter=Math.max(1,Math.min(currentBook.chapters,currentChapter));
  state.reading={bookId:currentBook.id,chapter:currentChapter,scroll:0};persist();
  $('#readerBook').textContent=currentBook.name;$('#readerChapter').textContent=currentChapter;$('#scripture').innerHTML='<div class="loading">Abrindo a Palavra…</div>';
  const key=chapterKey(currentBook.id,currentChapter), cached=chapterCache[key];
  if(cached&&!force){verses=cached.verses;renderChapter(true);recordHistory();return}
  try{
    const response=await fetch(`https://bible-api.com/data/almeida/${currentBook.id}/${currentChapter}`);
    if(!response.ok)throw new Error('network');const data=await response.json();
    verses=(data.verses||[]).map(v=>({verse:Number(v.verse),text:String(v.text).replace(/\s+/g,' ').trim()}));if(!verses.length)throw new Error('empty');
    chapterCache[key]={bookId:currentBook.id,book:currentBook.name,chapter:currentChapter,verses,at:Date.now()};trimCache();localStorage.setItem(CACHE,JSON.stringify(chapterCache));renderChapter(false);recordHistory();
  }catch{
    if(cached){verses=cached.verses;renderChapter(true);toast('Capítulo aberto do modo offline')}
    else $('#scripture').innerHTML='<div class="error">Não foi possível carregar este capítulo.<br><small>Verifique sua conexão e tente novamente.</small><button class="retry-btn" id="retryChapter">Tentar novamente</button></div>',setTimeout(()=>$('#retryChapter')?.addEventListener('click',()=>loadChapter(true)),0);
  }
}
function trimCache(){const entries=Object.entries(chapterCache).sort((a,b)=>(b[1].at||0)-(a[1].at||0));chapterCache=Object.fromEntries(entries.slice(0,80))}
function recordHistory(){const key=chapterKey(currentBook.id,currentChapter);state.history[key]={bookId:currentBook.id,book:currentBook.name,chapter:currentChapter,lastOpened:Date.now(),read:state.history[key]?.read||false};addActivity();persist();renderHome()}
function addActivity(){const today=new Date().toISOString().slice(0,10);if(!state.activity.includes(today)){state.activity.push(today);state.activity=state.activity.slice(-120)}}
function renderChapter(fromCache){
  const testament=currentBook.testament==='old'?'ANTIGO TESTAMENTO':'NOVO TESTAMENTO';
  $('#scripture').innerHTML=`<header class="chapter-heading"><small>${testament}</small><h1>${escapeHTML(currentBook.name)} ${currentChapter}</h1><p>${fromCache?'Disponível offline · ':''}Almeida</p></header><div>${verses.map(v=>verseHTML(v)).join('')}</div>`;
  $$('.verse').forEach(el=>el.addEventListener('click',()=>openVerseActions(Number(el.dataset.verse))));
  $('#prevChapter').disabled=currentChapter===1&&books.indexOf(currentBook)===0;$('#nextChapter').disabled=currentChapter===currentBook.chapters&&books.indexOf(currentBook)===books.length-1;
  $('#audioTitle').textContent=`${currentBook.name} ${currentChapter}`;updateContinue();
}
function verseHTML(v){const item=state.library[refKey(currentBook.id,currentChapter,v.verse)]||{};const classes=['verse',item.saved?'saved':'',item.note?'has-note':'',item.highlight?`highlight-${item.highlight}`:''].filter(Boolean).join(' ');return `<span class="${classes}" data-verse="${v.verse}" tabindex="0"><sup>${v.verse}</sup>${escapeHTML(v.text)} </span>`}
function changeChapter(delta){let i=books.indexOf(currentBook);currentChapter+=delta;if(currentChapter<1){currentBook=books[Math.max(0,--i)];currentChapter=currentBook.chapters}if(currentChapter>currentBook.chapters){currentBook=books[Math.min(books.length-1,++i)];currentChapter=1}window.scrollTo({top:0,behavior:'smooth'});loadChapter()}
$('#prevChapter').onclick=()=>changeChapter(-1);$('#nextChapter').onclick=()=>changeChapter(1);

function openVerseActions(number){
  const verse=verses.find(v=>v.verse===number);if(!verse)return;selectedVerse={bookId:currentBook.id,book:currentBook.name,chapter:currentChapter,...verse};const item=getLibraryItem(false);
  $('#verseSheetRef').textContent=`${currentBook.name} ${currentChapter}:${number}`;$('#versePreview').textContent=verse.text;$('#saveVerse').classList.toggle('active',!!item?.saved);$('#saveVerse span').textContent=item?.saved?'♥':'♡';$('#noteVerse').classList.toggle('active',!!item?.note);$('#verseSheet').showModal();
}
function getLibraryItem(create=true){if(!selectedVerse)return null;const key=refKey(selectedVerse.bookId,selectedVerse.chapter,selectedVerse.verse);if(!state.library[key]&&create)state.library[key]={...selectedVerse,saved:false,highlight:null,note:'',updated:Date.now()};return state.library[key]}
function cleanLibrary(){Object.keys(state.library).forEach(k=>{const x=state.library[k];if(!x.saved&&!x.highlight&&!x.note)delete state.library[k]})}
$('#saveVerse').onclick=()=>{const item=getLibraryItem();item.saved=!item.saved;item.updated=Date.now();cleanLibrary();persist();closeDialog($('#verseSheet'));renderChapter(!!chapterCache[chapterKey(currentBook.id,currentChapter)]);toast(item.saved?'Versículo salvo':'Removido dos salvos')};
$$('[data-color]').forEach(btn=>btn.onclick=()=>{const item=getLibraryItem();item.highlight=btn.dataset.color==='none'?null:btn.dataset.color;item.updated=Date.now();cleanLibrary();persist();closeDialog($('#verseSheet'));renderChapter(true);toast(item.highlight?'Destaque aplicado':'Destaque removido')});
$('#noteVerse').onclick=()=>{const item=getLibraryItem();$('#noteRef').textContent=`${selectedVerse.book} ${selectedVerse.chapter}:${selectedVerse.verse}`;$('#noteText').value=item.note||'';$('#noteCount').textContent=$('#noteText').value.length;closeDialog($('#verseSheet'));$('#noteSheet').showModal();setTimeout(()=>$('#noteText').focus(),100)};
$('#noteText').oninput=e=>$('#noteCount').textContent=e.target.value.length;
$('#saveNote').onclick=()=>{const item=getLibraryItem();item.note=$('#noteText').value.trim();item.updated=Date.now();cleanLibrary();persist();closeDialog($('#noteSheet'));if($('#readerView').classList.contains('active'))renderChapter(true);toast(item.note?'Anotação salva':'Anotação removida')};
function verseShareText(){return `“${selectedVerse.text}” — ${selectedVerse.book} ${selectedVerse.chapter}:${selectedVerse.verse}`}
$('#copyVerse').onclick=async()=>{await copyText(verseShareText());closeDialog($('#verseSheet'));toast('Versículo copiado')};
$('#shareVerse').onclick=async()=>{const text=verseShareText();try{await navigator.share({title:`${selectedVerse.book} ${selectedVerse.chapter}:${selectedVerse.verse}`,text})}catch{await copyText(text);toast('Versículo copiado para compartilhar')}closeDialog($('#verseSheet'))};
$('#speakVerse').onclick=()=>{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(selectedVerse.text);u.lang='pt-BR';speechSynthesis.speak(u);closeDialog($('#verseSheet'))};
async function copyText(text){try{return await navigator.clipboard.writeText(text)}catch{const t=document.createElement('textarea');t.value=text;document.body.append(t);t.select();document.execCommand('copy');t.remove()}}

function renderBooks(testament=currentBook.testament){
  $('#bookSheetTitle').textContent='Escolha o livro';$('#chapterList').style.display='none';$('#bookList').style.display='grid';$$('[data-testament]').forEach(x=>x.classList.toggle('active',x.dataset.testament===testament));
  $('#bookList').innerHTML=books.filter(b=>b.testament===testament).map(b=>`<button data-id="${b.id}">${escapeHTML(b.name)}</button>`).join('');$$('#bookList button').forEach(btn=>btn.onclick=()=>{currentBook=bookById(btn.dataset.id);renderChapters()});
}
function renderChapters(){$('#bookSheetTitle').textContent=currentBook.name;$('#bookList').style.display='none';$('#chapterList').style.display='grid';$('#chapterList').innerHTML=Array.from({length:currentBook.chapters},(_,i)=>`<button>${i+1}</button>`).join('');$$('#chapterList button').forEach(btn=>btn.onclick=()=>{currentChapter=Number(btn.textContent);closeDialog($('#bookSheet'));showView('reader')})}
$('#chapterPicker').onclick=()=>{renderBooks();$('#bookSheet').showModal()};$$('[data-testament]').forEach(b=>b.onclick=()=>renderBooks(b.dataset.testament));

function renderLibrary(){
  const items=Object.values(state.library).filter(x=>libraryFilter==='all'||(libraryFilter==='saved'&&x.saved)||(libraryFilter==='highlight'&&x.highlight)||(libraryFilter==='note'&&x.note)).sort((a,b)=>(b.updated||0)-(a.updated||0));
  $('#savedList').innerHTML=items.length?items.map(x=>`<article class="saved-item" ${x.highlight?`data-color="${x.highlight}"`:''}><p>“${escapeHTML(x.text)}”</p>${x.note?`<div class="note-copy">${escapeHTML(x.note)}</div>`:''}<footer><span>${escapeHTML(x.book)} ${x.chapter}:${x.verse}</span><div><button data-open="${refKey(x.bookId,x.chapter,x.verse)}">Ler</button><button class="remove" data-remove="${refKey(x.bookId,x.chapter,x.verse)}">Remover</button></div></footer></article>`).join(''):'<div class="empty">Nada por aqui ainda.<br>Toque em um versículo durante a leitura para salvar, destacar ou anotar.</div>';
  $$('[data-open]').forEach(b=>b.onclick=()=>openLibraryRef(state.library[b.dataset.open]));$$('[data-remove]').forEach(b=>b.onclick=()=>{delete state.library[b.dataset.remove];persist();renderLibrary();renderHome();toast('Item removido')});
}
function openLibraryRef(item){currentBook=bookById(item.bookId);currentChapter=item.chapter;showView('reader');setTimeout(()=>document.querySelector(`[data-verse="${item.verse}"]`)?.scrollIntoView({behavior:'smooth',block:'center'}),700)}
$$('[data-library]').forEach(b=>b.onclick=()=>{libraryFilter=b.dataset.library;$$('[data-library]').forEach(x=>x.classList.toggle('active',x===b));renderLibrary()});

function renderSearchTopics(){$('#topicGrid').innerHTML=Object.keys(topics).map(t=>`<button data-topic="${t}">${t}</button>`).join('');$$('[data-topic]').forEach(b=>b.onclick=()=>{searchTopic(b.dataset.topic)})}
function parseReference(query){const m=query.trim().match(/^(.+?)\s+(\d+)(?::(\d+))?$/);if(!m)return null;const q=normalize(m[1]);const book=books.find(b=>normalize(b.name)===q||normalize(b.name).startsWith(q));if(!book)return null;const chapter=Number(m[2]),verse=m[3]?Number(m[3]):null;if(chapter<1||chapter>book.chapters)return null;return{book,chapter,verse}}
$('#searchForm').onsubmit=e=>{e.preventDefault();runSearch($('#searchInput').value)};
$$('[data-filter]').forEach(b=>b.onclick=()=>{searchFilter=b.dataset.filter;$$('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));runSearch($('#searchInput').value)});
function runSearch(query){
  query=query.trim();if(!query){$('#searchResults').innerHTML='';return}const ref=parseReference(query);let results=[];
  if(ref&&searchFilter!=='cached'){results=[{type:'ref',bookId:ref.book.id,book:ref.book.name,chapter:ref.chapter,verse:ref.verse,text:ref.verse?'Abrir versículo no capítulo':'Abrir capítulo completo'}]}
  if(searchFilter!=='reference'){const q=normalize(query);Object.values(chapterCache).forEach(ch=>ch.verses.forEach(v=>{if(normalize(v.text).includes(q))results.push({type:'cache',bookId:ch.bookId,book:ch.book,chapter:ch.chapter,verse:v.verse,text:v.text})}))}
  renderSearchResults(results.slice(0,60),query);
}
function renderSearchResults(results,query){$('#searchResults').innerHTML=results.length?`<small>${results.length} resultado${results.length===1?'':'s'}</small>`+results.map((r,i)=>`<button class="result-card" data-result="${i}"><strong>${escapeHTML(r.book)} ${r.chapter}${r.verse?':'+r.verse:''}</strong><p>${escapeHTML(r.text)}</p></button>`).join(''):`<div class="empty">Nenhum resultado nos capítulos acessados.<br><small>Tente uma referência como João 3:16 ou abra mais capítulos para ampliar a pesquisa offline.</small></div>`;$$('[data-result]').forEach(b=>b.onclick=()=>openSearchResult(results[Number(b.dataset.result)]))}
function openSearchResult(r){currentBook=bookById(r.bookId);currentChapter=r.chapter;showView('reader');if(r.verse)setTimeout(()=>document.querySelector(`[data-verse="${r.verse}"]`)?.scrollIntoView({behavior:'smooth',block:'center'}),700)}
function searchTopic(topic){$('#searchInput').value=topic;const results=topics[topic].map(([bookId,chapter,verse])=>{const book=bookById(bookId),cached=chapterCache[chapterKey(bookId,chapter)],found=cached?.verses.find(v=>v.verse===verse);return{type:'topic',bookId,book:book.name,chapter,verse,text:found?.text||`Leitura recomendada sobre ${topic}`}});renderSearchResults(results,topic);$('#searchResults').scrollIntoView({behavior:'smooth'})}

function renderPlans(){
  const active=plans.filter(p=>state.plans[p.id]?.started);$('#activePlans').innerHTML=active.length?active.map(p=>activePlanHTML(p)).join(''):'';
  $('#planList').innerHTML=plans.filter(p=>!state.plans[p.id]?.started).map(p=>planHTML(p)).join('')||'<div class="empty">Todos os planos foram iniciados.</div>';
  $$('[data-start-plan]').forEach(b=>b.onclick=()=>startPlan(b.dataset.startPlan));$$('[data-read-plan]').forEach(b=>b.onclick=()=>readPlanDay(b.dataset.readPlan));$$('[data-complete-plan]').forEach(b=>b.onclick=()=>completePlanDay(b.dataset.completePlan));
}
function planState(id){return state.plans[id]||{started:null,completed:[]}}
function planHTML(p){return `<article class="plan-card ${p.color}"><div><span>${p.days.length} DIAS</span><h2>${escapeHTML(p.title)}</h2><p>${escapeHTML(p.description)}</p></div><button class="start-plan" data-start-plan="${p.id}">Iniciar</button></article>`}
function activePlanHTML(p){const ps=planState(p.id),done=ps.completed.length,pct=Math.round(done/p.days.length*100),finished=done>=p.days.length;return `<article class="plan-card ${p.color}"><div><span>${finished?'CONCLUÍDO':`DIA ${done+1} DE ${p.days.length}`}</span><h2>${escapeHTML(p.title)}</h2><p>${finished?'Plano finalizado. Continue cultivando esse ritmo.':`${done} leitura${done===1?'':'s'} concluída${done===1?'':'s'}`}</p><div class="mini-progress"><i style="width:${pct}%"></i></div></div><b>${pct}%</b></article>${finished?'':`<div class="plan-day"><div><strong>${dayReference(p,done)}</strong><small>Leitura de hoje</small></div><div><button data-read-plan="${p.id}">Ler</button> <button class="done" data-complete-plan="${p.id}">Concluir</button></div></div>`}`}
function dayReference(p,index){const [id,ch]=p.days[index]||p.days[p.days.length-1];return `${bookById(id).name} ${ch}`}
function startPlan(id){state.plans[id]={started:new Date().toISOString(),completed:[]};persist();renderPlans();renderHome();toast('Plano iniciado')}
function readPlanDay(id){const p=plans.find(x=>x.id===id),ps=planState(id),[bookId,ch]=p.days[Math.min(ps.completed.length,p.days.length-1)];currentBook=bookById(bookId);currentChapter=ch;showView('reader')}
function completePlanDay(id){const p=plans.find(x=>x.id===id),ps=state.plans[id];const index=ps.completed.length;if(index<p.days.length){ps.completed.push({day:index+1,at:new Date().toISOString()});addActivity();persist();renderPlans();renderHome();toast(index+1===p.days.length?'Plano concluído!':'Leitura do dia concluída')}}

function renderHome(){
  const hour=new Date().getHours();$('#greetingText').textContent=hour<12?'Bom dia':hour<18?'Boa tarde':'Boa noite';
  const library=Object.values(state.library),streak=calculateStreak();$('#savedStat').textContent=library.filter(x=>x.saved).length;$('#notesStat').textContent=library.filter(x=>x.note).length;$('#chaptersRead').textContent=Object.keys(state.history).length;$('#streakDays').textContent=`${streak} dia${streak===1?'':'s'}`;
  const active=plans.filter(p=>state.plans[p.id]?.started&&!isPlanFinished(p));$('#activePlansText').textContent=active.length?`${active.length} em andamento`:'Comece um novo caminho';renderDaily();updateContinue();
}
function calculateStreak(){let count=0,d=new Date();const set=new Set(state.activity);for(let i=0;i<120;i++){const key=d.toISOString().slice(0,10);if(set.has(key))count++;else if(i>0)break;d.setDate(d.getDate()-1)}return count}
function isPlanFinished(p){return planState(p.id).completed.length>=p.days.length}
function renderDaily(){const index=Math.floor(Date.now()/86400000)%daily.length,[bookId,chapter,verse,text]=daily[index],book=bookById(bookId);$('#dailyText').textContent=text;$('#dailyRef').textContent=`${book.name} ${chapter}:${verse} · Almeida`;$('#dailyRead').dataset.ref=`${bookId}-${chapter}-${verse}`;window.__daily={bookId,book:book.name,chapter,verse,text}}
$('#dailyRead').onclick=()=>openSearchResult(window.__daily);$('#shareDaily').onclick=async()=>{const d=window.__daily,text=`“${d.text}” — ${d.book} ${d.chapter}:${d.verse}`;try{await navigator.share({title:'Palavra do dia',text})}catch{await copyText(text);toast('Palavra do dia copiada')}};
function updateContinue(){const book=bookById(state.reading.bookId)||currentBook,pct=Math.max(1,Math.round((state.reading.chapter/book.chapters)*100));$('#continueTitle').textContent=`${book.name} ${state.reading.chapter}`;$('#continueExcerpt').textContent='Retome exatamente de onde parou.';$('#continueProgress').style.width=pct+'%';$('#continuePercent').textContent=pct+'%'}

function playChapter(){if(!('speechSynthesis'in window)){toast('Áudio não disponível neste navegador');return}stopAudio();audioIndex=0;audioPaused=false;$('#audioPlayer').hidden=false;speakNext()}
function speakNext(){if(audioIndex<0||audioIndex>=verses.length){stopAudio();return}$$('.verse').forEach(x=>x.classList.remove('speaking'));const el=document.querySelector(`[data-verse="${verses[audioIndex].verse}"]`);el?.classList.add('speaking');el?.scrollIntoView({behavior:'smooth',block:'center'});$('#audioStatus').textContent=`Versículo ${verses[audioIndex].verse} de ${verses.length}`;const u=new SpeechSynthesisUtterance(verses[audioIndex].text);u.lang='pt-BR';u.rate=Number($('#audioRate').value);u.onend=()=>{if(!audioPaused){audioIndex++;speakNext()}};u.onerror=()=>stopAudio();speechSynthesis.speak(u);requestWakeLock()}
function stopAudio(){if('speechSynthesis'in window)speechSynthesis.cancel();audioIndex=-1;audioPaused=false;$('#audioPlayer').hidden=true;$$('.verse.speaking').forEach(x=>x.classList.remove('speaking'));releaseWakeLock()}
$('#audioButton').onclick=playChapter;$('#audioToggle').onclick=()=>{if(audioPaused){speechSynthesis.resume();audioPaused=false;$('#audioToggle').textContent='Ⅱ'}else{speechSynthesis.pause();audioPaused=true;$('#audioToggle').textContent='▷'}};$('#audioStop').onclick=stopAudio;$('#audioRate').onchange=()=>{if(audioIndex>=0){speechSynthesis.cancel();audioPaused=false;speakNext()}};

function applySettings(){const s=state.settings;document.body.dataset.theme=s.theme;document.body.classList.toggle('readable',s.readable);document.documentElement.style.setProperty('--reader-size',s.font+'px');document.documentElement.style.setProperty('--reader-line',s.line);$('#fontRange').value=s.font;$('#fontOutput').value=s.font+'px';$('#lineRange').value=s.line*10;$('#lineOutput').value=s.line.toFixed(1);$('#readableFont').checked=s.readable;$('#wakeLockSetting').checked=s.wakeLock;$$('[data-theme]').forEach(x=>x.classList.toggle('active',x.dataset.theme===s.theme));document.querySelector('meta[name="theme-color"]').content=s.theme==='dark'?'#171b18':'#f6f3ec'}
$('#fontButton').onclick=()=>$('#appearanceSheet').showModal();$('#fontRange').oninput=e=>{state.settings.font=Number(e.target.value);persist();applySettings()};$('#lineRange').oninput=e=>{state.settings.line=Number(e.target.value)/10;persist();applySettings()};$('#readableFont').onchange=e=>{state.settings.readable=e.target.checked;persist();applySettings()};$$('[data-theme]').forEach(b=>b.onclick=()=>{state.settings.theme=b.dataset.theme;persist();applySettings()});
$('#settingsButton').onclick=()=>$('#settingsSheet').showModal();$('#settingsAppearance').onclick=()=>{closeDialog($('#settingsSheet'));$('#appearanceSheet').showModal()};$('#readerMenu').onclick=()=>$('#readerOptionsSheet').showModal();$('#openAppearance').onclick=()=>{closeDialog($('#readerOptionsSheet'));$('#appearanceSheet').showModal()};
$('#wakeLockSetting').onchange=e=>{state.settings.wakeLock=e.target.checked;persist();if(!e.target.checked)releaseWakeLock()};async function requestWakeLock(){if(!state.settings.wakeLock||!('wakeLock'in navigator))return;try{wakeLock=await navigator.wakeLock.request('screen')}catch{}}async function releaseWakeLock(){try{await wakeLock?.release();wakeLock=null}catch{}}
$('#markChapterRead').onclick=()=>{const key=chapterKey(currentBook.id,currentChapter);state.history[key]={...(state.history[key]||{}),bookId:currentBook.id,book:currentBook.name,chapter:currentChapter,lastOpened:Date.now(),read:true};addActivity();persist();closeDialog($('#readerOptionsSheet'));renderHome();toast('Capítulo marcado como lido')};
$('#copyChapterLink').onclick=async()=>{await copyText(`${location.origin}${location.pathname}?ref=${currentBook.id}-${currentChapter}`);closeDialog($('#readerOptionsSheet'));toast('Link do capítulo copiado')};$('#downloadChapter').onclick=()=>{closeDialog($('#readerOptionsSheet'));if(chapterCache[chapterKey(currentBook.id,currentChapter)])toast('Capítulo disponível offline');else loadChapter(true)};
$('#exportData').onclick=()=>{const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),state,chapters:chapterCache},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='inspire-o-reino-backup.json';a.click();URL.revokeObjectURL(a.href);toast('Backup exportado')};
$('#clearData').onclick=()=>{if(!confirm('Apagar favoritos, notas, destaques, planos e histórico deste dispositivo?'))return;localStorage.removeItem(STORAGE);localStorage.removeItem(CACHE);location.reload()};

window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;$('#installButton').hidden=false});$('#installButton').onclick=async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$('#installButton').hidden=true};window.addEventListener('appinstalled',()=>toast('Aplicativo instalado'));
function updateOnline(){document.body.classList.toggle('offline',!navigator.onLine);if(!navigator.onLine)toast('Modo offline ativado')}window.addEventListener('online',updateOnline);window.addEventListener('offline',updateOnline);
window.addEventListener('scroll',()=>{if(!$('#readerView').classList.contains('active'))return;const max=document.documentElement.scrollHeight-innerHeight;$('#readingProgress').style.width=(max?scrollY/max*100:0)+'%';state.reading.scroll=scrollY;clearTimeout(window.__saveScroll);window.__saveScroll=setTimeout(persist,500)});
$('#scripture').addEventListener('touchstart',e=>touchStartX=e.changedTouches[0].clientX,{passive:true});$('#scripture').addEventListener('touchend',e=>{const delta=e.changedTouches[0].clientX-touchStartX;if(Math.abs(delta)>85)changeChapter(delta<0?1:-1)},{passive:true});
document.addEventListener('keydown',e=>{if(!$('#readerView').classList.contains('active')||['INPUT','TEXTAREA'].includes(document.activeElement.tagName))return;if(e.key==='ArrowLeft')changeChapter(-1);if(e.key==='ArrowRight')changeChapter(1)});
$$('.close-sheet').forEach(b=>b.onclick=()=>closeDialog(b.closest('dialog')));$$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)closeDialog(d)}));

function openInitialReference(){const params=new URLSearchParams(location.search),ref=params.get('ref'),view=params.get('view');if(view&&['home','reader','search','plans','saved'].includes(view))showView(view);if(!ref)return;const [id,ch]=ref.split('-');if(bookById(id)&&Number(ch)){currentBook=bookById(id);currentChapter=Number(ch);showView('reader')}}
applySettings();renderSearchTopics();renderHome();renderPlans();renderLibrary();updateOnline();openInitialReference();
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));