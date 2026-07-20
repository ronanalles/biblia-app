const books = [
  ['GEN','Gênesis',50,'old'],['EXO','Êxodo',40,'old'],['LEV','Levítico',27,'old'],['NUM','Números',36,'old'],['DEU','Deuteronômio',34,'old'],['JOS','Josué',24,'old'],['JDG','Juízes',21,'old'],['RUT','Rute',4,'old'],['1SA','1 Samuel',31,'old'],['2SA','2 Samuel',24,'old'],['1KI','1 Reis',22,'old'],['2KI','2 Reis',25,'old'],['1CH','1 Crônicas',29,'old'],['2CH','2 Crônicas',36,'old'],['EZR','Esdras',10,'old'],['NEH','Neemias',13,'old'],['EST','Ester',10,'old'],['JOB','Jó',42,'old'],['PSA','Salmos',150,'old'],['PRO','Provérbios',31,'old'],['ECC','Eclesiastes',12,'old'],['SNG','Cânticos',8,'old'],['ISA','Isaías',66,'old'],['JER','Jeremias',52,'old'],['LAM','Lamentações',5,'old'],['EZK','Ezequiel',48,'old'],['DAN','Daniel',12,'old'],['HOS','Oséias',14,'old'],['JOL','Joel',3,'old'],['AMO','Amós',9,'old'],['OBA','Obadias',1,'old'],['JON','Jonas',4,'old'],['MIC','Miquéias',7,'old'],['NAM','Naum',3,'old'],['HAB','Habacuque',3,'old'],['ZEP','Sofonias',3,'old'],['HAG','Ageu',2,'old'],['ZEC','Zacarias',14,'old'],['MAL','Malaquias',4,'old'],
  ['MAT','Mateus',28,'new'],['MRK','Marcos',16,'new'],['LUK','Lucas',24,'new'],['JHN','João',21,'new'],['ACT','Atos',28,'new'],['ROM','Romanos',16,'new'],['1CO','1 Coríntios',16,'new'],['2CO','2 Coríntios',13,'new'],['GAL','Gálatas',6,'new'],['EPH','Efésios',6,'new'],['PHP','Filipenses',4,'new'],['COL','Colossenses',4,'new'],['1TH','1 Tessalonicenses',5,'new'],['2TH','2 Tessalonicenses',3,'new'],['1TI','1 Timóteo',6,'new'],['2TI','2 Timóteo',4,'new'],['TIT','Tito',3,'new'],['PHM','Filemom',1,'new'],['HEB','Hebreus',13,'new'],['JAS','Tiago',5,'new'],['1PE','1 Pedro',5,'new'],['2PE','2 Pedro',3,'new'],['1JN','1 João',5,'new'],['2JN','2 João',1,'new'],['3JN','3 João',1,'new'],['JUD','Judas',1,'new'],['REV','Apocalipse',22,'new']
].map(([id,name,chapters,testament])=>({id,name,chapters,testament}));

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state={book:books.find(b=>b.id==='JHN'),chapter:3,testament:'new',verses:[],saved:JSON.parse(localStorage.getItem('ir-saved')||'[]')};
const fallback={
  'JHN-3':[{verse:16,text:'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.'},{verse:17,text:'Porque Deus enviou o seu Filho ao mundo, não para que condenasse o mundo, mas para que o mundo fosse salvo por ele.'},{verse:18,text:'Quem crê nele não é condenado; mas quem não crê já está condenado, porquanto não crê no nome do unigênito Filho de Deus.'}],
  'PSA-23':[{verse:1,text:'O Senhor é o meu pastor; nada me faltará.'},{verse:2,text:'Deitar-me faz em verdes pastos, guia-me mansamente a águas tranquilas.'},{verse:3,text:'Refrigera a minha alma; guia-me pelas veredas da justiça, por amor do seu nome.'}]
};

