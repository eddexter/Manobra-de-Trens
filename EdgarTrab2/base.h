#ifndef BASE_H_INCLUDED
#define BASE_H_INCLUDED

//Organização e estrutura das filas
typedef struct vagao Vagao;
typedef struct fila Fila;
Fila* filacria();
int filavazia(Fila* f);
void filainsere(Fila* f, int n);
int filaretira(Fila* f);
void filalibera(Fila* f);
void filaimprime(Fila* f);

//Organização e estrutura da pilha
typedef struct pilha Pilha;
Pilha* criar_pilha();
void push (Pilha* p, int v);
int pop (Pilha* p);
int vazia (Pilha* p);
void liberar_pilha (Pilha* p);
int topo (Pilha* p);
void pilhaimprime(Pilha* p);
int pilhatotal(Pilha* p);

#endif // BASE_H_INCLUDED
