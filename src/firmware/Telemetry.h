#ifndef TELEMETRY_H
#define TELEMETRY_H

/**
 * @brief Interface de telemetria para o Micromouse.
 * 
 * Este módulo gerencia o envio de eventos para o backend via WebSocket,
 * implementando buffer em memória para casos de desconexão.
 */
class Telemetry {
public:
    static void init();

    static void process(); 
    
    static void sendRunStarted(int dimensao, int tentativa, int bateria);
    static void sendCellDiscovered(int x, int y, bool p_norte, bool p_sul, bool p_leste, bool p_oeste, const char* direcao, float velocidade, float bateria);
    static void sendRunFinished(bool sucesso, float v_med, float bateria);

private:
    
};

#endif // TELEMETRY_H
