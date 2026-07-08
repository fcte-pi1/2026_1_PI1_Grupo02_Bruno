#ifndef TELEMETRY_TYPES_H
#define TELEMETRY_TYPES_H

#include <stdint.h>

// Estrutura para representar coordenadas da rota
struct Coordinate {
    int x;
    int y;
};

// Payload para run_started
struct RunStartedPayload {
    int dimensao;
    int tentativa;
    float bateria;
};

// Payload para cell_discovered
struct CellDiscoveredPayload {
    int x;
    int y;
    bool parede_norte;
    bool parede_sul;
    bool parede_leste;
    bool parede_oeste;
    const char* direcao;
    float velocidade;
    float bateria;
};

// Payload para optimal_path_calculated
// O tamanho máximo da rota dependerá do labirinto (ex: 256 células max).
struct OptimalPathPayload {
    Coordinate rota[256];
    int tamanho_rota;
};

// Payload para run_finished
struct RunFinishedPayload {
    bool sucesso;
    float v_med;
    float bateria;
};

#endif
