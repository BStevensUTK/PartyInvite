'use strict';
const $ = s => document.querySelector(s);
const fields = ['Code','Name','Occupation','Information','Personality','Dress','Act1','Act2','Act3','Murderer','Reveal'];
const views = [['character','Your character','01'],['share','Share in red','02'],['personality','Personality trait','03'],['dress','Suggested dress','04'],['act1','Act I','I'],['act2','Act II','II'],['act3','Act III','III'],['truth','Am I the murderer?','?']];
let guests = [], current = null, ready = false, loadId = 0;
const defaultSettings = {Location:'In the family crypt',Context:'Invited to pay respects for the late Henrietta Crane'};
let settings = {...defaultSettings};

// Only [red] and [/red] are formatting. Everything else is literal text.
function segments(value) {
 const text = String(value ?? '');
 const parts = []; const token = /\[\/?red\]/g; let last = 0, red = false, match;
 while ((match = token.exec(text))) {
  if (match.index > last) parts.push({text:text.slice(last,match.index),red});
  if (match[0] === '[red]') { if(red) throw Error('Nested [red] tags are not supported.'); red = true; }
  else { if(!red) throw Error('A [/red] tag has no matching [red] tag.'); red = false; }
  last = token.lastIndex;
 }
 if(red) throw Error('A [red] tag is missing its closing [/red] tag.');
 if(last < text.length) parts.push({text:text.slice(last),red});
 return parts;
}

function parseWorkbook(bytes) {
 if(typeof XLSX === 'undefined') throw Error('The Excel reader is missing. Include xlsx.full.min.js beside index.html.');
 const wb = XLSX.read(bytes,{type:'array'});
 if(!wb.Sheets.Characters) throw Error('The workbook needs a sheet named Characters.');
 const grid = XLSX.utils.sheet_to_json(wb.Sheets.Characters,{header:1,defval:'',raw:true});
 const headers = (grid[0] || []).map(v => String(v).trim());
 const missing = fields.filter(f => !headers.includes(f));
 if(missing.length) throw Error('Missing workbook columns: '+missing.join(', ')+'.');
 if(new Set(headers.filter(Boolean)).size !== headers.filter(Boolean).length) throw Error('Each workbook column needs a unique header.');
 const seen = new Set();
 const records = grid.slice(1).map((row,i)=>({row,index:i+2})).filter(({row})=>row.some(v=>String(v).trim() !== '')).map(({row,index})=>{
  const p = Object.fromEntries(fields.map(f=>[f,String(row[headers.indexOf(f)] ?? '')]));
  p.Code = p.Code.trim();
  if(/^\d{1,6}$/.test(p.Code)) p.Code = p.Code.padStart(6,'0');
  if(!/^\d{6}$/.test(p.Code)) throw Error('Row '+index+': Code must contain six digits.');
  if(seen.has(p.Code)) throw Error('Row '+index+': Each character must have a unique code.');
  seen.add(p.Code);
  for(const f of ['Name','Occupation','Personality']) if(!p[f].trim()) throw Error('Row '+index+': '+f+' is empty.');
  for(const f of ['Occupation','Information','Personality','Dress','Act1','Act2','Act3']) {
   try {segments(p[f]);} catch(err) {throw Error('Row '+index+', '+f+': '+err.message);}
  }
  p.Murderer = p.Murderer.trim().toUpperCase() || 'UNASSIGNED';
  if(!['YES','NO','UNASSIGNED'].includes(p.Murderer)) throw Error('Row '+index+': Murderer must be YES, NO, or UNASSIGNED.');
  return p;
 });
 if(!records.length) throw Error('The Characters sheet is empty.');
 const killers = records.filter(p=>p.Murderer === 'YES').length;
 const assigned = records.filter(p=>p.Murderer !== 'UNASSIGNED').length;
 if(killers > 1) throw Error('Select only one murderer. Set Murderer to YES for one character and NO for everyone else.');
 if(assigned && (killers !== 1 || assigned !== records.length)) throw Error('Finish the murderer assignment: one YES and everyone else NO, or leave everyone UNASSIGNED.');
 const config = {...defaultSettings};
 if(wb.Sheets.Settings) for(const [key,value] of XLSX.utils.sheet_to_json(wb.Sheets.Settings,{header:1,defval:''}).slice(1)) if(Object.hasOwn(config,String(key)) && String(value).trim()) config[String(key)] = String(value);
 return {records,config};
}

