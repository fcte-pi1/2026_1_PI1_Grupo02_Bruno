#include "battery.h"
#include "hal.h"
#include <Arduino.h>

void battery_init() {
    pinMode(BATERIA, INPUT);
}

static float ler_tensao_bat() {

    float tensao = analogRead(BATERIA);

    float v_pino = (tensao/BAT_ADC_BITS) * BAT_VREF;

    float v_bat = v_pino * (BAT_R1 +BAT_R2) / BAT_R2;
    v_bat = v_bat * BAT_CAL_FATOR;
    return v_bat;
}

    

float battery_tensao() {
    return ler_tensao_bat();
}

int battery_porcentagem() {
    float v = ler_tensao_bat();

    if (v >= BAT_VMAX) return 100;
    if (v <= BAT_VMIN) return 0;

    float pct = (v - BAT_VMIN) / (BAT_VMAX - BAT_VMIN) * 100.0f;
    return (int)pct;
}
