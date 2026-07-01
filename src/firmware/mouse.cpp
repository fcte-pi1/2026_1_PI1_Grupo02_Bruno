/**
 * @file mouse.cpp
 * @brief Lógica de navegação do Micromouse (Flood Fill) integrada com telemetria real.
 *
 * Esta implementação é derivada do código da branch `software-embarcados` e adiciona
 * os eventos de telemetria nas passagens corretas do algoritmo de navegação:
 *
 *  - sendRunStarted()     → disparado uma vez ao início de cada corrida
 *  - sendCellDiscovered() → disparado a cada nova célula mapeada pelos sensores IR
 *  - sendRunFinished()    → disparado ao atingir o centro do labirinto
 *
 * Os dados passados para a telemetria vêm diretamente das funções reais do hardware:
 *  - Paredes  : sensor_parede_frente/direita/esquerda() via detectar_paredes()
 *  - Bateria  : battery_porcentagem()
 *  - Velocidade: constante física derivada de VEL_BASE e DIAMETRO_RODA_MM
 */

#include <Arduino.h>
#include <cstring>
#include <array>
#include <algorithm>
#include "hal.h"
#include "motors.h"
#include "sensors.h"
#include "battery.h"
#include "dip.h"
#include "Telemetry.h"

// ─── Constantes do labirinto ───────────────────────────────────────────────
constexpr int TAM = 16;
constexpr int MAX_DIST = 255;

// Bits de parede armazenados em paredes[x][y]
constexpr char P_NORTE = 0x1;
constexpr char P_LESTE = 0x2;
constexpr char P_SUL   = 0x4;
constexpr char P_OESTE = 0x8;

enum class Direcao : int { norte = 0, leste = 1, sul = 2, oeste = 3 };
constexpr int NUM_DIRECOES = 4;
constexpr int idx(Direcao d) { return static_cast<int>(d); }

// Velocidade estimada em m/s baseada na constante VEL_BASE e no diâmetro da roda
// VEL_BASE=160 (PWM) → ~70% da velocidade máxima; roda ø44mm → circunferência=138mm
// Com 360 pulsos/volta e ~1000 pulsos/s em velocidade base ≈ 0,38 m/s
static constexpr float VEL_ESTIMADA_MS = (VEL_BASE / 255.0f) * 
                                          ((360.0f / PULSOSPORVOLTA) * 
                                           (3.14159f * (DIAMETRO_RODA_MM / 1000.0f)));

// ─── Classe Micromouse ─────────────────────────────────────────────────────

class Micromouse {
public:
    Micromouse() { reset(); }