function message(text,error=false) {$('#entry-message').textContent=text;$('#entry-message').classList.toggle('error',error);}
function applyWorkbook(bytes) {
 const parsed = parseWorkbook(bytes); guests = parsed.records; settings = parsed.config; ready=true;
 document.querySelectorAll('[data-setting]').forEach(el=>el.textContent=settings[el.dataset.setting]);
 $('#enter').disabled=false;$('#load-help').hidden=true; message('Your invitation is waiting.');
}
async function loadHosted() {
 const thisLoad = ++loadId; ready=false;$('#enter').disabled=true;message('Preparing the guest list…');
 if(location.protocol==='file:') {$('#load-help').hidden=false;$('#retry').hidden=true;message('Choose the included character workbook below.');return;}
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);
 try {
  const res=await fetch('./characters.xlsx',{cache:'no-store',signal:controller.signal});
  if(!res.ok) throw Error('Could not load characters.xlsx. Ask your host to check the uploaded workbook.');
  const bytes=await res.arrayBuffer();if(thisLoad===loadId)applyWorkbook(bytes);
 } catch(err) {
  if(thisLoad!==loadId)return;
  message(err.name==='AbortError'?'The guest list took too long to load. Please retry.':err.message,true);
  $('#load-help').hidden=false;$('#load-help-text').textContent='Retry, or choose a copy of characters.xlsx.';
 } finally {clearTimeout(timeout);}
}
$('#workbook').addEventListener('change',async e=>{
 const file=e.target.files[0];if(!file)return;const thisLoad=++loadId;ready=false;$('#enter').disabled=true;
 try {if(file.size>5*1024*1024)throw Error('Please choose a workbook smaller than 5 MB.');const bytes=await file.arrayBuffer();if(thisLoad===loadId)applyWorkbook(bytes);} catch(err){message(err.message,true);}
});
$('#retry').addEventListener('click',loadHosted);
$('#code').addEventListener('input',e=>{e.target.value=e.target.value.replace(/[^0-9]/g,'').slice(0,6);e.target.removeAttribute('aria-invalid');});
$('#entry').addEventListener('submit',e=>{
 e.preventDefault();if(!ready)return;
 const code=$('#code').value.trim();const p=guests.find(g=>g.Code===code);
 if(!p){message(code.length!==6?'Please enter all six digits.':'That code is not on the guest list. Check your code with your host.',true);$('#code').setAttribute('aria-invalid','true');$('#code').focus();return;}
 openCharacter(p);
});
function el(tag,cls,text) {const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function rich(text,cls='source-prose') {
 const p=el('p',cls);
 for(const s of segments(text)){const span=el('span',s.red?'source-red':'source-private',s.text);span.dataset.share=String(s.red);p.append(span);}
 return p;
}
function sourceBlock(label,text,shareOnly=false,name=false) {
 const parts=segments(text);const chosen=shareOnly?parts.filter(p=>p.red && p.text.trim()):parts;
 if(!chosen.length)return null;
 const block=el('section','source-block');const heading=el('h4','source-label',label);
 const allRed=chosen.every(p=>p.red || !p.text.trim());const someRed=chosen.some(p=>p.red);
 heading.append(el('span','badge'+(allRed?' share':''),allRed?'Share with guests':someRed?'Red text only to share':'Private guidance'));
 block.append(heading);
 if(shareOnly) for(const p of chosen)block.append(rich('[red]'+p.text+'[/red]','source-prose red-excerpt'+(name?' name':'')));
 else block.append(rich(text,'source-prose'+(name?' name':'')));
 return block;
}
function paper(title,kicker) {
 const article=el('article','paper');const header=el('header','paper-top');const text=el('div');text.append(el('p','paper-kicker',kicker),el('h3','',title));header.append(text,el('div','paper-seal','H'));header.lastChild.setAttribute('aria-hidden','true');article.append(header);return article;
}
function empty(title,body) {const n=el('div','empty');n.append(el('p','eyebrow','HILLTOP MANOR'),el('h3','',title),el('p','',body));return n;}
function openCharacter(p) {
 current=p;document.body.classList.add('in-dossier');$('#welcome').hidden=true;$('#dossier').hidden=false;$('#leave').hidden=false;$('.header-note').hidden=true;
 $('#character-name').textContent=p.Name;$('#monogram').textContent=p.Name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('');
 $('#code').value='';$('#code').removeAttribute('aria-invalid');buildTabs();setView('character');window.scrollTo(0,0);$('#character-name').focus();
}
function buildTabs() {
 const tabs=$('#tabs');tabs.replaceChildren();
 for(const [view,label,number] of views){const button=el('button',view==='truth'?'secret':'');button.type='button';button.id='tab-'+view;button.dataset.view=view;button.setAttribute('role','tab');button.setAttribute('aria-controls','panel');button.append(el('span','tab-num',number),el('span','',label));button.firstChild.setAttribute('aria-hidden','true');button.addEventListener('click',()=>setView(view));button.addEventListener('keydown',tabKey);tabs.append(button);}
}
function tabKey(e) {
 const tabs=[...$('#tabs').querySelectorAll('[role="tab"]')];let i=tabs.indexOf(e.currentTarget);
 if(['ArrowDown','ArrowRight'].includes(e.key))i=(i+1)%tabs.length;
 else if(['ArrowUp','ArrowLeft'].includes(e.key))i=(i+tabs.length-1)%tabs.length;
 else if(e.key==='Home')i=0;else if(e.key==='End')i=tabs.length-1;else return;
 e.preventDefault();tabs[i].focus();setView(tabs[i].dataset.view);
}
function setView(view) {
 if(!current)return;
 $('#tabs').querySelectorAll('[role="tab"]').forEach(button=>{const active=button.dataset.view===view;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});
 const panel=$('#panel');panel.replaceChildren();panel.setAttribute('aria-labelledby','tab-'+view);$('#page-label').textContent=views.find(v=>v[0]===view)[1].toUpperCase();
 if(view==='character'||view==='share'||view==='personality') {
  const sharing=view==='share';const title=sharing?'Share with your fellow guests':view==='personality'?'Personality trait':'Your character';
  const article=paper(title,sharing?'INFORMATION IN RED':view==='personality'?'PLAYING YOUR CHARACTER':'HILLTOP MANOR');
  const blocks=view==='personality'?[['Personality trait',current.Personality]]:[['Name','[red]'+current.Name+'[/red]'],['Occupation',current.Occupation],['',current.Information],['Personality trait',current.Personality]];
  for(const [label,text]of blocks){if(!text)continue;const block=sourceBlock(label||'Information',text,sharing,label==='Name');if(block)article.append(block);}
  if(sharing)article.append(el('p','paper-note','Only the information marked in red is shown here.'));
  panel.append(article);return;
 }
 if(view==='dress'||view.startsWith('act')) {
  const field=view==='dress'?'Dress':'Act'+view.slice(-1);const title=view==='dress'?'Suggested dress':'Act '+['I','II','III'][Number(view.slice(-1))-1];
  if(!current[field].trim())panel.append(empty(view==='dress'?'Dress details have not been added.':title+' is waiting for your host.',view==='dress'?'Your character sheet does not include suggested dress. Ask your host for any costume guidance.':'No dialogue has been added for this act. Follow your host’s instructions.'));
  else {const article=paper(title,'YOUR CHARACTER');article.append(rich(current[field]));panel.append(article);}return;
 }
 if(current.Murderer==='UNASSIGNED'){panel.append(empty('Your role has not been assigned.','Your host has not yet assigned the murderer for this mystery. Check with your host, then reload your invitation when the game is ready.'));return;}
 const sealed=el('div','sealed');sealed.append(el('div','crest','HC'),el('p','eyebrow','FOR YOUR EYES ONLY'),el('h3','','A secret under seal.'),el('p','','Make sure no one can see your screen before opening your private role.'));
 const button=el('button','blood-button','BREAK THE SEAL');button.type='button';button.addEventListener('click',showTruth);sealed.append(button);panel.append(sealed);
}
function showTruth() {
 if(!current||current.Murderer==='UNASSIGNED')return;
 const killer=current.Murderer==='YES';const article=el('article','reveal '+(killer?'killer':'safe'));const title=el('h3','',killer?'You ARE the murderer.':'You are NOT the murderer.');title.tabIndex=-1;
 article.append(el('p','eyebrow','YOUR PRIVATE ROLE'),title);
 if(current.Reveal.trim())article.append(el('p','reveal-body',current.Reveal));
 const close=el('button','quiet-button','Close & reseal');close.type='button';close.addEventListener('click',()=>{setView('truth');$('#panel .blood-button').focus();});article.append(close);$('#panel').replaceChildren(article);title.focus();
}
function lock() {
 current=null;$('#panel').replaceChildren();$('#tabs').replaceChildren();$('#character-name').textContent='';$('#monogram').textContent='';$('#dossier').hidden=true;$('#welcome').hidden=false;$('#leave').hidden=true;$('.header-note').hidden=false;document.body.classList.remove('in-dossier');$('#code').value='';message('Your invitation is locked.');window.scrollTo(0,0);$('#code').focus();
}
$('#leave').addEventListener('click',lock);
loadHosted();
