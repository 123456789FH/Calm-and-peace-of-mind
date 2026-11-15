/* Scope the cache to this GitHub Pages repository when the origin hosts other apps. */
const ROOT=new URL(self.registration.scope);
const PREFIX='sakinah-'+ROOT.pathname+'-';
const CACHE=PREFIX+'v1.1.3';
const FILES=['./','./index.html','./style.css','./content.js','./period.js','./app.js','./reminders.js','./quran-data.js','./manifest.webmanifest','./assets/sky-0.webp','./assets/sky-1.webp','./assets/quran.webp','./assets/icon-192.png','./assets/icon-512.png','./assets/icon-maskable.png','./assets/apple-touch.png','./assets/sans.ttf','./assets/sans-bold.ttf','./assets/naskh.ttf','./assets/quran-license.txt','./books/hisn-al-muslim.pdf','./books/riyad-as-salihin.html','./books/reading.css','./books/reading.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(path=>new Request(new URL(path,ROOT),{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
async function serveBookPDF(request) {
 const cache = await caches.open(CACHE);
 const full = await cache.match(new URL('./books/hisn-al-muslim.pdf', ROOT).href);
 if (!full) return fetch(request);
 const range = request.headers.get('Range');
 if (!range) return full;
 const part = /^bytes=(\d*)-(\d*)$/i.exec(range);
 if (!part || (!part[1] && !part[2])) return full;
 const bytes = await full.arrayBuffer();
 const size = bytes.byteLength;
 const start = part[1] ? Number(part[1]) : Math.max(0, size - Number(part[2]));
 const end = part[1] && part[2] ? Math.min(Number(part[2]), size-1) : size-1;
 if (start >= size || end < start) {
  return new Response(null, {status:416, headers:{'Content-Range':'bytes */'+size}});
 }
 return new Response(bytes.slice(start, end+1), {status:206,headers:{
  'Content-Type':'application/pdf','Accept-Ranges':'bytes','Content-Length':String(end-start+1),
  'Content-Range':'bytes '+start+'-'+end+'/'+size
 }});
}
const assets=new Set(FILES.map(p=>new URL(p,ROOT).href));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const url=new URL(e.request.url);if(url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return;
 if(e.request.mode==='navigate'&&(url.pathname===ROOT.pathname||url.pathname===new URL('index.html',ROOT).pathname)){
  e.respondWith(fetch(e.request).catch(()=>caches.open(CACHE).then(c=>c.match(new URL('index.html',ROOT).href))));return
 }
 if(url.href===new URL('./books/hisn-al-muslim.pdf',ROOT).href){e.respondWith(serveBookPDF(e.request));return}
 if(assets.has(url.href))e.respondWith(caches.open(CACHE).then(async c=>await c.match(e.request)||fetch(e.request)))
});
