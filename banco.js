// Acesso ao banco (Firebase / Cloud Firestore) — usado pelo início, fases, tela final, telão e painel.
// Script comum (não módulo) e SDK "compat" do Firebase: assim funciona abrindo os arquivos direto, sem servidor.
// Antes deste arquivo a página carrega: firebase-app-compat.js, firebase-firestore-compat.js (e auth no painel) e firebase-config.js.
//
// Coleções:
//   config/jogo      regras (fases por pessoa, fases ativas, tempos, círculo) e a rodada atual { id, nome, inicio }
//   rodadas/{id}     cada rodada: nome, início, fim
//   partidas/{auto}  cada partida: rodada, nome, total, maximo, fases [{ fase, cor, harmonia }], criadoEm, estacao
//   recorde/evento   melhor partida do evento inteiro (não é apagado ao encerrar rodada)
//   estacoes/{id}    cada PC do jogo: status (livre | jogando | concluiu | demo), jogador, rodada, fila (partidas não enviadas), atualizado

// harmonia = resposta certa (a mesma de HARMONIA em cada prototipo-*.html); o telão só mostra quando a rodada termina
const HARMONIAS_NOMES = { complementar: "Complementar", analoga: "Análoga", triade: "Tríade", monocromatica: "Monocromática", tetradica: "Tetrádica", quadrada: "Quadrada" };
// cópia offline do site (sw.js): só quando publicado (http/https)
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
const FASES_DO_JOGO = {
  "prototipo-neve": { nome: "Neve", img: "img/paisagem-neve.webp", harmonia: "complementar" },
  "prototipo-casa": { nome: "Casa", img: "img/casa-vermelha.webp", harmonia: "triade" },
  "prototipo-ninfeias": { nome: "Ninfeias", img: "img/ninfeias.jpg", harmonia: "analoga" },
  "prototipo-rita-lee": { nome: "Rita Lee", img: "img/capa-rita-lee.jpg", harmonia: "triade" },
  "prototipo-cacto": { nome: "Cacto", img: "img/cacto.svg", harmonia: "triade" },
  "prototipo-pooh": { nome: "Ursinho Pooh", img: "img/pooh.jpg", harmonia: "analoga" },
  "prototipo-burger-king": { nome: "Burger King", img: "img/burger-king.jpg", harmonia: "triade" },
  "prototipo-snoopy": { nome: "Snoopy", img: "img/snoopy.jpg", harmonia: "analoga" },
  "prototipo-perry": { nome: "Perry", img: "img/perry.jpg", harmonia: "complementar" },
  "prototipo-victorias-secret": { nome: "Victoria's Secret", img: "img/victorias-secret.jpg", harmonia: "monocromatica" },
  "prototipo-menina-afega": { nome: "Menina afegã", img: "img/menina-afega.jpg", harmonia: "complementar" },
  "prototipo-lego": { nome: "LEGO", img: "img/lego.jpg", harmonia: "analoga" },
  "prototipo-bob-esponja": { nome: "Bob Esponja", img: "img/bob-esponja.jpg", harmonia: "quadrada" },
  "prototipo-blade-runner": { nome: "Blade Runner", img: "img/blade-runner.jpg", harmonia: "complementar" },
  "prototipo-kung-fu-panda": { nome: "Kung Fu Panda", img: "img/kung-fu-panda.jpg", harmonia: "analoga" },
  "prototipo-picole": { nome: "Picolé", img: "img/picole.jpg", harmonia: "analoga" },
  "prototipo-gumball": { nome: "Gumball e Darwin", img: "img/gumball.jpg", harmonia: "complementar" },
  "prototipo-mario": { nome: "Mario Bros", img: "img/mario.jpg", harmonia: "triade" },
  "prototipo-ikea": { nome: "IKEA", img: "img/ikea.jpg", harmonia: "complementar" },
  "prototipo-a-sobremesa": { nome: "A Sobremesa (Matisse)", img: "img/a-sobremesa.jpg", harmonia: "triade" },
  "prototipo-batman": { nome: "The Batman", img: "img/batman.jpg", harmonia: "monocromatica" },
  "prototipo-logan": { nome: "Logan", img: "img/logan.jpg", harmonia: "analoga" },
  "prototipo-concerto": { nome: "Pôster de concerto", img: "img/concerto.jpg", harmonia: "analoga" },
  "prototipo-natura-ekos": { nome: "Natura Ekos", img: "img/natura-ekos.jpg", harmonia: "analoga" },
  "prototipo-noite-estrelada": { nome: "Noite Estrelada", img: "img/noite-estrelada.jpg", harmonia: "complementar" },
  "prototipo-superman": { nome: "Superman", img: "img/superman.jpg", harmonia: "triade" },
  "prototipo-coca-cola": { nome: "Coca-Cola", img: "img/coca-cola.png", harmonia: "monocromatica" },
  "prototipo-mondrian": { nome: "Mondrian", img: "img/mondrian.jpg", harmonia: "triade" },
};

