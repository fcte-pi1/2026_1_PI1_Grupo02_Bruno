#pragma once

// ── Motores (TB6612FNG) ───────────────────────────────────────────────────
#define MOT_ESQ_INA1  25
#define MOT_ESQ_INA2  26
#define MOT_ESQ_PWMA  23

#define MOT_DIR_INB1  4
#define MOT_DIR_INB2  16
#define MOT_DIR_PWMB  17

// ── Encoders magnéticos (pinos com suporte a interrupção) ─────────────────
#define ENC_ESQ_A  18
#define ENC_ESQ_B  19
#define ENC_DIR_A  21
#define ENC_DIR_B  22

// ── Sensores IR (TCRT5000, saída analógica) ───────────────────────────────
#define IR_FRENTE    33
#define IR_ESQUERDA  32
#define IR_DIREITA   35

// ── Wi-Fi / OTA (ElegantOTA) ───────────────────────────────────────────────
#ifndef WIFI_SSID
  #define WIFI_SSID     "NOME_DA_REDE"
  #define WIFI_PASSWORD "SENHA_DA_REDE"
#endif

// ── Bateria (divisor de tensão) ───────────────────────────────────────────
#define BATERIA      34
#define BAT_R1       10000.0f
#define BAT_R2       4700.0f
#define BAT_VREF     3.3f
#define BAT_ADC_BITS 4095.0f
#define BAT_VMAX     8.4f
#define BAT_VMIN     6.6f

// ── PWM dos motores ───────────────────────────────────────────────────────
#define PWM_FREQ      20000
#define PWM_BITS      8
#define PWM_CANAL_ESQ 0
#define PWM_CANAL_DIR 1

// ── Parâmetros físicos do robô e do labirinto (em mm) ─────────────────────
#define DIAMETRO_RODA_MM  44.0f
#define LARGURA_ROBO_MM   106.0f   // largura com rodas (10,6 cm)
#define COMP_ROBO_MM      120.0f   // comprimento frente-fundo (12 cm)
#define CELULA_MM         180.0f   // célula do labirinto (18 cm)
#define PULSOSPORVOLTA    360

// ── Odometria ─────────────────────────────────────────────────────────────
#define PULSOS_CELULA  ((int)(PULSOSPORVOLTA * (CELULA_MM  / (3.14159f * DIAMETRO_RODA_MM))))
#define PULSOS_GIRO_90 ((int)(PULSOSPORVOLTA * (LARGURA_ROBO_MM / (4.0f * DIAMETRO_RODA_MM))))

// ── PID de tração (calibrar na bancada) ───────────────────────────────────
#define PID_KP  1.0f
#define PID_KI  0.1f
#define PID_KD  0.0f

// ── Velocidades (PWM 0-255, resolução 8 bits) ─────────────────────────────
#define VEL_BASE  160
#define VEL_GIRO  130
#define VEL_MAX   220

// ── Parâmetros dos sensores IR ────────────────────────────────────────────
// Offset sistemático medido na bancada: sensores leem ~1 cm a menos que a régua
#define SENSOR_OFFSET_CM       1.0f

// Geometria de alinhamento lateral:
//   gap lateral = (CELULA_MM - LARGURA_ROBO_MM) / 2 = 37 mm = 3,7 cm
//   sensor recuado 9 mm da borda lateral do robô
//   distância alvo = 3,7 + 0,9 = 4,6 cm
//
//   limite sem parede: robô encostado na parede oposta
//   gap oposto = 7,4 cm + recuo 0,9 cm = 8,3 cm
#define SENSOR_RECUO_MM        9.0f
#define DIST_LATERAL_ALVO_CM   4.6f   // sensor → parede quando centralizado
#define DIST_LATERAL_MARGEM_CM 0.5f   // tolerância antes de acionar correção (±0,5 cm)
#define DIST_SEM_PAREDE_CM     8.3f   // acima disso: passagem livre

// Detecção frontal:
//   sensor na frente do robô, centro do robô a 6 cm da frente
//   quando sensor lê 3 cm → centro do robô está no centro da célula (9 cm da parede)
//   raio de giro: √(6² + 5,3²) ≈ 8,0 cm < 9 cm → consegue girar no próprio eixo
#define DIST_FRONTAL_LIMITE_CM 3.0f   // abaixo disso: parede detectada, robô no centro da célula
