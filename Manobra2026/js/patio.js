// Desenho do pátio em SVG.
// Entrada à esquerda (frente da fila voltada para o pátio), trilhos de espera no meio
// (cada um é uma pilha: fundo à esquerda, topo voltado para a saída) e saída à direita.
//
// As funções de layout são puras (testáveis no Node). O desenho só toca no DOM dentro de
// desenharPatio(). Os vagões são criados uma vez por simulação e só mudam de posição a cada
// passo: a animação é uma transição CSS no transform.

const NS = 'http://www.w3.org/2000/svg';

const GAP = 6; // folga entre vagões
const LINHA_H = 54; // altura de cada trilho de espera
const MARGEM = 16;
const ZONA_GAP = 44; // espaço entre entrada, trilhos e saída
const TITULO_H = 30;
const LOCO_W = 70;
const PARACHOQUE_W = 10;
const ZONA_TRILHOS_MIN_W = 130;

/**
 * Calcula o layout fixo de uma simulação inteira, para o pátio não "pular" entre passos.
 */
export function calcularLayout({ passos, capacidade, total }) {
  const nTrilhos = Math.max(0, ...passos.map((p) => p.estado.trilhos.length));
  const maxEmpilhado = Math.max(1, ...passos.flatMap((p) => p.estado.trilhos.map((t) => t.length)));
  const slotsTrilho = Math.max(1, Math.min(capacidade, maxEmpilhado));

  const { vW, vH } = total <= 12 ? { vW: 46, vH: 30 } : total <= 24 ? { vW: 36, vH: 26 } : { vW: 30, vH: 24 };
  const passo = vW + GAP;

  const areaH = Math.max(nTrilhos, 1) * LINHA_H;
  const yMeio = TITULO_H + areaH / 2 - 4; // centro dos vagões na entrada e na saída
  const yTrilho = Array.from({ length: nTrilhos }, (_, k) => TITULO_H + k * LINHA_H + LINHA_H / 2 - 4);

  const xViaEntrada = MARGEM + LOCO_W;
  const xEntradaFim = xViaEntrada + total * passo;
  const xTrilho0 = xEntradaFim + ZONA_GAP;
  const xTrilhoFim = xTrilho0 + Math.max(PARACHOQUE_W + slotsTrilho * passo, ZONA_TRILHOS_MIN_W);
  const xSaida0 = xTrilhoFim + ZONA_GAP;
  const xSaidaFim = xSaida0 + total * passo;

  return {
    total,
    vW,
    vH,
    passo,
    nTrilhos,
    slotsTrilho,
    yMeio,
    yTrilho,
    xViaEntrada,
    xEntradaFim,
    xTrilho0,
    xTrilhoFim,
    xSaida0,
    xSaidaFim,
    largura: xSaidaFim + MARGEM,
    altura: TITULO_H + areaH + 24,
  };
}

/** Posição (canto superior esquerdo) de cada vagão num estado. */
export function calcularPosicoes(estado, L) {
  const posicoes = new Map();
  const yLinha = L.yMeio - L.vH / 2;

  // índice 0 da entrada é a frente da fila: fica no lado voltado para o pátio (direita)
  estado.entrada.forEach((v, i) => {
    posicoes.set(v, { x: L.xEntradaFim - (i + 1) * L.passo + GAP / 2, y: yLinha });
  });
  estado.trilhos.forEach((trilho, k) => {
    trilho.forEach((v, j) => {
      posicoes.set(v, { x: L.xTrilho0 + PARACHOQUE_W + j * L.passo + GAP / 2, y: L.yTrilho[k] - L.vH / 2 });
    });
  });
  estado.saida.forEach((v, i) => {
    posicoes.set(v, { x: L.xSaida0 + i * L.passo + GAP / 2, y: yLinha });
  });
  return posicoes;
}

// ---------------------------------------------------------------- DOM

function el(nome, atributos = {}, ...filhos) {
  const e = document.createElementNS(NS, nome);
  for (const [k, v] of Object.entries(atributos)) e.setAttribute(k, v);
  e.append(...filhos);
  return e;
}

function reduzirMovimento() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Via com dormentes. yTrilho é a altura da linha do trilho. */
function criarVia(x1, x2, yTrilho, classe) {
  const g = el('g', { class: `via ${classe}` });
  for (let x = x1 + 4; x < x2 - 8; x += 14) {
    g.append(el('rect', { class: 'dormente', x, y: yTrilho + 1, width: 8, height: 6, rx: 1 }));
  }
  g.append(el('line', { class: 'trilho-linha', x1, x2, y1: yTrilho, y2: yTrilho }));
  return g;
}

function criarLocomotiva(x, yTrilho) {
  return el(
    'g',
    { class: 'locomotiva', transform: `translate(${x} ${yTrilho - 41})`, 'aria-hidden': 'true' },
    el('rect', { class: 'loco-corpo', x: 24, y: 12, width: 42, height: 26, rx: 3 }),
    el('rect', { class: 'loco-corpo', x: 0, y: 0, width: 26, height: 38, rx: 3 }),
    el('rect', { class: 'loco-janela', x: 6, y: 6, width: 14, height: 11, rx: 2 }),
    el('rect', { class: 'loco-corpo', x: 54, y: 3, width: 8, height: 11, rx: 1 }),
    el('circle', { class: 'roda', cx: 14, cy: 36, r: 5 }),
    el('circle', { class: 'roda', cx: 38, cy: 36, r: 5 }),
    el('circle', { class: 'roda', cx: 56, cy: 36, r: 5 }),
  );
}