// Regras padrão (valem enquanto o moderador não mudar nada, ou sem internet)
const CONFIG_PADRAO = {
  fasesPorPessoa: 5,
  fasesAtivas: Object.keys(FASES_DO_JOGO),
  tempoResultado: 8,
  tempoCombinacao: 6,
  tempoAbandono: 90,
  tempoComoJogar: 15,
  tempoFinal: 20,        // segundos na tela final antes de voltar ao início (0 = até tocar na tela)
  tempoAjuste: 0,        // limite para ajustar as cores, em segundos (0 = sem limite)
  tempoHarmonia: 0,      // limite para responder a harmonia, em segundos (0 = sem limite)
  sortear: true,         // false: todos jogam as mesmas fases, na ordem da lista
  circulo: true,
  nota100: false,        // true: as telas mostram os pontos de 0 a 100 (só conversão; o banco guarda os pontos reais)
  sons: false,           // sons de acerto, erro, tempo e fim (painel)
  rodada: null,          // { id, nome, inicio, encerrada }
};

const Banco = (() => {
  let db = null, auth = null;
  try {
    if (window.firebase && window.FIREBASE_CONFIG) {
      if (!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
      db = firebase.firestore();
      if (firebase.auth) auth = firebase.auth();
    }
  } catch (e) { console.warn("Firebase indisponível:", e); }

  const lerLocal = (k, padrao) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? padrao; } catch { return padrao; } };
  const gravarLocal = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  // ---------- config ----------
  // As fases usam a última config guardada no navegador (instantâneo e funciona sem internet); o banco atualiza essa cópia.
  function configLocal() { return { ...CONFIG_PADRAO, ...lerLocal("config_jogo", {}) }; }
  async function atualizarConfig() {
    if (!db) return configLocal();
    try {
      const doc = await db.collection("config").doc("jogo").get();
      const cfg = { ...CONFIG_PADRAO, ...(doc.exists ? doc.data() : {}) };
      gravarLocal("config_jogo", cfg);
      return cfg;
    } catch (e) { console.warn("config:", e); return configLocal(); }
  }
  function ouvirConfig(aoMudar) {
    if (!db) { aoMudar(configLocal()); return () => {}; }
    return db.collection("config").doc("jogo").onSnapshot((doc) => {
      const cfg = { ...CONFIG_PADRAO, ...(doc.exists ? doc.data() : {}) };
      gravarLocal("config_jogo", cfg);
      aoMudar(cfg);
    }, (e) => { console.warn("config:", e); aoMudar(configLocal()); });
  }
  async function salvarConfig(parcial) {          // só o moderador (regras exigem login)
    await db.collection("config").doc("jogo").set(parcial, { merge: true });
  }

  // ---------- rodadas ----------
  function nomeDaRodada(n) {
    const d = new Date();
    return `Rodada ${n} · ${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}`;
  }
  // Encerra a rodada atual: o telão passa a mostrar o ranking final e as respostas certas (até começar a próxima)
  async function encerrarRodada() {
    const cfg = await atualizarConfig();
    if (!cfg.rodada?.id || cfg.rodada.encerrada) return;
    await fecharRodada(cfg.rodada.id, firebase.firestore.FieldValue.serverTimestamp());
    await salvarConfig({ rodada: { ...cfg.rodada, encerrada: true, fim: Date.now() } });
  }
  async function novaRodada() {                    // encerra a atual (se houver) e começa outra; o recorde não muda
    const cfg = await atualizarConfig();
    const agora = firebase.firestore.FieldValue.serverTimestamp();
    if (cfg.rodada?.id && !cfg.rodada.encerrada) await fecharRodada(cfg.rodada.id, agora);
    const qtd = (await db.collection("rodadas").get()).size;
    const ref = db.collection("rodadas").doc();
    const rodada = { id: ref.id, nome: nomeDaRodada(qtd + 1) };
    await ref.set({ nome: rodada.nome, inicio: agora });
    await db.collection("config").doc("jogo").update({ rodada: { ...rodada, inicio: Date.now(), encerrada: false } });
    return rodada;
  }

  // Ao encerrar, a rodada guarda um resumo (fica no histórico mesmo se partidas forem apagadas depois)
  function resumir(lista) {
    const porFase = {};
    lista.forEach((p) => (p.fases || []).forEach((f) => {
      const s = (porFase[f.fase] ||= { jogadas: 0, acertos: 0, somaCor: 0 });
      s.jogadas++; s.acertos += f.harmonia ? 1 : 0; s.somaCor += f.cor || 0;
    }));
    const melhor = lista[0];
    return {
      jogadores: lista.length,
      melhor: melhor ? { nome: melhor.nome, total: melhor.total, maximo: melhor.maximo } : null,
      mediaTotal: lista.length ? Math.round(lista.reduce((a, p) => a + (p.total || 0), 0) / lista.length) : 0,
      porFase,
    };
  }
  async function fecharRodada(id, fim) {
    const lista = await partidasDaRodada(id);
    await db.collection("rodadas").doc(id).set({ fim, resumo: resumir(lista) }, { merge: true });
  }
  // Histórico: todas as rodadas (mais nova primeiro), cada uma com suas partidas
  async function historico() {
    const [rs, ps] = await Promise.all([db.collection("rodadas").get(), db.collection("partidas").get()]);
    const porRodada = {};
    ps.docs.forEach((d) => (porRodada[d.data().rodada || "sem-rodada"] ||= []).push({ id: d.id, ...d.data() }));
    const ms = (t) => t?.toMillis?.() ?? (typeof t === "number" ? t : 0);
    const rodadas = rs.docs.map((d) => ({ id: d.id, ...d.data(), partidas: ordenar(porRodada[d.id] || []) }));
    if (porRodada["sem-rodada"]) rodadas.push({ id: "sem-rodada", nome: "Sem rodada (testes)", partidas: ordenar(porRodada["sem-rodada"]) });
    return rodadas.sort((a, b) => ms(b.inicio) - ms(a.inicio));
  }
  async function apagarPartida(id) { await apagarPartidaECorrigir(id); }   // só o moderador

  // ---------- partidas ----------
  // Grava a partida; sem internet, guarda numa fila local e tenta de novo depois
  // Sem internet: a partida fica numa fila no navegador e é reenviada depois (tela inicial a cada 2 min e a cada partida nova).
  // Cada partida ganha um id fixo ao entrar na fila: se um envio "travado" chegar ao banco e depois houver um reenvio,
  // o banco recusa a cópia (já existe) e ela sai da fila — não há partida duplicada.
  const idNovo = () => (db ? db.collection("partidas").doc().id : "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
  const comPrazo = (promessa, ms) => Promise.race([promessa, new Promise((_, nao) => setTimeout(() => nao(new Error("sem resposta")), ms))]);
  async function salvarPartida(p) {
    const fila = lerLocal("fila_partidas", []);
    fila.push({ _id: idNovo(), ...p }); gravarLocal("fila_partidas", fila);
    return enviarFila();
  }
  let enviando = null;
  function enviarFila() {
    if (!db) return Promise.resolve(false);
    if (!enviando) enviando = enviarFilaAgora().finally(() => { enviando = null; });   // nunca dois envios ao mesmo tempo
    return enviando;
  }
  async function enviarFilaAgora() {
    let fila = lerLocal("fila_partidas", []), ok = true;
    while (fila.length) {
      const { _id, ...p } = fila[0];
      const ref = db.collection("partidas").doc(_id || idNovo());
      try {
        await comPrazo(ref.set({ ...p, criadoEm: firebase.firestore.FieldValue.serverTimestamp() }), 10000);
      } catch (e) {
        // já gravada antes (o banco recusa regravar)? então só tira da fila
        const existe = e?.code === "permission-denied" && (await comPrazo(ref.get(), 8000).then((d) => d.exists).catch(() => false));
        if (!existe) { console.warn("partida não enviada (fica na fila):", e); ok = false; break; }
      }
      await comPrazo(atualizarRecorde(p), 8000).catch(() => {});
      fila = lerLocal("fila_partidas", []).filter((q) => q._id !== _id || !_id);
      if (!_id) fila.shift();
      gravarLocal("fila_partidas", fila);
    }
    return ok;
  }
  async function atualizarRecorde(p) {
    const ref = db.collection("recorde").doc("evento");
    try {
      await db.runTransaction(async (t) => {
        const atual = await t.get(ref);
        if (!atual.exists || aprov(atual.data()) < aprov(p)) t.set(ref, { nome: p.nome, total: p.total, maximo: p.maximo, rodadaNome: p.rodadaNome || "", quando: Date.now() });
      });
    } catch (e) { console.warn("recorde:", e); }
  }
  // Partidas de uma rodada, em ordem de pontos (ordena aqui para não precisar de índice no banco)
  // Ordem do ranking: pelo aproveitamento (total ÷ maximo), para ser justo mesmo se o número de fases mudar no meio;
  // empate: mais pontos reais e, depois, quem terminou antes
  const aprov = (p) => (p.maximo ? p.total / p.maximo : 0);
  function ordenar(lista) { return lista.sort((a, b) => aprov(b) - aprov(a) || b.total - a.total || (a.criadoEm?.toMillis?.() ?? 0) - (b.criadoEm?.toMillis?.() ?? 0)); }
  // sem rodada criada pelo moderador, as partidas ficam em "sem-rodada"
  async function partidasDaRodada(rodadaId) {
    rodadaId = rodadaId || "sem-rodada";
    if (!db) return [];
    const snap = await db.collection("partidas").where("rodada", "==", rodadaId).get();
    return ordenar(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }
  function ouvirRodada(rodadaId, aoMudar) {
    rodadaId = rodadaId || "sem-rodada";
    if (!db) { aoMudar([]); return () => {}; }
    return db.collection("partidas").where("rodada", "==", rodadaId)
      .onSnapshot((snap) => aoMudar(ordenar(snap.docs.map((d) => ({ id: d.id, ...d.data() })))), (e) => console.warn("rodada:", e));
  }
  function ouvirRecorde(aoMudar) {
    if (!db) return () => {};
    return db.collection("recorde").doc("evento").onSnapshot((d) => aoMudar(d.exists ? d.data() : null), (e) => console.warn("recorde:", e));
  }

  // Apagar recorde (só o moderador): apaga também a PARTIDA que fez o recorde (some do ranking e do histórico)
  // e o recorde passa para a melhor partida que sobrou no evento.
  async function apagarRecorde() {
    const ref = db.collection("recorde").doc("evento"), atual = await ref.get();
    if (atual.exists) {
      const r = atual.data();
      const snap = await db.collection("partidas").where("nome", "==", r.nome).get();
      const iguais = snap.docs.filter((d) => d.data().total === r.total);
      const alvo = (r.partidaId && iguais.find((d) => d.id === r.partidaId)) || iguais.find((d) => (d.data().rodadaNome || "") === (r.rodadaNome || "")) || iguais[0];
      if (alvo) await alvo.ref.delete();
    }
    await recalcularRecorde();
  }
  async function recalcularRecorde() {
    const todas = ordenar((await db.collection("partidas").get()).docs.map((d) => ({ id: d.id, ...d.data() })));
    const ref = db.collection("recorde").doc("evento"), p = todas[0];
    if (!p) return ref.delete();
    await ref.set({ nome: p.nome, total: p.total, maximo: p.maximo, rodadaNome: p.rodadaNome || "", quando: p.criadoEm?.toMillis?.() ?? Date.now() });
  }
  // apagar uma partida que era o recorde também corrige o recorde
  async function apagarPartidaECorrigir(id) {
    const p = (await db.collection("partidas").doc(id).get()).data();
    await db.collection("partidas").doc(id).delete();
    const r = (await db.collection("recorde").doc("evento").get()).data();
    if (p && r && r.nome === p.nome && r.total === p.total) await recalcularRecorde();
  }

  // rodada em que o jogador atual começou (guardada em inicio.html ao confirmar o nome)
  function rodadaDoJogo() { try { return JSON.parse(sessionStorage.getItem("rodada_jogo")); } catch { return null; } }

  // ---------- estações (cada PC do jogo informa o que está fazendo; o painel e o telão acompanham) ----------
  function idDaEstacao() {
    let id = null; try { id = localStorage.getItem("estacao"); } catch {}
    if (!id) { id = "PC-" + Math.random().toString(36).slice(2, 6).toUpperCase(); try { localStorage.setItem("estacao", id); } catch {} }
    return id;
  }
  async function informarEstacao(status, jogador) {
    if (!db) return;
    const rodada = (status !== "livre" && status !== "demo" && rodadaDoJogo()) || configLocal().rodada;
    const dados = { status, jogador: (jogador || "").slice(0, 20), rodada: rodada?.id || "sem-rodada", fila: lerLocal("fila_partidas", []).length, atualizado: firebase.firestore.FieldValue.serverTimestamp() };
    if (status === "jogando") dados.inicio = Date.now();
    try { await db.collection("estacoes").doc(idDaEstacao()).set(dados, { merge: true }); } catch (e) { console.warn("estação:", e); }
  }
  function ouvirEstacoes(aoMudar) {
    if (!db) { aoMudar([]); return () => {}; }
    return db.collection("estacoes").onSnapshot((snap) => aoMudar(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), (e) => console.warn("estações:", e));
  }
  // Nome já usado na rodada atual (por quem concluiu ou por quem está jogando agora em outro PC)?
  // Compara sem maiúsculas/acentos/espaços extras. Sem internet (ou demora > 3 s), deixa passar.
  async function nomeEmUso(nome) {
    if (!db) return false;
    const norm = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
    const alvo = norm(nome);
    const busca = (async () => {
      const cfg = await atualizarConfig(), rodada = cfg.rodada?.id || "sem-rodada";
      const [ps, es] = await Promise.all([
        db.collection("partidas").where("rodada", "==", rodada).get(),
        db.collection("estacoes").where("rodada", "==", rodada).get(),
      ]);
      if (ps.docs.some((d) => norm(d.data().nome) === alvo)) return true;
      const eu = idDaEstacao(), agora = Date.now();
      return es.docs.some((d) => d.id !== eu && d.data().status === "jogando" && agora - (d.data().atualizado?.toMillis?.() ?? 0) < 20 * 60000 && norm(d.data().jogador) === alvo);
    })();
    return Promise.race([busca, new Promise((ok) => setTimeout(() => ok(false), 3000))]).catch(() => false);
  }
  async function apagarEstacao(id) { await db.collection("estacoes").doc(id).delete(); }   // só o moderador

  // ---------- moderador (login por e-mail e senha do Firebase Authentication) ----------
  const entrar = (email, senha) => auth.signInWithEmailAndPassword(email, senha);
  const sair = () => auth.signOut();
  const aoMudarLogin = (fn) => (auth ? auth.onAuthStateChanged(fn) : fn(null));

  return { disponivel: !!db, configLocal, atualizarConfig, ouvirConfig, salvarConfig, encerrarRodada, novaRodada, historico, idDaEstacao, informarEstacao, rodadaDoJogo, ouvirEstacoes, apagarEstacao, nomeEmUso, resumir, apagarPartida, salvarPartida, enviarFila, partidasDaRodada, ouvirRodada, ouvirRecorde, apagarRecorde, entrar, sair, aoMudarLogin };
})();

// Pontos para MOSTRAR: o banco guarda sempre os pontos reais (total e maximo); com "Nota de 0 a 100" ligada no painel,
// a tela converte na hora (total ÷ maximo × 100). Por isso o interruptor pode ser mudado a qualquer momento.
function pontos(p) {
  if (!p) return 0;
  return CONFIG_ATUAL().nota100 && p.maximo ? Math.round((p.total / p.maximo) * 100) : p.total;
}
const CONFIG_ATUAL = () => Banco.configLocal();

// Título divertido conforme o aproveitamento (0 a 1)
const TITULOS = [            // [aproveitamento mínimo (0 a 1), título] — do maior para o menor
  [0.97, "Mestre das Cores"],
  [0.90, "Especialista em Cor"],
  [0.82, "Artista"],
  [0.74, "Olho Clínico"],
  [0.65, "Designer"],
  [0.55, "Caçador de Cores"],
  [0.40, "Aprendiz"],
  [0, "Curioso"],
];
function tituloDoJogador(frac) {
  return (TITULOS.find(([min]) => frac >= min) || TITULOS[TITULOS.length - 1])[1];
}
