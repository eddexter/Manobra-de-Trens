// Resultado final (card no último passo) e comparação entre estratégias.

import { simular } from './motor.js';

export const NOMES_ESTRATEGIA = {
  'first-fit': 'First-fit',
  'best-fit': 'Best-fit',
};

/** Roda as duas estratégias com os mesmos parâmetros e devolve os resumos. */
export function compararEstrategias({ sequencia, trilhosIniciais, capacidade }) {
  return Object.keys(NOMES_ESTRATEGIA).map(
    (estrategia) => simular({ sequencia, trilhosIniciais, capacidade, estrategia }).resumo,
  );
}

function celula(tag, texto, classe) {
  const c = document.createElement(tag);
  c.textContent = texto;
  if (classe) c.className = classe;
  return c;
}

/**
 * Liga o resumo ao DOM.
 * raiz deve conter [data-campo="resultado"] e [data-campo="comparacao"].
 */
export function criarResumo(raiz) {
  const resultado = raiz.querySelector('[data-campo="resultado"]');
  const comparacao = raiz.querySelector('[data-campo="comparacao"]');

  function reiniciar() {
    resultado.dataset.pronto = 'false';
    resultado.replaceChildren(celula('p', 'O resultado aparece no último passo.', 'resumo-pendente'));
    comparacao.replaceChildren();
  }

  /** Mostra o card em destaque só quando a simulação está no último passo. */
  function definir(resumo, noUltimoPasso) {
    if (!noUltimoPasso) {
      if (resultado.dataset.pronto !== 'false') reiniciarResultado();
      return;
    }
    resultado.dataset.pronto = 'true';
    const bloco = (rotulo, valor) => {
      const d = document.createElement('div');
      d.className = 'resumo-item';
      d.append(celula('span', String(valor), 'resumo-valor'), celula('span', rotulo, 'resumo-rotulo'));
      return d;
    };
    resultado.replaceChildren(
      bloco('trilhos usados', resumo.trilhosUsados),
      bloco('etapas', resumo.etapas),
      celula('p', `Estratégia: ${NOMES_ESTRATEGIA[resumo.estrategia]}`, 'resumo-estrategia'),
    );
  }

  function reiniciarResultado() {
    resultado.dataset.pronto = 'false';
    resultado.replaceChildren(celula('p', 'O resultado aparece no último passo.', 'resumo-pendente'));
  }

  /** Tabela lado a lado; destaca o menor valor de cada coluna quando há diferença. */
  function definirComparacao(resumos) {
    const tabela = document.createElement('table');
    tabela.className = 'tabela-comparacao';
    tabela.append(celula('caption', 'Comparação das estratégias com os mesmos dados'));

    const cab = document.createElement('tr');
    for (const t of ['Estratégia', 'Trilhos usados', 'Etapas']) {
      const th = celula('th', t);
      th.scope = 'col';
      cab.append(th);
    }
    const thead = document.createElement('thead');
    thead.append(cab);

    const melhor = (chave) => {
      const valores = resumos.map((r) => r[chave]);
      return new Set(valores).size > 1 ? Math.min(...valores) : null;
    };
    const melhorTrilhos = melhor('trilhosUsados');
    const melhorEtapas = melhor('etapas');

    const tbody = document.createElement('tbody');
    for (const r of resumos) {
      const linha = document.createElement('tr');
      const nome = celula('th', NOMES_ESTRATEGIA[r.estrategia]);
      nome.scope = 'row';
      linha.append(
        nome,
        celula('td', String(r.trilhosUsados), r.trilhosUsados === melhorTrilhos ? 'melhor' : ''),
        celula('td', String(r.etapas), r.etapas === melhorEtapas ? 'melhor' : ''),
      );
      tbody.append(linha);
    }
    tabela.append(thead, tbody);

    const empate = resumos.every((r) => r.trilhosUsados === resumos[0].trilhosUsados && r.etapas === resumos[0].etapas);
    comparacao.replaceChildren(tabela);
    if (empate) comparacao.append(celula('p', 'As duas estratégias deram o mesmo resultado.', 'comparacao-nota'));
  }

  reiniciar();
  return { reiniciar, definir, definirComparacao };
}
