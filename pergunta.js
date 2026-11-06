// Etapas depois de "Confirmar" nos protótipos de ajustar cores:
//   1) resultado: a nota na tela e a versão do aluno lado a lado com a imagem original;
//   2) pergunta: ao clicar em "Continuar", a imagem original desliza para o centro da tela e, embaixo dela,
//      com as amostras das cores originais, o aluno clica na combinação de cores (harmonia).
// Uso, no fim de confirmar():
//   mostrarResultado({ nota, mensagem, sua, original, cores, harmonia, proxima })
//     sua / original: endereço (URL ou data URL) de cada imagem; cores: lista de cores CSS da imagem original.
// E em reiniciar(): fecharPergunta()

const HARMONIAS_PERGUNTA = {
  complementar: { rotulo: "Complementar", dica: "Cores opostas no círculo cromático criam contraste forte e vibrante." },
  analoga: { rotulo: "Análoga", dica: "Cores vizinhas no círculo cromático combinam de forma suave e calma." },
  triade: { rotulo: "Tríade", dica: "Três cores igualmente espaçadas no círculo dão variedade com equilíbrio." },
  monocromatica: { rotulo: "Monocromática", dica: "Uma só cor com tons claros e escuros dá unidade e elegância." },
  // (Tetrádica fora da lista: nenhuma fase tem essa resposta e ela se confundia com a Quadrada)
  quadrada: { rotulo: "Quadrada", dica: "Quatro cores igualmente espaçadas no círculo, formando um quadrado." },
};