function showView(name){
  $$('.view').forEach(v=>v.classList.remove('active')); $(`#${name}View`).classList.add('active');
  $$('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  window.scrollTo({top:0,behavior:'smooth'}); if(name==='reader')loadChapter(); if(name==='saved')renderSaved();
}
$$('[data-view]').forEach(el=>el.addEventListener('click',()=>showView(el.dataset.view)));
$('#continueCard').addEventListener('click',()=>showView('reader'));

async function loadChapter(){
  $('#readerBook').textContent=state.book.name; $('#readerChapter').textContent=state.chapter;
  $('#scripture').innerHTML='<div class="loading">Abrindo a Palavra…</div>';
  try{
    const r=await fetch(`https://bible-api.com/data/almeida/${state.book.id}/${state.chapter}`);
    if(!r.ok)throw Error(); const data=await r.json();
    state.verses=(data.verses||[]).map(v=>({verse:v.verse,text:v.text.trim()}));
    if(!state.verses.length)throw Error();
  }catch{state.verses=fallback[`${state.book.id}-${state.chapter}`]||[];}
  localStorage.setItem('ir-last',JSON.stringify({book:state.book.id,chapter:state.chapter}));
  renderChapter(); updateContinue();
}
function renderChapter(){
  if(!state.verses.length){$('#scripture').innerHTML='<div class="error">Não foi possível carregar este capítulo agora.<br><small>Confira sua conexão e tente novamente.</small></div>';return;}
  $('#scripture').innerHTML=`<header class="chapter-heading"><small>${state.book.testament==='old'?'ANTIGO':'NOVO'} TESTAMENTO</small><h1>${state.book.name} ${state.chapter}</h1></header><div>${state.verses.map(v=>`<span class="verse ${isSaved(v)?'saved':''}" data-verse="${v.verse}" title="Toque para salvar"><sup>${v.verse}</sup>${escapeHtml(v.text)} </span>`).join('')}</div>`;
  $$('.verse').forEach(el=>el.addEventListener('click',()=>toggleVerse(+el.dataset.verse,el)));
  $('#prevChapter').disabled=state.chapter===1&&books.indexOf(state.book)===0;
  $('#nextChapter').disabled=state.chapter===state.book.chapters&&books.indexOf(state.book)===books.length-1;
}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function isSaved(v){return state.saved.some(s=>s.bookId===state.book.id&&s.chapter===state.chapter&&s.verse===v.verse)}
function toggleVerse(number,el){
  const idx=state.saved.findIndex(s=>s.bookId===state.book.id&&s.chapter===state.chapter&&s.verse===number);
  if(idx>=0){state.saved.splice(idx,1);el.classList.remove('saved');toast('Removido dos salvos');}
  else{const v=state.verses.find(v=>v.verse===number);state.saved.unshift({bookId:state.book.id,book:state.book.name,chapter:state.chapter,verse:number,text:v.text});el.classList.add('saved');toast('Versículo salvo');}
  localStorage.setItem('ir-saved',JSON.stringify(state.saved)); updateSavedCount();
}
function changeChapter(delta){
  let i=books.indexOf(state.book); state.chapter+=delta;
  if(state.chapter<1){state.book=books[--i];state.chapter=state.book.chapters}
  if(state.chapter>state.book.chapters){state.book=books[++i];state.chapter=1}
  window.scrollTo({top:0,behavior:'smooth'});loadChapter();
}
$('#prevChapter').onclick=()=>changeChapter(-1); $('#nextChapter').onclick=()=>changeChapter(1);

function renderBooks(testament=state.testament){
  state.testament=testament; $('#chapterList').style.display='none';$('#bookList').style.display='grid';
  $('#bookList').innerHTML=books.filter(b=>b.testament===testament).map(b=>`<button data-id="${b.id}">${b.name}</button>`).join('');
  $$('#bookList button').forEach(btn=>btn.onclick=()=>{state.book=books.find(b=>b.id===btn.dataset.id);renderChapters()});
}
function renderChapters(){
  $('#bookList').style.display='none';$('#chapterList').style.display='grid';
  $('#chapterList').innerHTML=Array.from({length:state.book.chapters},(_,i)=>`<button>${i+1}</button>`).join('');
  $$('#chapterList button').forEach(btn=>btn.onclick=()=>{state.chapter=+btn.textContent;$('#bookSheet').close();showView('reader')});
}
$('#chapterPicker').onclick=()=>{renderBooks(state.book.testament);$('#bookSheet').showModal()};
$$('[data-testament]').forEach(b=>b.onclick=()=>{$$('[data-testament]').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderBooks(b.dataset.testament)});

function renderSaved(){
  $('#savedList').innerHTML=state.saved.length?state.saved.map((s,i)=>`<article class="saved-item"><p>“${escapeHtml(s.text)}”</p><footer><span>${s.book} ${s.chapter}:${s.verse}</span><button data-remove="${i}">Remover</button></footer></article>`).join(''):'<div class="empty">Nenhum versículo salvo ainda.<br>Durante a leitura, toque em um versículo para guardá-lo aqui.</div>';
  $$('[data-remove]').forEach(b=>b.onclick=()=>{state.saved.splice(+b.dataset.remove,1);localStorage.setItem('ir-saved',JSON.stringify(state.saved));renderSaved();updateSavedCount()});
}
function updateSavedCount(){$('#savedCount').textContent=`${state.saved.length} versículo${state.saved.length===1?'':'s'}`}

$('#fontButton').onclick=()=>$('#fontSheet').showModal();
$('#fontRange').oninput=e=>{document.documentElement.style.setProperty('--reader-size',e.target.value+'px');$('#fontOutput').value=e.target.value+'px';localStorage.setItem('ir-font',e.target.value)};
$('#lineRange').oninput=e=>{const n=(e.target.value/10).toFixed(1);document.documentElement.style.setProperty('--reader-line',n);$('#lineOutput').value=n;localStorage.setItem('ir-line',n)};
$$('[data-theme]').forEach(b=>b.onclick=()=>{document.body.dataset.theme=b.dataset.theme;$$('[data-theme]').forEach(x=>x.classList.toggle('active',x===b));localStorage.setItem('ir-theme',b.dataset.theme)});
$$('.close-sheet').forEach(b=>b.onclick=()=>b.closest('dialog').close());

$('#searchButton').onclick=()=>{$('#searchSheet').showModal();setTimeout(()=>$('#searchInput').focus(),100)};
$('#searchForm').onsubmit=e=>{e.preventDefault();const q=$('#searchInput').value.trim().toLowerCase();const m=q.match(/^(.+?)\s+(\d+)(?::\d+)?$/);if(!m)return toast('Use uma referência como João 3:16');const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s/g,'');const b=books.find(x=>normalize(x.name.toLowerCase()).startsWith(normalize(m[1])));if(!b||+m[2]>b.chapters)return toast('Referência não encontrada');state.book=b;state.chapter=+m[2];$('#searchSheet').close();showView('reader')};

