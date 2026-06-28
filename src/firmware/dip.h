#pragma once

// inicializa os pinos das chaves DIP como entrada com pull-down interno
void dip_init();

// retorna true se a chave estiver ligada (ON)
bool start();
bool mapa_4x4();
bool mapa_8x8();

void dip_print();