#include "motors.h"
#include "sensors.h"
#include "hal.h"
#include <Arduino.h>

// esse código serve para controlar os dois motores do robô usando a ponte h e lendo o quanto eles andaram pelos encoders
// usando um pid pra tentar manter os dois girando na mesma velocidade

// aqui a gente guarda quantos pulsos cada roda já deu
// usamos volatile porque esses valores mudam o tempo todo no meio das interrupções
static volatile long enc_esq = 0;
static volatile long enc_dir = 0;

// essas duas funções são chamadas automaticamente toda vez que o encoder gira
// elas checam o outro pino pra saber se a roda tá indo pra frente ou pra trás e soma ou subtrai
static void IRAM_ATTR isr_enc_esq() {
    if (digitalRead(ENC_ESQ_B) == LOW)
        enc_esq++;
    else
        enc_esq--;
}
static void IRAM_ATTR isr_enc_dir() {
    if (digitalRead(ENC_DIR_B) == LOW)
        enc_dir--;
    else
        enc_dir++;
}
// aqui a gente liga os pinos pra fazer a roda esquerda ir pra frente ou pra trás
static void set_motor_esq(int pwm) {
    if (pwm >= 0) {
        digitalWrite(MOT_ESQ_INA1, HIGH);
        digitalWrite(MOT_ESQ_INA2, LOW);
    } else {
        digitalWrite(MOT_ESQ_INA1, LOW);
        digitalWrite(MOT_ESQ_INA2, HIGH);
        pwm = -pwm;
    }
    // manda a velocidade pro motor
    ledcWrite(MOT_ESQ_PWMA, constrain(pwm, 0, 255));
}

// mesma coisa que o da esquerda só que pra roda direita
static void set_motor_dir(int pwm) {
    if (pwm >= 0) {
        digitalWrite(MOT_DIR_INB1, HIGH); 
        digitalWrite(MOT_DIR_INB2, LOW);
    } else {
        digitalWrite(MOT_DIR_INB1, LOW);
        digitalWrite(MOT_DIR_INB2, HIGH);
        pwm = -pwm;
    }
    ledcWrite(MOT_DIR_PWMB, constrain(pwm, 0, 255));
}

// configura todos os pinos de motor e encoder pra começarem a funcionar
void motors_init() {
    pinMode(MOT_ESQ_INA1, OUTPUT);
    pinMode(MOT_ESQ_INA2, OUTPUT);
    pinMode(MOT_DIR_INB1, OUTPUT);
    pinMode(MOT_DIR_INB2, OUTPUT);   

    // configura o pwm do esp32 pra gente poder controlar a velocidade
    ledcAttach(MOT_ESQ_PWMA, PWM_FREQ, PWM_BITS);
    ledcAttach(MOT_DIR_PWMB, PWM_FREQ, PWM_BITS);

    // pinos dos encoders entram como input pra gente ler o sinal deles
    pinMode(ENC_ESQ_A, INPUT_PULLUP);
    pinMode(ENC_ESQ_B, INPUT_PULLUP);
    pinMode(ENC_DIR_A, INPUT_PULLUP);
    pinMode(ENC_DIR_B, INPUT_PULLUP);

    // avisa o esp32 pra rodar aquelas funçoes de interrupção toda vez que o sinal do encoder subir
    attachInterrupt(digitalPinToInterrupt(ENC_ESQ_A), isr_enc_esq, RISING);
    attachInterrupt(digitalPinToInterrupt(ENC_DIR_A), isr_enc_dir, RISING);
}

// só zera a velocidade dos dois motores pra eles pararem
void motors_parar() {
    set_motor_esq(0);
    set_motor_dir(0);
}

// essa é a função principal que faz o robô andar até o alvo e corrige a trajetória com o pid
// recebe quantos pulsos cada roda tem que dar (positivo frente, negativo ré)
static void mover(long alvo_esq, long alvo_dir, bool usar_sensor = false) {
    // desliga as interrupções rapidinho só pra zerar os contadores sem dar problema
    noInterrupts();
    enc_esq = 0;
    enc_dir = 0;
    interrupts();

    // vê pra qual lado cada roda tem que girar
    int sinal_esq = (alvo_esq >= 0) ? 1 : -1;
    int sinal_dir = (alvo_dir >= 0) ? 1 : -1;
    long abs_esq  = abs(alvo_esq);
    long abs_dir  = abs(alvo_dir);

    float erro_anterior = 0.0f;
    float integral      = 0.0f;

    // fica rodando aqui até as duas rodas chegarem no alvo
    while (true) {
        // le o quanto já andou
        noInterrupts();
        long lido_esq = enc_esq * sinal_esq;   // progresso sempre positivo
        long lido_dir = enc_dir * sinal_dir;
        interrupts();

        // checa se já chegou
        bool esq_ok = (lido_esq >= abs_esq);
        bool dir_ok = (lido_dir >= abs_dir);

        bool parede_proxima = usar_sensor && (sensor_cm(IR_FRENTE) < DIST_FRONTAL_LIMITE_CM); // para se o sensor lê menos que DIST_FRONTAL_LIMITE_CM (3 cm),
        if ((esq_ok && dir_ok) || parede_proxima) break;

        // aqui a gente calcula o erro do pid
        // ve qual roda tá mais adiantada comparando a porcentagem do que elas já andaram
        float prog_esq = (abs_esq > 0) ? (float)lido_esq / abs_esq : 1.0f;
        float prog_dir = (abs_dir > 0) ? (float)lido_dir / abs_dir : 1.0f;
        float erro     = prog_esq - prog_dir;   // se der positivo a esquerda ta mais rapida

        integral      += erro;
        float derivada = erro - erro_anterior;
        erro_anterior  = erro;

        // faz a conta do pid misturando as constantes que a gente definiu
        float correcao = PID_KP * erro + PID_KI * integral + PID_KD * derivada;

        // se a roda já chegou no alvo ela para, senão a gente soma ou subtrai a correção da velocidade base
        int pwm_esq = esq_ok ? 0 : (int)(VEL_BASE - correcao * 50);
        int pwm_dir = dir_ok ? 0 : (int)(VEL_BASE + correcao * 50);

        // manda a velocidade pros motores com um limite pra nao passar do maximo
        set_motor_esq(constrain(pwm_esq, 0, VEL_MAX) * sinal_esq);
        set_motor_dir(constrain(pwm_dir, 0, VEL_MAX) * sinal_dir);
        delay(2);   
    }

    // chegou no alvo entao manda parar e da um tempinho pra ele estabilizar
    motors_parar();
    delay(80);   
}

// manda o robo andar a distancia de uma celula inteira pra frente
void motors_avancar_celula() {
    mover(PULSOS_CELULA, PULSOS_CELULA, true);
}

// gira 90 graus no proprio eixo pra direita (uma roda vai pra frente e a outra pra tras)
void motors_girar_direita() {
    mover(+PULSOS_GIRO_90, -PULSOS_GIRO_90);
}

// gira 90 graus no proprio eixo pra esquerda
void motors_girar_esquerda() {
    mover(-PULSOS_GIRO_90, +PULSOS_GIRO_90);
}
