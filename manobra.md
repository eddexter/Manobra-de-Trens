# Manobra de Trens (página web)

Reescrita de um trabalho de Estrutura de Dados (UEZO, AV2), originalmente feito em C por Edgar, agora como página web com visualização passo a passo.
Repositório original (C): https://github.com/eddexter/Manobra-de-Trens (pasta `EdgarTrab2/`: `main.c`, `base.c`, `base.h`).

Idioma: toda a interface, comentários e mensagens em português do Brasil.

## Objetivo

Simulador visual, passo a passo, do rearranjo de vagões num pátio de manobra, com tema ferroviário.
Roda 100% no navegador. Não há backend, banco de dados nem login.

## Regras do problema (README original)

- Trem com N vagões numerados de 1 a N. A saída precisa terminar em ordem crescente (1..N).
- Pátio: via de entrada (fila), via de saída (fila) e K trilhos de espera (pilhas, LIFO).
- Movimentos permitidos: entrada → trilho de espera, entrada → saída, trilho de espera → saída.
- O usuário informa: a sequência de chegada, o número inicial de trilhos e a capacidade máxima de cada trilho.
- A simulação mostra entrada, trilhos e saída a cada passo.
- Se os trilhos forem insuficientes, o simulador cria outros.
- No fim, mostra **trilhos usados** e **número de etapas**.

## Algoritmo original (fiel ao `main.c`)

A cada iteração acontece **um** movimento (1 etapa), nesta prioridade:

1. Se o número esperado está no **topo** de algum trilho de espera → trilho → saída.
2. Senão, retira o vagão da frente da entrada. Se for o esperado → entrada → saída.
3. Senão, **first-fit**: o primeiro trilho (menor índice) com `tamanho < capacidade` e (vazio **ou** topo > vagão) recebe o vagão.
4. Se nenhum serve, cria um trilho novo e coloca o vagão nele.

Detalhes:
- A regra "topo > vagão" mantém cada trilho ordenado (menor por cima), então o algoritmo nunca trava.
- Se mais de um trilho tem o esperado no topo, o C fica com o de **maior índice** (o laço não tem `break`). Na prática isso não ocorre com entrada válida, mas o port deve imitar.
- "Trilhos usados" = maior índice de trilho já usado + 1. Trem já ordenado dá 0.
- Etapas = quantidade de movimentos de vagão.

## Decisões já tomadas

| Tema | Decisão |
|---|---|
| Plataforma | Página web estática (HTML + CSS + JS), sem backend |
| Dados | Nada é salvo. Tudo vive na memória da página. |
| Resultado final | Card sempre visível no último passo, com trilhos usados e etapas |
| Visual | Tema ferroviário (SVG: trilhos, dormentes, vagões, locomotiva na entrada, plataforma na saída) |
| Estratégia padrão | First-fit, idêntica ao C |
| Estratégia extra | Best-fit, selecionável e comparável (ver abaixo) |
| Exemplos prontos | Botões de sequência: ordenada, inversa (pior caso), aleatória |

### Sugestões técnicas (confirmar com o Edgar antes de começar)

| Tema | Sugestão | Motivo |
|---|---|---|
| Stack | JavaScript puro com módulos ES, sem framework e sem build | Uma página pequena. Abre direto no navegador. |
| Testes do motor | `node --test` (nativo do Node, sem dependências) | Nada para instalar. |
| Hospedagem | GitHub Pages | Grátis, e o Edgar já tem conta no GitHub. |
| Desenho | SVG gerado por JS | Escala bem e anima com CSS. |

### Best-fit (estratégia extra)

Igual ao first-fit, só muda o passo 3: entre os trilhos que aceitam o vagão, escolhe o de **menor topo maior que o vagão**. Trilho vazio só é usado se não houver trilho com topo.
O usuário escolhe a estratégia num seletor, e há um botão "Comparar estratégias" que mostra as duas lado a lado (trilhos usados e etapas), já que o motor é rápido.

### Exemplos prontos e relação com o objetivo do trabalho

O README pede analisar a eficiência para diferentes tamanhos de trem e pátios. Por isso:
- **Ordenada** (1..N): melhor caso, N etapas, 0 trilhos.
- **Inversa** (N..1): pior caso, 2N-1 etapas.
- **Aleatória**: embaralha 1..N. Resultado varia.

## Arquitetura

Separar lógica e visual. O motor é JS puro, sem DOM, testável direto no Node.

