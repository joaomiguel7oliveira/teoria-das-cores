// Sons curtos do jogo, sintetizados na hora (Web Audio): não precisa de arquivos e funciona abrindo direto (file://).
// Só tocam se o moderador ligar "Sons" no painel (config "sons", copiada pelo banco.js em localStorage "config_jogo").
// Uso: Sons.tocar("acerto" | "perto" | "erro" | "clique" | "tique" | "final")
const Sons = (() => {
  let ctx = null;
  const ligado = () => { try { return (JSON.parse(localStorage.getItem("config_jogo")) || {}).sons === true; } catch { return false; } };
  function audio() {
    if (!ctx) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; ctx = new A(); }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  // uma nota: frequência (Hz), início (s a partir de agora), duração (s), forma de onda e volume
  function nota(f, ini, dur, tipo = "sine", vol = 0.14) {
    const a = audio(); if (!a) return;
    const t = a.currentTime + ini, o = a.createOscillator(), g = a.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);           // ataque rápido
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);          // some suave
    o.connect(g).connect(a.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }
  const SONS = {
    acerto: () => { nota(784, 0, 0.18); nota(988, 0.09, 0.18); nota(1319, 0.18, 0.35); },                 // sol-si-mi subindo
    perto: () => { nota(659, 0, 0.18); nota(784, 0.1, 0.3); },
    erro: () => { nota(311, 0, 0.22, "triangle", 0.12); nota(233, 0.14, 0.32, "triangle", 0.12); },       // dois tons descendo, sem ser agressivo
    clique: () => nota(1200, 0, 0.05, "sine", 0.05),
    tique: () => nota(880, 0, 0.08, "square", 0.035),
    final: () => [523, 659, 784, 1047, 1319].forEach((f, i) => nota(f, i * 0.11, i === 4 ? 0.7 : 0.25)),  // arpejo de "fanfarra"
  };
  return { tocar(nome) { if (!ligado() || !SONS[nome]) return; try { SONS[nome](); } catch {} }, ligado };
})();
