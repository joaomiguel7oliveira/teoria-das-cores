const app = document.getElementById("app");
const estado = { apelido: "", nivel: "normal", pontos: 0, indice: 0 };

// Telas das perguntas usam o tema claro; as demais, o escuro
function tema(claro) { document.body.classList.toggle("tema-claro", claro); }

function esc(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function hsl(h, s, l) {
  return `hsl(${((h % 360) + 360) % 360}, ${s}%, ${l}%)`;
}

// Devolve [fundo, cor A, cor B, cor C] para o tipo de harmonia
function paleta(tipo, h) {
  switch (tipo) {
    case "complementar": return [hsl(h, 30, 94), hsl(h, 75, 50), hsl(h + 180, 75, 50), hsl(h, 60, 25)];
    case "analoga": return [hsl(h, 30, 94), hsl(h, 70, 50), hsl(h + 30, 70, 52), hsl(h - 30, 70, 45)];
    case "triade": return [hsl(h, 25, 95), hsl(h, 70, 52), hsl(h + 120, 65, 48), hsl(h + 240, 65, 52)];
    case "tetradica": return [hsl(h, 25, 95), hsl(h, 70, 52), hsl(h + 90, 65, 48), hsl(h + 180, 65, 52)];
    default: return [hsl(h, 40, 94), hsl(h, 60, 25), hsl(h, 60, 50), hsl(h, 60, 75)];
  }
}

function cenaSVG(tipo, h) {
  const [bg, a, b, c] = paleta(tipo, h);
  return `<svg class="cena" viewBox="0 0 400 240" role="img" aria-label="Composição de cores">
    <rect width="400" height="240" fill="${bg}"/>
    <circle cx="110" cy="120" r="80" fill="${a}"/>
    <rect x="190" y="50" width="130" height="140" rx="14" fill="${b}"/>
    <polygon points="290,210 350,110 380,210" fill="${c}"/>
    <circle cx="240" cy="205" r="20" fill="${a}"/>
    <circle cx="60" cy="30" r="14" fill="${c}"/>
  </svg>`;
}

// Ângulos (graus, 0 = topo) dos pontos de cada harmonia no círculo
const ANGULOS = {
  analoga: [-30, 0, 30],
  complementar: [0, 180],
  triade: [0, 120, 240],
  tetradica: [-60, 60, 120, 240],
};

// Desenho sem cor: círculo com os pontos (e a figura que os liga) de cada harmonia
function diagramaSVG(tipo) {
  const c = 50, r = 38;
  const pt = (a) => [c + r * Math.sin((a * Math.PI) / 180), c - r * Math.cos((a * Math.PI) / 180)];
  let forma = "";
  if (tipo === "monocromatica") {
    // um só matiz: um ponto na borda e tons (pontos menores) em direção ao centro
    const [x, y] = pt(0);
    forma = `<line x1="${c}" y1="${c}" x2="${x}" y2="${y}" class="d-linha"/>
      <circle cx="${c}" cy="${c - r * 0.35}" r="4" class="d-ponto"/>
      <circle cx="${c}" cy="${c - r * 0.68}" r="5" class="d-ponto"/>
      <circle cx="${x}" cy="${y}" r="6" class="d-ponto"/>`;
  } else {
    const pts = ANGULOS[tipo].map(pt);
    const lista = pts.map((p) => p.join(",")).join(" ");
    forma = (pts.length === 2 ? `<polyline points="${lista}" class="d-linha"/>` : pts.length === 3 && tipo === "analoga"
      ? `<polyline points="${lista}" class="d-linha"/>` : `<polygon points="${lista}" class="d-linha d-vazio"/>`)
      + pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" class="d-ponto"/>`).join("");
  }
  return `<svg class="diagrama" viewBox="0 0 100 100" aria-hidden="true"><circle cx="${c}" cy="${c}" r="${r}" class="d-roda"/>${forma}</svg>`;
}

// Cor (RGB) -> matiz/saturação/luminosidade (HSL), com h em graus
function rgbParaHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, l = (max + min) / 2;
  if (!d) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: ((h * 60) + 360) % 360, s, l };
}
function tituloPara(pontos) {
  return [...TITULOS].reverse().find((t) => pontos >= t.min).nome;
}