```
/
├── index.html
├── css/
│   └── estilo.css          tema ferroviário, variáveis CSS para as cores
├── js/
│   ├── motor.js            simulação (sem DOM)
│   ├── app.js              estado da página e eventos
│   ├── patio.js            desenha o pátio em SVG
│   ├── controles.js        play/pausa, anterior, próximo, velocidade, slider, ir ao fim
│   ├── log.js              lista de passos com a regra aplicada
│   └── resumo.js           resultado final e comparação de estratégias
├── test/
│   └── motor.test.js
├── package.json            só o script "test": "node --test"
└── CLAUDE.md
```

Telas e blocos da página:
- **Formulário:** N, sequência, trilhos iniciais, capacidade, estratégia, botões de exemplo.
- **Pátio:** entrada à esquerda, saída à direita, trilhos de espera no meio. Cada trilho de espera é uma pilha com o topo voltado para a saída.
- **Controles** e **log** do passo atual, com a regra explicada em português ("É o próximo da saída: vai direto").
- **Resultado final:** trilhos usados e etapas, em destaque no último passo.

### Contrato do motor

```js
simular({ sequencia: number[], trilhosIniciais: number, capacidade: number, estrategia: 'first-fit' | 'best-fit' })
// retorna
{
  passos: [{
    n: number,                       // 0 = estado inicial
    movimento: { vagao, de, para } | null,   // de/para: 'entrada' | 'saida' | { trilho: k }
    regra: 'esperado-no-topo' | 'direto-saida' | 'first-fit' | 'best-fit' | 'novo-trilho' | null,
    trilhoCriado: boolean,
    estado: { entrada: number[], trilhos: number[][], saida: number[] }   // trilhos: do fundo para o topo
  }],
  resumo: { etapas: number, trilhosUsados: number, estrategia }
}
```

O motor gera todos os passos de uma vez. A tela só guarda um índice de passo, então voltar, pular e dar play são triviais.

### Validações (o C não tinha)

- A sequência deve ser uma permutação de 1..N, sem repetidos nem fora do intervalo.
- Capacidade ≥ 1. Trilhos iniciais ≥ 0. N ≥ 1.
- Mensagens de erro em português, mostradas no formulário.

## Vetores de teste

Gerados por um port em Python do `main.c`, com trilhos iniciais = 0 e capacidade grande (99), salvo indicação.
**Confirmar 2 ou 3 deles rodando `EdgarTrab2/bin/Debug/EdgarTrab2.exe` no Windows.**

| Sequência | Capacidade | Estratégia | Etapas | Trilhos usados |
|---|---|---|---|---|
| 1 2 3 4 5 6 | 99 | first-fit | 6 | 0 |
| 6 5 4 3 2 1 | 99 | first-fit | 11 | 1 |
| 6 5 4 3 2 1 | 3 | first-fit | 11 | 2 |
| 10 9 8 7 6 5 4 3 2 1 | 99 | first-fit | 19 | 1 |
| 10 9 8 7 6 5 4 3 2 1 | 3 | first-fit | 19 | 3 |
| 5 3 6 1 4 2 | 99 | first-fit | 10 | 2 |
| 2 5 1 4 6 3 | 99 | first-fit | 10 | 3 |
| 2 5 1 4 6 3 | 99 | best-fit | 10 | 2 |
| 1 3 6 2 5 7 4 | 99 | first-fit | 11 | 3 |
| 1 3 6 2 5 7 4 | 99 | best-fit | 11 | 2 |

Também testar: trilhos iniciais maiores que o necessário (trilhos extras não usados não contam), capacidade 1, N = 1, entrada inválida.

## Fases

| Fase | Entrega |
|---|---|
| 1 | Projeto base (`index.html`, `package.json`) + `motor.js` + testes (vetores acima) |
| 2 | `patio.js`: pátio estático em SVG, tema ferroviário, desenhando um estado |
| 3 | `controles.js` + `log.js`: navegação passo a passo e regra aplicada |
| 4 | Animação do vagão entre trilhos, play automático, velocidade |
| 5 | Formulário com validação, exemplos prontos e `resumo.js` (resultado final na tela) |
| 6 | Best-fit e comparação de estratégias |
| 7 | Responsivo (celular), acessibilidade e publicação no GitHub Pages |

## Convenções para o Claude Code

- Começar pela Fase 1 e só avançar com os testes passando (`npm test`).
- Manter o motor sem dependência de DOM, para rodar no Node e no navegador.
- Sem framework e sem etapa de build, a menos que o Edgar peça.
- Acessibilidade: cada vagão com `aria-label` ("Vagão 3"), controles operáveis por teclado, log com `aria-live="polite"`, e respeitar `prefers-reduced-motion` nas animações.
- Layout responsivo: o pátio precisa caber em telas estreitas (rolagem horizontal ou escala do SVG).
- Antes de qualquer decisão de arquitetura nova, perguntar ao Edgar.
