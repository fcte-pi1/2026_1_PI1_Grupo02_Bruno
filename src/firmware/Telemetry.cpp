#include <Arduino.h>
#include "Telemetry.h"
#include "TelemetryTypes.h"
#include <ArduinoJson.h>

int Telemetry::head = 0;
int Telemetry::tail = 0;
int Telemetry::count = 0;
String Telemetry::eventBuffer[50];
WebSocketsClient Telemetry::webSocket;

// ─── CONFIGURAÇÃO DE REDE ─────────────────────────────────────────────────
// Defina abaixo o IP do computador onde o backend Django está rodando.
//
// Modo AP (padrão): a ESP32 cria a rede "rataturing" (credentials.h).
//   → Conecte o PC nessa rede.
//   → O IP do PC nessa rede costuma ser 192.168.4.2
//   → Defina: host = "192.168.4.2"
//
// Modo STA (alternativo): modifique ota.cpp para conectar em um roteador.
//   → Use o IP local do PC na rede do roteador (ex: "192.168.1.15")
//   → Descubra com: hostname -I  (Linux) ou ipconfig (Windows)
//
// TODO: substitua o valor abaixo antes de fazer o upload para a ESP32
const char* host = "0.0.0.0"; // <-- CONFIGURE O IP DO BACKEND AQUI
const int port = 8000;        // Porta padrão do Django (não alterar)

static uint32_t next_event_id = 1;
// id_corrida_atual é atualizado via ACK do backend após run_started.
// O backend retorna { "ack": N, "corrida_id": X } ao criar a corrida no banco.
// Enquanto não houver corrida ativa, permanece 0.
static uint32_t corrida_id_atual = 0;

static void montarJsonBase(JsonDocument& doc, const char* tipo) {
    doc["event_id"] = next_event_id++;
    doc["id_corrida"] = corrida_id_atual;
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
            // Aumentamos o buffer para 128 bytes para comportar o campo corrida_id.
            StaticJsonDocument<128> doc;
            DeserializationError error = deserializeJson(doc, payload);
            if (!error && doc.containsKey("ack")) {
                // Se o ACK vier acompanhado de corrida_id (resposta ao run_started),
                // atualiza o id da corrida ativa para os próximos eventos.
                if (doc.containsKey("corrida_id")) {
                    corrida_id_atual = doc["corrida_id"].as<uint32_t>();
                }
                // Remove o evento confirmado do buffer FIFO.
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
    payload["linha"]  = y;
    payload["coluna"] = x;
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
