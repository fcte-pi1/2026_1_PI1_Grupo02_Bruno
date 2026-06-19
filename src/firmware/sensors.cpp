#include "sensors.h"
#include "hal.h"
#include <Arduino.h>

// Tabela de calibração TCRT5000: tensão (V) por distância (cm), de 1cm a 12cm
static const float tabela_v[] = {0.14, 0.19, 0.24, 1.31, 1.82, 2.04, 2.24, 2.40, 2.55, 2.65, 2.72, 2.76};

void sensors_init() {
    pinMode(IR_FRENTE,   INPUT);
    pinMode(IR_ESQUERDA, INPUT);
    pinMode(IR_DIREITA,  INPUT);
}

static int ler_sensor(int pino) {
    int soma = 0;
    for (int i = 0; i < 4; i++) soma += analogRead(pino);
    return soma / 4;
}

// converte leitura ADC para tensão em volts
float sensor_volts(int pino) {
    return (ler_sensor(pino) / 4095.0f) * 3.3f;
}

// estima distância real em cm (interpolação na tabela + correção de offset)
float sensor_cm(int pino) {
    float v = sensor_volts(pino);
    if (v <= tabela_v[0])  return 1.0f;
    if (v >= tabela_v[11]) return 12.0f + SENSOR_OFFSET_CM;
    for (int i = 0; i < 11; i++) {
        if (v >= tabela_v[i] && v <= tabela_v[i + 1]) {
            float frac = (v - tabela_v[i]) / (tabela_v[i + 1] - tabela_v[i]);
            return (i + 1) + frac + SENSOR_OFFSET_CM;
        }
    }
    return -1.0f;
}

// retorna true se há parede na frente — robô está no centro da célula, pronto para girar
bool sensor_parede_frente() {
    return sensor_cm(IR_FRENTE) < DIST_FRONTAL_LIMITE_CM;
}

// retorna true se há parede na direita
bool sensor_parede_direita() {
    return sensor_cm(IR_DIREITA) < DIST_SEM_PAREDE_CM;
}

// retorna true se há parede na esquerda
bool sensor_parede_esquerda() {
    return sensor_cm(IR_ESQUERDA) < DIST_SEM_PAREDE_CM;
}

// Erro lateral em cm para uso no PID de alinhamento:
//   positivo → robô desviado para a direita → corrigir virando à esquerda
//   negativo → robô desviado para a esquerda → corrigir virando à direita
//   zero     → sem paredes laterais detectadas, sem referência
float sensor_erro_lateral() {
    float esq = sensor_cm(IR_ESQUERDA);
    float dir = sensor_cm(IR_DIREITA);
    bool tem_esq = (esq < DIST_SEM_PAREDE_CM);
    bool tem_dir = (dir < DIST_SEM_PAREDE_CM);

    if (tem_esq && tem_dir) return esq - dir;
    if (tem_esq)            return esq - DIST_LATERAL_ALVO_CM;
    if (tem_dir)            return DIST_LATERAL_ALVO_CM - dir;
    return 0.0f;
}

// retorna true se o desvio lateral supera a margem e precisa de correção
bool sensor_precisa_corrigir() {
    return fabsf(sensor_erro_lateral()) > DIST_LATERAL_MARGEM_CM;
}
