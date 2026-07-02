#pragma once

void sensors_init();

bool  sensor_parede_frente();
bool  sensor_parede_direita();
bool  sensor_parede_esquerda();

float sensor_volts(int pino);
float sensor_cm(int pino);
float sensor_erro_lateral();
bool  sensor_precisa_corrigir();