function ranking(nivel) {
  try { return JSON.parse(localStorage.getItem("ranking_" + nivel)) || []; } catch { return []; }
}

function salvarRanking(nivel, entrada) {
  const lista = ranking(nivel).concat(entrada).sort((x, y) => y.pontos - x.pontos).slice(0, 10);
  try { localStorage.setItem("ranking_" + nivel, JSON.stringify(lista)); } catch {}
  return lista;
}

function telaInicial() {
  tema(false);
  // Galeria de fundo: todas as imagens do jogo, repetidas para o loop ser contínuo
  const fotos = Object.values(NIVEIS).flatMap((n) => (n.fase1 || []).map((q) => q.imagem)).filter(Boolean);
  const galeria = Array.from({ length: 4 }, () => fotos).flat().map((src) => `<img src="${src}" alt="">`).join("");
  app.innerHTML = `<div class="splash" id="splash" role="button" tabindex="0" aria-label="Iniciar jogo">
    <div class="galeria" aria-hidden="true"><div class="galeria-trilho">${galeria}</div></div>
    <div class="splash-evento"><b>Mundo<br>SENAI</b></div>
    <div class="roda-cena">
      <div class="roda-inclina" id="inclina">
        <div class="roda-brilho"></div>
        <div class="roda"></div>
        <div class="roda-fina"></div>
      </div>
      <div class="splash-titulo">
        <h1>Teoria<br>das Cores</h1>
        <div class="splash-cta">Iniciar Jogo</div>
      </div>
    </div>
  </div>`;
  const splash = document.getElementById("splash");
  const inclina = document.getElementById("inclina");
  splash.addEventListener("mousemove", (e) => {
    const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
    inclina.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`;
  });
  let saiu = false;
  const iniciar = () => {
    if (saiu) return;
    saiu = true;
    splash.classList.add("saindo");
    setTimeout(telaNome, 550);
  };
  splash.addEventListener("click", iniciar);
  splash.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") iniciar(); });
  splash.focus();
}

// Progresso por nome (guardado no navegador): quais níveis o jogador já concluiu bem
function chaveProgresso(nome) {
  return "progresso_" + nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function lerProgresso(nome) {
  try { return JSON.parse(localStorage.getItem(chaveProgresso(nome))) || {}; } catch { return {}; }
}

function salvarProgresso(nome, progresso) {
  try { localStorage.setItem(chaveProgresso(nome), JSON.stringify(progresso)); } catch {}
}

function nivelLiberado(id, progresso) {
  const requer = NIVEIS[id].requer;
  return !requer || !!progresso[requer];
}

// Segunda página: só o nome e o botão de continuar
function telaNome() {
  tema(false);
  app.innerHTML = `<div class="tela-nome">
    <input id="nome" type="text" maxlength="14" placeholder="Digite seu nome" autocomplete="off" aria-label="Seu nome">
    <button class="btn" id="continuar" disabled>Continuar</button>
  </div>`;
  const campo = document.getElementById("nome");
  const botao = document.getElementById("continuar");
  const seguir = () => {
    const nome = campo.value.trim();
    if (!nome) return;
    estado.apelido = nome;
    telaNivel();
  };
  campo.addEventListener("input", () => { botao.disabled = !campo.value.trim(); });
  campo.addEventListener("keydown", (e) => { if (e.key === "Enter") seguir(); });
  botao.addEventListener("click", seguir);
  campo.focus();
}

// Terceira página: escolha do nível
function telaNivel() {
  tema(false);
  // Difícil abre para quem foi bem no Normal; Mais difícil, para quem foi bem no Difícil (por nome)
  const progresso = lerProgresso(estado.apelido);
  const ids = Object.keys(NIVEIS);
  estado.nivel = [...ids].reverse().find((id) => nivelLiberado(id, progresso));
  app.innerHTML = `<div class="tela-nome">
    <div class="niveis">
      ${ids.map((id) => {
        const n = NIVEIS[id], aberto = nivelLiberado(id, progresso);
        return `<button class="nivel ${id === estado.nivel ? "sel" : ""}" data-nivel="${id}" ${aberto ? "" : "disabled"}>
          ${n.nome}<small>${aberto ? n.descricao : "Conclua bem o nível " + NIVEIS[n.requer].nome}</small>
        </button>`;
      }).join("")}
    </div>
    <button class="btn" id="comecar">Começar</button>
  </div>`;
  app.querySelectorAll(".nivel").forEach((b) => b.addEventListener("click", () => {
    estado.nivel = b.dataset.nivel;
    app.querySelectorAll(".nivel").forEach((x) => x.classList.toggle("sel", x === b));
  }));
  document.getElementById("comecar").addEventListener("click", () => {
    estado.pontos = 0; estado.indice = 0;
    telaIntroFase1();
  });
}

// Título da seção, no meio da tela, antes da primeira pergunta
function telaIntroFase1() {
  tema(false);
  app.innerHTML = `<div class="fase-intro" id="fase-intro" role="button" tabindex="0" aria-label="Iniciar">
    <h1>Combinações harmônicas</h1>
    <div class="splash-cta">Iniciar</div>
  </div>`;
  const tela = document.getElementById("fase-intro");
  let saiu = false;
  const iniciar = () => {
    if (saiu) return;
    saiu = true;
    tela.classList.add("saindo");
    setTimeout(perguntaFase1, 500);
  };
  tela.addEventListener("click", iniciar);
  tela.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") iniciar(); });
  tela.focus();
}

// Círculo cromático de 12 cores, só para consulta durante o jogo
const RODA_12 = ["#fe2712", "#fc600a", "#fb9902", "#fccc1a", "#fefe33", "#b2d732", "#66b032", "#347c98", "#0247fe", "#4424d6", "#8601af", "#c21460"];

const MATIZES_RODA = RODA_12.map((hex) => rgbParaHsl([1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))).h);

// Ângulo (graus, 0 = topo) onde a cor cai no círculo cromático
function anguloNaRoda(h) {
  const base = MATIZES_RODA[0];
  const hh = h < base ? h + 360 : h;
  let i = 11;
  for (let k = 0; k < 12; k++) if (MATIZES_RODA[k] <= hh) i = k;
  const ini = MATIZES_RODA[i] < base ? MATIZES_RODA[i] + 360 : MATIZES_RODA[i];
  const prox = (i + 1) % 12;
  const fim = prox === 0 ? base + 360 : MATIZES_RODA[prox];
  return (i + (hh - ini) / (fim - ini)) * 30;
}

function rodaConsultaHTML(info = "") {
  const c = 100, r1 = 92, r2 = 50, passo = Math.PI / 6;
  const p = (r, a) => [c + r * Math.sin(a), c - r * Math.cos(a)].map((v) => v.toFixed(2)).join(" ");
  const fatias = RODA_12.map((cor, i) => {
    const a0 = i * passo - passo / 2, a1 = a0 + passo;
    return `<path d="M${p(r1, a0)} A${r1} ${r1} 0 0 1 ${p(r1, a1)} L${p(r2, a1)} A${r2} ${r2} 0 0 0 ${p(r2, a0)} Z" fill="${cor}" stroke-width="1.5"/>`;
  }).join("");
  return `<aside class="consulta" aria-label="Círculo cromático para consulta">
    ${info}
    <svg viewBox="0 0 200 200" role="img" aria-label="Círculo cromático">${fatias}
      <g class="marcador" id="marcador"><circle class="m-fora" cx="100" cy="29" r="14"/><circle class="m-anel" cx="100" cy="29" r="11"/><circle class="m-cor" id="marcador-cor" cx="100" cy="29" r="8"/></g>
    </svg>
    <p class="rotulo">Círculo cromático<br><span>só para consulta</span></p>
  </aside>`;
}

// Faixas de matiz (de 10 em 10 graus) que fazem parte da composição principal da imagem:
// as que, somadas às vizinhas, têm pelo menos FILTRO_RUIDO das cores com saturação (0 desliga o filtro)
function huesPrincipais(px) {
  if (!FILTRO_RUIDO) return null;
  const hist = new Array(36).fill(0);
  let total = 0;
  for (let i = 0; i < px.length; i += 4) {
    const hsl = rgbParaHsl([px[i], px[i + 1], px[i + 2]]);
    if (hsl.s < 0.12 || hsl.l < 0.08 || hsl.l > 0.95) continue;
    hist[Math.floor(hsl.h / 10) % 36]++;
    total++;
  }
  const set = new Set();
  for (let i = 0; i < 36; i++) {
    const soma = hist[(i + 35) % 36] + hist[i] + hist[(i + 1) % 36];
    if (hist[i] && soma >= FILTRO_RUIDO * total) set.add(i);
  }
  return set;
}

// Ao passar o mouse sobre a imagem, mostra no círculo cromático onde cai a cor sob o cursor
function ligarSeletorDeCor(foto) {
  const marcador = document.getElementById("marcador");
  const corMarcador = document.getElementById("marcador-cor");
  let ctx = null, w = 0, h = 0, angulo = null, principais = null;
  const preparar = () => {
    try {
      const k = Math.min(1, 500 / Math.max(foto.naturalWidth, foto.naturalHeight));
      const cv = document.createElement("canvas");
      w = cv.width = Math.max(1, Math.round(foto.naturalWidth * k));
      h = cv.height = Math.max(1, Math.round(foto.naturalHeight * k));
      ctx = cv.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(foto, 0, 0, w, h);
      principais = huesPrincipais(ctx.getImageData(0, 0, w, h).data); // falha se a imagem não puder ser lida
    } catch { ctx = null; }
  };
  if (foto.complete) preparar(); else foto.addEventListener("load", preparar);
  foto.classList.add("seletor");

  const esconder = () => marcador.classList.remove("ativo");
  foto.addEventListener("mouseleave", esconder);
  foto.addEventListener("mousemove", (e) => {
    if (!ctx) return;
    // a imagem usa object-fit: contain, então descarta as faixas vazias ao redor
    const r = foto.getBoundingClientRect();
    const k = Math.min(r.width / foto.naturalWidth, r.height / foto.naturalHeight);
    const dw = foto.naturalWidth * k, dh = foto.naturalHeight * k;
    const x = (e.clientX - r.left - (r.width - dw) / 2) / dw;
    const y = (e.clientY - r.top - (r.height - dh) / 2) / dh;
    if (x < 0 || x > 1 || y < 0 || y > 1) return esconder();
    const px = Math.min(w - 3, Math.max(0, Math.floor(x * w) - 1)), py = Math.min(h - 3, Math.max(0, Math.floor(y * h) - 1));
    const d = ctx.getImageData(px, py, 3, 3).data; // média de 3x3 pixels, para não oscilar com ruído
    const rgb = [0, 1, 2].map((c) => Math.round([...Array(9).keys()].reduce((t, i) => t + d[i * 4 + c], 0) / 9));
    const hsl = rgbParaHsl(rgb);
    if (hsl.s < 0.12 || hsl.l < 0.08 || hsl.l > 0.95) return esconder(); // preto, branco e cinzas não têm lugar na roda
    if (principais && !principais.has(Math.floor(hsl.h / 10) % 36)) return esconder(); // ruído: cor que não faz parte da composição principal
    const alvo = anguloNaRoda(hsl.h);
    // gira pelo caminho mais curto, sem dar a volta inteira ao cruzar o topo
    angulo = angulo === null ? alvo : angulo + ((alvo - angulo + 540) % 360) - 180;
    corMarcador.style.fill = `rgb(${rgb.join(",")})`;
    marcador.style.transform = `rotate(${angulo}deg)`;
    marcador.classList.add("ativo");
  });
}

function perguntaFase1() {
  tema(true);
  const nivel = NIVEIS[estado.nivel];
  const q = nivel.fase1[estado.indice];
  // Fase, pontos e progresso ficam no painel ao lado do cartão
  const infoJogo = `<div class="info">
    <p class="rotulo">Fase 1</p>
    <div class="info-nome">Combinações</div>
    <div class="info-pontos"><b>${estado.pontos}</b> pts · ${nivel.nome}</div>
    <div class="passos">${nivel.fase1.map((_, i) => `<i class="${i <= estado.indice ? "feito" : ""}"></i>`).join("")}</div>
  </div>`;
  app.innerHTML = `<div class="jogo"><div class="card">
    ${q.imagem ? `<img class="foto" src="${q.imagem}" alt="Imagem de referência">` : cenaSVG(q.certa, q.hue)}
    <div class="opcoes">
      ${(q.opcoes || Object.keys(HARMONIAS)).map((o) => `<button class="opcao" data-op="${o}">${diagramaSVG(o)}<span>${HARMONIAS[o].rotulo}</span></button>`).join("")}
    </div>
    <div class="feedback-area" id="retorno"></div>
    <button class="btn" id="confirmar" disabled>Escolha uma opção</button>
  </div>${rodaConsultaHTML(infoJogo)}</div>`;

  const foto = app.querySelector(".foto");
  if (foto && nivel.paleta) ligarSeletorDeCor(foto);

  let escolhida = null;
  const confirmar = document.getElementById("confirmar");
  app.querySelectorAll(".opcao").forEach((b) => b.addEventListener("click", () => {
    escolhida = b.dataset.op;
    app.querySelectorAll(".opcao").forEach((x) => x.classList.toggle("sel", x === b));
    confirmar.disabled = false;
    confirmar.textContent = "Confirmar";
  }));
  let respondida = false;
  confirmar.addEventListener("click", () => {
    if (!respondida) { respondida = true; responder(escolhida); return; }
    if (estado.indice === nivel.fase1.length - 1) telaResultado(); else { estado.indice += 1; perguntaFase1(); }
  });

  function responder(escolha) {
    const acertou = escolha === q.certa;
    const ganho = acertou ? PONTOS_FASE.fase1 / nivel.fase1.length : 0;
    const antes = estado.pontos;
    estado.pontos += ganho;
    const botaoEscolhido = app.querySelector(`.opcao[data-op="${escolha}"]`);
    app.querySelectorAll(".opcao").forEach((b) => {
      b.disabled = true;
      if (b.dataset.op === q.certa) b.classList.add("certa");
      else if (b.dataset.op === escolha) b.classList.add("errada");
    });
    const ultima = estado.indice === nivel.fase1.length - 1;
    const selo = acertou
      ? `<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`
      : `<svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7L7 17"/></svg>`;
    document.getElementById("retorno").innerHTML =
      `<div class="feedback ${acertou ? "ok" : "erro"}"><span class="selo">${selo}</span><span><strong>${acertou ? "Acertou! +" + ganho : "Quase!"}</strong> ${HARMONIAS[q.certa].dica}</span></div>`;
    confirmar.textContent = ultima ? "Continuar" : "Próxima";
    efeitoResposta(acertou, botaoEscolhido, ganho, antes);
  }
}

// Feedback imersivo: clarão de cor na tela, fundo que muda de cor, partículas, pontos flutuantes e tremor
function efeitoResposta(acertou, botao, ganho, antes) {
  const reduzir = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cartao = app.querySelector(".jogo > .card");
  const classe = acertou ? "ok" : "erro";
  cartao.classList.add(acertou ? "acertou" : "errou");
  document.body.classList.add("fb-" + classe);
  setTimeout(() => document.body.classList.remove("fb-ok", "fb-erro"), 1600);

  const clarao = document.createElement("div");
  clarao.className = "clarao " + classe;
  document.body.append(clarao);
  setTimeout(() => clarao.remove(), 1200);
  if (!acertou || reduzir || !botao) return;

  const r = botao.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < 34; i++) {
    const p = document.createElement("i");
    p.className = "particula";
    const tam = 5 + Math.random() * 7;
    p.style.cssText = `left:${cx}px;top:${cy}px;width:${tam}px;height:${tam}px;background:${RODA_12[i % 12]}`;
    document.body.append(p);
    const ang = Math.random() * Math.PI * 2, dist = 70 + Math.random() * 170;
    p.animate(
      [{ transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
       { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist - 40}px)) scale(.2)`, opacity: 0 }],
      { duration: 800 + Math.random() * 600, easing: "cubic-bezier(.15,.7,.3,1)" }
    ).onfinish = () => p.remove();
  }
  const mais = document.createElement("div");
  mais.className = "ponto-flutua";
  mais.textContent = "+" + ganho;
  mais.style.cssText = `left:${cx}px;top:${cy}px`;
  document.body.append(mais);
  mais.animate(
    [{ transform: "translate(-50%,-50%) scale(.6)", opacity: 0 },
     { transform: "translate(-50%,-90px) scale(1.15)", opacity: 1, offset: .35 },
     { transform: "translate(-50%,-140px) scale(1)", opacity: 0 }],
    { duration: 1300, easing: "ease-out" }
  ).onfinish = () => mais.remove();

  // pontos no painel lateral sobem de forma animada
  const marcador = app.querySelector(".info-pontos b");
  if (marcador) {
    const t0 = performance.now();
    marcador.classList.add("salta");
    const passo = (t) => {
      const k = Math.min(1, (t - t0) / 700);
      marcador.textContent = Math.round(antes + (ganho * k * (2 - k)));
      if (k < 1) requestAnimationFrame(passo); else marcador.classList.remove("salta");
    };
    requestAnimationFrame(passo);
  }
}

function telaResultado() {
  tema(false);
  // Fases 2 e 3 ainda não construídas: o resultado reflete só a Fase 1.
  const lista = salvarRanking(estado.nivel, { apelido: estado.apelido, pontos: estado.pontos });
  const progresso = lerProgresso(estado.apelido);
  const foiBem = estado.pontos >= APROVACAO * PONTOS_DISPONIVEIS;
  let liberou = null;
  if (foiBem && !progresso[estado.nivel]) {
    progresso[estado.nivel] = true;
    salvarProgresso(estado.apelido, progresso);
    liberou = Object.values(NIVEIS).find((n) => n.requer === estado.nivel);
  }
  // Top 5 (e a posição do jogador, se ficou fora dele) para a tela caber sem rolagem
  const minha = lista.findIndex((e) => e.apelido === estado.apelido && e.pontos === estado.pontos);
  const linha = (e, i) => `<li class="${i === minha ? "eu" : ""}"><span>${i + 1}</span><span>${esc(e.apelido)}</span><span>${e.pontos}</span></li>`;
  const linhas = lista.slice(0, 5).map(linha).join("") + (minha >= 5 ? linha(lista[minha], minha) : "");
  app.innerHTML = `<div class="tela-nome resultado">
    <div class="res-jogador">
      <p class="res-nome">${esc(estado.apelido)}</p>
      <p class="res-rotulo">Pontuação</p>
      <div class="pontos">${estado.pontos}<small>/100</small></div>
      <div class="titulo-final">${tituloPara(estado.pontos)}</div>
      ${liberou ? `<p class="res-libera">Nível ${liberou.nome} liberado</p>` : ""}
      <button class="btn" id="novo">Jogar de novo</button>
    </div>
    <div class="res-ranking">
      <p class="rotulo">Ranking · ${NIVEIS[estado.nivel].nome}</p>
      <ol>${linhas}</ol>
    </div>
  </div>`;
  document.getElementById("novo").addEventListener("click", telaInicial);
}

telaInicial();
