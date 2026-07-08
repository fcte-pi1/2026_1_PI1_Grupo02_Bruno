#include <Arduino.h>
#include <cstring>
#include <array>
#include <algorithm>
#include "hal.h"
#include "motors.h"
#include "sensors.h"
#include "battery.h"
#include "dip.h"
#include "ota.h"
#include "Telemetry.h"

constexpr int TAM_CT      = 16;
constexpr int MAX_DIST_CT = 255;

constexpr char PCT_NORTE = 0x1;
constexpr char PCT_LESTE = 0x2;
constexpr char PCT_SUL   = 0x4;
constexpr char PCT_OESTE = 0x8;

enum class DirecaoCT : int { norte = 0, leste = 1, sul = 2, oeste = 3 };
constexpr int NUM_DIR_CT = 4;
constexpr int idxCT(DirecaoCT d) { return static_cast<int>(d); }

static constexpr float VEL_ESTIMADA_MS =
    (VEL_BASE / 255.0f) *
    ((360.0f / PULSOSPORVOLTA) *
     (3.14159f * (DIAMETRO_RODA_MM / 1000.0f)));

class MicromouseComTelemetria {
public:
    MicromouseComTelemetria() { reset(); }

    void run() {
        int dimensao = 16;
        if (mapa_4x4()) dimensao = 4;
        else if (mapa_8x8()) dimensao = 8;

        int bat_inicial = battery_porcentagem();
        Telemetry::sendRunStarted(dimensao, tentativa_atual, bat_inicial);
        tentativa_atual++;
        Serial.printf("[TEL] run_started | dim=%d bat=%d%%\n", dimensao, bat_inicial);

        detectar_paredes();
        calcular_distancias();
        ultima_checada = millis();

        while (!centro(pos_x, pos_y)) {
            Telemetry::process();

            detectar_paredes();

            bool p_norte  = tem_parede(pos_x, pos_y, DirecaoCT::norte);
            bool p_sul    = tem_parede(pos_x, pos_y, DirecaoCT::sul);
            bool p_leste  = tem_parede(pos_x, pos_y, DirecaoCT::leste);
            bool p_oeste  = tem_parede(pos_x, pos_y, DirecaoCT::oeste);
            const char* dir_str   = direcao_para_str(direcao);
            float       bat_atual = (float)battery_porcentagem();

            Telemetry::sendCellDiscovered(
                pos_x, pos_y,
                p_norte, p_sul, p_leste, p_oeste,
                dir_str, VEL_ESTIMADA_MS, bat_atual
            );
            Serial.printf("[TEL] cell_discovered | (%d,%d) dir=%s bat=%.0f%%\n",
                          pos_x, pos_y, dir_str, bat_atual);

            if (millis() - ultima_checada >= INTERVALO_BATERIA) {
                Serial.printf("[BAT] Nível: %d%%\n", battery_porcentagem());
                ultima_checada = millis();
            }

            calcular_distancias();
            melhor_celula();
            ota_loop();
        }

        float bat_final = (float)battery_porcentagem();
        Telemetry::sendRunFinished(true, VEL_ESTIMADA_MS, bat_final);
        Telemetry::process();
        Serial.printf("[TEL] run_finished | bat=%.0f%%\n", bat_final);

        motors_parar();
    }

private:
    unsigned long ultima_checada          = 0;
    const unsigned long INTERVALO_BATERIA = 30000;
    int       distancia[TAM_CT][TAM_CT];
    char      paredes[TAM_CT][TAM_CT];
    int       pos_x = 0, pos_y = 0;
    DirecaoCT direcao = DirecaoCT::norte;
    int       tentativa_atual = 1;

    static constexpr std::array<int, NUM_DIR_CT> move_x = { 0,  1,  0, -1 };
    static constexpr std::array<int, NUM_DIR_CT> move_y = { 1,  0, -1,  0 };
    static constexpr std::array<DirecaoCT, NUM_DIR_CT> oposto = {
        DirecaoCT::sul, DirecaoCT::oeste, DirecaoCT::norte, DirecaoCT::leste
    };

    void reset() {
        pos_x   = 0;
        pos_y   = 0;
        direcao = DirecaoCT::norte;
        std::memset(paredes, 0, sizeof(paredes));
        inicializar_bordas();
    }

    void inicializar_bordas() {
        for (int i = 0; i < TAM_CT; i++) {
            paredes[i][TAM_CT - 1] |= PCT_NORTE;
            paredes[i][0]          |= PCT_SUL;
            paredes[TAM_CT - 1][i] |= PCT_LESTE;
            paredes[0][i]          |= PCT_OESTE;
        }
    }

