const reminderKinds=['morning','evening','quran'];
const defaultTimes=['06:00','17:00','20:00'];
const defaultAlarms=()=>({daily:Object.fromEntries(reminderKinds.map((k,i)=>[k,{on:false,time:defaultTimes[i],next:0}])),timers:{},sound:true});
const two=n=>String(n).padStart(2,'0');
function nextLocal(time, now=Date.now()){
 const [hour,minute]=time.split(':').map(Number), target=new Date(now);
 target.setHours(hour,minute,0,0);
 if(+target<=now){target.setDate(target.getDate()+1);target.setHours(hour,minute,0,0)}
 return +target;
}
function dailyKey(date=new Date()){return [date.getFullYear(),two(date.getMonth()+1),two(date.getDate())].join('-')}
function readStore(key,fallback){try{return JSON.parse(localStorage.getItem('sakinah.v1.'+key))??fallback()}catch{return fallback()}}
function writeStore(key,value){try{localStorage.setItem('sakinah.v1.'+key,JSON.stringify(value))}catch{if(typeof toast==='function')toast('تعذّر الحفظ على هذا الجهاز.')}}
let alarms=readStore('alarms',defaultAlarms);
function saveAlarms(){writeStore('alarms',alarms)}
function listDueDates(){
 const rows=[];
 for(const kind of reminderKinds){
  const daily=alarms.daily[kind];if(daily.on&&daily.next)rows.push({kind,at:daily.next,mode:'daily'});
  if(alarms.timers[kind])rows.push({kind,at:alarms.timers[kind],mode:'timer'})
 }
 return rows.sort((a,b)=>a.at-b.at)
}
function consumeDue(now){
 const due=listDueDates().filter(x=>x.at<=now);if(!due.length)return [];
 for(const event of due){
  if(event.mode==='daily')alarms.daily[event.kind].next=nextLocal(alarms.daily[event.kind].time,now);
  else delete alarms.timers[event.kind]
 }
 saveAlarms();return due
}
function stamp(d,utc=false){
 if(utc)return d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
 return dailyKey(d).replaceAll('-','')+'T'+two(d.getHours())+two(d.getMinutes())+two(d.getSeconds())
}
function foldICS(line){
 const enc=new TextEncoder();let out='',chunk='',size=0;
 for(const c of line){const length=enc.encode(c).length;if(size+length>74){out+=chunk+'\r\n';chunk=' ';size=1}chunk+=c;size+=length}return out+chunk
}
function calendarText(rows,created,appURL){
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Sakinah//Daily Reminders//AR','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:سكينة'];
 const scopeKey=encodeURIComponent(appURL.split('#')[0]).replace(/%/g,'');
 for(const e of rows){const daily=e.mode==='daily',name=LABEL[e.kind],dt=new Date(e.at);
  lines.push('BEGIN:VEVENT','UID:'+scopeKey+'-'+e.kind+'-'+(daily?'daily':e.at)+'@sakinah','DTSTAMP:'+stamp(created,true),'SEQUENCE:'+Math.floor(created.getTime()/1000),'DTSTART:'+stamp(dt,!daily),'DURATION:PT5M','SUMMARY:سكينة – '+name,'DESCRIPTION:حان وقت '+name);
  if(daily)lines.push('RRULE:FREQ=DAILY');
  if(/^https?:/.test(appURL))lines.push('URL:'+appURL.split('#')[0]+'#'+e.kind);
  lines.push('BEGIN:VALARM','TRIGGER:PT0M','ACTION:DISPLAY','DESCRIPTION:حان وقت '+name,'END:VALARM','END:VEVENT');
 }
 lines.push('END:VCALENDAR');return lines.map(foldICS).join('\r\n')+'\r\n'
}
let audioCtx;
function unlockAudio(){
 const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return Promise.resolve(false);
 try{if(!audioCtx)audioCtx=new Ctx();return (audioCtx.state==='running'?Promise.resolve():audioCtx.resume()).then(()=>audioCtx.state==='running',()=>false)}catch{return Promise.resolve(false)}
}
function ringBell(){
 if(!audioCtx||audioCtx.state!=='running')return false;
 const t=audioCtx.currentTime;
 [0,.52,1.06].forEach((delay,i)=>{
  [1,2.39,3.85].forEach((partial,j)=>{
   const osc=audioCtx.createOscillator(),volume=audioCtx.createGain();const at=t+delay+.015;
   osc.type='sine';osc.frequency.value=(i===1?740:622)*partial;
   volume.gain.setValueAtTime(.0001,at);volume.gain.exponentialRampToValueAtTime(.12/(j+1),at+.012);
   volume.gain.exponentialRampToValueAtTime(.0001,at+(j?0.73:1.65));
   osc.connect(volume);volume.connect(audioCtx.destination);osc.start(at);osc.stop(at+1.72);osc.onended=()=>{osc.disconnect();volume.disconnect()}
  })
 });return true
}
function delayLabel(ms){
 const sec=Math.max(0,Math.ceil(ms/1000)),h=Math.floor(sec/3600),m=Math.floor(sec/60)%60,s=sec%60;
 const nums=(h?[h,m,s]:[m,s]).map(x=>two(x).replace(/\d/g,n=>'٠١٢٣٤٥٦٧٨٩'[n]));return nums.join(':')
}
function localTime(ms){return new Date(ms).toLocaleTimeString('ar-SA',{hour:'numeric',minute:'2-digit',hour12:true})}

