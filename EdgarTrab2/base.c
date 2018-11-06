#include <stdio.h>
#include <stdlib.h>
#include "base.h"

//Organização e Estrutura das Filas
struct vagao
{
    int info;
    struct vagao* prox;
};

struct fila
{
    struct vagao* inicio;
    struct vagao* fim;
};

Fila* filacria()
{
    Fila* f = (Fila*)malloc(sizeof(Fila));
    f->inicio = NULL;
    f->fim = NULL;
    return f;
}

int filavazia(Fila* f)
{
    if(f->inicio == NULL)
        return 1;
    return 0;
}

void filainsere(Fila* f, int n)
{
    Vagao* novo;
    novo = (Vagao*)malloc(sizeof(Vagao));
    novo->info = n;
    novo->prox = NULL;
    if (f->fim != NULL)
        f->fim->prox = novo;
    else
        f->inicio = novo;
    f->fim = novo;
}

int filaretira(Fila* f)
{
    Vagao* t;
    int v;
    if (filavazia(f))
    {
        printf("Fila vazia\n");
        return 0;
    }
    t = f->inicio;
    v = t->info;
    f->inicio = t->prox;

    if(f->inicio == NULL)
        f->fim = NULL;
    free(t);
    return v;
}

void filalibera(Fila* f)
{
    Vagao *q = f->inicio;
    while (q != NULL)
    {
        Vagao *t = q->prox;
        free(q);
        q = t;
    }
    free(f);
}

void filaimprime(Fila* f)
{
    if (filavazia(f))
    {
        printf("Fila vazia\n");
    }
    else
    {
    Vagao *p = f->inicio;
    Vagao *aux;
    while (p != NULL)
    {
        printf("%d ", p->info);
        aux = p->prox;
        p = aux;
    }
    printf(" \n");
    }
}


//Implementações da Pilha
struct pilha
{
    int total;
    Vagao *prim;
};

Pilha* criar_pilha()
{
    Pilha* p = (Pilha*) malloc(sizeof(Pilha));
    p->total = 0;
    p->prim = NULL;
    return p;
}

void push (Pilha* p, int v)
{
    Vagao* novo;
    novo = (Vagao*) malloc(sizeof(Vagao));
    novo->info = v;
    novo->prox = p->prim;
    p->prim = novo;
    p->total++;
}

int pop (Pilha* p)
{
    Vagao *t;
    int v;

    if(vazia(p))
    {
        printf("Pilha vazia\n");
        return 0;
    }
    t = p->prim;
    v = t->info;
    p->prim = t->prox;
    p->total--;
    free(t);
    return v;
}

int vazia (Pilha* p)
{
    if(p->prim == NULL)
        return 1;
    return 0;
}

void liberar_pilha (Pilha* p)
{
    Vagao *t, *q = p->prim;
    while (q != NULL)
    {
        t = q->prox;
        free(q);
        q = t;
        p->total--;
    }
    free(p);
}

int topo (Pilha* p)
{
    if (vazia(p))
        return 0;
    return p->prim->info;
}

void pilhaimprime(Pilha* p)
{
    Vagao *t, *q = p->prim;
    while (q != NULL)
    {
        t = q->prox;
        printf("%d ", q->info);
        q = t;
    }
    printf(" \n");
}

int pilhatotal(Pilha* p)
{
    return p->total;
}
