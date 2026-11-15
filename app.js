'use strict';
const $=s=>document.querySelector(s);
const dailyBlank=()=>({day:dailyKey(),morning:{i:0,counts:{}},evening:{i:0,counts:{}},read:[]});
let today=readStore('day',dailyBlank);
if(today.day!==dailyKey())today=dailyBlank();
let reading=readStore('reading',()=>({s:1,a:1,goal:5,ended:false}));
const saveDay=()=>writeStore('day',today);
const saveReading=()=>writeStore('reading',reading);
const routes={home:'الرئيسية',riyad:'رياض الصالحين',morning:LABEL.morning,evening:LABEL.evening,quran:'وِردي القرآني',library:'المكتبة والفتاوى',reminders:'التذكيرات'};
const navItems=[['home','home','الرئيسية'],['quran','book','وِردي'],['library','books','المكتبة'],['reminders','bell','التذكيرات']];
function route(){const value=location.hash.slice(1);return Object.hasOwn(routes,value)?value:'home'}
function activeTab(){if(route()==='riyad')return 'library';return ['morning','evening'].includes(route())?'home':route()}
function svgSlots(){document.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=icon(el.dataset.icon)})}
function btn(action,label,key='arrow',cls='primary',extra=''){return '<button type="button" class="'+cls+'" data-action="'+action+'" '+extra+'>'+label+' '+icon(key)+'</button>'}
function linkPage(path,name,key,cls='ghost'){return '<a class="'+cls+'" href="#'+path+'">'+name+' '+icon(key)+'</a>'}
function dateText(){return new Intl.DateTimeFormat('ar-SA-u-ca-gregory',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date())}
function intro(title,subtitle=''){return '<div class="intro"><div><h1>'+title+'</h1>'+(subtitle?'<p class="desc">'+subtitle+'</p>':'')+'</div><span class="date">'+icon('calendar')+dateText()+'</span></div>'}
function modal(title,html){$('#modalTitle').textContent=title;$('#modalBody').innerHTML=html;if(!$('#modal').open)$('#modal').showModal()}
function toast(message){clearTimeout(toast.timer);$('#toast').textContent=message;toast.timer=setTimeout(()=>$('#toast').textContent='',3800)}
function progressLine(current,total){return '<div class="meter-text"><span>إنجاز اليوم</span><b>'+ar(current)+' من '+ar(total)+'</b></div><div class="progress"><i style="width:'+Math.min(100,current/total*100)+'%"></i></div>'}
function completed(kind){return collection(kind).filter((x,i)=>(today[kind].counts[i]||0)>=x.limit).length}
function card(kind){
 const count=completed(kind),started=Object.values(today[kind].counts).some(Number),morning=kind==='morning';
 const action=count===collection(kind).length?'مراجعة الأذكار':started?'متابعة الأذكار':'ابدأ الأذكار';
 return '<article class="sky '+kind+'-sky"><div class="eyeline">'+icon(morning?'sun':'moon')+'<span>'+ (morning?'وِرد الصباح':'وِرد المساء')+'</span></div><h2>'+LABEL[kind]+'</h2><p>'+ar(collection(kind).length)+' أذكار'+(count?' · اكتمل '+ar(count):' مع المعنى والفضل')+'</p>'+linkPage(kind,action,'arrow','lightbtn')+'</article>'
}
function bookmarkName(){return 'سورة '+QURAN[reading.s-1].name+' · الآية '+ar(reading.a)}
function nextPreview(){
 const next=listDueDates()[0];
 return '<article class="preview-rem"><div class="eyeline">'+icon('bell')+'<span>التذكير القادم</span></div><h2>'+(next?LABEL[next.kind]:'مواعيد التذكير')+'</h2><p>'+(next?'الساعة '+localTime(next.at)+' · بعد <bdi id="countdown">'+delayLabel(next.at-Date.now())+'</bdi>':'اختر وقتًا لأذكارك ووِردك القرآني.')+'</p>'+linkPage('reminders',next?'إدارة التذكيرات':'ضبط المواعيد','arrow','textbtn')+'</article>'
}
function homeView(){return intro('أذكاري ووِردي')+'<div class="twosky">'+card('morning')+card('evening')+'</div><div class="sectionbar"><h2>وِرد اليوم</h2></div><div class="dashboard"><article class="qhero"><div class="eyeline">'+icon('bookmark')+'<span>علامة القراءة</span></div><h2>وِردي القرآني</h2><p>'+bookmarkName()+'</p>'+linkPage('quran','متابعة القراءة','arrow','textbtn')+'</article>'+nextPreview()+'</div>'}
function dhikrView(kind){
 const list=collection(kind),section=today[kind],i=section.i,d=list[i],count=section.counts[i]||0,done=count>=d.limit;
 const words=d.surahs?d.surahs.map(n=>'<strong class="surahlabel">سورة '+QURAN[n-1].name+'</strong><p>'+QURAN[n-1].verses.join(' ۞ ')+'</p>').join(''):'<p>'+d.text+'</p>';
 const repeat=done?'اكتمل الذكر':d.surahs?'قرأت السور الثلاث':'قرأت الذكر';
 return intro(LABEL[kind])+'<div class="two-col"><article class="panel"><div class="dhikr-head '+kind+'-sky"><div><div class="eyeline">'+icon(kind==='morning'?'sun':'moon')+' الذكر '+ar(i+1)+' من '+ar(list.length)+'</div><h2>'+d.name+'</h2></div></div><div class="dhikr">'+words+'</div><details class="refbox"><summary>'+(d.virtue?'فضل هذا الذكر':'معنى الذكر وسُنّيته')+'</summary><p>'+(d.virtue||d.note)+'</p><a class="source" href="'+d.url+'" target="_blank" rel="noopener noreferrer">'+d.source+' ↗</a></details><div class="actions">'+btn('count',repeat+' · '+ar(count)+' / '+ar(d.limit),done?'check':'sparkle','primary countbtn',done?'disabled':'')+(i<list.length-1?btn('dhnext','الذكر التالي','arrow','ghost'):linkPage('home','الرئيسية','home'))+'</div></article><aside class="panel"><h2>أذكار الوِرد</h2>'+progressLine(completed(kind),list.length)+list.map((entry,n)=>'<button class="indexbtn '+(n===i?'current':'')+'" data-action="dhindex" data-n="'+n+'">'+icon((section.counts[n]||0)>=entry.limit?'check':'leaf')+'<b>'+entry.name+'</b><span>'+ar(section.counts[n]||0)+' / '+ar(entry.limit)+'</span></button>').join('')+'</aside></div>'
}
function readerView(){
 const chapter=QURAN[reading.s-1],v=chapter.verses[reading.a-1],first=reading.s===1&&reading.a===1,last=reading.s===114&&reading.a===chapter.verses.length;
 const basmala=reading.a===1&&![1,9].includes(reading.s)?'<div class="basmala">'+QURAN[0].verses[0]+'</div>':'';
 return intro('وِردي القرآني')+'<div class="two-col"><article class="panel reader"><div class="eyeline" style="justify-content:center;color:var(--gold)">'+icon('book')+' القرآن الكريم</div><h2>سورة '+chapter.name+'</h2><div class="reader-meta">الآية '+ar(reading.a)+' من '+ar(chapter.verses.length)+'</div>'+basmala+'<div class="verse">'+v+' <span class="verse-num">﴿'+ar(reading.a)+'﴾</span></div><div class="actions multi">'+btn('prevVerse','السابقة','prev','ghost',first?'disabled':'')+btn('readVerse',last?(reading.ended?'أتممت القراءة':'قرأت آخر آية'):'قرأتُ الآية وتابعت','check','primary',last&&reading.ended?'disabled':'')+btn('nextVerse','التالية','arrow','ghost',last?'disabled':'')+'</div><p class="note">'+icon('bookmark')+' يُحفظ موضع القراءة على هذا الجهاز.</p></article><aside class="stack"><div class="panel"><h2>هدف اليوم</h2>'+progressLine(today.read.length,reading.goal)+'<div class="actions">'+btn('goal','تعديل عدد الآيات','settings','ghost')+'</div></div><div class="panel"><h2>الانتقال إلى آية</h2><form id="jump"><div class="fieldrow"><label>السورة<select id="chapter">'+QURAN.map((s,i)=>'<option value="'+(i+1)+'" '+(reading.s===i+1?'selected':'')+'>'+ar(i+1)+' · '+s.name+'</option>').join('')+'</select></label><label>الآية<input type="number" id="verseNo" min="1" max="'+chapter.verses.length+'" value="'+reading.a+'" required inputmode="numeric"></label></div><div class="actions"><button class="ghost">انتقل واحفظ الموضع '+icon('bookmark')+'</button></div></form></div></aside></div>'
}
function referenceRow(entry, glyph) {
  const [, name, description, href, local] = entry;
  const links = local?.download
    ? '<a href="'+href+'" download="'+local.download+'">تنزيل الكتاب PDF '+icon('download')+'</a>'
    : local?.source ? '<a href="'+local.source+'" target="_blank" rel="noopener noreferrer">تصفّح في المكتبة الشاملة '+icon('link')+'</a>' : '';
  const bookHref = local?.source ? '#riyad' : href;
  const target = local?.source ? '' : ' target="_blank" rel="noopener noreferrer"';
  return '<div><a class="refrow" href="'+bookHref+'"'+target+'><span class="tile">'+icon(glyph)+'</span><div><b>'+name+'</b><small>'+description+'</small></div><span class="out">'+icon(local?'book':'link')+'</span></a>'+
    (links?'<div class="book-action">'+links+'</div>':'')+'</div>';
}
function libraryView() {
  const categories = ['كتب ومراجع', 'فتاوى العلماء'];
  const sections = categories.map((category,i) => {
    const rows = references.filter(r => r[0] === category).map(r => referenceRow(r, i?'link':'book'));
    return '<section class="panel"><h2>'+category+'</h2>'+rows.join('')+'</section>';
  });
  const sources = [
    '<details class="refbox"><summary>مصادر التطبيق</summary>',
    '<p>مصدر النص العثماني <a class="source" href="https://quranenc.com/ar" target="_blank" rel="noopener noreferrer">موسوعة القرآن الكريم</a>. وصل النص إلى سَكينة عبر مجموعة <a class="source" href="https://github.com/risan/quran-json/tree/v3.1.2" target="_blank" rel="noopener noreferrer" lang="en" dir="ltr">Quran JSON</a>، الإصدار ٣٫١٫٢، التي أعدّها <bdi lang="en">Risan Bagja Pradana</bdi>.</p>',
    '<p>أُعيد تنظيم البيانات للعرض مع إبقاء نصوص الآيات كما وردت في المصدر. ترخيص مجموعة البيانات هو <a class="source" href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">المشاع الإبداعي، النسبة والترخيص بالمثل ٤٫٠</a>.</p></details>'
  ].join('');
  return intro('المكتبة والفتاوى')+'<div class="library">'+sections.join('')+'</div><p class="note">بعد اكتمال تحميل التطبيق، يمكنك قراءة «حصن المسلم» و«رياض الصالحين» دون اتصال. تحتاج بقية المراجع والفتاوى إلى الإنترنت.</p>'+sources;
}
function ongoingTimers(){return Object.entries(alarms.timers).map(([k,at])=>'<div class="setting"><b>'+LABEL[k]+'</b><bdi data-timer="'+k+'">'+delayLabel(at-Date.now())+'</bdi>'+btn('cancelTimer','إلغاء','close','ghost','data-kind="'+k+'"')+'</div>').join('')}
function remindersView(){return intro('تذكيراتي')+'<div class="two-col"><div class="stack"><section class="panel"><h2>المواعيد اليومية</h2><p class="note">فعّل ما تريد واضبط الساعة بحسب توقيت جهازك.</p><form id="dailyForm">'+reminderKinds.map(k=>'<div class="setting"><input id="on-'+k+'" type="checkbox" class="switch" aria-label="تفعيل '+LABEL[k]+'" '+(alarms.daily[k].on?'checked':'')+'><label for="on-'+k+'"><b>'+LABEL[k]+'</b></label><input id="time-'+k+'" aria-label="موعد '+LABEL[k]+'" type="time" value="'+alarms.daily[k].time+'" required></div>').join('')+'<div class="actions"><button class="primary">حفظ المواعيد '+icon('check')+'</button></div></form></section><section class="panel"><h2>مؤقّت لمرة واحدة</h2><form id="timerForm"><div class="fieldrow"><label>الوِرد<select id="timerKind">'+reminderKinds.map(k=>'<option value="'+k+'">'+LABEL[k]+'</option>').join('')+'</select></label><label>بعد كم دقيقة؟<input id="minutes" type="number" value="5" min="1" max="1440" required inputmode="numeric"></label></div><div class="actions"><button class="primary">بدء المؤقّت '+icon('timer')+'</button></div></form><div id="timersActive" class="timer-info">'+ongoingTimers()+'</div></section></div><aside class="stack"><section class="panel"><h2>جرس التذكير</h2><label class="setting"><input id="sound" class="switch" type="checkbox" '+(alarms.sound?'checked':'')+'>صوت الجرس داخل التطبيق</label>'+btn('testBell','تجربة الجرس','speaker','ghost')+'<p class="note">يرنّ الجرس عند حلول الموعد والتطبيق مفتوح ونشط. ارفع صوت الوسائط وألغِ الكتم لسماعه.</p></section><section class="panel"><h2>عند إغلاق التطبيق</h2><p class="note">انقل مواعيدك المحفوظة إلى تقويم جهازك، ثم افتح الملف ووافق على إضافة الأحداث وتنبيهاتها. يتحكم التقويم بصوتها عند قفل الشاشة.</p><div class="actions">'+btn('exportCalendar','تنزيل مواعيد التقويم','calendar','ghost')+'</div><p class="note">لتغيير موعد سبق استيراده أو إلغائه، حدّث الحدث في التقويم أيضًا.</p></section></aside></div>'}
function render(){
 const path=route();$('#tabs').innerHTML=navItems.map(([r,k,n])=>'<a href="#'+r+'" '+(r===activeTab()?'class="active" aria-current="page"':'')+'>'+icon(k)+n+'</a>').join('');
 $('#main').innerHTML=path==='home'?homeView():path==='quran'?readerView():path==='riyad'?'<iframe class="sakinah-reader" src="./books/riyad-as-salihin.html" title="رياض الصالحين وفهرس الأبواب"></iframe>':path==='library'?libraryView():path==='reminders'?remindersView():dhikrView(path);
 document.title=routes[path]+' | سَكينة';updateCountDisplays()
}
function showTheme(){let dark=document.body.classList.contains('dark');$('#theme').innerHTML=icon(dark?'sun':'moon');$('#theme').setAttribute('aria-label',dark?'تفعيل المظهر النهاري':'تفعيل المظهر الليلي');document.querySelector('meta[name=theme-color]').content=dark?'#102421':'#f8f7f1'}
document.body.classList.toggle('dark',readStore('dark',()=>false));showTheme();svgSlots();render();
document.querySelector('.skip').onclick=e=>{e.preventDefault();$('#main').focus()};
$('#theme').onclick=()=>{document.body.classList.toggle('dark');writeStore('dark',document.body.classList.contains('dark'));showTheme()};
window.addEventListener('hashchange',()=>{if($('#modal').open&&!$('#modal').dataset.alert)$('#modal').close();render();window.scrollTo(0,0);$('#main').focus({preventScroll:true})});
$('#closeModal').onclick=()=>$('#modal').close();
let installPrompt;
function isInstalled(){return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}
function installLabel(){if(isInstalled())$('#install').hidden=true}
installLabel();window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e});window.addEventListener('appinstalled',()=>{installPrompt=null;$('#install').hidden=true;toast('تم تثبيت سَكينة')});
$('#install').onclick=async()=>{if(installPrompt){const p=installPrompt;installPrompt=null;try{await p.prompt();await p.userChoice;return}catch{}}
 modal('تثبيت سَكينة','<ul><li><b>آيفون وآيباد</b> افتح الرابط في سفاري، ثم «مشاركة» و«إضافة إلى الشاشة الرئيسية».</li><li><b>أندرويد</b> من قائمة المتصفح اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».</li><li><b>الكمبيوتر</b> استخدم أيقونة التثبيت في شريط العنوان أو خيار تثبيت الصفحة من قائمة Chrome أو Edge. في سفاري على أجهزة ماك الحديثة اختر «إضافة إلى شريط الأيقونات».</li></ul><p class="note">إذا لم يظهر الخيار، افتح رابط الموقع المنشور في المتصفح مباشرة. يمكنك استخدام سَكينة من الرابط أيضًا.</p>')};
