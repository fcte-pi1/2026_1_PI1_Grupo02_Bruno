#pragma once

// ajuste dos pinos fisicos no código
// trocar cada "??" pelos numeros de pinos condizentes na esp 
// eu coloquei cada pino pra gente saber qual vai estar conectado no driver do TB6612FNG

#define MOT_ESQ_INA1  ??
#define MOT_ESQ_INA2  ??
#define MOT_ESQ_PWMA  ??

#define MOT_DIR_INB1  ??
#define MOT_DIR_INB2  ??
#define MOT_DIR_PWMB  ??

// no pinout/datasheet precisa colocar esse pino para a ponte H funcionar 
#define MOT_STBY  ??

//  pinos de encoders magnéticos dos motores, precisam ser pinos que permitam interrupção 
#define ENC_ESQ_A  ??
#define ENC_ESQ_B  ?? 
#define ENC_DIR_A  ??
#define ENC_DIR_B  ??

// pinos dos sensores, e os nossos sensores são sensores analógicos ent eles vâo devolver um valor de acordo com a distância da parede
// por isso vamos definir um limite para quando o valor for maior do q X ele vai ter detectado uma parede

#define IR_FRENTE_ESQ  ??
#define IR_FRENTE_DIR  ??
#define IR_ESQUERDA  ??
#define IR_DIREITA  ??

// testar na bancada qual o valor que vai ser retornado e que iremos definir para substituir aq depois 

#define IR_LIMITE ??????
// aq temos o controle da frequencia e controle dos bits que iremos trabalhar
// n sabia quanto colocar o gemini falou que 20khz é uma frequencia boa e que 8 bits é uma quantidade boa para trabalhar tambem
// mas eu acho que talvez a gente vá diminuir a quantidade de bits n sei ainda 
#define PWM_FREQ  20000  
#define PWM_BITS  8       
#define PWM_CANAL_ESQ 0
#define PWM_CANAL_DIR 1

// aq vamos ter alguns parametros fisicos do robo tem que ver certinho quanto cada coisa vai valer quando o robô tiver montado mas a princípio peguei os valores dos cads de cada coisa 
// os valores de diametro largura e celula sao todos em milímetros
#define PULSOSPORVOLTA  360 
#define DIAMETRO_RODA_MM  44.0f 
#define LARGURA_ROBO_MM  75.0f   
#define CELULA_MM  180.0f

// Distância em pulsos equivalente a 1 célula
#define PULSOS_CELULA  ((int)(PULSOSPORVOLTA * (CELULA_MM / (3.14159f * DIAMETRO_RODA_MM))))

// Pulsos para girar 90°  (arco = (π × LARGURA_ROBO) / 4  /  circunferência_roda)
#define PULSOS_GIRO_90 ((int)(PULSOSPORVOLTA * (LARGURA_ROBO_MM / (4.0f * DIAMETRO_RODA_MM))))
// esse aqui vamos ter que definir na bancada quando testarmos mas resumidamente 
// o PID KP serve para quando uma roda estiver mais atrasada e ele vai dar um impulso nela pra compesar 
// o PID KI serve para corrigir erros bem pequenos caso um motorfique mais fraco que o outro ou coisas do tipo (talvez nem precisemos usar)
// o PID KD é o contrário do KP ele vai dar uma desacelerada pois caso o KP entre muito forte ele dá uma freiada para a correção não passar do ponto ideal
#define PID_KP  ??
#define PID_KI  ??
#define PID_KD  ??

// Velocidade base equivalente aos 8 bits escolhidos anteriormente (PWM 0–255)
#define VEL_BASE      160
#define VEL_GIRO      130
#define VEL_MAX       220
