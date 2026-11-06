// Cópia offline do site (só funciona publicado em http/https, ex.: GitHub Pages; abrindo os arquivos direto não precisa).
// Na primeira abertura com internet, guarda todos os arquivos do jogo no PC. Depois:
//   com internet  → busca a versão nova (assim as atualizações aparecem) e atualiza a cópia;
//   sem internet  → usa a cópia guardada (o jogo abre e funciona; partidas ficam na fila e são enviadas depois).
// Ao incluir arquivos novos (ex.: uma fase nova), acrescente-os em ARQUIVOS e troque a VERSAO.
const VERSAO = "teoria-das-cores-v1";
const ARQUIVOS = [
  "./",
  "banco.js",
  "final.html",
  "firebase-config.js",
  "img/burger-king.jpg",
  "img/cacto.svg",
  "img/capa-rita-lee.jpg",
  "img/casa-vermelha.webp",
  "img/embutidas/burger-king.js",
  "img/embutidas/cacto.js",
  "img/embutidas/capa-rita-lee.js",
  "img/embutidas/casa-vermelha.js",
  "img/embutidas/lego.js",
  "img/embutidas/menina-afega.js",
  "img/embutidas/ninfeias.js",
  "img/embutidas/paisagem-neve.js",
  "img/embutidas/perry.js",
  "img/embutidas/pooh.js",
  "img/embutidas/snoopy.js",
  "img/embutidas/victorias-secret.js",
  "img/lego.jpg",
  "img/logo-senai.png",
  "img/menina-afega.jpg",
  "img/ninfeias.jpg",
  "img/paisagem-neve.webp",
  "img/perry.jpg",
  "img/pooh.jpg",
  "img/snoopy.jpg",
  "img/victorias-secret.jpg",
  "index.html",
  "inicio.html",
  "painel.html",
  "pergunta.js",
  "prototipo-burger-king.html",
  "prototipo-cacto.html",
  "prototipo-casa.html",
  "prototipo-lego.html",
  "prototipo-menina-afega.html",
  "prototipo-neve.html",
  "prototipo-ninfeias.html",
  "prototipo-perry.html",
  "prototipo-pooh.html",
  "prototipo-rita-lee.html",
  "prototipo-snoopy.html",
  "prototipo-victorias-secret.html",
  "sons.js",
  "style.css",
  "telao.html",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js",
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => Promise.all(ARQUIVOS.map((a) => c.add(a).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// só os arquivos do próprio site e os scripts do Firebase; o banco (firestore.googleapis.com) não passa por aqui
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || !(url.origin === location.origin || url.hostname === "www.gstatic.com")) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSAO);
    try {
      const rede = await Promise.race([fetch(e.request), new Promise((_, nao) => setTimeout(() => nao(new Error("lento")), 4000))]);
      if (rede.ok) cache.put(e.request, rede.clone());
      return rede;
    } catch {
      return (await cache.match(e.request, { ignoreSearch: true })) || (await cache.match(url.pathname.endsWith("/") ? "./" : url.pathname.split("/").pop(), { ignoreSearch: true })) || Response.error();
    }
  })());
});
