// Lista de passos com a regra aplicada em cada um.
// descreverPasso() é pura (testável no Node); o resto mexe no DOM só dentro das funções.

function vagoesTexto(n) {
  return `${n} ${n === 1 ? 'vagão' : 'vagões'}`;
}

/** Explica em português o que aconteceu no passo i. */
export function descreverPasso(passos, i) {
  const passo = passos[i];
  if (i === 0) {
    return `Estado inicial: ${vagoesTexto(passo.estado.entrada.length)} na entrada.`;
  }

  const { vagao, de, para } = passo.movimento;
  const esperado = passos[i - 1].estado.saida.length + 1;
  const trilhoDe = typeof de === 'object' ? de.trilho + 1 : null;
  const trilhoPara = typeof para === 'object' ? para.trilho + 1 : null;

  switch (passo.regra) {
    case 'esperado-no-topo':
      return `O vagão ${vagao} é o próximo da saída e está no topo do trilho ${trilhoDe}: sai do trilho ${trilhoDe} para a saída.`;
    case 'direto-saida':
      return `O vagão ${vagao} é o próximo da saída: vai direto da entrada para a saída.`;
    case 'first-fit':
      return `O vagão ${vagao} não é o próximo da saída (é o ${esperado}). First-fit: vai para o trilho ${trilhoPara}, o primeiro que aceita (vazio ou com topo maior que ${vagao}).`;
    case 'best-fit':
      return `O vagão ${vagao} não é o próximo da saída (é o ${esperado}). Best-fit: vai para o trilho ${trilhoPara}, o de menor topo maior que ${vagao}.`;
    case 'novo-trilho':
      return `O vagão ${vagao} não é o próximo da saída (é o ${esperado}) e nenhum trilho o aceita: cria o trilho ${trilhoPara} e coloca o vagão nele.`;
    default:
      return `Movimento do vagão ${vagao}.`;
  }
}

/**
 * Liga o log ao DOM.
 * raiz deve conter [data-campo="atual"] (região aria-live) e [data-campo="lista"] (<ol>).
 */
export function criarLog(raiz, { aoEscolher }) {
  const atual = raiz.querySelector('[data-campo="atual"]');
  const lista = raiz.querySelector('[data-campo="lista"]');
  let passos = [];
  let itens = [];

  lista.addEventListener('click', (evento) => {
    const botao = evento.target.closest('button[data-passo]');
    if (botao) aoEscolher(Number(botao.dataset.passo));
  });

  function carregar(novosPassos) {
    passos = novosPassos;
    itens = passos.map((_, i) => {
      const li = document.createElement('li');
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.dataset.passo = String(i);
      botao.textContent = `${i}. ${descreverPasso(passos, i)}`;
      li.append(botao);
      return li;
    });
    lista.replaceChildren(...itens);
  }

  function marcar(indice) {
    atual.textContent = `Passo ${indice} de ${passos.length - 1}. ${descreverPasso(passos, indice)}`;
    itens.forEach((li, i) => {
      const botao = li.firstElementChild;
      li.classList.toggle('atual', i === indice);
      li.classList.toggle('feito', i < indice);
      if (i === indice) botao.setAttribute('aria-current', 'step');
      else botao.removeAttribute('aria-current');
    });
    // rola só a lista (não a página) para manter o passo atual visível
    const li = itens[indice];
    if (li) lista.scrollTop = li.offsetTop - lista.clientHeight / 2 + li.clientHeight / 2;
  }

  return { carregar, marcar };
}
