// Controles de navegação: início, anterior, play/pausa, próximo, fim, velocidade e slider.
// O índice do passo atual mora aqui; a página é avisada por aoMudar(indice, { animar, duracao }).

const TEMPO_MAX_ANIMACAO = 600; // ms

export function criarControles(raiz, { aoMudar }) {
  const botao = (acao) => raiz.querySelector(`[data-acao="${acao}"]`);
  const campo = (nome) => raiz.querySelector(`[data-campo="${nome}"]`);

  const btnInicio = botao('inicio');
  const btnAnterior = botao('anterior');
  const btnPlay = botao('play');
  const btnProximo = botao('proximo');
  const btnFim = botao('fim');
  const velocidade = campo('velocidade');
  const slider = campo('passo');
  const contador = campo('contador');

  let ultimo = -1; // índice do último passo (-1 = nenhuma simulação ainda)
  let indice = 0;
  let tocando = false;
  let timer = null;

  const atraso = () => Number(velocidade.value);
  const duracao = () => Math.min(TEMPO_MAX_ANIMACAO, Math.round(atraso() * 0.7));

  function atualizarUI() {
    const pronto = ultimo >= 0;
    btnInicio.disabled = !pronto || indice === 0;
    btnAnterior.disabled = !pronto || indice === 0;
    btnProximo.disabled = !pronto || indice === ultimo;
    btnFim.disabled = !pronto || indice === ultimo;
    btnPlay.disabled = !pronto || ultimo === 0;
    slider.disabled = !pronto || ultimo === 0;
    slider.max = String(Math.max(ultimo, 0));
    slider.value = String(indice);
    slider.setAttribute('aria-valuetext', `Passo ${indice} de ${Math.max(ultimo, 0)}`);
    contador.textContent = pronto ? `Passo ${indice} de ${ultimo}` : 'Sem simulação';
    btnPlay.setAttribute('aria-pressed', String(tocando));
    btnPlay.querySelector('[data-rotulo]').textContent = tocando ? 'Pausar' : 'Reproduzir';
    btnPlay.querySelector('[data-icone]').textContent = tocando ? '⏸' : '▶';
  }

  function parar() {
    tocando = false;
    clearTimeout(timer);
    timer = null;
  }

  function irPara(novo, animar = false) {
    indice = Math.max(0, Math.min(ultimo, novo));
    if (indice === ultimo) parar();
    atualizarUI();
    aoMudar(indice, { animar, duracao: duracao() });
  }

  function agendar() {
    timer = setTimeout(() => {
      if (indice < ultimo) irPara(indice + 1, true);
      if (tocando) agendar();
      else atualizarUI();
    }, atraso());
  }

  function alternarPlay() {
    if (tocando) {
      parar();
      atualizarUI();
      return;
    }
    if (indice === ultimo) irPara(0); // terminou: recomeça
    tocando = true;
    atualizarUI();
    agendar();
  }

  const manual = (fn) => () => {
    parar();
    fn();
  };

  btnInicio.addEventListener('click', manual(() => irPara(0)));
  btnAnterior.addEventListener('click', manual(() => irPara(indice - 1, true)));
  btnProximo.addEventListener('click', manual(() => irPara(indice + 1, true)));
  btnFim.addEventListener('click', manual(() => irPara(ultimo)));
  btnPlay.addEventListener('click', alternarPlay);
  slider.addEventListener('input', manual(() => irPara(Number(slider.value))));

  velocidade.addEventListener('change', () => {
    if (tocando) {
      clearTimeout(timer);
      agendar();
    }
  });

  /** Nova simulação com `totalPassos` passos (contando o estado inicial). */
  function carregar(totalPassos) {
    parar();
    ultimo = totalPassos - 1;
    irPara(0);
  }

  /** Salto manual (usado pelo log): pausa o play e vai direto ao passo. */
  function saltarPara(i) {
    parar();
    irPara(i);
  }

  return { carregar, saltarPara };
}
