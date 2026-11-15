/* Scope the cache to this GitHub Pages repository when the origin hosts other apps. */
const ROOT=new URL(self.registration.scope);
const PREFIX='sakinah-'+ROOT.pathname+'-';
const CACHE=PREFIX+'v1.0.0';
const FILES=['./','./index.html','./style.css','./content.js','./period.js','./app.js','./reminders.js','./quran-data.js','./manifest.webmanifest','./assets/sky-0.webp','./assets/sky-1.webp','./assets/quran.webp','./assets/icon-192.png','./assets/icon-512.png','./assets/icon-maskable.png','./assets/apple-touch.png','./assets/sans.ttf','./assets/sans-bold.ttf','./assets/naskh.ttf','./assets/quran-license.txt'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const assets=new Set(FILES.map(p=>new URL(p,ROOT).href));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const url=new URL(e.request.url);if(url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return;
 if(e.request.mode==='navigate'&&(url.pathname===ROOT.pathname||url.pathname===new URL('index.html',ROOT).pathname)){
  e.respondWith(fetch(e.request).catch(()=>caches.open(CACHE).then(c=>c.match(new URL('index.html',ROOT).href))));return
 }
 if(assets.has(url.href))e.respondWith(caches.open(CACHE).then(async c=>await c.match(e.request)||fetch(e.request)))
});
