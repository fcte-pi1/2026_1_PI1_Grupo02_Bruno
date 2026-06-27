#include "dip.h"
#include "hal.h"
#include <Arduino.h>


// Chaves DIP com pull-up interno:
void dip_init() {
    pinMode(START, INPUT_PULLDOWN);
    pinMode(MAPA_4X4, INPUT_PULLDOWN);
    pinMode(MAPA_8X8, INPUT_PULLDOWN);
}

bool start() { return digitalRead(START) == HIGH;}
bool mapa_4x4() { return digitalRead(MAPA_4X4) == HIGH;}
bool mapa_8x8() { return digitalRead(MAPA_8X8) == HIGH;}