function criarVagao(numero, total, L) {
  const hue = Math.round(((numero - 1) / Math.max(total - 1, 1)) * 300);
  const corpoH = L.vH - 6;
  const corpo = el('rect', { class: 'corpo', x: 0, y: 0, width: L.vW, height: corpoH, rx: 4 });
  corpo.style.fill = `hsl(${hue} 55% 36%)`;
  return el(
    'g',
    { class: 'vagao', role: 'img', 'aria-label': `Vagão ${numero}` },
    corpo,
    el('circle', { class: 'roda', cx: L.vW * 0.22, cy: L.vH - 3.5, r: 3.5 }),
    el('circle', { class: 'roda', cx: L.vW * 0.78, cy: L.vH - 3.5, r: 3.5 }),
    el('text', { class: 'numero', x: L.vW / 2, y: corpoH / 2, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, String(numero)),
  );
}

function montar(container, L) {
  const svg = el('svg', {
    class: 'patio-svg',
    viewBox: `0 0 ${L.largura} ${L.altura}`,
    role: 'group',
    'aria-label': 'Pátio de manobra: entrada à esquerda, trilhos de espera no meio e saída à direita',
  });
  svg.style.minWidth = `${Math.round(L.largura * 0.6)}px`;

  const yViaMeio = L.yMeio + L.vH / 2;

  svg.append(
    el('text', { class: 'titulo-zona', x: MARGEM, y: 18 }, 'Entrada'),
    el('text', { class: 'titulo-zona', x: L.xTrilho0, y: 18 }, 'Trilhos de espera'),
    el('text', { class: 'titulo-zona', x: L.xSaida0, y: 18 }, 'Saída'),
  );

  // entrada: via + locomotiva
  svg.append(criarVia(L.xViaEntrada - 8, L.xEntradaFim + 8, yViaMeio, 'via-entrada'));
  svg.append(criarLocomotiva(MARGEM, yViaMeio));

  // saída: via + plataforma
  svg.append(criarVia(L.xSaida0 - 8, L.xSaidaFim + 8, yViaMeio, 'via-saida'));
  svg.append(el('rect', { class: 'plataforma', x: L.xSaida0 - 8, y: yViaMeio + 9, width: L.xSaidaFim - L.xSaida0 + 16, height: 9, rx: 2 }));

  // trilhos de espera
  const vias = L.yTrilho.map((yc, k) => {
    const yTrilho = yc + L.vH / 2;
    const g = el('g', { class: 'espera' });
    g.append(criarVia(L.xTrilho0, L.xTrilhoFim, yTrilho, 'via-espera'));
    g.append(el('rect', { class: 'parachoque', x: L.xTrilho0, y: yTrilho - 14, width: PARACHOQUE_W - 3, height: 14, rx: 2 }));
    g.append(el('text', { class: 'rotulo-trilho', x: L.xTrilho0 - 8, y: yTrilho - 4, 'text-anchor': 'end' }, `T${k + 1}`));
    svg.append(g);
    return g;
  });
  if (L.nTrilhos === 0) {
    svg.append(el('text', { class: 'aviso-zona', x: L.xTrilho0, y: yViaMeio - 4 }, 'nenhum trilho necessário'));
  }

  // vagões, por último (ficam por cima das vias)
  const vagoes = new Map();
  for (let v = 1; v <= L.total; v++) {
    const g = criarVagao(v, L.total, L);
    vagoes.set(v, g);
    svg.append(g);
  }

  container.replaceChildren(svg);
  return { layout: L, svg, vagoes, vias };
}

/**
 * Desenha (ou atualiza) o pátio para um estado.
 * @param container elemento que recebe o SVG
 * @param estado    { entrada, trilhos, saida }
 * @param layout    resultado de calcularLayout (mesmo objeto durante toda a simulação)
 * @param opcoes    { animar, movimento, trilhoCriado }
 */
export function desenharPatio(container, estado, layout, { animar = false, movimento = null, trilhoCriado = false } = {}) {
  let ctx = container._patio;
  if (!ctx || ctx.layout !== layout) {
    ctx = montar(container, layout);
    container._patio = ctx;
    animar = false;
  }

  // com a classe "anima" o CSS faz a transição do transform; sem ela o vagão salta
  ctx.svg.classList.toggle('anima', animar && !reduzirMovimento());

  const posicoes = calcularPosicoes(estado, layout);
  for (const [vagao, p] of posicoes) {
    const g = ctx.vagoes.get(vagao);
    g.style.transform = `translate(${p.x}px, ${p.y}px)`;
    g.classList.toggle('destaque', movimento !== null && movimento.vagao === vagao);
  }

  // em telas estreitas o pátio rola na horizontal: acompanha o vagão que se moveu
  if (container.scrollWidth > container.clientWidth) {
    const alvo = movimento ? posicoes.get(movimento.vagao) : null;
    const escala = ctx.svg.getBoundingClientRect().width / layout.largura;
    const esquerda = alvo ? (alvo.x + layout.vW / 2) * escala - container.clientWidth / 2 : 0;
    container.scrollTo({ left: Math.max(0, esquerda), behavior: animar && !reduzirMovimento() ? 'smooth' : 'auto' });
  }

  ctx.vias.forEach((g, k) => {
    g.classList.toggle('inexistente', k >= estado.trilhos.length);
    g.classList.remove('novo');
  });
  if (trilhoCriado && movimento && typeof movimento.para === 'object') {
    ctx.vias[movimento.para.trilho]?.classList.add('novo');
  }
}
