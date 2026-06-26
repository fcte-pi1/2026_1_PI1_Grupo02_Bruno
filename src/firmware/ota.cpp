#include <credentials.h>
#include "ota.h"
#include "hal.h"
#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <ElegantOTA.h>

static WebServer server(80);

void ota_init() {
    WiFi.mode(WIFI_AP);
    
    WiFi.softAP(WIFI_SSID, WIFI_PASSWORD);

    Serial.println("=========================================");
    Serial.print("Hotspot Wi-Fi criado! Rede: ");
    Serial.println(WIFI_SSID);
    
    // O IP padrão do Access Point do ESP32 costuma ser 192.168.4.1
    Serial.print("IP do Hotspot: ");
    Serial.println(WiFi.softAPIP()); 
    Serial.println("=========================================");

    server.on("/", []() {
        server.send(200, "text/plain", "Micromouse online - acesse /update para enviar novo firmware");
    });

    ElegantOTA.begin(&server);   // habilita a pagina de OTA em /update
    server.begin();
    Serial.println("Servidor OTA pronto. Acesse: http://192.168.4.1/update");
}

void ota_loop() {
    server.handleClient();
    ElegantOTA.loop();
}