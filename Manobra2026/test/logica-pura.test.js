// Testes das partes sem DOM: formulário, texto do log, layout do pátio e comparação.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simular } from '../js/motor.js';
import { parseSequencia, gerarOrdenada, gerarInversa, gerarAleatoria, interpretarFormulario, validarN, MAX_VAGOES } from '../js/entrada.js';
import { descreverPasso } from '../js/log.js';
import { calcularLayout, calcularPosicoes } from '../js/patio.js';
import { compararEstrategias } from '../js/resumo.js';

const base = { n: '6', sequencia: '5 3 6 1 4 2', trilhosIniciais: '2', capacidade: '3', estrategia: 'first-fit' };

// ---------------------------------------------------------------- entrada.js

test('parseSequencia aceita espaços, vírgulas e ponto e vírgula', () => {
  assert.deepEqual(parseSequencia(' 5 3,6;1  4\t2 '), [5, 3, 6, 1, 4, 2]);
  assert.deepEqual(parseSequencia(''), []);
  assert.ok(Number.isNaN(parseSequencia('1 a 3')[1]));
});

test('exemplos: ordenada, inversa e aleatória (permutação)', () => {
  assert.deepEqual(gerarOrdenada(4), [1, 2, 3, 4]);
  assert.deepEqual(gerarInversa(4), [4, 3, 2, 1]);
  const embaralhada = gerarAleatoria(20);
  assert.deepEqual([...embaralhada].sort((a, b) => a - b), gerarOrdenada(20));
  // com um "aleatório" fixo o resultado é determinístico
  assert.deepEqual(gerarAleatoria(4, () => 0), [2, 3, 4, 1]);
});

test('interpretarFormulario: entrada válida', () => {
  const { erros, params } = interpretarFormulario(base);
  assert.deepEqual(erros, []);
  assert.deepEqual(params, { sequencia: [5, 3, 6, 1, 4, 2], trilhosIniciais: 2, capacidade: 3, estrategia: 'first-fit' });
});

test('interpretarFormulario: N diferente da quantidade de vagões', () => {
  const { erros, params } = interpretarFormulario({ ...base, n: '5' });
  assert.equal(params, null);
  assert.match(erros.join(' '), /não bate/);
});

test('interpretarFormulario: campos vazios e inválidos viram mensagens', () => {
  const { erros } = interpretarFormulario({ n: '', sequencia: '', trilhosIniciais: '', capacidade: '', estrategia: 'first-fit' });
  const texto = erros.join(' ');
  assert.match(texto, /N deve ser/);
  assert.match(texto, /pelo menos 1 vagão/);
  assert.match(texto, /capacidade/);
  assert.match(texto, /número inicial de trilhos/);
});

test('interpretarFormulario: sequência com repetidos ou letras', () => {
  assert.match(interpretarFormulario({ ...base, sequencia: '1 2 2 4 5 6' }).erros.join(' '), /repetidos/);
  assert.match(interpretarFormulario({ ...base, sequencia: '1 2 x 4 5 6' }).erros.join(' '), /inteiros/);
});

test('validarN respeita o limite máximo', () => {
  assert.equal(validarN('6').erro, null);
  assert.ok(validarN('0').erro);
  assert.ok(validarN(String(MAX_VAGOES + 1)).erro);
  assert.ok(validarN('abc').erro);
});

// ---------------------------------------------------------------- log.js

test('descreverPasso cobre cada regra em português', () => {
  const r = simular({ sequencia: [3, 1, 2], trilhosIniciais: 0, capacidade: 5 });
  const textos = r.passos.map((_, i) => descreverPasso(r.passos, i));
  assert.match(textos[0], /Estado inicial: 3 vagões/);
  assert.match(textos[1], /cria o trilho 1/);
  assert.match(textos[2], /vai direto/);
  assert.match(textos[4], /sai do trilho 1 para a saída/);
});

test('descreverPasso: first-fit e best-fit citam a estratégia e o trilho', () => {
  const ff = simular({ sequencia: [3, 2, 1], trilhosIniciais: 0, capacidade: 5 });
  assert.match(descreverPasso(ff.passos, 2), /First-fit: vai para o trilho 1/);
  const bf = simular({ sequencia: [3, 2, 1], trilhosIniciais: 0, capacidade: 5, estrategia: 'best-fit' });
  assert.match(descreverPasso(bf.passos, 2), /Best-fit: vai para o trilho 1/);
});

test('descreverPasso usa singular quando há 1 vagão', () => {
  const r = simular({ sequencia: [1], trilhosIniciais: 0, capacidade: 1 });
  assert.match(descreverPasso(r.passos, 0), /1 vagão na entrada/);
});

// ---------------------------------------------------------------- patio.js (layout)

test('calcularLayout: trilhos e largura da simulação', () => {
  const r = simular({ sequencia: [6, 5, 4, 3, 2, 1], trilhosIniciais: 0, capacidade: 3 });
  const L = calcularLayout({ passos: r.passos, capacidade: 3, total: 6 });
  assert.equal(L.nTrilhos, 2);
  assert.equal(L.slotsTrilho, 3);
  assert.equal(L.yTrilho.length, 2);
  assert.ok(L.largura > L.xSaidaFim);
  assert.ok(L.xEntradaFim < L.xTrilho0 && L.xTrilhoFim < L.xSaida0);
});

test('calcularLayout: sem trilhos ainda reserva espaço mínimo', () => {
  const r = simular({ sequencia: [1, 2, 3], trilhosIniciais: 0, capacidade: 3 });
  const L = calcularLayout({ passos: r.passos, capacidade: 3, total: 3 });
  assert.equal(L.nTrilhos, 0);
  assert.ok(L.xTrilhoFim > L.xTrilho0);
});

test('calcularPosicoes: todo vagão tem posição e a fila avança para o pátio', () => {
  const r = simular({ sequencia: [3, 1, 2], trilhosIniciais: 1, capacidade: 3 });
  const L = calcularLayout({ passos: r.passos, capacidade: 3, total: 3 });
  const inicio = calcularPosicoes(r.passos[0].estado, L);
  assert.equal(inicio.size, 3);
  // frente da fila (3) está mais à direita que o vagão de trás (2)
  assert.ok(inicio.get(3).x > inicio.get(1).x && inicio.get(1).x > inicio.get(2).x);

  const fim = calcularPosicoes(r.passos.at(-1).estado, L);
  assert.equal(fim.size, 3);
  // na saída, 1, 2, 3 da esquerda para a direita
  assert.ok(fim.get(1).x < fim.get(2).x && fim.get(2).x < fim.get(3).x);
  assert.ok(fim.get(1).x >= L.xSaida0);
});

test('calcularPosicoes: o topo do trilho fica voltado para a saída', () => {
  const r = simular({ sequencia: [4, 3, 2, 1], trilhosIniciais: 0, capacidade: 9 });
  const L = calcularLayout({ passos: r.passos, capacidade: 9, total: 4 });
  const p = calcularPosicoes(r.passos[3].estado, L); // 4, 3, 2 empilhados no trilho 1
  assert.ok(p.get(4).x < p.get(3).x && p.get(3).x < p.get(2).x);
});

// ---------------------------------------------------------------- resumo.js

test('compararEstrategias devolve first-fit e best-fit', () => {
  const [ff, bf] = compararEstrategias({ sequencia: [2, 5, 1, 4, 6, 3], trilhosIniciais: 0, capacidade: 99 });
  assert.equal(ff.estrategia, 'first-fit');
  assert.equal(bf.estrategia, 'best-fit');
  assert.equal(ff.trilhosUsados, 3);
  assert.equal(bf.trilhosUsados, 2);
});
