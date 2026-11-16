// Leitura e validação do formulário, e geradores dos exemplos prontos.
// Sem DOM: testável no Node.

import { validar } from './motor.js';

export const MAX_VAGOES = 30;

/** Converte "5 3, 6;1 4 2" em [5, 3, 6, 1, 4, 2]. Texto inválido vira NaN (a validação reclama). */
export function parseSequencia(texto) {
  return texto
    .trim()
    .split(/[\s,;]+/)
    .filter(Boolean)
    .map((parte) => Number(parte));
}

/** Campo numérico vazio vira NaN em vez de 0. */
function inteiro(texto) {
  const limpo = String(texto).trim();
  return limpo === '' ? NaN : Number(limpo);
}

export function gerarOrdenada(n) {
  return Array.from({ length: n }, (_, i) => i + 1);
}

export function gerarInversa(n) {
  return gerarOrdenada(n).reverse();
}

/** Embaralhamento de Fisher-Yates. `aleatorio` é injetável para os testes. */
export function gerarAleatoria(n, aleatorio = Math.random) {
  const v = gerarOrdenada(n);
  for (let i = v.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [v[i], v[j]] = [v[j], v[i]];
  }
  return v;
}

export const EXEMPLOS = {
  ordenada: gerarOrdenada,
  inversa: gerarInversa,
  aleatoria: gerarAleatoria,
};

/** Valida o campo N sozinho (usado pelos botões de exemplo). */
export function validarN(texto) {
  const n = inteiro(texto);
  if (!Number.isInteger(n) || n < 1 || n > MAX_VAGOES) {
    return { n, erro: `N deve ser um inteiro entre 1 e ${MAX_VAGOES}.` };
  }
  return { n, erro: null };
}

/**
 * Lê os valores (texto) do formulário.
 * @returns {{ erros: string[], params: object|null }}
 */
export function interpretarFormulario({ n, sequencia, trilhosIniciais, capacidade, estrategia }) {
  const erros = [];
  const { n: nNumero, erro } = validarN(n);
  if (erro) erros.push(erro);

  const seq = parseSequencia(sequencia);
  if (!erro && seq.length > 0 && seq.length !== nNumero) {
    erros.push(`N (${nNumero}) não bate com a quantidade de vagões da sequência (${seq.length}).`);
  }
  if (seq.length > MAX_VAGOES) {
    erros.push(`A sequência tem mais de ${MAX_VAGOES} vagões.`);
  }

  const params = {
    sequencia: seq,
    trilhosIniciais: inteiro(trilhosIniciais),
    capacidade: inteiro(capacidade),
    estrategia,
  };
  erros.push(...validar(params));

  return erros.length > 0 ? { erros, params: null } : { erros: [], params };
}
