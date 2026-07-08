#ifndef TELEMETRY_H
#define TELEMETRY_H

#include <WebSocketsClient.h>

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
    static void webSocketEvent(WStype_t type, uint8_t * payload, size_t length);
    static WebSocketsClient webSocket;
    static void adicionarAoBuffer(String json);
    static bool processarBuffer();

    static const int BUFFER_SIZE = 50;
    static String eventBuffer[BUFFER_SIZE];
    static int head;
    static int tail;
    static int count;
    
};

#endif // TELEMETRY_H