    bool centro(int x, int y) const {
        return (x == 7 || x == 8) && (y == 7 || y == 8);
    }

    bool tem_parede(int x, int y, DirecaoCT d) const {
        return (paredes[x][y] & (1 << idxCT(d))) != 0;
    }

    static const char* direcao_para_str(DirecaoCT d) {
        switch (d) {
            case DirecaoCT::norte: return "N";
            case DirecaoCT::leste: return "L";
            case DirecaoCT::sul:   return "S";
            case DirecaoCT::oeste: return "O";
            default:               return "N";
        }
    }

    void calcular_distancias() {
        for (int x = 0; x < TAM_CT; x++)
            for (int y = 0; y < TAM_CT; y++)
                distancia[x][y] = centro(x, y) ? 0 : MAX_DIST_CT;

        bool alteracao = true;
        while (alteracao) {
            alteracao = false;
            for (int x = 0; x < TAM_CT; x++) {
                for (int y = 0; y < TAM_CT; y++) {
                    if (centro(x, y)) continue;
                    int melhor_vizinho = MAX_DIST_CT;
                    auto verificar = [&](DirecaoCT d, int nx, int ny) {
                        if (!tem_parede(x, y, d) && nx >= 0 && nx < TAM_CT && ny >= 0 && ny < TAM_CT)
                            melhor_vizinho = std::min(melhor_vizinho, distancia[nx][ny]);
                    };
                    verificar(DirecaoCT::norte, x, y + 1);
                    verificar(DirecaoCT::sul,   x, y - 1);
                    verificar(DirecaoCT::leste, x + 1, y);
                    verificar(DirecaoCT::oeste, x - 1, y);

                    int nova = (melhor_vizinho == MAX_DIST_CT) ? MAX_DIST_CT : melhor_vizinho + 1;
                    if (nova < distancia[x][y]) {
                        distancia[x][y] = nova;
                        alteracao = true;
                    }
                }
            }
        }
    }

    void adicionar_parede(int x, int y, DirecaoCT d) {
        paredes[x][y] |= (1 << idxCT(d));
        int nx = x + move_x[idxCT(d)];
        int ny = y + move_y[idxCT(d)];
        if (nx >= 0 && nx < TAM_CT && ny >= 0 && ny < TAM_CT)
            paredes[nx][ny] |= (1 << idxCT(oposto[idxCT(d)]));
    }

    DirecaoCT relativa_para_absoluta(DirecaoCT dir_mouse, int giro) const {
        return static_cast<DirecaoCT>((idxCT(dir_mouse) + giro) % NUM_DIR_CT);
    }

    void detectar_paredes() {
        if (sensor_parede_frente())
            adicionar_parede(pos_x, pos_y, relativa_para_absoluta(direcao, 0));
        if (sensor_parede_direita())
            adicionar_parede(pos_x, pos_y, relativa_para_absoluta(direcao, 1));
        if (sensor_parede_esquerda())
            adicionar_parede(pos_x, pos_y, relativa_para_absoluta(direcao, 3));
    }

    bool melhor_celula() {
        int melhor_direcao  = -1;
        int menor_distancia = MAX_DIST_CT + 1;

        for (int d = 0; d < NUM_DIR_CT; d++) {
            if (tem_parede(pos_x, pos_y, static_cast<DirecaoCT>(d))) continue;
            int nx = pos_x + move_x[d];
            int ny = pos_y + move_y[d];
            if (distancia[nx][ny] < menor_distancia) {
                menor_distancia = distancia[nx][ny];
                melhor_direcao  = d;
            }
        }

        if (melhor_direcao == -1) return false;

        while (idxCT(direcao) != melhor_direcao) {
            int diferenca = (melhor_direcao - idxCT(direcao) + NUM_DIR_CT) % NUM_DIR_CT;
            if (diferenca == 1) {
                motors_girar_direita();
                direcao = static_cast<DirecaoCT>((idxCT(direcao) + 1) % NUM_DIR_CT);
            } else {
                motors_girar_esquerda();
                direcao = static_cast<DirecaoCT>((idxCT(direcao) + 3) % NUM_DIR_CT);
            }
        }

        motors_avancar_celula();
        pos_x += move_x[melhor_direcao];
        pos_y += move_y[melhor_direcao];
        return true;
    }
};

void micromouse_run_com_telemetria() {
    MicromouseComTelemetria mouse;
    mouse.run();
}
