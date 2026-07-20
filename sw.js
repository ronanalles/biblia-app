const SHELL='inspire-reino-shell-v2';
const BIBLE='inspire-reino-bible-v2';
const ASSETS=['./','./index.html','./styles.css','./data.js','./app.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(SHELL).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>![SHELL,BIBLE].includes(key)).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  if(request.url.includes('bible-api.com')){
    event.respondWith(caches.open(BIBLE).then(async cache=>{
      const cached=await cache.match(request);
      const network=fetch(request).then(response=>{if(response.ok)cache.put(request,response.clone());return response}).catch(()=>cached);
      return cached||network;
    }));
    return;
  }
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
    if(new URL(request.url).origin===self.location.origin)caches.open(SHELL).then(cache=>cache.put(request,response.clone()));
    return response;
  }).catch(()=>request.mode==='navigate'?caches.match('./index.html'):undefined)));
});