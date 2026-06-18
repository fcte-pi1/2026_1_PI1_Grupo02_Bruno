#include <Arduino.h>
#include "Telemetry.h"
#include "TelemetryTypes.h"
#include <ArduinoJson.h>

int Telemetry::head = 0;
int Telemetry::tail = 0;
int Telemetry::count = 0;
String Telemetry::eventBuffer[50];
WebSocketsClient Telemetry::webSocket;

const char* host = "192.168.1.100"; // MUDAR PARA O IP DO SEU BACKEND
const int port = 8000;              // Porta padrão do Django

static uint32_t next_event_id = 1;

static void montarJsonBase(JsonDocument& doc, const char* tipo) {
    doc["event_id"] = next_event_id++;
    doc["id_corrida"] = 1;
    doc["timestamp_ms"] = millis();
    doc["tipo"] = tipo;
}

void Telemetry::init() {
    webSocket.begin(host, port, "/ws/firmware/");
    webSocket.onEvent(Telemetry::webSocketEvent);
    webSocket.setReconnectInterval(5000);
}

void Telemetry::process() {
    webSocket.loop();
    if (webSocket.isConnected()) {
        processarBuffer();
    }
}

void Telemetry::webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_TEXT: {
            StaticJsonDocument<64> doc;
            DeserializationError error = deserializeJson(doc, payload);
            if (!error && doc.containsKey("ack")) {
                // O servidor confirmou o recebimento do evento mais antigo!
                // Agora sim, removemos do buffer com segurança.
                if(count > 0) {
                    head = (head + 1) % BUFFER_SIZE;
                    count--;
                }
            }
            break;
        }
        case WStype_DISCONNECTED:
            // Log: conexão perdida
            break;
        case WStype_CONNECTED:
            // Log: conectado ao servidor
            break;
    }
}

void Telemetry::adicionarAoBuffer(String json){
    if(count < BUFFER_SIZE){
        eventBuffer[tail] = json;
        tail = (tail + 1) % BUFFER_SIZE;
        count++;
    }
}

bool Telemetry::processarBuffer(){
    if(count > 0){
        String json = eventBuffer[head];
        // Tentamos enviar. Se o WiFi estiver ok, ele envia.
        if(webSocket.sendTXT(json)){
            return true;
        }
    }
    return false;
}

void Telemetry::sendRunStarted(int dimensao, int tentativa, int bateria) {
    StaticJsonDocument<256> doc;
    montarJsonBase(doc, "run_started");
    
    JsonObject payload = doc.createNestedObject("payload");
    payload["dimensao"] = dimensao;
    payload["tentativa"] = tentativa;
    payload["bateria"] = bateria;
    
    String output;
    serializeJson(doc, output);
    adicionarAoBuffer(output);
}

void Telemetry::sendCellDiscovered(int x, int y, bool p_norte, bool p_sul, bool p_leste, bool p_oeste, const char* direcao, float velocidade, float bateria) {
    StaticJsonDocument<512> doc;
    montarJsonBase(doc, "cell_discovered");
    
    JsonObject payload = doc.createNestedObject("payload");
    payload["x"] = x;
    payload["y"] = y;
    payload["parede_norte"] = p_norte;
    payload["parede_sul"] = p_sul;
    payload["parede_leste"] = p_leste;
    payload["parede_oeste"] = p_oeste;
    payload["direcao"] = direcao;
    payload["velocidade"] = velocidade;
    payload["bateria"] = bateria;
    
    String output;
    serializeJson(doc, output);
    adicionarAoBuffer(output);
}

void Telemetry::sendRunFinished(bool sucesso, float v_med, float bateria) {
    StaticJsonDocument<256> doc;
    montarJsonBase(doc, "run_finished");
    
    JsonObject payload = doc.createNestedObject("payload");
    payload["sucesso"] = sucesso;
    payload["v_med"] = v_med;
    payload["bateria"] = bateria;
    
    String output;
    serializeJson(doc, output);
    adicionarAoBuffer(output);
}
