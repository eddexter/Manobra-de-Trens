#include <stdio.h>
#include <stdlib.h>
#include <locale.h>
#include "base.h"



int main()
{
    setlocale(LC_ALL, "Portuguese");
    int qtdvagoes, qtdareas, vagoesporarea, numesperado, inttemporal;
    int i, j, m, n, p, topotemp, totaltemp, contamanobra=-1;
    int movimentos = 0;

    printf("UEZO - TADS\n");
    printf("Estrutura de Dados\n");
    printf("ORGANIZADOR DE VAGÕES\n");
    printf("by Edgar Farias de Paula\n\n");

//Diálogos iniciais do trem e pilhas
    printf("Informe quantos vagões teremos no trem:\n");
    scanf("%d", &qtdvagoes);
    printf("Informe quantas áreas de manobra serão disponibilizadas:\n");
    scanf("%d", &qtdareas);
    printf("Informe quantos vagões cabem em cada área de manobra:\n");
    scanf("%d", &vagoesporarea);
    printf("Insira de 1 a %d a sequência de chegada dos vagões:\n", qtdvagoes);
    j = 1;
//Implementação da fila de entrada
    Fila *entrada;
    entrada = filacria();
    for (i = 0; i < qtdvagoes; i++)
    {
        printf("%do->", j);
        scanf("%d", &inttemporal);
        filainsere(entrada, inttemporal);
        j++;
    }
    printf("\nSequência de chegada do trem: ");
    filaimprime(entrada);
    printf("\n");

//Implementação das pilhas de manobra
    Pilha **manobra;
    manobra = (Pilha**)malloc(qtdareas*sizeof(Pilha*));
    for(m = 0; m < qtdareas; m++)
    {
        manobra[m] = criar_pilha();
    }
//Implementação da fila de saída
    Fila *saida;
    saida = filacria();

//Preparar uma saída do sistema
    system("cls");

    printf("ORGANIZADOR DE VAGÕES\n\n");
    printf("Fila de Entrada    <--------<\n");
    filaimprime(entrada);
    printf("\n");
    for (n = 0; n < qtdareas; n++)
    {
        printf("Área de Manobra %d\n", n+1);
        pilhaimprime(manobra[n]);
        printf("\n");
    }
    printf("Fila de saída    <--------<\n");
    filaimprime(saida);

//Implementação do loop de organização dos vagões
//Passo 1: Verificar se o número esperado está no topo das pilhas
    numesperado = 1;
    int x, pilhaorigem, comparador;
    getchar();

    do
    {
        pilhaorigem = -1;
        for (x = 0; x < qtdareas; x++)
        {
            comparador = topo(manobra[x]);
            if (comparador == numesperado)
                pilhaorigem = x;
        }


        //Retirando o número de uma área de manobra e levando pra saída
        if (pilhaorigem >= 0)
        {
            pop(manobra[pilhaorigem]);
            filainsere(saida, numesperado);
            numesperado++;
        }
        else
        {
            inttemporal = filaretira(entrada);
            if (inttemporal == numesperado)
            {
                filainsere(saida, numesperado);
                numesperado++;
            }
            else
            {
                for (p = 0; p < qtdareas; p++)
                {
                    topotemp = topo(manobra[p]);
                    totaltemp = pilhatotal(manobra[p]);
                    if ((totaltemp < vagoesporarea) && (inttemporal < topotemp || topotemp == 0) && inttemporal > 0)
                    {
                        push(manobra[p], inttemporal);
                        inttemporal = 0;
                        if (contamanobra < p)
                            contamanobra = p;
                    }
                }
                if (inttemporal > 0)
                {
                    qtdareas++;
                    manobra = (Pilha**) realloc(manobra, qtdareas*sizeof(Pilha*));
                    manobra[qtdareas-1] = criar_pilha();
                    contamanobra++;
                    push(manobra[contamanobra], inttemporal);
                }
            }
        }
        movimentos++;

        //Preparar uma saída do sistema
        getchar();
        system("cls");

        printf("ORGANIZADOR DE VAGÕES\n\n");
        printf("Fila de Entrada    <--------<\n");
        filaimprime(entrada);
        printf("\n");
        for (n = 0; n < qtdareas; n++)
        {
            printf("Área de Manobra %d\n", n+1);
            pilhaimprime(manobra[n]);
            printf("\n");
        }
        printf("Fila de saída    <--------<\n");
        filaimprime(saida);
    }
    while(numesperado != (qtdvagoes+1));

    printf("\n");
    printf("Seus vagões foram organizados com sucesso.\n");
    printf("O sistema organizou %d vagões.\n", qtdvagoes);
    printf("O sistema utilizou %d movimentos.\n", movimentos);
    printf("Foram utilizadas %d áreas de manobra.\n", contamanobra+1);

    return 0;
}