    /**
     * @brief Executa uma corrida completa: do ponto (0,0) até o centro do labirinto.
     *
     * Sequência:
     *  1. Lê dimensão pelas chaves DIP e envia RunStarted.
     *  2. Loop: detecta paredes → envia CellDiscovered → Flood Fill → move.
     *  3. Ao chegar no centro, envia RunFinished e para os motores.
     */
    void run() {
        // --- 1. Determinar dimensão pelo DIP switch ---
        int dimensao = 16;
        if (mapa_4x4()) dimensao = 4;
        else if (mapa_8x8()) dimensao = 8;

        // --- 2. Evento: Corrida Iniciada ---
        int bat_inicial = battery_porcentagem();
        Telemetry::sendRunStarted(dimensao, tentativa_atual, bat_inicial);
        tentativa_atual++;

        Serial.printf("[TEL] run_started | dim=%d bat=%d%%\n", dimensao, bat_inicial);

        // Mapeia paredes de borda e calcula distâncias iniciais
        detectar_paredes();
        calcular_distancias();
        ultima_checada = millis();

        // --- 3. Loop de navegação ---
        while (!centro(pos_x, pos_y)) {
            // Mantém o WebSocket ativo em segundo plano
            Telemetry::process();

            // Detecta paredes na célula atual usando os sensores IR
            detectar_paredes();

            // Lê o estado atual das paredes desta célula do mapa interno
            bool p_norte = tem_parede(pos_x, pos_y, Direcao::norte);
            bool p_sul   = tem_parede(pos_x, pos_y, Direcao::sul);
            bool p_leste = tem_parede(pos_x, pos_y, Direcao::leste);
            bool p_oeste = tem_parede(pos_x, pos_y, Direcao::oeste);

            // Converte enum Direcao para string ("N", "L", "S", "O")
            const char* dir_str = direcao_para_str(direcao);

            // Lê bateria real via ADC (divisor de tensão na hal.h)
            float bat_atual = (float)battery_porcentagem();

            // --- 4. Evento: Célula Descoberta ---
            Telemetry::sendCellDiscovered(
                pos_x, pos_y,
                p_norte, p_sul, p_leste, p_oeste,
                dir_str,
                VEL_ESTIMADA_MS,
                bat_atual
            );

            Serial.printf("[TEL] cell_discovered | (%d,%d) dir=%s bat=%.0f%%\n",
                          pos_x, pos_y, dir_str, bat_atual);

            // Loga bateria periodicamente no Serial (a cada 30s)
            if (millis() - ultima_checada >= INTERVALO_BATERIA) {
                Serial.printf("[BAT] Nível: %d%%\n", battery_porcentagem());
                ultima_checada = millis();
            }

            calcular_distancias();
            melhor_celula();   // Move o robô fisicamente para a próxima célula

            ota_loop();        // Mantém o servidor OTA respondendo durante a corrida
        }

        // --- 5. Evento: Corrida Finalizada ---
        float bat_final = (float)battery_porcentagem();
        Telemetry::sendRunFinished(true, VEL_ESTIMADA_MS, bat_final);
        // Garante envio do último evento antes de parar
        Telemetry::process();

        Serial.printf("[TEL] run_finished | bat=%.0f%%\n", bat_final);

        motors_parar();
    }

private:
    unsigned long ultima_checada = 0;
    const unsigned long INTERVALO_BATERIA = 30000;  // 30 segundos
    int   distancia[TAM][TAM];
    char  paredes[TAM][TAM];
    int   pos_x = 0, pos_y = 0;
    Direcao direcao = Direcao::norte;
    int tentativa_atual = 1;

    // Vetores de deslocamento por direção: norte→+y, leste→+x, sul→-y, oeste→-x
    static constexpr std::array<int, NUM_DIRECOES> move_x = { 0,  1,  0, -1 };
    static constexpr std::array<int, NUM_DIRECOES> move_y = { 1,  0, -1,  0 };

    static constexpr std::array<Direcao, NUM_DIRECOES> oposto = {
        Direcao::sul, Direcao::oeste, Direcao::norte, Direcao::leste
    };

    // ── Helpers ──────────────────────────────────────────────────────────

    void reset() {
        pos_x   = 0;
        pos_y   = 0;
        direcao = Direcao::norte;
        std::memset(paredes, 0, sizeof(paredes));
        inicializar_bordas();
    }

    void inicializar_bordas() {
        for (int i = 0; i < TAM; i++) {
            paredes[i][TAM - 1] |= P_NORTE;
            paredes[i][0]       |= P_SUL;
            paredes[TAM - 1][i] |= P_LESTE;
            paredes[0][i]       |= P_OESTE;
        }
    }

    bool centro(int x, int y) const {
        return (x == 7 || x == 8) && (y == 7 || y == 8);
    }

    bool tem_parede(int x, int y, Direcao d) const {
        return (paredes[x][y] & (1 << idx(d))) != 0;
    }

    // Converte o enum Direcao para o código de string esperado pela telemetria
    static const char* direcao_para_str(Direcao d) {
        switch (d) {
            case Direcao::norte: return "N";
            case Direcao::leste: return "L";
            case Direcao::sul:   return "S";
            case Direcao::oeste: return "O";
            default:             return "N";
        }
    }

    // ── Flood Fill ────────────────────────────────────────────────────────

