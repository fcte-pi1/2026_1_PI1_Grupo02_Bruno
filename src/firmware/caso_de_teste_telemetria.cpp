#include <Arduino.h>
#include "hal.h"
#include "sensors.h"
#include "battery.h"
#include "dip.h"
#include "ota.h"
#include "Telemetry.h"

static constexpr float VEL_ESTIMADA_MS_TESTE =
    (VEL_BASE / 255.0f) *
    ((360.0f / PULSOSPORVOLTA) *
     (3.14159f * (DIAMETRO_RODA_MM / 1000.0f)));

void telemetria_run_teste() {
    int dimensao = 16;
    if (mapa_4x4()) dimensao = 4;
    else if (mapa_8x8()) dimensao = 8;

    int bat_inicial = battery_porcentagem();
    Telemetry::sendRunStarted(dimensao, 99, bat_inicial);
    Serial.printf("[TEL-TESTE] run_started | dim=%d bat=%d%%\n", dimensao, bat_inicial);

    unsigned long ultima_checada = millis();

    for (int passo = 0; passo < 10; passo++) {
        Telemetry::process();
        ota_loop();

        bool p_norte = sensor_parede_frente();
        bool p_sul   = false;
        bool p_leste = sensor_parede_direita();
        bool p_oeste = sensor_parede_esquerda();
        float bat    = (float)battery_porcentagem();

        Telemetry::sendCellDiscovered(
            passo, 0,
            p_norte, p_sul, p_leste, p_oeste,
            "N", VEL_ESTIMADA_MS_TESTE, bat
        );
        Serial.printf("[TEL-TESTE] cell_discovered | (%d,0) bat=%.0f%%\n", passo, bat);

        if (millis() - ultima_checada >= 30000) {
            Serial.printf("[BAT] Nível: %d%%\n", battery_porcentagem());
            ultima_checada = millis();
        }

        delay(500);
    }

    float bat_final = (float)battery_porcentagem();
    Telemetry::sendRunFinished(true, VEL_ESTIMADA_MS_TESTE, bat_final);
    Telemetry::process();
    Serial.printf("[TEL-TESTE] run_finished | bat=%.0f%%\n", bat_final);
    Serial.println("[TEL-TESTE] Teste concluido.");
}
