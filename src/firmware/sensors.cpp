#include "sensors.h"
#include "hal.h"
#include <Arduino.h>

// esse código serve para configurarmos os sensores principalmente a questão da leitura deles e como eles vão se comportar
void sensors_init() {
    // aqui a gente configura o pino da placa usando o pinmode, e como o sensor só devolve o valor a gente coloca ele como input
    pinMode(IR_FRENTE, INPUT);
    pinMode(IR_ESQUERDA,   INPUT);
    pinMode(IR_DIREITA,    INPUT);
}


// leitura constante dos sensore
static int ler_sensor(int pino) {
    int soma = 0;
    for (int i = 0; i < 4; i++) soma += analogRead(pino);
    return soma / 4;
}

// retorna true se tem parede na frente 
bool sensor_parede_frente() {
    return (ler_sensor(IR_FRENTE) > IR_LIMITE);
}
// retorna true se tem parede na direita
bool sensor_parede_direita() {
    return ler_sensor(IR_DIREITA) > IR_LIMITE;
}

// retorna true se tem parede na esquerda
bool sensor_parede_esquerda() {
    return ler_sensor(IR_ESQUERDA) > IR_LIMITE;
}
