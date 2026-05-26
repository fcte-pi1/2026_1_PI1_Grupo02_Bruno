#include <stdio.h>
#include <stdbool.h>
#include <string.h>

#include "API.h"

//Lembrar de fazer as configuracoes para quando a chave do micromouse mudar o programa trocar o tamanho do mapa

#define tam  16
#define max  255
#define p_norte  0x1
#define p_leste  0x2
#define p_sul    0x4
#define p_oeste  0x8

typedef enum { norte = 0, leste = 1, sul = 2, oeste = 3 } Direcao;


static int distancia[tam][tam]; 
static char paredes[tam][tam];   
static int rataturing_x, rataturing_y;  
static Direcao rataturing_direcao;    

static const int move_x[4] = {  0, 1,  0, -1 };
static const int move_Y[4] = {  1, 0, -1,  0 };

static const Direcao oposto[4] = { sul, oeste, norte, leste };

//Vai ter que dar um jeito de mudar essa parte tbm mas ainda nao sei como 
static bool centro(int x, int y) {
    return (x == 7 || x == 8) && (y == 7 || y == 8);}

static bool tem_parede(int x, int y, Direcao d) {
    return (paredes[x][y] & (1 << d)) != 0;}

static void calcular_distancias(void) {
    for (int x = 0; x < tam; x++)
        for (int y = 0; y < tam; y++)
            distancia[x][y] = centro(x, y) ? 0 : max;

    int alteracao = 1;
    while (alteracao) {
        alteracao = 0;
        for (int x = 0; x < tam; x++) {
            for (int y = 0; y < tam; y++) {
                if (centro(x, y)) continue;

                int melhor_vizinho = max;

                if (!tem_parede(x, y, norte) && y + 1 < tam && distancia[x][y+1] < melhor_vizinho)
                    melhor_vizinho = distancia[x][y+1];
                if (!tem_parede(x, y, sul)   && y - 1 >= 0  && distancia[x][y-1] < melhor_vizinho)
                    melhor_vizinho = distancia[x][y-1];
                if (!tem_parede(x, y, leste) && x + 1 < tam && distancia[x+1][y] < melhor_vizinho)
                    melhor_vizinho = distancia[x+1][y];
                if (!tem_parede(x, y, oeste) && x - 1 >= 0  && distancia[x-1][y] < melhor_vizinho)
                    melhor_vizinho = distancia[x-1][y];

                int nova_distancia = (melhor_vizinho == max) ? max : melhor_vizinho + 1;
                if (nova_distancia < distancia[x][y]) {
                    distancia[x][y] = nova_distancia;
                    alteracao = 1;
                }
            }
        }
    }
}

static void atualizar_tela(void) {
    char texto[8];
    for (int x = 0; x < tam; x++) {
        for (int y = 0; y < tam; y++) {
            if (distancia[x][y] == max)
                API_setText(x, y, "?");
            else {
                snprintf(texto, sizeof texto, "%d", distancia[x][y]);
                API_setText(x, y, texto);
            }
            if (centro(x, y))
                API_setColor(x, y, 'G'); 
        }
    }
    API_setColor(rataturing_x, rataturing_y, 'Y'); 
}

static void adicionar_parede(int x, int y, Direcao d) {
    paredes[x][y] |= (1 << d);
    int nx = x + move_x[d], ny = y + move_Y[d];
    if (nx >= 0 && nx < tam && ny >= 0 && ny < tam)
        paredes[nx][ny] |= (1 << oposto[d]);

    char letra_direcao = "nesw"[d];
    API_setWall(x, y, letra_direcao);
}


static Direcao relativa_para_absoluta(Direcao direcao_rato, int giro) {
    return (Direcao)((direcao_rato + giro) % 4);
}

static void detectar_paredes(void) {
    if (API_wallFront()) adicionar_parede(rataturing_x, rataturing_y, relativa_para_absoluta(rataturing_direcao, 0));
    if (API_wallRight()) adicionar_parede(rataturing_x, rataturing_y, relativa_para_absoluta(rataturing_direcao, 1));
    if (API_wallLeft())  adicionar_parede(rataturing_x, rataturing_y, relativa_para_absoluta(rataturing_direcao, 3));
}


static bool mover_para_melhor_celula(void) {
    int melhor_direcao = -1;
    int menor_distancia = max + 1;

    for (int d = 0; d < 4; d++) {
        if (tem_parede(rataturing_x, rataturing_y, (Direcao)d)) continue;
        int nx = rataturing_x + move_x[d], ny = rataturing_y + move_Y[d];
        if (distancia[nx][ny] < menor_distancia) {
            menor_distancia = distancia[nx][ny];
            melhor_direcao  = d;
        }
    }

    if (melhor_direcao == -1) return false;

    while ((int)rataturing_direcao != melhor_direcao) {
        int diferenca = (melhor_direcao - (int)rataturing_direcao + 4) % 4;
        if (diferenca == 1) {
            API_turnRight();
            rataturing_direcao = (Direcao)((rataturing_direcao + 1) % 4);
        } else {
            API_turnLeft();
            rataturing_direcao = (Direcao)((rataturing_direcao + 3) % 4);
        }
    }

    API_moveForward();
    rataturing_x += move_x[melhor_direcao];
    rataturing_y += move_Y[melhor_direcao];
    return true;
}


int main(void) {
    rataturing_x = 0;
    rataturing_y = 0;
    rataturing_direcao = norte;
    memset(paredes, 0, sizeof paredes);

    for (int i = 0; i < tam; i++) {
        paredes[i][tam - 1] |= p_norte;
        paredes[i][0]       |= p_sul;
        paredes[tam - 1][i] |= p_leste;
        paredes[0][i]       |= p_oeste;
    }

    calcular_distancias();
    atualizar_tela();

    while (!centro(rataturing_x, rataturing_y)) {
        detectar_paredes();
        calcular_distancias();
        atualizar_tela();
        mover_para_melhor_celula();
    }

    API_setColor(rataturing_x, rataturing_y, 'G');
    return 0;
}