$('#shareDaily').onclick=async()=>{const text='“O Senhor é o meu pastor; nada me faltará.” — Salmos 23:1';try{await navigator.share({title:'Palavra do dia',text})}catch{await navigator.clipboard.writeText(text);toast('Versículo copiado')}};
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.classList.remove('show'),1800)}
function updateContinue(){const pct=Math.round(state.chapter/state.book.chapters*100);$('#continueTitle').textContent=`${state.book.name} ${state.chapter}`;$('#continueExcerpt').textContent=state.verses[0]?.text.slice(0,56)+'…'||'Continue de onde você parou';$('#continueProgress').style.width=pct+'%';$('#continuePercent').textContent=pct+'%'}

window.addEventListener('scroll',()=>{if(!$('#readerView').classList.contains('active'))return;const max=document.documentElement.scrollHeight-innerHeight;$('#readingProgress').style.width=(max?scrollY/max*100:0)+'%'});
const hour=new Date().getHours();$('#greetingText').textContent=hour<12?'Bom dia':hour<18?'Boa tarde':'Boa noite';
const last=JSON.parse(localStorage.getItem('ir-last')||'null');if(last){state.book=books.find(b=>b.id===last.book)||state.book;state.chapter=last.chapter||3}
const font=localStorage.getItem('ir-font')||20,line=localStorage.getItem('ir-line')||1.8,theme=localStorage.getItem('ir-theme')||'light';$('#fontRange').value=font;$('#lineRange').value=+line*10;document.documentElement.style.setProperty('--reader-size',font+'px');document.documentElement.style.setProperty('--reader-line',line);document.body.dataset.theme=theme;$$('[data-theme]').forEach(x=>x.classList.toggle('active',x.dataset.theme===theme));updateSavedCount();updateContinue();
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js'));
