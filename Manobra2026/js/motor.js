// Motor da simulação de manobra de trens.
// JS puro, sem DOM: roda no Node e no navegador.
// Port fiel do main.c original (EdgarTrab2), mais a estratégia best-fit.

const ESTRATEGIAS = ['first-fit', 'best-fit'];

/**
 * Valida os parâmetros da simulação.
 * @returns {string[]} lista de mensagens de erro em português (vazia se válido)
 */
export function validar({ sequencia, trilhosIniciais, capacidade, estrategia = 'first-fit' }) {
  const erros = [];

  if (!Array.isArray(sequencia) || sequencia.length < 1) {
    erros.push('Informe pelo menos 1 vagão na sequência.');
  } else {
    const n = sequencia.length;
    if (!sequencia.every((v) => Number.isInteger(v))) {
      erros.push('A sequência deve conter apenas números inteiros.');
    } else {
      const foraDoIntervalo = sequencia.filter((v) => v < 1 || v > n);
      if (foraDoIntervalo.length > 0) {
        erros.push(`Os vagões devem ser numerados de 1 a ${n}. Fora do intervalo: ${[...new Set(foraDoIntervalo)].join(', ')}.`);
      }
      const repetidos = sequencia.filter((v, i) => sequencia.indexOf(v) !== i);
      if (repetidos.length > 0) {
        erros.push(`Há vagões repetidos: ${[...new Set(repetidos)].join(', ')}.`);
      }
    }
  }

  if (!Number.isInteger(capacidade) || capacidade < 1) {
    erros.push('A capacidade de cada trilho deve ser um inteiro maior ou igual a 1.');
  }
  if (!Number.isInteger(trilhosIniciais) || trilhosIniciais < 0) {
    erros.push('O número inicial de trilhos deve ser um inteiro maior ou igual a 0.');
  }
  if (!ESTRATEGIAS.includes(estrategia)) {
    erros.push(`Estratégia desconhecida: ${estrategia}.`);
  }

  return erros;
}

/** Um trilho aceita o vagão se tem espaço e está vazio ou o topo é maior que o vagão. */
function aceita(trilho, vagao, capacidade) {
  return trilho.length < capacidade && (trilho.length === 0 || trilho[trilho.length - 1] > vagao);
}

/** first-fit: primeiro trilho (menor índice) que aceita. -1 se nenhum. */
function escolherFirstFit(trilhos, vagao, capacidade) {
  return trilhos.findIndex((t) => aceita(t, vagao, capacidade));
}

/**
 * best-fit: entre os trilhos que aceitam, o de menor topo maior que o vagão.
 * Trilho vazio só é usado se nenhum trilho com topo aceitar (primeiro vazio).
 */
function escolherBestFit(trilhos, vagao, capacidade) {
  let melhor = -1;
  for (let k = 0; k < trilhos.length; k++) {
    const t = trilhos[k];
    if (t.length === 0 || !aceita(t, vagao, capacidade)) continue;
    if (melhor === -1 || t[t.length - 1] < trilhos[melhor][trilhos[melhor].length - 1]) melhor = k;
  }
  if (melhor !== -1) return melhor;
  return trilhos.findIndex((t) => t.length === 0 && aceita(t, vagao, capacidade));
}

function copiarEstado(entrada, trilhos, saida) {
  return { entrada: [...entrada], trilhos: trilhos.map((t) => [...t]), saida: [...saida] };
}

/**
 * Simula a manobra e devolve todos os passos de uma vez.
 * Cada iteração faz um movimento, na prioridade do main.c:
 *   1. esperado no topo de algum trilho (o de maior índice, como no C) -> saída
 *   2. frente da entrada é o esperado -> saída
 *   3. estratégia (first-fit ou best-fit) escolhe um trilho existente
 *   4. senão, cria um trilho novo
 */
export function simular({ sequencia, trilhosIniciais, capacidade, estrategia = 'first-fit' }) {
  const erros = validar({ sequencia, trilhosIniciais, capacidade, estrategia });
  if (erros.length > 0) throw new Error(erros.join(' '));

  const escolher = estrategia === 'best-fit' ? escolherBestFit : escolherFirstFit;
  const total = sequencia.length;

  const entrada = [...sequencia];
  const trilhos = Array.from({ length: trilhosIniciais }, () => []);
  const saida = [];
  let esperado = 1;
  let maiorTrilhoUsado = -1;

  const passos = [{
    n: 0,
    movimento: null,
    regra: null,
    trilhoCriado: false,
    estado: copiarEstado(entrada, trilhos, saida),
  }];

  const registrar = (movimento, regra, trilhoCriado) => {
    passos.push({
      n: passos.length,
      movimento,
      regra,
      trilhoCriado,
      estado: copiarEstado(entrada, trilhos, saida),
    });
  };

  while (saida.length < total) {
    // 1. esperado no topo de algum trilho (sem break: vale o de maior índice)
    let origem = -1;
    for (let k = 0; k < trilhos.length; k++) {
      const t = trilhos[k];
      if (t.length > 0 && t[t.length - 1] === esperado) origem = k;
    }
    if (origem !== -1) {
      const vagao = trilhos[origem].pop();
      saida.push(vagao);
      esperado++;
      registrar({ vagao, de: { trilho: origem }, para: 'saida' }, 'esperado-no-topo', false);
      continue;
    }

    // 2. frente da entrada é o esperado
    const vagao = entrada.shift();
    if (vagao === esperado) {
      saida.push(vagao);
      esperado++;
      registrar({ vagao, de: 'entrada', para: 'saida' }, 'direto-saida', false);
      continue;
    }

    // 3. estratégia escolhe um trilho existente
    let destino = escolher(trilhos, vagao, capacidade);
    let regra = estrategia;
    let criado = false;

    // 4. nenhum serve: cria um trilho novo
    if (destino === -1) {
      trilhos.push([]);
      destino = trilhos.length - 1;
      regra = 'novo-trilho';
      criado = true;
    }

    trilhos[destino].push(vagao);
    maiorTrilhoUsado = Math.max(maiorTrilhoUsado, destino);
    registrar({ vagao, de: 'entrada', para: { trilho: destino } }, regra, criado);
  }

  return {
    passos,
    resumo: {
      etapas: passos.length - 1,
      trilhosUsados: maiorTrilhoUsado + 1,
      estrategia,
    },
  };
}
