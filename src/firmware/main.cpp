#include <Arduino.h>
#include <cstring>
#include <array>
#include <algorithm>
#include <stdexcept>
#include "hal.h"
#include "motors.h"
#include "sensors.h"
#include "battery.h"
#include "ota.h"
#include "dip.h"

// seguindo a mesma lógica do código do simulador mms mas agora com funções declaradas e não apenas api do simulador
constexpr int TAM = 16;
constexpr int MAX = 255;
constexpr char P_NORTE = 0x1;
constexpr char P_LESTE = 0x2;
constexpr char P_SUL   = 0x4;
constexpr char P_OESTE = 0x8;
enum class Direcao : int { norte = 0, leste = 1, sul = 2, oeste = 3};
constexpr int NUM_DIRECOES = 4;
constexpr int idx(Direcao d) { return static_cast<int>(d);}

class Micromouse {
public:
    Micromouse() {reset();}

    void run() {
        detectar_paredes();
        calcular_distancias();
        ultima_checada = millis();
        while (!centro(pos_x, pos_y)) {
            detectar_paredes();
            calcular_distancias();
            melhor_celula();
            if (millis() - ultima_checada >= INTERVALO_BATERIA) {
                int bat = battery_porcentagem();
                Serial.print("Nivel da Bateria: ");
                Serial.print(bat);
                Serial.println("%");
                
                ultima_checada = millis(); // Reseta o cronômetro
            }
            ota_loop(); // mantém o servidor OTA respondendo mesmo durante a corrida
        }
        // chegou ao centro para os motores
        motors_parar();
    }

private:
    unsigned long ultima_checada = 0;
    const unsigned long INTERVALO_BATERIA = 30000;
    int  distancia[TAM][TAM];
    char paredes[TAM][TAM];
    int  pos_x, pos_y;
    Direcao direcao;
    static constexpr std::array<int, NUM_DIRECOES> move_x = {0, 1,  0, -1};
    static constexpr std::array<int, NUM_DIRECOES> move_y = {1, 0, -1, 0};
    static constexpr std::array<Direcao, NUM_DIRECOES> oposto = {Direcao::sul, Direcao::oeste, Direcao::norte, Direcao::leste
    };
    

    void reset() {
        pos_x  = 0;
        pos_y  = 0;
        direcao  = Direcao::norte;
        std::memset(paredes, 0, sizeof(paredes));
        inicializar_bordas();
    }

    void inicializar_bordas() {
        for (int i = 0; i < TAM; i++) {
            paredes[i][TAM - 1]  |= P_NORTE;
            paredes[i][0]  |= P_SUL;
            paredes[TAM - 1][i] |= P_LESTE;
            paredes[0][i]  |= P_OESTE;
        }
    }

    bool centro(int x, int y) const {
        return (x == 7 || x == 8) && (y == 7 || y == 8);
    }

    bool tem_parede(int x, int y, Direcao d) const {
        return (paredes[x][y] & (1 << idx(d))) != 0;
    }

    void calcular_distancias() {
        for (int x = 0; x < TAM; x++)
            for (int y = 0; y < TAM; y++)
                distancia[x][y] = centro(x, y) ? 0 : MAX;
        bool alteracao = true;
        while (alteracao) {
            alteracao = false;
            for (int x = 0; x < TAM; x++) {
                for (int y = 0; y < TAM; y++) {
                    if (centro(x, y)) continue;

                    int melhor_vizinho = MAX;
                    auto verificar = [&](Direcao d, int nx, int ny) {
                        if (!tem_parede(x, y, d) && nx >= 0 && nx < TAM && ny >= 0 && ny < TAM)
                            melhor_vizinho = std::min(melhor_vizinho, distancia[nx][ny]);
                    };
                    verificar(Direcao::norte, x, y + 1);
                    verificar(Direcao::sul, x, y - 1);
                    verificar(Direcao::leste, x + 1, y);
                    verificar(Direcao::oeste, x - 1, y);

                    int nova = (melhor_vizinho == MAX) ? MAX : melhor_vizinho + 1;
                    if (nova < distancia[x][y]) {
                        distancia[x][y] = nova;
                        alteracao = true;
                    }
                }
            }
        }
    }
    // registra uma parede detectada na memória do labirinto
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

    // detecção de paredes
    void detectar_paredes() {
        if (sensor_parede_frente())
            adicionar_parede(pos_x, pos_y, relativa_para_absoluta(direcao, 0));
        if (sensor_parede_direita())
            adicionar_parede(pos_x, pos_y, relativa_para_absoluta(direcao, 1));
        if (sensor_parede_esquerda())
            adicionar_parede(pos_x, pos_y, relativa_para_absoluta(direcao, 3));
    }

    // antes chamava apenas algumas funcoes de virar para a direita e para a esquerda agora chama funcoes reais do robo real
    bool melhor_celula() {
        int melhor_direcao  = -1;
        int menor_distancia  = MAX + 1;

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
        // gira até apontar para a direção desejada
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
        motors_avancar_celula();                               
        pos_x += move_x[melhor_direcao];
        pos_y += move_y[melhor_direcao];
        return true;
    }
};

// setup loop
void setup() {
    Serial.begin(115200);
    sensors_init();
    dip_init();
    battery_init();
    motors_init();
    ota_init();
    delay(2000);   
    Micromouse mouse;
    mouse.run();
}

void loop() {
    ota_loop();
}
