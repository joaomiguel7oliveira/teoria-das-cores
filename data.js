// Conteúdo do jogo, separado do código. Cada nível tem suas próprias fases.
// Fase 1 (harmonia): a cena é gerada a partir de um matiz base (hue) e do tipo de harmonia correta.

const HARMONIAS = {
  analoga: { rotulo: "Análoga", dica: "Cores vizinhas no círculo cromático combinam de forma suave e calma." },
  monocromatica: { rotulo: "Monocromática", dica: "Uma só cor com tons claros e escuros dá unidade e elegância." },
  complementar: { rotulo: "Complementar", dica: "Cores opostas no círculo cromático criam contraste forte e vibrante." },
  triade: { rotulo: "Tríade", dica: "Três cores igualmente espaçadas dão variedade com equilíbrio." },
  tetradica: { rotulo: "Tetrádica", dica: "Quatro cores, em dois pares de opostas, dão uma paleta rica e variada." },
};

// A pontuação do jogo inteiro vai de 0 a 100, dividida entre as fases.
const PONTOS_FASE = { fase1: 30, fase2: 30, fase3: 40 };

const TITULOS = [
  { min: 0, nome: "Olho Curioso" },
  { min: 40, nome: "Aprendiz de Cor" },
  { min: 75, nome: "Diretor de Arte" },
];

// Para liberar o nível seguinte, o jogador precisa fazer pelo menos esta fração dos pontos disponíveis.
// Atualize PONTOS_DISPONIVEIS quando as Fases 2 e 3 existirem (hoje só a Fase 1 vale pontos).
const APROVACAO = 0.7;
const PONTOS_DISPONIVEIS = PONTOS_FASE.fase1;

// Assistência do círculo cromático: ignora cores que ocupam menos que esta fração das cores da imagem
// (ruído que não faz parte da composição principal). Use 0 para desligar.
const FILTRO_RUIDO = 0.07;

// "requer": nível que o jogador (identificado pelo nome) precisa ter concluído bem para liberar este.
// "paleta": se a ajuda de cores (a cor sob o mouse aparece no círculo cromático) fica ativa.
const NIVEIS = {
  normal: {
    nome: "Normal",
    descricao: "Para quem está começando",
    paleta: true,
    fase1: [
      // Sem "opcoes", a pergunta mostra todas as harmonias de HARMONIAS.
      { imagem: "img/h1_complementar.jpg", certa: "complementar" },
      { imagem: "img/h2_analoga.jpg", certa: "analoga" },
      { imagem: "img/h3_triade.jpg", certa: "triade" },
      { imagem: "img/h4_monocromatica.jpg", certa: "monocromatica" },
      { imagem: "img/h5_tetradica.jpg", certa: "tetradica" },
    ],
  },
  dificil: {
    nome: "Difícil",
    descricao: "Para quem já tem um olho treinado",
    requer: "normal",
    paleta: true,
    fase1: [
      { imagem: "img/d1_complementar.jpg", certa: "complementar" },
      { imagem: "img/d2_analoga.jpg", certa: "analoga" },
      { imagem: "img/d3_triade.jpg", certa: "triade" },
      { imagem: "img/d4_monocromatica.jpg", certa: "monocromatica" },
      { imagem: "img/d5_complementar.jpg", certa: "complementar" },
    ],
  },
  maisDificil: {
    nome: "Mais difícil",
    descricao: "Sem ajuda de cores",
    requer: "dificil",
    paleta: false,
    fase1: [
      { imagem: "img/m1_analoga.jpg", certa: "analoga" },
      { imagem: "img/m2_complementar.jpg", certa: "complementar" },
      { imagem: "img/m3_monocromatica.jpg", certa: "monocromatica" },
      { imagem: "img/m4_triade.jpg", certa: "triade" },
      { imagem: "img/m5_complementar.jpg", certa: "complementar" },
    ],
  },
};
