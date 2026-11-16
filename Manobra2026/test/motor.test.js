import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simular, validar } from '../js/motor.js';

const seq = (texto) => texto.split(' ').map(Number);

// Vetores gerados por um port em Python do main.c (trilhos iniciais = 0).
const vetores = [
  ['1 2 3 4 5 6', 99, 'first-fit', 6, 0],
  ['6 5 4 3 2 1', 99, 'first-fit', 11, 1],
  ['6 5 4 3 2 1', 3, 'first-fit', 11, 2],
  ['10 9 8 7 6 5 4 3 2 1', 99, 'first-fit', 19, 1],
  ['10 9 8 7 6 5 4 3 2 1', 3, 'first-fit', 19, 3],
  ['5 3 6 1 4 2', 99, 'first-fit', 10, 2],
  ['2 5 1 4 6 3', 99, 'first-fit', 10, 3],
  ['2 5 1 4 6 3', 99, 'best-fit', 10, 2],
  ['1 3 6 2 5 7 4', 99, 'first-fit', 11, 3],
  ['1 3 6 2 5 7 4', 99, 'best-fit', 11, 2],
];

for (const [sequencia, capacidade, estrategia, etapas, trilhosUsados] of vetores) {
  test(`${estrategia} cap ${capacidade}: ${sequencia} -> ${etapas} etapas, ${trilhosUsados} trilhos`, () => {
    const { resumo } = simular({ sequencia: seq(sequencia), trilhosIniciais: 0, capacidade, estrategia });
    assert.equal(resumo.etapas, etapas);
    assert.equal(resumo.trilhosUsados, trilhosUsados);
  });
}