// Desenho sem cor: círculo com os pontos de cada harmonia (o mesmo do jogo)
function diagramaHarmonia(tipo) {
  const c = 50, r = 38, ang = { analoga: [-30, 0, 30], complementar: [0, 180], triade: [0, 120, 240], tetradica: [-60, 60, 120, 240], quadrada: [0, 90, 180, 270] };
  const pt = (a) => [c + r * Math.sin((a * Math.PI) / 180), c - r * Math.cos((a * Math.PI) / 180)];
  let forma;
  if (tipo === "monocromatica") {
    const [x, y] = pt(0);
    forma = `<line x1="${c}" y1="${c}" x2="${x}" y2="${y}" class="d-linha"/><circle cx="${c}" cy="${c - r * 0.35}" r="4" class="d-ponto"/><circle cx="${c}" cy="${c - r * 0.68}" r="5" class="d-ponto"/><circle cx="${x}" cy="${y}" r="6" class="d-ponto"/>`;
  } else {
    const pts = ang[tipo].map(pt), lista = pts.map((p) => p.join(",")).join(" ");
    forma = (pts.length === 2 || tipo === "analoga" ? `<polyline points="${lista}" class="d-linha"/>` : `<polygon points="${lista}" class="d-linha"/>`)
      + pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" class="d-ponto"/>`).join("");
  }
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="${c}" cy="${c}" r="${r}" class="d-roda"/>${forma}</svg>`;
}

(function estilo() {
  const s = document.createElement("style");
  s.textContent = `
  .fora-da-etapa { display: none !important; }
  .etapa { display: flex; flex-direction: column; gap: clamp(10px, 2.2vh, 18px); }
  .rotulo-etapa { margin: 0; font-size: .7rem; letter-spacing: .18em; text-transform: uppercase; color: var(--muted); }
  .etapa > .rotulo-etapa:first-child, .nota-bloco > .rotulo-etapa { font-size: .95rem; font-weight: 800; letter-spacing: .14em; color: var(--ink); }   /* "Pontuação" mais legível */
  .etapa .placar { display: flex; align-items: baseline; gap: 6px; line-height: 1; }
  .etapa .placar b { font-size: clamp(3.4rem, 9vh, 5rem); font-weight: 800; letter-spacing: -.04em; font-variant-numeric: tabular-nums; }
  .etapa .placar span { font-size: 1.2rem; font-weight: 600; color: var(--muted); }
  .etapa .placar.ok b { color: var(--ok); } .etapa .placar.perto b { color: #8a6a1f; } .etapa .placar.erro b { color: var(--bad); }
  .etapa .msg { margin: 0; font-size: .95rem; line-height: 1.45; }
  /* retorno por canal: tabela compacta (cor × matiz / saturação / luminosidade) */
  .canais { display: flex; flex-direction: column; gap: 8px; }
  .canais-linha { display: grid; grid-template-columns: 92px minmax(0, 1fr) 42px; gap: 12px; align-items: center; }
  .barra { height: 8px; border-radius: 99px; background: var(--line); overflow: hidden; }
  .barra b { display: block; height: 100%; border-radius: inherit; }
  .barra b { background: var(--ink); }   /* barras neutras, sem cor de acerto/erro */
  .taxa { font-size: .85rem; font-weight: 800; text-align: right; font-variant-numeric: tabular-nums; color: var(--ink); }
  .canais-cor { display: flex; align-items: center; gap: 7px; min-width: 0; font-size: .78rem; font-weight: 700; text-transform: capitalize; overflow-wrap: anywhere; line-height: 1.15; }
  .canais-cor i { flex: none; width: 16px; height: 16px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(0,0,0,.1); }
  .questao p.credito { margin: 0; text-align: center; }
  .comparar figcaption .credito, .questao .credito { display: block; margin-top: 4px; font-size: .68rem; letter-spacing: 0; text-transform: none; font-weight: 400; color: var(--muted); }
  .etapa .botoes, .questao .botoes { display: flex; flex-direction: column; gap: 10px; align-items: center; margin-top: 4px; }
  .comparar { width: 100%; height: 100%; min-height: 0; display: flex; gap: clamp(10px, 2vw, 22px); }
  .comparar figure { flex: 1; min-width: 0; min-height: 0; margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; }
  .comparar img { display: block; min-height: 0; max-width: 100%; max-height: calc(100% - 48px); width: auto; height: auto; border-radius: 4px; box-shadow: 0 0 0 1px var(--line); }
  .comparar figcaption { text-align: center; font-size: .7rem; letter-spacing: .18em; text-transform: uppercase; color: var(--muted); }
  .comparar figure.original figcaption { color: var(--ink); font-weight: 700; }
  .palco.saindo { transition: opacity .3s ease; opacity: 0; }

  /* pergunta: imagem original no centro da tela e a questão embaixo dela */
  /* a imagem fica menor (até ~36% da altura) e o bloco da questão ganha prioridade e tamanho */
  .questao { flex: 1; min-height: 0; width: 100%; max-width: 760px; align-self: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: clamp(12px, 2.6vh, 24px); margin-top: clamp(4px, 1vh, 10px); }
  .questao .foto-q { flex: 0 1 auto; height: clamp(130px, 36vh, 340px); min-height: 0; width: 100%; display: flex; justify-content: center; }
  .questao .foto-q img { display: block; max-width: 100%; max-height: 100%; width: auto; height: auto; border-radius: 4px; box-shadow: 0 0 0 1px var(--line); }
  .questao .resto { width: 100%; display: flex; flex-direction: column; gap: clamp(10px, 2.2vh, 18px); }
  .questao .resto.entra > * { animation: q-entra .45s ease both; }
  .questao .resto.entra > :nth-child(2) { animation-delay: .08s; } .questao .resto.entra > :nth-child(3) { animation-delay: .16s; } .questao .resto.entra > :nth-child(n+4) { animation-delay: .24s; }
  @keyframes q-entra { from { opacity: 0; transform: translateY(10px); } }
  .questao .enunciado { margin: 0; text-align: center; font-size: clamp(1.15rem, 2.8vh, 1.5rem); font-weight: 800; letter-spacing: -.01em; line-height: 1.3; }
  .questao .cores { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  /* amostras em destaque: gota redonda de guache molhado sobre a superfície (SVG feito em guacheSVG) */
  .questao .paleta { display: flex; gap: clamp(14px, 2.4vw, 26px); justify-content: center; }
  .questao .paleta figure { margin: 0; display: flex; flex-direction: column; align-items: center; gap: 6px; width: clamp(78px, 13vh, 112px); }
  .questao .paleta .guache { display: block; width: 100%; height: auto; overflow: visible; }
  .questao .paleta figcaption { font-size: .78rem; font-weight: 700; line-height: 1.2; text-align: center; color: var(--ink); text-transform: capitalize; overflow-wrap: anywhere; }

  /* progresso do jogo, no topo: um segmento por imagem; o da imagem atual enche conforme a etapa */
  .progresso { position: fixed; left: 50%; bottom: clamp(8px, 1.6vh, 16px); transform: translateX(-50%); z-index: 5; display: flex; flex-direction: column; align-items: center; gap: 6px; color: var(--ink); font-size: .68rem; text-transform: uppercase; pointer-events: none; }
  body { padding-bottom: clamp(44px, 7vh, 60px) !important; }   /* espaço para o progresso embaixo */
  .progresso .segs { display: flex; gap: 4px; }
  .progresso .seg { width: clamp(28px, 4vw, 44px); height: 6px; border-radius: 99px; background: var(--line); overflow: hidden; }
  .progresso .seg b { display: block; height: 100%; width: 0; background: var(--ink); border-radius: inherit; transition: width .6s ease; }
  .progresso .seg.feito b { width: 100%; }
  .progresso .conta { font-weight: 700; letter-spacing: .12em; }

  /* o aluno não pode pular imagens: o "Passar" só existe no menu do protótipo (canto inferior direito) */
  #passar { display: none !important; }
  /* ao arrastar os sliders, o mouse não seleciona os textos (a seleção travava o arraste) */
  .esquerda, .painel, .amostras, .cena, .questao { -webkit-user-select: none; user-select: none; }
  .painel input[type=range] { touch-action: none; cursor: pointer; }
  #nota { display: none !important; }
  /* reflexo sobre a cor da amostra selecionada */
  .quadro canvas.reflexo { position: absolute; inset: 0; width: 100% !important; height: 100% !important; pointer-events: none; mix-blend-mode: screen; opacity: .85; box-shadow: none !important; border-radius: 4px; }
  .cena svg .brilha { animation: brilha-svg 2.6s ease-in-out infinite; }
  @keyframes brilha-svg { 0%, 60%, 100% { filter: brightness(1); } 30% { filter: brightness(1.35); } }
  /* comando da tela de ajuste: linha de cima do palco, ocupando as duas colunas */
  .palco { grid-template-rows: auto minmax(0, 1fr); }
  .comando { margin: 0; font-size: clamp(.95rem, 2.2vh, 1.1rem); font-weight: 700; letter-spacing: -.005em; }
  .esquerda > .comando { margin-bottom: -4px; }
  .titulo-ajuste { grid-column: 1 / -1; order: -2; margin: 0; text-align: center; }
  /* título da etapa: discreto, só para situar (não chama atenção) */
  .titulo-ajuste, .titulo-etapa { font-size: .72rem; font-weight: 600; letter-spacing: .18em; text-transform: uppercase; color: var(--muted); }
  /* logo do evento, em cinza, no canto durante o jogo */
  /* canto superior esquerdo: nome do jogo · direito: marca do evento */
  .nome-jogo { position: fixed; top: 28px; left: 32px; z-index: 4; margin: 0; display: flex; align-items: center; gap: 10px; font: 800 1.2rem/1 "Helvetica Neue", Helvetica, Arial, sans-serif; letter-spacing: -.02em; color: #16181d; pointer-events: none; }
  .marca-jogo { position: fixed; top: 28px; right: 32px; text-align: right; z-index: 4; margin: 0; font: italic 900 1.5rem/.95 var(--sans); letter-spacing: -.01em; text-transform: uppercase; color: #b3afa6; pointer-events: none; }
  .marca-jogo .local { font-weight: 400; }
  .marca-jogo .curso { display: block; margin-top: .6em; font-size: .5em; font-weight: 600; letter-spacing: .12em; }
  @media (max-width: 1100px) { .marca-jogo, .nome-jogo { display: none; } }
  .relogio-questao { top: 96px !important; }   /* o relógio do tempo limite fica abaixo da marca do evento */
  /* modo simulação: cursor de mentira e aviso discreto no topo */
  .cursor-sim { position: fixed; z-index: 60; width: 26px; height: 26px; margin: -3px 0 0 -5px; pointer-events: none; filter: drop-shadow(0 2px 3px rgba(0,0,0,.25)); }
  .cursor-sim svg { width: 100%; height: 100%; transition: transform .12s; }
  .cursor-sim.clique svg { transform: scale(.85); }
  .cursor-sim.clique::after { content: ""; position: absolute; left: -9px; top: -9px; width: 26px; height: 26px; border-radius: 50%; border: 2px solid rgba(22,24,29,.35); animation: fb-pop .4s ease-out; }
  .aviso-sim { position: fixed; top: 12px; left: 50%; transform: translateX(-50%); z-index: 55; padding: 6px 14px; border-radius: 99px; background: var(--ink); color: #fff; font: 600 .72rem var(--sans); letter-spacing: .08em; pointer-events: none; animation: pulsa-aviso 2.4s ease-in-out infinite; }
  @keyframes pulsa-aviso { 50% { opacity: .55; } }   /* a pontuação aparece só na tela de resultado, não no canto superior direito */

  /* troca de tela com fade: a página entra e sai suavemente */
  body { animation: tela-entra .45s ease both; }
  body.tela-saindo { animation: tela-sai .4s ease forwards; }
  @keyframes tela-entra { from { opacity: 0; } }
  @keyframes tela-sai { to { opacity: 0; } }
  .questao .ops { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
  .questao .op { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: clamp(8px, 1.6vh, 14px) 4px; background: #fff; border: 1px solid var(--line); border-radius: 8px; font: 700 clamp(.74rem, 1.7vh, .88rem) var(--sans); color: var(--ink); cursor: pointer; transition: border-color .15s, background .15s; }
  .questao .op:hover:not(:disabled) { border-color: var(--ink); }
  .questao .op.sel { border-color: var(--ink); box-shadow: inset 0 0 0 1px var(--ink); background: #ecebe6; }
  .questao .btn:disabled { opacity: .35; cursor: default; }
  .questao .op:disabled { cursor: default; opacity: .5; }
  .questao .op.certa { opacity: 1; border-color: var(--ok); box-shadow: inset 0 0 0 1px var(--ok); background: #e6f1ea; }
  .questao .op.errada { opacity: 1; border-color: var(--bad); box-shadow: inset 0 0 0 1px var(--bad); background: #f7e6e1; }
  .questao .op svg { width: clamp(32px, 6.4vh, 52px); height: clamp(32px, 6.4vh, 52px); }
  .questao .d-roda { fill: none; stroke: #c8c4ba; stroke-width: 3; }
  .questao .d-linha { fill: none; stroke: var(--ink); stroke-width: 2.5; stroke-linejoin: round; }
  .questao .d-ponto { fill: var(--ink); }
  .questao .resp { margin: 0; text-align: center; font-size: .92rem; line-height: 1.4; min-height: 2.8em; transition: opacity .4s; }
  .questao .botoes { margin-top: 0; }
  .questao .resp.some { opacity: 0; }
  /* a marcação (verde/vermelha) entra e sai com fade: borda, fundo, opacidade e o desenho */
  .questao .op { transition: border-color .6s, background-color .6s, box-shadow .6s, opacity .6s; }
  .questao .op svg * { transition: stroke .6s, fill .6s; }
  .questao .resp b.ok { color: var(--ok); } .questao .resp b.erro { color: var(--bad); }
  .imagem-voando { position: fixed; z-index: 10; margin: 0; border-radius: 4px; box-shadow: 0 0 0 1px rgba(0,0,0,.08); pointer-events: none; }   /* a sombra do voo é animada em voar() */

  /* tela de resultado: imagens em cima, pontuação embaixo, tudo centralizado */
  .resultado { flex: 1; min-height: 0; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: clamp(12px, 2.6vh, 26px); transition: opacity .3s ease; }
  .resultado.saindo { opacity: 0; }
  /* as figuras ficam do tamanho da imagem e juntas no centro (imagens verticais não ficam distantes) */
  .resultado .comparar { width: 100%; max-width: 860px; height: min(44vh, 400px); flex: none; justify-content: center; gap: clamp(16px, 3vw, 32px); }
  .resultado .comparar figure { flex: 0 1 auto; height: 100%; }
  .resultado .etapa { max-width: 520px !important; column-gap: clamp(24px, 4vw, 44px) !important; }

  /* contagem regressiva (no lugar dos botões Continuar e Próxima) */
  .relogio-questao { position: fixed; top: 24px; right: 28px; z-index: 6; animation: relogio-entra .4s ease both; transition: opacity .3s; }
  @keyframes relogio-entra { from { opacity: 0; transform: translateY(-8px); } }
  .relogio-questao .contagem { width: 54px; height: 54px; }
  .relogio-questao.acabando .anel { background: conic-gradient(#b4452f calc(var(--p, 1) * 1turn), var(--line) 0); }
  .relogio-questao.acabando b { color: #b4452f; }
  .relogio-questao.saindo { opacity: 0; }
  .tempo-esgotado { margin: 0; text-align: center; font-weight: 800; color: #b4452f; letter-spacing: .04em; }
  .contagem { position: relative; width: 46px; height: 46px; display: grid; place-items: center; }
  .contagem .anel { position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(var(--ink) calc(var(--p, 1) * 1turn), var(--line) 0); -webkit-mask: radial-gradient(circle, transparent 58%, #000 60%); mask: radial-gradient(circle, transparent 58%, #000 60%); }
  .contagem b { font-size: 1rem; font-weight: 800; font-variant-numeric: tabular-nums; }

  /* personagens sobre fundo branco: sem moldura, e o branco se mistura com o fundo (multiplicar) */
  html.fundo-branco { background: var(--bg); }   /* assim o body pinta o próprio fundo e o "multiplicar" mistura com ele */
  .fundo-branco .cena canvas, .fundo-branco .comparar img, .fundo-branco .foto-q img, .fundo-branco .imagem-voando { box-shadow: none !important; border-radius: 0 !important; mix-blend-mode: multiply; }
  .resultado.montando .etapa, .resultado.montando figure.original { opacity: 0; }
  .resultado.montando figure:not(.original) img { visibility: hidden; }
  .resultado .etapa, .resultado figure.original { transition: opacity .45s ease; }
  .resultado .etapa { width: 100%; max-width: 560px; display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; column-gap: clamp(20px, 4vw, 40px); row-gap: 14px; }
  .resultado .nota-bloco { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .resultado .etapa .canais { max-width: none; }
  .resultado .etapa .botoes { grid-column: 1 / -1; min-height: 46px; }   /* espaço da contagem já reservado: nada se mexe quando ela aparece */
  @media (max-width: 560px) { .questao .ops { grid-template-columns: repeat(3, 1fr); } }

  /* layout "lado": imagem à esquerda e o bloco da questão à direita */
  .questao.lado { flex-direction: row; flex-wrap: wrap; align-content: center; justify-content: center; max-width: 980px; gap: clamp(18px, 3vh, 32px) clamp(24px, 4vw, 52px); }
  /* título da pergunta: no alto do conteúdo, centralizado na tela */
  .questao .titulo-questao { flex: 0 0 100%; margin: 0; text-align: center; display: flex; flex-direction: column; gap: 6px; }
  .questao .titulo-questao p { margin: 0; }
  .questao .titulo-questao .comando { font-size: clamp(1.5rem, 4.2vh, 2.2rem); font-weight: 800; letter-spacing: -.015em; }
  .questao .titulo-questao.entra { animation: q-entra .45s ease both; }
  .questao.lado .foto-q { flex: 0 0 auto; width: auto; max-width: 46%; height: min(50vh, 420px); align-items: center; justify-content: center; }   /* só a largura da imagem: o conjunto fica centralizado */
  .questao.lado .resto { flex: 0 1 460px; min-width: 340px; align-items: center; }   /* paleta, pergunta, opções e botão centralizados entre si */
  .questao.lado .ops { display: flex; flex-wrap: wrap; justify-content: center; width: 100%; }   /* 3 + 2, a segunda linha centralizada */
  .questao.lado .op { flex: 0 0 calc((100% - 20px) / 3); }

  /* imagem da pergunta com a legenda (crédito) logo abaixo */
  .questao .foto-q { flex-direction: column; }
  .questao.lado .foto-q { align-items: center; justify-content: center; }
  .foto-fig { margin: 0; height: 100%; max-width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; }
  .foto-fig img { max-height: 100%; }
  .foto-fig.com-legenda img { max-height: calc(100% - 26px); }
  .foto-fig .credito { margin: 0; text-align: center; }
  /* legenda abaixo da imagem também na tela de ajuste */
  .legenda-imagem { position: absolute; left: 0; right: 0; top: calc(100% + 6px); margin: 0; text-align: center; font-size: .68rem; color: var(--muted); }

  /* botão e painel do círculo cromático de consulta */
  .abre-roda, .fecha-roda { align-self: center; padding: 4px 6px; border: 0; background: none; font: 600 .8rem var(--sans); color: var(--muted); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
  .abre-roda:hover, .fecha-roda:hover { color: var(--ink); }
  .questao .abre-roda { margin-top: -6px; }
  .roda-consulta { position: fixed; inset: 0; z-index: 40; display: grid; place-items: center; background: rgba(243,241,236,.86); backdrop-filter: blur(3px); cursor: pointer; animation: tela-entra .2s ease both; }   /* a tela inteira esbranquiça */
  .roda-consulta.saindo { animation: tela-sai .2s ease forwards; }
  .roda-cartao { position: relative; display: grid; place-items: center; }
  .roda-cartao .fecha-roda { position: absolute; padding: 10px; text-decoration: none; }   /* X no centro do círculo */
  .roda-cartao .fecha-roda svg { display: block; width: 30px; height: 30px; stroke: var(--ink); stroke-width: 2.2; stroke-linecap: round; fill: none; }
  .roda-cartao svg { width: min(72vmin, 360px); height: auto; }
  .roda-cartao .bolinhas circle { filter: drop-shadow(0 1.5px 1.5px rgba(0,0,0,.18)); }

  /* pontuação centralizada */
  .etapa { align-items: center; text-align: center; }
  .etapa .placar { justify-content: center; }
  .etapa .canais { width: 100%; max-width: 320px; }
  .etapa .canais-cor { text-align: left; }

  /* amostras da tela de ajuste: cartão (trecho + cor atual juntos), a selecionada em destaque e as outras apagadas */
  .amostras { gap: 12px !important; }
  .amostra { gap: 0 !important; opacity: .5; transition: opacity .2s; }   /* sem deslocamento (transform): em alguns PCs ele fazia a faixa de cor falhar no desenho */
  .amostra:hover { opacity: .85; }
  .amostra.sel { opacity: 1; }
  .amostra canvas, .amostra .alvo { border-radius: 8px 8px 0 0 !important; outline: 0 !important; }
  .amostra .atual { height: 10px !important; border-radius: 0 0 8px 8px !important; box-shadow: none !important; }
  .amostra.sel canvas, .amostra.sel .alvo { box-shadow: 0 0 0 3px var(--ink); }
  .amostra.sel .atual { box-shadow: 0 0 0 3px var(--ink) !important; }
  .amostra .rot { display: none; }
  .amostra .nome-amostra { margin-top: 6px; font-size: .72rem; font-weight: 700; text-align: center; text-transform: capitalize; color: var(--ink); }
  @media (max-width: 760px) {
    .questao.lado { flex-direction: column; }
    .questao.lado .foto-q { height: clamp(130px, 36vh, 340px); flex: 0 1 auto; }
    .questao.lado .resto { min-width: 0; }
  }

  /* feedback visual: clarão nas bordas da tela, partículas, pontos que sobem, tremor e destaque */
  .fb-clarao { position: fixed; inset: 0; z-index: 20; pointer-events: none; opacity: 0; animation: fb-clarao 1.2s ease-out forwards; }
  .fb-clarao.ok { background: radial-gradient(circle at 50% 50%, rgba(23,210,124,0) 30%, rgba(23,210,124,.45) 100%); }
  .fb-clarao.perto { background: radial-gradient(circle at 50% 50%, rgba(240,170,30,0) 30%, rgba(240,170,30,.42) 100%); }
  .fb-clarao.erro { background: radial-gradient(circle at 50% 50%, rgba(255,74,58,0) 25%, rgba(255,74,58,.5) 100%); }
  @keyframes fb-clarao { 12% { opacity: 1; } 100% { opacity: 0; } }
  .fb-particula { position: fixed; z-index: 21; border-radius: 50%; pointer-events: none; }
  .fb-flutua { position: fixed; z-index: 22; pointer-events: none; font: 800 2rem var(--sans); letter-spacing: -.03em; color: var(--ok); text-shadow: 0 2px 14px rgba(255,255,255,.9); white-space: nowrap; }
  .fb-treme { animation: fb-treme .5s ease-in-out; }
  .fb-pop { animation: fb-pop .6s cubic-bezier(.2,1.7,.4,1); }
  @keyframes fb-treme { 0%, 100% { transform: translateX(0); } 18% { transform: translateX(-10px); } 36% { transform: translateX(9px); } 54% { transform: translateX(-6px); } 72% { transform: translateX(4px); } }
  @keyframes fb-pop { 45% { transform: scale(1.12); } }
  .comparar figure img { transition: box-shadow .4s; }
  .comparar figure.ok img { box-shadow: 0 0 0 3px var(--ok), 0 0 40px rgba(23,210,124,.45); }
  .comparar figure.perto img { box-shadow: 0 0 0 3px #d39a1c, 0 0 40px rgba(240,170,30,.4); }
  .comparar figure.erro img { box-shadow: 0 0 0 3px var(--bad), 0 0 40px rgba(255,74,58,.35); }
  .questao .op.certa svg .d-linha, .questao .op.certa svg .d-ponto { stroke: var(--ok); } .questao .op.certa svg .d-ponto { fill: var(--ok); }
  .questao .op.errada svg .d-linha, .questao .op.errada svg .d-ponto { stroke: var(--bad); } .questao .op.errada svg .d-ponto { fill: var(--bad); }`;
  document.head.append(s);

})();

let etapaDados = null;

// ---------- amostra de cor: gota de guache molhado ----------
// Silhueta suave e levemente irregular (cada amostra varia um pouco), sem textura. Camadas: sombra curta na superfície;
// a tinta (cor chapada); volume (borda um pouco mais escura); reflexo de tinta molhada.
function contornoGota(n) {
  // raio que varia devagar ao redor do centro (2 a 3 ondulações suaves); os parâmetros mudam com n
  const fase1 = n * 1.9 + 0.6, fase2 = n * 2.7 + 1.3, a1 = 0.045 + (n % 3) * 0.012, a2 = 0.03 + ((n + 1) % 2) * 0.015;
  const pts = Array.from({ length: 24 }, (_, k) => {
    const t = (k / 24) * Math.PI * 2, r = 40 * (1 + a1 * Math.sin(2 * t + fase1) + a2 * Math.sin(3 * t + fase2));
    return [50 + r * Math.cos(t), 50 + r * Math.sin(t)];
  });
  // curva fechada suave (Catmull-Rom convertida em Bézier)
  const p = (i) => pts[(i + pts.length) % pts.length], f = (v) => v.toFixed(2);
  let d = `M${f(p(0)[0])} ${f(p(0)[1])}`;
  for (let i = 0; i < pts.length; i++) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + "Z";
}
function guacheSVG(cor, n) {
  const id = "guache" + n, forma = contornoGota(n);
  return `<svg class="guache" viewBox="0 0 100 100" aria-hidden="true">
    <defs>
      <filter id="${id}-sombra" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.6"/></filter>
      <filter id="${id}-brilho" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="0.7"/></filter>
      <radialGradient id="${id}-volume" cx="46%" cy="42%" r="56%">
        <stop offset="0" stop-color="#fff" stop-opacity=".16"/>
        <stop offset=".62" stop-color="#fff" stop-opacity="0"/>
        <stop offset=".86" stop-color="#000" stop-opacity=".12"/>
        <stop offset="1" stop-color="#000" stop-opacity=".3"/>
      </radialGradient>
    </defs>
    <path d="${forma}" fill="#000" opacity=".2" transform="translate(1 5)" filter="url(#${id}-sombra)"/>
    <path d="${forma}" fill="${cor}"/>
    <path d="${forma}" fill="url(#${id}-volume)"/>
    <g filter="url(#${id}-brilho)" fill="#fff">
      <path d="M27 40 C 29 29, 38 22, 49 21 C 41 25, 34 31, 31 41 Z" opacity=".85"/>
      <ellipse cx="56" cy="23.5" rx="3.2" ry="1.8" opacity=".7"/>
      <path d="M70 72 C 66 76, 60 79, 53 80 C 60 77, 65 74, 69 69 Z" opacity=".28"/>
    </g>
  </svg>`;
}

// Layout da pergunta de combinação: "lado" = imagem à esquerda e questão à direita; "acima" = imagem em cima e questão embaixo
const LAYOUT_PERGUNTA = "lado";
// Tempo (segundos) que cada tela fica antes de passar sozinha: o resultado do HSB e a combinação depois de respondida
// Regras definidas pelo moderador no painel (banco.js guarda uma cópia no navegador: vale mesmo sem internet)
// cópia offline do site (sw.js): só quando publicado (http/https)
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
// Prévia para revisão (prototipo-*.html#previa=resultado | #previa=pergunta): ajusta as cores perto do certo e confirma sozinho;
// "resultado" para na tela de pontuação, "pergunta" segue até a harmonia. Ninguém está jogando, então nada é gravado.
const PREVIA_FASE = (location.hash.match(/previa=(\w+)/) || [])[1];
if (PREVIA_FASE === "resultado" || PREVIA_FASE === "pergunta") document.addEventListener("DOMContentLoaded", () => {
  const pronto = () => typeof GRUPOS !== "undefined" && GRUPOS.every((g) => g.alvoHsb);
  const ajustar = () => {
    if (!pronto()) return setTimeout(ajustar, 200);
    GRUPOS.forEach((g, i) => {
      selecionar(i);
      const t = g.alvoHsb, quase = { h: t.h + 6, s: Math.max(0, t.s - 5), b: Math.min(100, t.b + 4) };
      for (const c of ["h", "s", "b"]) { const el = document.getElementById(c); el.value = Math.round(quase[c]); el.dispatchEvent(new Event("input", { bubbles: true })); }
    });
    setTimeout(() => { if (!confirmada) confirmar(); }, 400);
  };
  setTimeout(ajustar, 500);
});
// sons (painel: "Sons"); carrega sons.js sem precisar mexer em cada prototipo-*.html. A demonstração fica muda.
document.head.append(Object.assign(document.createElement("script"), { src: "sons.js" }));
function som(nome) { if (typeof sim !== "undefined" && sim.ativo) return; window.Sons?.tocar(nome); }
const CFG = (() => { try { return JSON.parse(localStorage.getItem("config_jogo")) || {}; } catch { return {}; } })();
const TEMPO_RESULTADO = CFG.tempoResultado || 8, TEMPO_COMBINACAO = CFG.tempoCombinacao || 6;

// ---------- ordem das fases: embaralhada para cada aluno ----------
// Todas as imagens do jogo. Cada aluno joga numa ordem sorteada, para que colegas lado a lado não fiquem na mesma imagem.
// A ordem fica guardada na aba do navegador (sessionStorage): a fase em que o aluno entrou é a primeira, as outras são sorteadas.
// Ao terminar a última fase, uma nova partida começa com outra ordem sorteada.
const ORDEM_JOGO = ["prototipo-neve", "prototipo-casa", "prototipo-ninfeias", "prototipo-rita-lee", "prototipo-cacto",
  "prototipo-pooh", "prototipo-burger-king", "prototipo-snoopy", "prototipo-perry", "prototipo-victorias-secret", "prototipo-menina-afega", "prototipo-lego",
  "prototipo-bob-esponja", "prototipo-blade-runner", "prototipo-kung-fu-panda", "prototipo-picole", "prototipo-gumball", "prototipo-mario", "prototipo-ikea", "prototipo-a-sobremesa", "prototipo-batman", "prototipo-logan", "prototipo-concerto", "prototipo-natura-ekos", "prototipo-noite-estrelada", "prototipo-coca-cola", "prototipo-mondrian", "prototipo-superman"];
const paginaAtual = () => location.pathname.split("/").pop().replace(/\.html$/, "");

function embaralhar(lista) {
  for (let i = lista.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [lista[i], lista[j]] = [lista[j], lista[i]]; }
  return lista;
}
function guardarOrdem(ordem) { try { sessionStorage.setItem("ordem_fases", JSON.stringify(ordem)); } catch {} }
function ordemDaPartida() {
  let ordem = null;
  try { ordem = JSON.parse(sessionStorage.getItem("ordem_fases")); } catch {}
  const valida = Array.isArray(ordem) && ordem.length > 0 && ordem.every((p) => ORDEM_JOGO.includes(p)) && ordem.includes(paginaAtual());
  if (valida) return ordem;
  if (!ORDEM_JOGO.includes(paginaAtual())) return ORDEM_JOGO;
  ordem = [paginaAtual(), ...sortearFases().filter((p) => p !== paginaAtual())].slice(0, quantasFases());
  guardarOrdem(ordem);
  return ordem;
}
// fases que podem cair (as ativas no painel) e quantas cada pessoa joga
function fasesAtivas() { const a = (CFG.fasesAtivas || ORDEM_JOGO).filter((p) => ORDEM_JOGO.includes(p)); return a.length ? a : ORDEM_JOGO; }
function quantasFases() { return fasesAtivas().length; }   // todos jogam todas as fases marcadas no painel (jogo justo)
function sortearFases() { const l = [...fasesAtivas()]; return (CFG.sortear === false ? l : embaralhar(l)).slice(0, quantasFases()); }   // painel: sortear ou ordem fixa
const ORDEM_PARTIDA = ordemDaPartida();

// Endereço da próxima fase. Depois da última: quem está jogando vai para a tela final; a demonstração sorteia outra partida
let proximaEscolhida = null;
function proximaFase() {
  if (proximaEscolhida) return proximaEscolhida;
  const i = ORDEM_PARTIDA.indexOf(paginaAtual());
  if (i >= 0 && i < ORDEM_PARTIDA.length - 1) return (proximaEscolhida = ORDEM_PARTIDA[i + 1] + ".html");
  if (alguemJogando()) return (proximaEscolhida = "final.html");
  const nova = sortearFases();
  if (nova[0] === paginaAtual() && nova.length > 1) [nova[0], nova[nova.length - 1]] = [nova[nova.length - 1], nova[0]];   // não repete a imagem que acabou de ser jogada
  guardarOrdem(nova);
  return (proximaEscolhida = nova[0] + ".html");
}

// ---------- progresso do jogo ----------
const ETAPAS_PROGRESSO = { ajuste: 0.2, resultado: 0.55, pergunta: 0.8, respondida: 1 };   // quanto do segmento atual fica cheio

// fica na parte de baixo da tela, centralizado: as marcações e, abaixo delas, "Fase x de x"
function mostrarProgresso(etapa) {
  const atual = ORDEM_PARTIDA.indexOf(paginaAtual());
  if (atual < 0) return;
  let lugar = document.getElementById("progresso");
  if (!lugar) {
    lugar = document.createElement("div");
    lugar.id = "progresso"; lugar.className = "progresso"; lugar.setAttribute("aria-label", "Progresso do jogo");
    lugar.innerHTML = `<span class="segs">${ORDEM_PARTIDA.map((_, i) => `<span class="seg ${i < atual ? "feito" : ""}"><b></b></span>`).join("")}</span>
      <span class="conta">Fase ${atual + 1} de ${ORDEM_PARTIDA.length}</span>`;
    document.body.append(lugar);
  }
  const barra = lugar.querySelectorAll(".seg b")[atual];
  requestAnimationFrame(() => { barra.style.width = ETAPAS_PROGRESSO[etapa] * 100 + "%"; });
}
mostrarProgresso("ajuste");
// comando da tela de ajuste (HSB), no alto e centralizado, como o da pergunta de combinação
(function comandoDoAjuste() {
  const palco = document.querySelector(".palco");
  if (!palco || !document.getElementById("acao")) return;
  const p = document.createElement("p");
  p.className = "titulo-ajuste"; p.textContent = "Percepção de cor";
  palco.prepend(p);
  const c = document.createElement("p");
  c.className = "comando"; c.textContent = "Ajuste os níveis até igualar às amostras";
  document.querySelector(".esquerda")?.prepend(c);
})();
(function marcaDoEvento() { const m = document.createElement("p"); m.className = "marca-jogo"; m.setAttribute("aria-label", "Mundo SENAI, Sobradinho"); m.innerHTML = 'Mundo SENAI <span class="local">| Sobradinho</span><span class="curso">Técnico em Design Gráfico</span>'; document.body.append(m);
  document.body.insertAdjacentHTML("beforeend", '<p class="nome-jogo">Teoria das Cores</p>'); })();


// ---------- troca de tela com fade ----------
let saindoDaTela = false;
function irPara(url) {
  if (saindoDaTela) return;                                   // evita duas saídas (botão + passagem automática)
  saindoDaTela = true;
  document.body.classList.add("tela-saindo");
  setTimeout(() => { location.href = url; }, 400);
}
// ao voltar pelo histórico, a página pode vir da memória ainda apagada
addEventListener("pageshow", (e) => { if (e.persisted) { saindoDaTela = false; document.body.classList.remove("tela-saindo"); } });

// ---------- feedback visual ----------
const CORES_CONFETE = ["#fe2712", "#fc600a", "#fb9902", "#fccc1a", "#fefe33", "#b2d732", "#66b032", "#347c98", "#0247fe", "#4424d6", "#8601af", "#c21460"];

function reanimar(el, classe) {                                          // reinicia a animação mesmo se a classe já estava
  el.classList.remove(classe); void el.offsetWidth; el.classList.add(classe);
  setTimeout(() => el.classList.remove(classe), 900);
}

// tipo: "ok" | "perto" | "erro"; origem: elemento de onde saem as partículas; texto: o que sobe (ex.: "+85")
function efeitoFeedback(tipo, origem, texto) {
  som(tipo === "ok" ? "acerto" : tipo);
  const clarao = document.createElement("div");
  clarao.className = "fb-clarao " + tipo;
  document.body.append(clarao);
  setTimeout(() => clarao.remove(), 1300);
  if (!origem) return;
  if (tipo === "erro") return reanimar(origem, "fb-treme");
  reanimar(origem, "fb-pop");

  const r = origem.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const quantas = tipo === "ok" ? 40 : 14;
  for (let i = 0; i < quantas; i++) {
    const p = document.createElement("i"), tam = 5 + Math.random() * 7;
    p.className = "fb-particula";
    p.style.cssText = `left:${cx}px;top:${cy}px;width:${tam}px;height:${tam}px;background:${CORES_CONFETE[i % 12]}`;
    document.body.append(p);
    const ang = Math.random() * Math.PI * 2, dist = 70 + Math.random() * (tipo === "ok" ? 190 : 90);
    p.animate(
      [{ transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
       { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist - 40}px)) scale(.2)`, opacity: 0 }],
      { duration: 800 + Math.random() * 600, easing: "cubic-bezier(.15,.7,.3,1)" }
    ).onfinish = () => p.remove();
  }
  if (!texto) return;
  const sobe = document.createElement("div");
  sobe.className = "fb-flutua"; sobe.textContent = texto;
  if (tipo === "perto") sobe.style.color = "#b07d10";
  sobe.style.cssText += `;left:${cx}px;top:${cy}px`;
  document.body.append(sobe);
  sobe.animate(
    [{ transform: "translate(-50%,-50%) scale(.6)", opacity: 0 },
     { transform: "translate(-50%,-90px) scale(1.15)", opacity: 1, offset: .35 },
     { transform: "translate(-50%,-140px) scale(1)", opacity: 0 }],
    { duration: 1300, easing: "ease-out" }
  ).onfinish = () => sobe.remove();
}

// a nota sobe de 0 até o valor final; o efeito dispara quando ela chega
function contarNota(el, nota, aoTerminar) {
  const t0 = performance.now(), dur = 900;
  const passo = (t) => {
    const k = Math.min(1, (t - t0) / dur);
    el.textContent = Math.round(nota * k * (2 - k));
    if (k < 1) requestAnimationFrame(passo); else aoTerminar();
  };
  requestAnimationFrame(passo);
}

// Esconde o conteúdo normal de um lugar (lado esquerdo ou cena) e põe o da etapa no lugar dele
function ocuparLugar(lugar, id, classe) {
  [...lugar.children].forEach((el) => { if (el.id !== id) el.classList.add("fora-da-etapa"); });
  let box = document.getElementById(id);
  if (!box) { box = document.createElement("div"); box.id = id; box.className = classe; lugar.prepend(box); }
  box.classList.remove("fora-da-etapa");
  return box;
}

function figura(src, legenda, original, credito) {
  return `<figure class="${original ? "original" : ""}"><img src="${src}" alt="${legenda}"><figcaption>${legenda}${credito ? `<span class="credito">${credito}</span>` : ""}</figcaption></figure>`;
}

// ---------- créditos: só das imagens cuja origem dá para afirmar ----------
const CREDITOS = {
  "prototipo-ninfeias": "Pintura no estilo das <i>Ninfeias</i>, de Claude Monet",
  "prototipo-rita-lee": "Pôster sobre Rita Lee, cantora e compositora brasileira",
  "prototipo-pooh": "Ursinho Pooh, personagem de A. A. Milne (Disney)",
  "prototipo-burger-king": "Logotipo do Burger King",
  "prototipo-snoopy": "Snoopy e Woodstock, de Charles M. Schulz (<i>Peanuts</i>)",
  "prototipo-perry": "Perry, o Ornitorrinco (<i>Phineas e Ferb</i>, Disney)",
  "prototipo-victorias-secret": "Embalagens da Victoria's Secret",
  "prototipo-menina-afega": "<i>Menina afegã</i> (Sharbat Gula), foto de Steve McCurry, 1984",
  "prototipo-lego": "Logotipo da LEGO",
  "prototipo-bob-esponja": "Pôster de <i>Bob Esponja: Um Herói Fora d'Água</i> (Nickelodeon/Paramount, 2015)",
  "prototipo-blade-runner": "Pôster de <i>Blade Runner 2049</i> (2017)",
  "prototipo-kung-fu-panda": "Pôster de <i>Kung Fu Panda</i> (DreamWorks, 2008)",
  "prototipo-picole": "Anúncio do picolé Magnum Double Cherry",
  "prototipo-gumball": "Gumball e Darwin, de <i>O Incrível Mundo de Gumball</i> (Cartoon Network)",
  "prototipo-mario": "Mario, da Nintendo",
  "prototipo-ikea": "Logotipo da IKEA",
  "prototipo-a-sobremesa": "Henri Matisse, <i>A Sobremesa: Harmonia em Vermelho</i> (1908)",
  "prototipo-batman": "Pôster de <i>The Batman</i> (Warner Bros., 2022)",
  "prototipo-logan": "Pôster de <i>Logan</i> (20th Century Fox, 2017)",
  "prototipo-concerto": "Pôster de concerto da Philadelphia Young Artists Orchestra",
  "prototipo-natura-ekos": "Embalagens Natura Ekos Maracujá",
  "prototipo-noite-estrelada": "Vincent van Gogh, <i>A Noite Estrelada</i> (1889)",
  "prototipo-superman": "Superman (DC Comics)",
  "prototipo-coca-cola": "Logotipo da Coca-Cola",
  "prototipo-mondrian": "Piet Mondrian, <i>Composição II em Vermelho, Azul e Amarelo</i> (1930)",
};
// altura reservada embaixo da imagem da tela de ajuste para a legenda (usada no encaixar() de cada tela)
var LEGENDA_IMAGEM = CREDITOS[paginaAtual()] ? 26 : 0;
// personagens sobre fundo branco: sem moldura e em "multiplicar", para o branco se fundir com o fundo da página
const FUNDO_BRANCO = ["prototipo-pooh", "prototipo-perry", "prototipo-burger-king", "prototipo-gumball", "prototipo-mario", "prototipo-natura-ekos", "prototipo-coca-cola"];
if (FUNDO_BRANCO.includes(paginaAtual())) document.documentElement.classList.add("fundo-branco");

// contagem regressiva no lugar de um botão: anel que esvazia e os segundos no meio; ao fim, chama aoTerminar
function contagemRegressiva(lugar, segundos, aoTerminar) {
  if (PREVIA_FASE === "resultado") aoTerminar = () => {};      // prévia do resultado: a tela fica parada
  lugar.innerHTML = `<span class="contagem" role="timer" aria-live="off"><span class="anel"></span><b>${segundos}</b></span>`;
  const anel = lugar.querySelector(".anel"), num = lugar.querySelector("b"), t0 = performance.now(), total = segundos * 1000;
  const passo = (t) => {
    const falta = Math.min(total, Math.max(0, total - (t - t0)));   // o 1º quadro pode vir com horário anterior a t0
    anel.style.setProperty("--p", falta / total);
    num.textContent = Math.ceil(falta / 1000);
    if (falta > 0) requestAnimationFrame(passo); else aoTerminar();
  };
  requestAnimationFrame(passo);
}
// Tempo limite de cada questão (painel: "tempoAjuste" e "tempoHarmonia"; 0 = sem limite). Só para quem está jogando.
// Um relógio fixo no canto superior direito; nos últimos 5 s fica vermelho. Ao zerar, chama aoAcabar.
let pararRelogio = () => {};
function relogioQuestao(segundos, aoAcabar) {
  pararRelogio();
  if (!(segundos > 0) || !alguemJogando()) return;
  const el = document.createElement("div");
  el.className = "relogio-questao"; el.setAttribute("aria-label", "Tempo restante");
  el.innerHTML = `<span class="contagem"><span class="anel"></span><b>${segundos}</b></span>`;
  document.body.append(el);
  const anel = el.querySelector(".anel"), num = el.querySelector("b"), t0 = performance.now(), total = segundos * 1000;
  let vivo = true, ultimoTique = 0;
  const passo = (t) => {
    if (!vivo) return;
    const falta = Math.min(total, Math.max(0, total - (t - t0)));   // o 1º quadro pode vir com horário anterior a t0
    anel.style.setProperty("--p", falta / total); num.textContent = Math.ceil(falta / 1000);
    el.classList.toggle("acabando", falta <= 5000);
    const seg = Math.ceil(falta / 1000);
    if (falta > 0 && seg <= 5 && seg !== ultimoTique) { ultimoTique = seg; som("tique"); }   // tique nos últimos 5 s
    if (falta > 0) requestAnimationFrame(passo); else { pararRelogio(); aoAcabar(); }
  };
  requestAnimationFrame(passo);
  pararRelogio = () => { vivo = false; el.classList.add("saindo"); setTimeout(() => el.remove(), 300); pararRelogio = () => {}; };
}
document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("acao") || typeof confirmar !== "function") return;
  relogioQuestao(CFG.tempoAjuste, () => { if (!confirmada) confirmar(); });   // acabou o tempo: confirma as cores como estão
});
(function legendaNoAjuste() {
  const credito = CREDITOS[paginaAtual()], quadro = document.querySelector(".quadro");
  if (!credito || !quadro) return;
  const p = document.createElement("p");
  p.className = "legenda-imagem"; p.innerHTML = credito;
  quadro.append(p);
})();

// ---------- retorno por canal (HSB): o que ficou certo e o que ajustar em cada cor ----------
function hsbCss(h, s, b) {
  s /= 100; b /= 100; h = ((h % 360) + 360) % 360;
  const c = b * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = b - c;
  const [r, g, bl] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return `rgb(${[r, g, bl].map((v) => Math.round((v + m) * 255)).join(",")})`;
}
// Aproximação de cada cor: a nota da própria tela (notaDe), de 0 a 100%, com barra
function canaisHTML(grupos) {
  return `<div class="canais" aria-label="Aproximação de cada cor">
    ${grupos.map((g) => {
      const n = typeof notaDe === "function" ? notaDe(g) : 0, nivel = n >= 85 ? "ok" : n >= 60 ? "perto" : "erro";
      return `<div class="canais-linha">
        <span class="canais-cor"><i style="background:${hsbCss(g.alvoHsb.h, g.alvoHsb.s, g.alvoHsb.b)}"></i>${g.cor || g.nome}</span>
        <span class="barra ${nivel}"><b style="width:${n}%"></b></span>
        <span class="taxa ${nivel}">${n}%</span>
      </div>`;
    }).join("")}
  </div>`;
}

// Uma cópia da imagem "voa" de um lugar da tela para outro; a sombra cresce e some aos poucos durante o voo
function criarVoo(src, de) {
  const voando = document.createElement("img");
  voando.src = src; voando.alt = ""; voando.className = "imagem-voando";
  Object.assign(voando.style, { left: de.left + "px", top: de.top + "px", width: de.width + "px", height: de.height + "px" });
  document.body.append(voando);
  return voando;
}
function voar(voando, de, para, aoTerminar) {
  const SEM = "0 0 0 1px rgba(0,0,0,.08), 0 0 0 0 rgba(0,0,0,0)", COM = "0 0 0 1px rgba(0,0,0,.08), 0 18px 40px rgba(0,0,0,.18)";
  const caixa = (r, sombra, offset) => ({ left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px", boxShadow: sombra, ...(offset ? { offset } : {}) });
  const meio = { left: (de.left + para.left) / 2, top: (de.top + para.top) / 2, width: (de.width + para.width) / 2, height: (de.height + para.height) / 2 };
  voando.animate([caixa(de, SEM), caixa(meio, COM, 0.5), caixa(para, SEM)], { duration: 800, easing: "cubic-bezier(.45,0,.2,1)", fill: "forwards" }).onfinish = aoTerminar;
}

// Etapa 1: a imagem do ajuste voa para "Sua versão"; as duas imagens ficam em cima e a pontuação embaixo, tudo centralizado
// resultado de cada fase da partida (só de quem está jogando; a demonstração não grava)
function guardarResultado(parcial) {
  if (!alguemJogando()) return;
  let r = {}; try { r = JSON.parse(sessionStorage.getItem("resultados")) || {}; } catch {}
  r[paginaAtual()] = { ...(r[paginaAtual()] || {}), ...parcial };
  try { sessionStorage.setItem("resultados", JSON.stringify(r)); } catch {}
}
function mostrarResultado(dados) {
  pararRelogio();
  guardarResultado({ cor: dados.nota });
  etapaDados = dados;
  mostrarProgresso("resultado");
  const faixa = dados.nota >= 85 ? "ok" : dados.nota >= 60 ? "perto" : "erro";
  const palco = document.querySelector(".palco"), coluna = palco.parentElement;
  const imagemAjuste = document.querySelector(".cena canvas, .cena svg");
  const de = imagemAjuste.getBoundingClientRect();
  const voando = criarVoo(dados.sua, de);
  imagemAjuste.style.visibility = "hidden";
  palco.classList.add("saindo");

  setTimeout(() => {
    palco.classList.add("fora-da-etapa");
    const tela = document.createElement("div");
    tela.className = "resultado"; tela.id = "resultado";
    tela.innerHTML = `<div class="comparar" id="comparar">${figura(dados.sua, "Sua versão") + figura(dados.original, "Original", true, CREDITOS[paginaAtual()])}</div>
      <div class="etapa" id="etapa">
        <div class="nota-bloco"><p class="rotulo-etapa">Pontuação</p><div class="placar ${faixa}"><b>0</b><span>/ 100</span></div></div>
        ${dados.grupos ? canaisHTML(dados.grupos) : ""}
        <div class="botoes" id="etapa-tempo"></div>
      </div>`;
    coluna.append(tela);
    const sua = tela.querySelector("figure:not(.original)"), suaImg = sua.querySelector("img");
    tela.classList.add("montando");                                    // tudo invisível até a imagem pousar
    const pronto = () => voar(voando, de, suaImg.getBoundingClientRect(), () => {
      voando.remove();
      tela.classList.remove("montando");
      contagemRegressiva(document.getElementById("etapa-tempo"), TEMPO_RESULTADO, mostrarPergunta);   // sem botão: passa sozinho
      // feedback: a nota conta até o valor, a "Sua versão" ganha borda da cor do resultado, clarão e partículas (ou tremor)
      const placar = tela.querySelector(".placar");
      contarNota(placar.querySelector("b"), dados.nota, () => {
        sua.classList.add(faixa);
        efeitoFeedback(faixa, placar, faixa === "erro" ? "" : "+" + dados.nota);
      });
    });
    // mede o destino só depois que as duas imagens carregaram: a original, ao carregar, empurrava a "Sua versão" para o lado
    Promise.all([...tela.querySelectorAll("#comparar img")].map((i) => i.decode().catch(() => {}))).then(() => requestAnimationFrame(pronto));
  }, 300);
}

// Etapa 2: a imagem original vai para o centro da tela e a questão aparece embaixo dela
function mostrarPergunta() {
  const dados = etapaDados, certa = dados.harmonia;
  const palco = document.querySelector(".palco"), coluna = palco.parentElement, resultado = document.getElementById("resultado");
  const imgOriginal = document.querySelector("#comparar figure.original img");
  const de = imgOriginal.getBoundingClientRect();

  // uma cópia da imagem fica por cima, no mesmo lugar, enquanto o resto da tela some
  const voando = criarVoo(dados.original, de);
  imgOriginal.style.visibility = "hidden";
  resultado.classList.add("saindo");

  setTimeout(() => {
    resultado.remove();
    const q = document.createElement("div");
    q.className = "questao" + (LAYOUT_PERGUNTA === "lado" ? " lado" : ""); q.id = "questao";
    const credito = CREDITOS[paginaAtual()];
    q.innerHTML = `<div class="titulo-questao"><p class="titulo-etapa">Harmonias</p><p class="comando">Selecione a combinação apresentada</p></div>
      <div class="foto-q"><figure class="foto-fig${credito ? " com-legenda" : ""}"><img src="${dados.original}" alt="Imagem original">${credito ? `<figcaption class="credito">${credito}</figcaption>` : ""}</figure></div>
      <div class="resto">
        <div class="cores"><div class="paleta">${dados.cores.map((c, i) => `<figure>${guacheSVG(c.cor, i)}<figcaption>${c.nome}</figcaption></figure>`).join("")}</div></div>
        ${CFG.circulo === false ? "" : `<button class="abre-roda" id="abre-roda" type="button">Consultar círculo cromático</button>`}
        <div class="ops">${Object.keys(HARMONIAS_PERGUNTA).map((k) => `<button class="op" data-op="${k}">${diagramaHarmonia(k)}<span>${HARMONIAS_PERGUNTA[k].rotulo}</span></button>`).join("")}</div>
        <div class="botoes"><button class="btn" id="etapa-acao" disabled>Confirmar</button></div>
      </div>`;
    coluna.append(q);
    const resto = q.querySelector(".resto"), alvoImg = q.querySelector(".foto-q img");
    resto.style.visibility = "hidden";                                 // ocupa o espaço, para medir onde a imagem vai parar
    const titulo = q.querySelector(".titulo-questao"); titulo.style.visibility = "hidden";
    alvoImg.style.visibility = "hidden";

    const terminar = () => {
      alvoImg.style.visibility = ""; voando.remove();
      resto.style.visibility = ""; resto.classList.add("entra");       // as partes da questão entram em sequência
      titulo.style.visibility = ""; titulo.classList.add("entra");
      mostrarProgresso("pergunta");
      ligarQuestao(q, dados, certa);
    };
    const pronto = () => voar(voando, de, alvoImg.getBoundingClientRect(), terminar);   // vai direto para o lugar final
    alvoImg.complete ? pronto() : alvoImg.addEventListener("load", pronto, { once: true });
  }, 300);
}

// ---------- círculo cromático para consulta (na pergunta de combinação) ----------
// Um anel de 24 bolinhas: as 12 cores do círculo RYB (as mesmas do jogo) e, entre cada par vizinho, a mistura dos dois.
// Cores em etapas (sem degradê) e sem rótulos.
const RODA_RYB = ["#fe2712", "#fc600a", "#fb9902", "#fccc1a", "#fefe33", "#b2d732", "#66b032", "#347c98", "#0247fe", "#4424d6", "#8601af", "#c21460"];
const rgbDe = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
function rodaEtapasSVG() {
  const c = 150, R = 112, n = 24;
  const cores = RODA_RYB.flatMap((hex, i) => {
    const a = rgbDe(hex), b = rgbDe(RODA_RYB[(i + 1) % 12]);
    return [hex, `rgb(${a.map((v, k) => Math.round((v + b[k]) / 2)).join(",")})`];
  });
  const bolinhas = cores.map((cor, i) => {
    const ang = (i / n) * Math.PI * 2;
    return `<circle cx="${(c + R * Math.sin(ang)).toFixed(2)}" cy="${(c - R * Math.cos(ang)).toFixed(2)}" r="13" fill="${cor}"/>`;
  }).join("");
  return `<svg viewBox="0 0 300 300" role="img" aria-label="Círculo cromático"><g class="bolinhas">${bolinhas}</g></svg>`;
}
function iconeRoda() {
  return `<svg viewBox="0 0 20 20" aria-hidden="true">${RODA_RYB.map((h, i) => { const a0 = (i - .5) * Math.PI / 6, a1 = a0 + Math.PI / 6, p = (a) => `${(10 + 9 * Math.sin(a)).toFixed(2)} ${(10 - 9 * Math.cos(a)).toFixed(2)}`; return `<path d="M10 10 L${p(a0)} A9 9 0 0 1 ${p(a1)} Z" fill="${h}"/>`; }).join("")}<circle cx="10" cy="10" r="3.6" fill="#fff"/></svg>`;
}
function abrirRoda() {
  if (document.getElementById("roda-consulta")) return;
  const fundo = document.createElement("div");
  fundo.id = "roda-consulta"; fundo.className = "roda-consulta";
  fundo.innerHTML = `<div class="roda-cartao" role="dialog" aria-modal="true" aria-label="Círculo cromático">
      ${rodaEtapasSVG()}
      <button class="fecha-roda" type="button" id="fecha-roda" aria-label="Fechar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </div>`;
  document.body.append(fundo);
  const fechar = () => { fundo.classList.add("saindo"); setTimeout(() => fundo.remove(), 200); removeEventListener("keydown", tecla); };
  const tecla = (e) => { if (e.key === "Escape") fechar(); };
  fundo.addEventListener("click", fechar);   // clicar em qualquer lugar fecha
  addEventListener("keydown", tecla);
}

// Clicar numa opção só a seleciona; "Confirmar" corrige e vira "Próxima"
function ligarQuestao(q, dados, certa) {
  q.querySelector("#abre-roda")?.addEventListener("click", abrirRoda);
  const acao = q.querySelector("#etapa-acao"), ops = q.querySelectorAll(".op");
  let escolha = null, respondida = false;
  ops.forEach((b) => b.addEventListener("click", () => {
    if (!respondida) som("clique");
    escolha = b.dataset.op;
    ops.forEach((x) => x.classList.toggle("sel", x === b));
    acao.disabled = false;
  }));
  // tempo limite: ao zerar, confirma a opção marcada; sem nenhuma marcada, conta como erro e segue
  relogioQuestao(CFG.tempoHarmonia, () => {
    if (respondida) return;
    if (escolha) return acao.click();
    respondida = true;
    guardarResultado({ harmonia: false, escolha: null });
    ops.forEach((x) => { x.disabled = true; x.classList.remove("sel"); });
    acao.parentElement.insertAdjacentHTML("beforebegin", `<p class="tempo-esgotado">Tempo esgotado</p>`);
    contagemRegressiva(acao.parentElement, TEMPO_COMBINACAO, () => irPara(proximaFase()));
    mostrarProgresso("respondida");
  });
  acao.addEventListener("click", () => {
    if (respondida) return;
    if (!escolha) return;
    respondida = true;
    pararRelogio();
    const acertou = escolha === certa;
    guardarResultado({ harmonia: acertou, escolha });
    // só a opção escolhida é marcada (verde ou vermelha): ao errar, a resposta certa não é revelada
    const marcada = q.querySelector(`.op[data-op="${escolha}"]`);
    ops.forEach((x) => { x.disabled = true; x.classList.remove("sel"); });
    marcada.classList.add(acertou ? "certa" : "errada");
    contagemRegressiva(acao.parentElement, TEMPO_COMBINACAO, () => irPara(proximaFase()));   // o botão vira a contagem
    mostrarProgresso("respondida");
    // feedback só visual (sem texto): acerto = clarão verde e partículas saindo da opção; erro = clarão vermelho e a opção treme
    efeitoFeedback(acertou ? "ok" : "erro", marcada, "");
    // em laboratório, os colegas ao lado não devem ver a resposta: a marcação some depressa
    setTimeout(() => marcada.classList.remove("certa", "errada"), 1200);
  });
  if (sim.ativo) simularPergunta(q, certa).catch(() => {});
}

// ---------- modo simulação (demonstração para o estande) ----------
// Sem ninguém jogando, o jogo joga sozinho: um cursor mexe nos sliders (com erros e acertos variados), às vezes consulta
// o círculo, responde a combinação (nem sempre certo) e passa pelas fases sem parar.
// Um toque/clique de verdade leva à tela inicial (inicio.html) para a pessoa jogar.
// Só acontece na guia aberta pelo botão "Abrir demonstração" do painel (inicio.html#demo grava sessionStorage "demo" = "1",
// que vale só para aquela guia). Os PCs dos jogadores nunca entram em demonstração.
function simulacaoLigada() { if (window.top !== window) return false; try { return sessionStorage.getItem("demo") === "1"; } catch { return false; } }   // dentro de uma prévia (iframe), nunca
function alguemJogando() { try { return sessionStorage.getItem("jogando") === "1"; } catch { return false; } }
const sim = { ativo: false, cursor: null, habilidade: 0.5 };
const sorte = (a, b) => a + Math.random() * (b - a);
function esperar(ms) { return new Promise((ok, parar) => setTimeout(() => (sim.ativo ? ok() : parar("parou")), ms)); }

function cursorSim() {
  if (!sim.cursor) {
    const c = document.createElement("div");
    c.className = "cursor-sim"; c.setAttribute("aria-hidden", "true");
    c.innerHTML = `<svg viewBox="0 0 24 24"><path d="M4 2 L4 19 L8.6 14.9 L11.6 21.6 L14.6 20.3 L11.7 13.7 L18 13.4 Z" fill="#16181d" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
    c.style.left = innerWidth * 0.62 + "px"; c.style.top = innerHeight * 0.7 + "px";
    document.body.append(c); sim.cursor = c;
  }
  return sim.cursor;
}
async function moverCursor(x, y, ms) {
  const c = cursorSim();
  c.style.transition = `left ${ms}ms cubic-bezier(.45,.05,.25,1), top ${ms}ms cubic-bezier(.45,.05,.25,1)`;
  c.style.left = x + "px"; c.style.top = y + "px";
  await esperar(ms);
}
const centroDe = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2 + sorte(-6, 6), r.top + r.height / 2 + sorte(-4, 4)]; };
async function clicarSim(el) {
  const [x, y] = centroDe(el);
  await moverCursor(x, y, sorte(450, 850));
  sim.cursor.classList.add("clique"); await esperar(140); sim.cursor.classList.remove("clique");
  el.click();
  await esperar(sorte(200, 400));
}
async function arrastarSlider(input, alvo) {
  const min = +input.min, max = +input.max, r = input.getBoundingClientRect();
  const x = (v) => r.left + 15 + ((v - min) / (max - min)) * (r.width - 30), y = r.top + r.height / 2;
  await moverCursor(x(+input.value), y, sorte(350, 600));
  sim.cursor.classList.add("clique");
  const ini = +input.value, passos = Math.round(sorte(14, 24));
  for (let k = 1; k <= passos; k++) {
    const t = k / passos, e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;   // acelera e desacelera, como a mão
    const v = Math.round(ini + (alvo - ini) * e);
    input.value = v; input.dispatchEvent(new Event("input", { bubbles: true }));
    sim.cursor.style.transition = "none"; sim.cursor.style.left = x(v) + "px";
    await esperar(sorte(35, 70));
  }
  sim.cursor.classList.remove("clique");
  await esperar(sorte(150, 400));
}
// Tela de ajuste: para cada cor, leva os 3 sliders para perto da cor certa (mais longe quando a "pessoa" erra mais)
async function simularAjuste() {
  const limite = (v) => Math.max(0, Math.min(100, v));
  for (let k = 0; k < GRUPOS.length; k++) {
    await esperar(sorte(500, 1100));
    const t = GRUPOS[selecionado].alvoHsb, erro = 1 - sim.habilidade;
    const alvo = { h: ((t.h + sorte(-1, 1) * erro * 80) % 360 + 360) % 360, s: limite(t.s + sorte(-1, 1) * erro * 45), b: limite(t.b + sorte(-1, 1) * erro * 45) };
    for (const c of ["h", "s", "b"]) await arrastarSlider(document.getElementById(c), Math.round(alvo[c]));
    await clicarSim(document.getElementById("acao"));                // "Próxima cor" e, na última, "Confirmar"
  }
}
// Pergunta: às vezes consulta o círculo, às vezes hesita, e acerta conforme a habilidade
async function simularPergunta(q, certa) {
  await esperar(sorte(1200, 2200));
  if (Math.random() < 0.3) {
    await clicarSim(q.querySelector("#abre-roda"));
    await esperar(sorte(1500, 2500));
    await clicarSim(document.getElementById("roda-consulta"));
  }
  const ops = [...q.querySelectorAll(".op")], erradas = ops.filter((o) => o.dataset.op !== certa);
  const acerta = Math.random() < 0.35 + sim.habilidade * 0.55;
  const final = acerta ? q.querySelector(`.op[data-op="${certa}"]`) : erradas[Math.floor(Math.random() * erradas.length)];
  if (Math.random() < 0.35) { await clicarSim(ops[Math.floor(Math.random() * ops.length)]); await esperar(sorte(500, 1000)); }
  await clicarSim(final);
  await esperar(sorte(500, 1000));
  await clicarSim(q.querySelector("#etapa-acao"));
}
function pararSimulacao() {
  sim.ativo = false;
  sim.cursor?.remove(); sim.cursor = null;
  document.getElementById("aviso-sim")?.remove();
}
function iniciarSimulacao() {
  if (sim.ativo || !document.getElementById("acao")) return;
  sim.ativo = true;
  sim.habilidade = sorte(0.35, 1);                                    // cada fase, uma "pessoa" diferente
  const aviso = document.createElement("div");
  aviso.id = "aviso-sim"; aviso.className = "aviso-sim"; aviso.textContent = "Demonstração · toque na tela para jogar";
  document.body.append(aviso);
  // espera a imagem ficar pronta (a cor-chave de cada grupo é calculada ao carregar)
  const pronto = () => typeof GRUPOS !== "undefined" && GRUPOS.every((g) => g.alvoHsb) && document.getElementById("acao").textContent.trim();
  const comecar = () => (pronto() ? simularAjuste().catch(() => {}) : setTimeout(comecar, 200));
  setTimeout(comecar, 600);
}
// um toque de verdade durante a simulação: vai para a tela inicial (o menu ⋯ do protótipo não conta)
document.addEventListener("pointerdown", (e) => {
  if (!sim.ativo || !e.isTrusted || e.target.closest(".menu-prototipo")) return;
  e.preventDefault(); e.stopPropagation();
  pararSimulacao();
  irPara("inicio.html");
}, true);
// alguém jogando que abandonou o jogo: depois de um tempo parado, volta para a tela inicial
const TEMPO_ABANDONO = CFG.tempoAbandono || 90;   // segundos (painel)
if (alguemJogando()) {
  let parado = 0;
  ["pointerdown", "pointermove", "keydown", "input"].forEach((t) => addEventListener(t, () => { parado = 0; }, true));
  setInterval(() => { parado += 5; if (parado >= TEMPO_ABANDONO) { try { sessionStorage.removeItem("jogando"); } catch {} irPara("inicio.html"); } }, 5000);
}
if (simulacaoLigada() && !alguemJogando()) document.addEventListener("DOMContentLoaded", iniciarSimulacao);

// Volta à tela de ajuste (chamado pelo reiniciar() de cada tela)
// ---------- botão da tela de ajuste: "Próxima cor" até o aluno passar por todas as cores; depois, "Confirmar" ----------
// (usa GRUPOS, selecionado, confirmada e selecionar() de cada tela)
const coresVistas = new Set();
function atualizarBotaoAjuste() {
  const acao = document.getElementById("acao");
  if (!acao || typeof GRUPOS === "undefined" || confirmada) return;
  coresVistas.add(selecionado);
  acao.innerHTML = coresVistas.size >= GRUPOS.length ? "Confirmar" : "Próxima cor &rsaquo;";
}
// repinta a faixa de cor atual (e as amostras chapadas do cacto): protege contra desenho que falha em alguns PCs
function repintarAmostras() {
  if (typeof GRUPOS === "undefined") return;
  document.querySelectorAll(".amostra").forEach((el, i) => {
    try {
      const g = GRUPOS[i]; if (!g) return;
      const alvo = el.querySelector(".alvo"); if (alvo && g.alvo) alvo.style.background = g.alvo;
      if (typeof atualizarChip === "function" && el.querySelector(".atual")) atualizarChip(i);
    } catch {}
  });
}
addEventListener("load", () => { repintarAmostras(); setTimeout(repintarAmostras, 500); });
addEventListener("resize", repintarAmostras);
document.addEventListener("visibilitychange", () => { if (!document.hidden) repintarAmostras(); });
document.addEventListener("DOMContentLoaded", () => {
  if (typeof selecionar !== "function" || !document.getElementById("acao")) return;
  const selecionarDaTela = selecionar;
  selecionar = function (i) { selecionarDaTela(i); atualizarBotaoAjuste(); atualizarBrilho(); repintarAmostras(); };    // qualquer troca de amostra atualiza o botão, o reflexo e as faixas de cor
  // antes do clique chegar ao botão: enquanto faltar cor, ele só avança para a próxima cor ainda não vista
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#acao") || confirmada || coresVistas.size >= GRUPOS.length) return;
    e.stopPropagation();
    let prox = (selecionado + 1) % GRUPOS.length;
    while (coresVistas.has(prox)) prox = (prox + 1) % GRUPOS.length;
    selecionar(prox);
  }, true);
  atualizarBotaoAjuste();
  // nome da cor embaixo de cada amostra
  document.querySelectorAll(".amostra").forEach((el, i) => { if (GRUPOS[i] && !el.querySelector(".nome-amostra")) el.insertAdjacentHTML("beforeend", `<span class="nome-amostra">${GRUPOS[i].cor || GRUPOS[i].nome}</span>`); });
  if (GRUPOS[selecionado]?.lista || typeof tela === "undefined") atualizarBrilho();   // a imagem embutida pode carregar antes deste evento
});

// ---------- reflexo na cor da amostra selecionada (tela de ajuste) ----------
// Um brilho em degradê passa, de tempos em tempos, só sobre as áreas da imagem que pertencem à cor selecionada.
// Telas com foto: um canvas por cima da imagem, recortado pela "máscara" do grupo (o peso de cada pixel).
// Cacto (SVG): as formas do grupo pulsam de leve.
const brilho = { mascaras: new Map(), camada: null, quadro: 0 };
function mascaraDoGrupo(g) {
  if (!brilho.mascaras.has(g)) {
    const c = document.createElement("canvas"); c.width = tela.width; c.height = tela.height;
    const cx = c.getContext("2d"), im = cx.createImageData(c.width, c.height);
    for (const i of g.lista) { const p = i * 4; im.data[p] = im.data[p + 1] = im.data[p + 2] = 255; im.data[p + 3] = Math.round(g.peso[i] * 255); }
    cx.putImageData(im, 0, 0);
    brilho.mascaras.set(g, c);
  }
  return brilho.mascaras.get(g);
}
function atualizarBrilho() {
  if (typeof GRUPOS === "undefined") return;
  const g = GRUPOS[selecionado];
  if (typeof tela === "undefined" || !tela.getContext) {                       // cacto (SVG)
    document.querySelectorAll(".cena svg .brilha").forEach((el) => el.classList.remove("brilha"));
    g?.membros?.forEach((m) => document.querySelectorAll(".cena svg ." + m.c).forEach((el) => el.classList.add("brilha")));
    return;
  }
  if (!g || !g.lista || !tela.width) return;
  if (!brilho.camada) {
    brilho.camada = document.createElement("canvas");
    brilho.camada.className = "reflexo";
    tela.after(brilho.camada);
  }
  const camada = brilho.camada, ctx = camada.getContext("2d"), mascara = mascaraDoGrupo(g);
  camada.width = tela.width; camada.height = tela.height;
  cancelAnimationFrame(brilho.quadro);
  // o brilho passa logo que a cor é escolhida e depois só de vez em quando
  const t0 = performance.now(), DURACAO = 1400, INTERVALO = 12000;
  const passo = (t) => {
    ctx.clearRect(0, 0, camada.width, camada.height);
    if (typeof confirmada !== "undefined" && confirmada) return;            // depois de confirmar, sem reflexo
    const k = ((t - t0) % INTERVALO) / DURACAO;
    if (k <= 1) {
      const w = camada.width, h = camada.height, faixa = Math.max(w, h) * 0.22;
      const x = -faixa + k * (w + h + 2 * faixa);                            // atravessa na diagonal
      const grad = ctx.createLinearGradient(x - faixa, 0, x + faixa, faixa * 0.9);
      grad.addColorStop(0, "rgba(255,255,255,0)");
      grad.addColorStop(0.5, "rgba(255,255,255,.75)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "destination-in";                       // só fica onde a máscara da cor existe
      ctx.drawImage(mascara, 0, 0);
      ctx.globalCompositeOperation = "source-over";
    }
    brilho.quadro = requestAnimationFrame(passo);
  };
  brilho.quadro = requestAnimationFrame(passo);
}

function fecharPergunta() {
  coresVistas.clear();
  mostrarProgresso("ajuste");
  document.getElementById("questao")?.remove();
  document.getElementById("resultado")?.remove();
  document.querySelector(".cena canvas, .cena svg")?.style.removeProperty("visibility");
  document.querySelector(".palco")?.classList.remove("saindo");
  document.querySelectorAll(".fora-da-etapa").forEach((el) => el.classList.remove("fora-da-etapa"));
  ["etapa", "comparar"].forEach((id) => document.getElementById(id)?.classList.add("fora-da-etapa"));
}

// ---------- banco: atualiza as regras do moderador em segundo plano ----------
(function carregarBanco() {
  const scripts = ["https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js", "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js", "firebase-config.js", "banco.js"];
  const proximo = (i) => {
    if (i >= scripts.length) { try { Banco.atualizarConfig(); Banco.enviarFila(); } catch {} return; }
    const el = document.createElement("script"); el.src = scripts[i];
    el.onload = () => proximo(i + 1); el.onerror = () => {};                 // sem internet: segue com a cópia guardada
    document.head.append(el);
  };
  addEventListener("load", () => proximo(0));
})();
