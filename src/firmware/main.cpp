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
// os arrays sempre têm o tamanho do maior mapa suportado (8x8); quando o mapa é 4x4,
// só usamos a submatriz [0..3][0..3] e o resto fica sem uso.
constexpr int TAM_MAX = 8;
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
    // não lê as chaves DIP aqui: no boot os pinos ainda podem não estar
    // configurados (dip_init roda no setup()). O tamanho real do labirinto
    // só é definido quando reset() é chamado, logo antes de cada corrida.
    Micromouse() : tam(TAM_MAX) {}

    // reconfigura o labirinto lendo a chave DIP e zera a posição/memória.
    // deve ser chamado sempre antes de run(), assim o robô pode trocar
    // de mapa (4x4/8x8) entre uma corrida e outra sem precisar regravar o firmware.
    void reset() {
        selecionar_labirinto();
        pos_x  = 0;
        pos_y  = 0;
        direcao  = Direcao::norte;
        std::memset(paredes, 0, sizeof(paredes));
        inicializar_bordas();
    }

    void run() {
        detectar_paredes();
        calcular_distancias();
        ultima_checada = millis();
        while (!centro(pos_x, pos_y)) {
            detectar_paredes();
            calcular_distancias();
            melhor_celula();
            if (millis() - ultima_checada >= INTERVALO_BATERIA) {
            ultima_checada = millis();
            }
            ota_loop(); // mantém o servidor OTA respondendo mesmo durante a corrida
        }
        // chegou ao centro para os motores
        motors_parar();
    }

private:
    unsigned long ultima_checada = 0;
    const unsigned long INTERVALO_BATERIA = 30000;
    int  tam;   // tamanho do labirinto atual: 4 ou 8 (definido pela chave DIP)
    int  distancia[TAM_MAX][TAM_MAX];
    char paredes[TAM_MAX][TAM_MAX];
    int  pos_x, pos_y;
    Direcao direcao;
    static constexpr std::array<int, NUM_DIRECOES> move_x = {0, 1,  0, -1};
    static constexpr std::array<int, NUM_DIRECOES> move_y = {1, 0, -1, 0};
    static constexpr std::array<Direcao, NUM_DIRECOES> oposto = {Direcao::sul, Direcao::oeste, Direcao::norte, Direcao::leste
    };

    // lê as chaves DIP de mapa e decide o tamanho do labirinto (4x4 ou 8x8)
    void selecionar_labirinto() {
        if (mapa_4x4() && mapa_8x8()) {
            tam = 4;
        } else if (mapa_4x4()) {
            tam = 4;
        } else if (mapa_8x8()) {
            tam = 8;
        } else {
            tam = 8;
        }

    }

    void inicializar_bordas() {
        for (int i = 0; i < tam; i++) {
            paredes[i][tam - 1]  |= P_NORTE;
            paredes[i][0]  |= P_SUL;
            paredes[tam - 1][i] |= P_LESTE;
            paredes[0][i]  |= P_OESTE;
        }
    }

    bool centro(int x, int y) const {
        int c1 = tam / 2 - 1;
        int c2 = tam / 2;
        return (x == c1 || x == c2) && (y == c1 || y == c2);
    }

    bool tem_parede(int x, int y, Direcao d) const {
        return (paredes[x][y] & (1 << idx(d))) != 0;
    }

    void calcular_distancias() {
        for (int x = 0; x < tam; x++)
            for (int y = 0; y < tam; y++)
                distancia[x][y] = centro(x, y) ? 0 : MAX;
        bool alteracao = true;
        while (alteracao) {
            alteracao = false;
            for (int x = 0; x < tam; x++) {
                for (int y = 0; y < tam; y++) {
                    if (centro(x, y)) continue;

                    int melhor_vizinho = MAX;
                    auto verificar = [&](Direcao d, int nx, int ny) {
                        if (!tem_parede(x, y, d) && nx >= 0 && nx < tam && ny >= 0 && ny < tam)
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
        if (nx >= 0 && nx < tam && ny >= 0 && ny < tam)
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

    // gira o robô com o mínimo de movimentos possível e avança uma célula.
    // os motores agora são de malha aberta (tempo fixo por comando)
    bool melhor_celula() {
        int melhor_direcao  = -1;
        int menor_distancia  = MAX + 1;

        for (int d = 0; d < NUM_DIRECOES; d++) {
            auto dir = static_cast<Direcao>(d);
            if (tem_parede(pos_x, pos_y, dir)) continue;
            int nx = pos_x + move_x[d];
            int ny = pos_y + move_y[d];
            if (nx < 0 || nx >= tam || ny < 0 || ny >= tam) continue;
            if (distancia[nx][ny] < menor_distancia) {
                menor_distancia = distancia[nx][ny];
                melhor_direcao  = d;
            }
        }

        if (melhor_direcao == -1) return false;

        int diferenca = (melhor_direcao - idx(direcao) + NUM_DIRECOES) % NUM_DIRECOES;
        switch (diferenca) {
            case 0:
                break; // já está de frente pra direção certa
            case 1:
                motors_girar_direita();
                break;
            case 2:
                motors_girar_tras();
                break;
            case 3:
                motors_girar_esquerda();
                break;
        }
        direcao = static_cast<Direcao>(melhor_direcao);

        motors_avancar_celula();
        pos_x += move_x[melhor_direcao];
        pos_y += move_y[melhor_direcao];
        return true;
    }
};

Micromouse mouse;
bool corrida_executada = false; // trava para não iniciar a corrida de novo enquanto START continuar ligada
String status_robo = "Aguardando chave START...";
int bateria_atual = 0;
void setup() {
    Serial.begin(115200);
    sensors_init();
    dip_init();
    battery_init();
    motors_init();
    ota_init();

   
}

void loop() {
    ota_loop();

    if (start() && !corrida_executada) {
        status_robo = "Chave ligada - Iniciando corrida!";
        delay(3000);
     
        mouse.reset(); // lê MAPA_4X4/MAPA_8X8 agora e prepara o labirinto do zero
        mouse.run();
        status_robo = "Corrida finalizada - Chegou ao centro!";
        corrida_executada = true; // trava até a chave START ser desligada
    }

    if (!start()) {
        corrida_executada = false; // rearma para permitir uma nova corrida
    }
}