    void calcular_distancias() {
        for (int x = 0; x < TAM; x++)
            for (int y = 0; y < TAM; y++)
                distancia[x][y] = centro(x, y) ? 0 : MAX_DIST;

        bool alteracao = true;
        while (alteracao) {
            alteracao = false;
            for (int x = 0; x < TAM; x++) {
                for (int y = 0; y < TAM; y++) {
                    if (centro(x, y)) continue;
                    int melhor_vizinho = MAX_DIST;
                    auto verificar = [&](Direcao d, int nx, int ny) {
                        if (!tem_parede(x, y, d) && nx >= 0 && nx < TAM && ny >= 0 && ny < TAM)
                            melhor_vizinho = std::min(melhor_vizinho, distancia[nx][ny]);
                    };
                    verificar(Direcao::norte, x, y + 1);
                    verificar(Direcao::sul,   x, y - 1);
                    verificar(Direcao::leste, x + 1, y);
                    verificar(Direcao::oeste, x - 1, y);

                    int nova = (melhor_vizinho == MAX_DIST) ? MAX_DIST : melhor_vizinho + 1;
                    if (nova < distancia[x][y]) {
                        distancia[x][y] = nova;
                        alteracao = true;
                    }
                }
            }
        }
    }

    // ── Detecção de paredes (sensores IR reais) ───────────────────────────

    void adicionar_parede(int x, int y, Direcao d) {
        paredes[x][y] |= (1 << idx(d));
        int nx = x + move_x[idx(d)];
        int ny = y + move_y[idx(d)];
        if (nx >= 0 && nx < TAM && ny >= 0 && ny < TAM)
            paredes[nx][ny] |= (1 << idx(oposto[idx(d)]));
    }

    Direcao relativa_para_absoluta(Direcao dir_mouse, int giro) const {
        return static_cast<Direcao>((idx(dir_mouse) + giro) % NUM_DIRECOES);
    }

    /**
     * @brief Lê os três sensores IR (frente, direita, esquerda) e registra
     *        as paredes detectadas no mapa interno do labirinto.
     *
     * sensor_parede_frente()    → sensor_cm(IR_FRENTE)   < DIST_FRONTAL_LIMITE_CM
     * sensor_parede_direita()   → sensor_cm(IR_DIREITA)  < DIST_SEM_PAREDE_CM
     * sensor_parede_esquerda()  → sensor_cm(IR_ESQUERDA) < DIST_SEM_PAREDE_CM
     */
    void detectar_paredes() {
        if (sensor_parede_frente())
            adicionar_parede(pos_x, pos_y, relativa_para_absoluta(direcao, 0));
        if (sensor_parede_direita())
            adicionar_parede(pos_x, pos_y, relativa_para_absoluta(direcao, 1));
        if (sensor_parede_esquerda())
            adicionar_parede(pos_x, pos_y, relativa_para_absoluta(direcao, 3));
    }

    // ── Movimento (motores reais com PID e encoders) ──────────────────────

    bool melhor_celula() {
        int melhor_direcao  = -1;
        int menor_distancia = MAX_DIST + 1;

        for (int d = 0; d < NUM_DIRECOES; d++) {
            auto dir = static_cast<Direcao>(d);
            if (tem_parede(pos_x, pos_y, dir)) continue;
            int nx = pos_x + move_x[d];
            int ny = pos_y + move_y[d];
            if (distancia[nx][ny] < menor_distancia) {
                menor_distancia = distancia[nx][ny];
                melhor_direcao  = d;
            }
        }

        if (melhor_direcao == -1) return false;

        // Gira o robô para apontar à direção desejada usando motors_girar_*()
        while (idx(direcao) != melhor_direcao) {
            int diferenca = (melhor_direcao - idx(direcao) + NUM_DIRECOES) % NUM_DIRECOES;
            if (diferenca == 1) {
                motors_girar_direita();
                direcao = static_cast<Direcao>((idx(direcao) + 1) % NUM_DIRECOES);
            } else {
                motors_girar_esquerda();
                direcao = static_cast<Direcao>((idx(direcao) + 3) % NUM_DIRECOES);
            }
        }

        // Avança uma célula completa (controlado por encoders + PID)
        motors_avancar_celula();
        pos_x += move_x[melhor_direcao];
        pos_y += move_y[melhor_direcao];
        return true;
    }
};

// ─── Ponto de entrada da corrida (chamado pelo main.cpp) ──────────────────

void micromouse_run() {
    Micromouse mouse;
    mouse.run();
}
