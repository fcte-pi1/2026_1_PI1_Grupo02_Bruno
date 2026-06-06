#include "battery.h"
#include "hal.h"
#include <Arduino.h>

void battery_init() {
    // pino ADC como entrada analógica (pinMode não é obrigatório no ESP32
    // mas deixamos explícito pra ficar claro no código)
    pinMode(BATERIA, INPUT);
}

// faz a média de 8 leituras pra reduzir ruído do ADC
static float ler_tensao_bat() {
    long soma = 0;
    for (int i = 0; i < 8; i++) {
        soma += analogRead(BATERIA);
    }
    float media = soma / 8.0f;

    // converte a leitura ADC (0–4095) pra tensão no pino (0–3.3V)
    float v_pino = (media / BAT_ADC_BITS) * BAT_VREF;

    // reverte o divisor de tensão pra obter a tensão real da bateria
    // V_bat = V_pino × (R1 + R2) / R2
    float v_bat = v_pino * (BAT_R1 + BAT_R2) / BAT_R2;

    return v_bat;
}

float battery_tensao() {
    return ler_tensao_bat();
}

int battery_porcentagem() {
    float v = ler_tensao_bat();

    // limita nos extremos antes de fazer a regra de 3
    if (v >= BAT_VMAX) return 100;
    if (v <= BAT_VMIN) return 0;

    
    float pct = (v - BAT_VMIN) / (BAT_VMAX - BAT_VMIN) * 100.0f;
    return (int)pct;
}