# Manobra de Trens (página web)

Plano completo em `../manobra.md`. Idioma: tudo em português do Brasil.

## Como rodar

- Testes: `npm test` (usa `node --test`, sem dependências).
- Página: os módulos ES **não carregam por `file://`**. Sirva a pasta por HTTP (extensão Live Server do VS Code, ou qualquer servidor estático) e abra `index.html`.

## Estrutura

- `js/motor.js`: simulação sem DOM (`simular`, `validar`). Port fiel do `main.c` + best-fit.
- `js/entrada.js`: leitura do formulário, validação de N e exemplos prontos (sem DOM).
- `js/patio.js`: layout do pátio (puro) e desenho em SVG. Os vagões são criados uma vez e só mudam de posição; a animação é transição CSS no `transform`.
- `js/controles.js`: play/pausa, anterior, próximo, início, fim, velocidade, slider. Guarda o índice do passo.
- `js/log.js`: texto de cada passo (`descreverPasso`, puro) e lista de passos.
- `js/resumo.js`: card de resultado (só aparece no último passo) e comparação de estratégias.
- `js/app.js`: estado da página e eventos. É o único que liga tudo.
- `test/`: `motor.test.js` (vetores do plano) e `logica-pura.test.js` (entrada, log, layout, comparação).

## Convenções

- O motor não depende de DOM e roda no Node e no navegador. Manter assim.
- Sem framework e sem build.
- Acessibilidade: cada vagão com `aria-label` ("Vagão 3"), controles por teclado, log com `aria-live="polite"`, `prefers-reduced-motion` respeitado.
- Layout responsivo: o SVG tem largura mínima e o pátio rola na horizontal em telas estreitas, acompanhando o vagão que se moveu.
- Antes de decisão de arquitetura nova, perguntar ao Edgar.
