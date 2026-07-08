/**
 * @file main.cpp
 * @brief Ponto de entrada do firmware do Micromouse ESP32 com telemetria integrada.
 *
 * Fluxo de execução:
 *
 *  setup()
 *    ├─ sensors_init()       → configura pinos dos sensores IR (TCRT5000)
 *    ├─ dip_init()           → configura chave DIP START/MAPA_4X4/MAPA_8X8
 *    ├─ battery_init()       → configura pino ADC do divisor de tensão da bateria
 *    ├─ motors_init()        → configura ponte H (TB6612FNG), PWM e encoders
 *    ├─ ota_init()           → sobe hotspot Wi-Fi ("rataturing") e servidor OTA
 *    └─ Telemetry::init()    → abre conexão WebSocket com o backend
 *
 *  loop()
 *    ├─ ota_loop()           → mantém servidor OTA e Wi-Fi vivos
 *    ├─ Telemetry::process() → processa fila de eventos e mantém WebSocket ativo
 *    └─ start() == HIGH?
 *         └─ micromouse_run_com_telemetria() → executa navegação Flood Fill com telemetria
 *
 * ATENÇÃO: Antes de fazer upload, configure o IP do backend em Telemetry.cpp:
 *   const char* host = "IP_DO_SEU_COMPUTADOR";  // Ex: "192.168.4.2"
 *
 * O hotspot da ESP32 usa a rede definida em credentials.h (padrão: "rataturing").
 * Conecte o computador nessa rede e execute o backend Django antes de ligar o robô.
 */

#include <Arduino.h>
#include "hal.h"
#include "motors.h"
#include "sensors.h"
#include "battery.h"
#include "ota.h"
#include "dip.h"
#include "Telemetry.h"

void micromouse_run_com_telemetria();

void setup() {
    Serial.begin(115200);

    // Inicialização do hardware
    sensors_init();
    dip_init();
    battery_init();
    motors_init();

    // Inicialização da rede: sobe hotspot Wi-Fi "rataturing" e servidor OTA em /update
    ota_init();

    // Inicialização da telemetria: abre WebSocket para o backend Django
    // ATENÇÃO: o host em Telemetry.cpp deve apontar para o IP correto do servidor
    Telemetry::init();

    Serial.println("=== Micromouse pronto ===");
    Serial.println("Aguardando chave START...");
    dip_print();
}

void loop() {
    // Mantém o servidor OTA respondendo (necessário para atualizações OTA)
    ota_loop();

    // Processa o buffer de telemetria e mantém a conexão WebSocket ativa
    Telemetry::process();

    // Aguarda a chave DIP START (pino 27) ser ativada para iniciar a corrida
    if (start()) {
        Serial.println("=== START ativado — iniciando corrida ===");
        micromouse_run_com_telemetria();
        Serial.println("=== Corrida finalizada — aguardando reset ===");

        // Aguarda o operador desligar a chave START antes de permitir nova corrida
        while (start()) {
            ota_loop();
            Telemetry::process();
            delay(100);
        }
    }
}
