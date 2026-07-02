#pragma once

// inicializa o pino da bateria
void battery_init();

// retorna a tensão atual em volts
float battery_tensao();

// retorna a porcentagem de carga (0–100)
int battery_porcentagem();