test('a saída termina em ordem crescente 1..N', () => {
  const { passos } = simular({ sequencia: seq('5 3 6 1 4 2'), trilhosIniciais: 0, capacidade: 2, estrategia: 'first-fit' });
  const ultimo = passos[passos.length - 1].estado;
  assert.deepEqual(ultimo.saida, [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(ultimo.entrada, []);
  assert.ok(ultimo.trilhos.every((t) => t.length === 0));
});

test('passo 0 é o estado inicial, sem movimento', () => {
  const { passos } = simular({ sequencia: seq('3 1 2'), trilhosIniciais: 2, capacidade: 5 });
  assert.equal(passos[0].n, 0);
  assert.equal(passos[0].movimento, null);
  assert.equal(passos[0].regra, null);
  assert.equal(passos[0].trilhoCriado, false);
  assert.deepEqual(passos[0].estado, { entrada: [3, 1, 2], trilhos: [[], []], saida: [] });
});

test('passos têm numeração sequencial e regras coerentes', () => {
  const { passos } = simular({ sequencia: seq('3 1 2'), trilhosIniciais: 0, capacidade: 5 });
  passos.forEach((p, i) => assert.equal(p.n, i));
  // 3 -> trilho novo; 1 -> direto; 2 -> direto; 3 sai do trilho
  assert.deepEqual(passos.slice(1).map((p) => p.regra), ['novo-trilho', 'direto-saida', 'direto-saida', 'esperado-no-topo']);
  assert.equal(passos[1].trilhoCriado, true);
  assert.deepEqual(passos[1].movimento, { vagao: 3, de: 'entrada', para: { trilho: 0 } });
  assert.deepEqual(passos[4].movimento, { vagao: 3, de: { trilho: 0 }, para: 'saida' });
});

test('os estados de cada passo são independentes (cópias)', () => {
  const { passos } = simular({ sequencia: seq('4 3 2 1'), trilhosIniciais: 0, capacidade: 9 });
  assert.deepEqual(passos[1].estado.trilhos, [[4]]);
  assert.deepEqual(passos[2].estado.trilhos, [[4, 3]]);
});

test('trilhos iniciais extras não usados não contam em "trilhos usados"', () => {
  const { resumo, passos } = simular({ sequencia: seq('3 2 1'), trilhosIniciais: 5, capacidade: 99 });
  assert.equal(resumo.trilhosUsados, 1);
  assert.equal(passos[0].estado.trilhos.length, 5);
});

test('trem já ordenado usa 0 trilhos mesmo com trilhos iniciais', () => {
  const { resumo } = simular({ sequencia: seq('1 2 3'), trilhosIniciais: 3, capacidade: 2 });
  assert.equal(resumo.trilhosUsados, 0);
  assert.equal(resumo.etapas, 3);
});

test('capacidade 1: cada vagão fora de ordem ocupa um trilho', () => {
  const { resumo, passos } = simular({ sequencia: seq('4 3 2 1'), trilhosIniciais: 0, capacidade: 1 });
  assert.equal(resumo.trilhosUsados, 3);
  assert.deepEqual(passos[passos.length - 1].estado.saida, [1, 2, 3, 4]);
});

test('N = 1', () => {
  const { resumo, passos } = simular({ sequencia: [1], trilhosIniciais: 0, capacidade: 1 });
  assert.equal(resumo.etapas, 1);
  assert.equal(resumo.trilhosUsados, 0);
  assert.equal(passos.length, 2);
});

test('trilho novo é criado quando os existentes estão cheios', () => {
  const { passos } = simular({ sequencia: seq('6 5 4 3 2 1'), trilhosIniciais: 1, capacidade: 3 });
  const criados = passos.filter((p) => p.trilhoCriado);
  assert.equal(criados.length, 1);
  assert.equal(criados[0].regra, 'novo-trilho');
});

test('best-fit prefere trilho com topo a trilho vazio; first-fit usa o primeiro que aceita', () => {
  // 2 5 1 4 6 3: ao chegar o 4, o trilho 0 está vazio (o 2 já saiu) e o trilho 1 tem topo 5.
  const destino4 = (estrategia) => {
    const { passos } = simular({ sequencia: seq('2 5 1 4 6 3'), trilhosIniciais: 0, capacidade: 99, estrategia });
    const passo = passos.find((p) => p.movimento && p.movimento.vagao === 4 && p.movimento.de === 'entrada');
    return { destino: passo.movimento.para, regra: passo.regra };
  };
  assert.deepEqual(destino4('first-fit'), { destino: { trilho: 0 }, regra: 'first-fit' });
  assert.deepEqual(destino4('best-fit'), { destino: { trilho: 1 }, regra: 'best-fit' });
});

test('o resumo reporta a estratégia usada', () => {
  assert.equal(simular({ sequencia: [2, 1], trilhosIniciais: 0, capacidade: 2, estrategia: 'best-fit' }).resumo.estrategia, 'best-fit');
  assert.equal(simular({ sequencia: [2, 1], trilhosIniciais: 0, capacidade: 2 }).resumo.estrategia, 'first-fit');
});

test('validação: sequência não é permutação de 1..N', () => {
  assert.match(validar({ sequencia: [1, 2, 2], trilhosIniciais: 0, capacidade: 1 }).join(' '), /repetidos/);
  assert.match(validar({ sequencia: [1, 2, 5], trilhosIniciais: 0, capacidade: 1 }).join(' '), /1 a 3/);
  assert.match(validar({ sequencia: [1, 0, 2], trilhosIniciais: 0, capacidade: 1 }).join(' '), /1 a 3/);
  assert.match(validar({ sequencia: [1, 1.5, 2], trilhosIniciais: 0, capacidade: 1 }).join(' '), /inteiros/);
  assert.match(validar({ sequencia: [], trilhosIniciais: 0, capacidade: 1 }).join(' '), /pelo menos 1/);
});

test('validação: capacidade, trilhos iniciais e estratégia', () => {
  assert.match(validar({ sequencia: [1], trilhosIniciais: 0, capacidade: 0 }).join(' '), /capacidade/);
  assert.match(validar({ sequencia: [1], trilhosIniciais: -1, capacidade: 1 }).join(' '), /número inicial de trilhos/);
  assert.match(validar({ sequencia: [1], trilhosIniciais: 0, capacidade: 1, estrategia: 'xyz' }).join(' '), /Estratégia/);
  assert.deepEqual(validar({ sequencia: [2, 1], trilhosIniciais: 0, capacidade: 1 }), []);
});

test('simular lança erro em português com entrada inválida', () => {
  assert.throws(() => simular({ sequencia: [1, 1], trilhosIniciais: 0, capacidade: 1 }), /repetidos/);
});
