// Estado da página e eventos. Liga formulário, motor, pátio, controles, log e resumo.

import { simular } from './motor.js';
import { calcularLayout, desenharPatio } from './patio.js';
import { criarControles } from './controles.js';
import { criarLog } from './log.js';
import { criarResumo, compararEstrategias } from './resumo.js';
import { EXEMPLOS, interpretarFormulario, validarN } from './entrada.js';

const $ = (seletor) => document.querySelector(seletor);

const form = $('#formulario');
const campos = {
  n: $('#campo-n'),
  sequencia: $('#campo-sequencia'),
  trilhosIniciais: $('#campo-trilhos'),
  capacidade: $('#campo-capacidade'),
  estrategia: $('#campo-estrategia'),
};
const caixaErros = $('#erros');
const patio = $('#patio');
const btnComparar = $('#btn-comparar');

// Nada é salvo: tudo vive aqui, na memória da página.
const estado = { resultado: null, layout: null, params: null };

const resumoUI = criarResumo($('#resumo'));
const logUI = criarLog($('#log'), { aoEscolher: (i) => controles.saltarPara(i) });
const controles = criarControles($('#controles'), { aoMudar: mostrarPasso });

function mostrarPasso(indice, { animar, duracao }) {
  const { passos, resumo } = estado.resultado;
  const passo = passos[indice];
  patio.style.setProperty('--dur-anim', `${duracao}ms`);
  desenharPatio(patio, passo.estado, estado.layout, {
    animar,
    movimento: passo.movimento,
    trilhoCriado: passo.trilhoCriado,
  });
  logUI.marcar(indice);
  resumoUI.definir(resumo, indice === passos.length - 1);
}

function mostrarErros(erros) {
  caixaErros.replaceChildren();
  caixaErros.hidden = erros.length === 0;
  if (erros.length === 0) return;
  const ul = document.createElement('ul');
  for (const e of erros) {
    const li = document.createElement('li');
    li.textContent = e;
    ul.append(li);
  }
  caixaErros.append(ul);
}

function lerCampos() {
  return Object.fromEntries(Object.entries(campos).map(([nome, campo]) => [nome, campo.value]));
}

function simularAgora() {
  const { erros, params } = interpretarFormulario(lerCampos());
  mostrarErros(erros);
  if (erros.length > 0) return;

  const resultado = simular(params);
  estado.params = params;
  estado.resultado = resultado;
  estado.layout = calcularLayout({
    passos: resultado.passos,
    capacidade: params.capacidade,
    total: params.sequencia.length,
  });

  btnComparar.disabled = false;
  resumoUI.reiniciar();
  logUI.carregar(resultado.passos);
  controles.carregar(resultado.passos.length);
}

form.addEventListener('submit', (evento) => {
  evento.preventDefault();
  simularAgora();
});

// Ao digitar a sequência, N acompanha a quantidade de vagões.
campos.sequencia.addEventListener('input', () => {
  const quantidade = campos.sequencia.value.trim().split(/[\s,;]+/).filter(Boolean).length;
  if (quantidade > 0) campos.n.value = String(quantidade);
});

// Exemplos prontos: preenchem a sequência com o N atual e simulam.
for (const botao of document.querySelectorAll('[data-exemplo]')) {
  botao.addEventListener('click', () => {
    const { n, erro } = validarN(campos.n.value);
    if (erro) {
      mostrarErros([erro]);
      return;
    }
    campos.sequencia.value = EXEMPLOS[botao.dataset.exemplo](n).join(' ');
    simularAgora();
  });
}

btnComparar.addEventListener('click', () => {
  if (estado.params) resumoUI.definirComparacao(compararEstrategias(estado.params));
});

simularAgora();