function moveVerse(step){
 const ch=QURAN[reading.s-1];let next=reading.a+step;
 if(next<1&&reading.s>1){reading.s--;next=QURAN[reading.s-1].verses.length}
 else if(next>ch.verses.length&&reading.s<114){reading.s++;next=1}
 reading.a=Math.max(1,Math.min(next,QURAN[reading.s-1].verses.length));saveReading();render()
}
function readVerse(){
 const id=reading.s+'-'+reading.a,old=today.read.length;
 if(!today.read.includes(id)){today.read.push(id);saveDay()}
 if(reading.s===114&&reading.a===6){reading.ended=true;saveReading();render();toast('ختمتَ القراءة، تقبّل الله منك.');return}
 moveVerse(1);if(today.read.length>=reading.goal&&old<reading.goal)toast('اكتمل وِرد اليوم، تقبّل الله منك.')
}
function selectDh(n){const section=today[route()];section.i=n;saveDay();render();$('#main').scrollIntoView({block:'start'})}
function collectCount(){
 const k=route(),section=today[k],d=collection(k)[section.i];
 section.counts[section.i]=Math.min(d.limit,(section.counts[section.i]||0)+1);saveDay();
 const val=section.counts[section.i],done=val===d.limit;
 const counter=document.querySelector('[data-action=count]');counter.textContent=(done?'اكتمل الذكر':d.surahs?'قرأت السور الثلاث':'قرأت الذكر')+' · '+ar(val)+' / '+ar(d.limit)+' ';counter.insertAdjacentHTML('beforeend',icon(done?'check':'sparkle'));counter.disabled=done;
 const idx=document.querySelector('.indexbtn.current');idx.querySelector('span:last-child').textContent=ar(val)+' / '+ar(d.limit);
 if(done){idx.querySelector('svg').outerHTML=icon('check');const c=completed(k),len=collection(k).length;$('.meter-text b').textContent=ar(c)+' من '+ar(len);$('.progress i').style.width=(c/len*100)+'%';toast(c===len?'اكتمل وِرد الأذكار، تقبّل الله منك.':'اكتمل هذا الذكر.')}
}
async function exportCalendar(){
 const rows=listDueDates();if(!rows.length){toast('احفظ موعدًا مفعّلًا أو ابدأ مؤقّتًا أولًا.');return}
 const file=new Blob([calendarText(rows,new Date(),location.href)],{type:'text/calendar;charset=utf-8'}),url=URL.createObjectURL(file);
 const a=document.createElement('a');a.href=url;a.download='Sakinah-reminders.ics';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);toast('افتح ملف المواعيد في تقويم جهازك وأكّد الاستيراد.')
}
let pendingAlerts=[];
function openNextAlert(){
 if(!pendingAlerts.length)return;const e=pendingAlerts[0],late=Date.now()-e.at>2*60000;
 modal(late?'تذكير فائت':'حان وقت الوِرد','<p class="notice">'+icon('bell')+' <b>'+LABEL[e.kind]+'</b></p><p class="note">موعد التذكير '+localTime(e.at)+'</p><div class="modal-actions">'+btn('openAlert','بدء الوِرد','arrow')+btn('snooze','ذكّرني بعد ٥ دقائق','timer','ghost')+'</div>');
 $('#modal').dataset.alert='1';
}
function afterAlert(){pendingAlerts.shift();delete $('#modal').dataset.alert}
$('#modal').addEventListener('close',()=>{if($('#modal').dataset.alert)afterAlert();if(pendingAlerts.length)openNextAlert()});
document.addEventListener('click',async e=>{
 const el=e.target.closest('[data-action]');if(!el)return;
 switch(el.dataset.action){
 case 'dhindex':selectDh(Number(el.dataset.n));break;
 case 'dhnext':selectDh(today[route()].i+1);break;
 case 'count':collectCount();break;
 case 'prevVerse':moveVerse(-1);break;
 case 'nextVerse':moveVerse(1);break;
 case 'readVerse':readVerse();break;
 case 'goal':modal('هدف الوِرد اليومي','<form id="goalForm"><label class="field">عدد الآيات يوميًا<input id="goalValue" type="number" min="1" max="6236" value="'+reading.goal+'" required></label><div class="actions"><button class="primary">حفظ الهدف '+icon('check')+'</button></div></form>');break;
 case 'testBell':{const ok=await unlockAudio();toast(ok&&ringBell()?'تجربة صوت الجرس':'تحقّق من إذن تشغيل الصوت في المتصفح.');break}
 case 'cancelTimer':delete alarms.timers[el.dataset.kind];saveAlarms();$('#timersActive').innerHTML=ongoingTimers();toast('أُلغي المؤقّت.');break;
 case 'exportCalendar':exportCalendar();break;
 case 'openAlert':case 'snooze':{const item=pendingAlerts[0];if(!item)break;const open=el.dataset.action==='openAlert';afterAlert();if(!open){alarms.timers[item.kind]=Date.now()+300000;saveAlarms();toast('سيُذكّرك سَكينة بعد ٥ دقائق.')};$('#modal').close();if(open)location.hash=item.kind;else if(route()==='reminders')$('#timersActive').innerHTML=ongoingTimers();break}
 }
});
document.addEventListener('change',e=>{
 if(e.target.id==='chapter'){const max=QURAN[+e.target.value-1].verses.length;$('#verseNo').max=max;$('#verseNo').value=1}
 if(e.target.id==='sound'){alarms.sound=e.target.checked;saveAlarms();if(alarms.sound)unlockAudio()}
});
document.addEventListener('submit',e=>{
 if(!['goalForm','jump','dailyForm','timerForm'].includes(e.target.id))return;e.preventDefault();if(!e.target.reportValidity())return;
 switch(e.target.id){
 case 'goalForm':reading.goal=Number($('#goalValue').value);saveReading();$('#modal').close();render();toast('حُفظ هدف الوِرد.');break;
 case 'jump':reading.s=Number($('#chapter').value);reading.a=Number($('#verseNo').value);reading.ended=false;saveReading();render();toast('حُفظ موضع القراءة.');break;
 case 'dailyForm':
  for(const k of reminderKinds){const time=$('#time-'+k).value,on=$('#on-'+k).checked;alarms.daily[k]={on,time,next:on?nextLocal(time):0}}
  saveAlarms();if(alarms.sound)unlockAudio();toast('حُفظت مواعيد التذكير.');break;
 case 'timerForm':{const k=$('#timerKind').value;alarms.timers[k]=Date.now()+Number($('#minutes').value)*60000;saveAlarms();if(alarms.sound)unlockAudio();$('#timersActive').innerHTML=ongoingTimers();toast('بدأ مؤقّت '+LABEL[k]+'.');break}
 }
});
function updateCountDisplays(){document.querySelectorAll('[data-timer]').forEach(el=>{const at=alarms.timers[el.dataset.timer];if(at)el.textContent=delayLabel(at-Date.now())});const top=$('#countdown'),first=listDueDates()[0];if(top&&first)top.textContent=delayLabel(first.at-Date.now())}
let checking=false;
async function tick(){
 if(today.day!==dailyKey()){today=dailyBlank();saveDay();render()}
 updateCountDisplays();if(checking||!listDueDates().some(x=>x.at<=Date.now()))return;checking=true;
 const perform=()=>{alarms=readStore('alarms',()=>alarms);const due=consumeDue(Date.now());if(!due.length)return;
  if(alarms.sound&&due.some(x=>Date.now()-x.at<120000))ringBell();if(route()==='home')render();if(route()==='reminders')$('#timersActive').innerHTML=ongoingTimers();
  const seen=new Set(pendingAlerts.map(x=>x.kind));due.forEach(x=>{if(!seen.has(x.kind)){pendingAlerts.push(x);seen.add(x.kind)}});if(!$('#modal').dataset.alert)openNextAlert()
 };
 try{if(navigator.locks)await navigator.locks.request('sakinah-alarm-'+location.pathname,perform);else perform()}finally{checking=false}
}
window.addEventListener('storage',e=>{if(e.key==='sakinah.v1.alarms'){alarms=readStore('alarms',defaultAlarms);if(route()==='home'||route()==='reminders')render()}if(e.key==='sakinah.v1.day'){today=readStore('day',dailyBlank);if(route()!=='reminders')render()}if(e.key==='sakinah.v1.reading'){reading=readStore('reading',()=>reading);if(route()==='quran'||route()==='home')render()}});
const prime=()=>{if(alarms.sound)unlockAudio()};document.addEventListener('pointerdown',prime,{passive:true});document.addEventListener('keydown',prime);setInterval(tick,500);document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick()});tick();
if('serviceWorker' in navigator && ['https:','http:'].includes(location.protocol))navigator.serviceWorker.register('./sw.js').catch(()=>{});

