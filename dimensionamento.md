# Dimensionamento Energético -- MicroMouse

## 1. Introdução
Dimensionar e implementar um sistema de alimentação que garanta uma autonomia mínima de 30 minutos de operação contínua, utilizando baterias que possam ser recarregadas totalmente em menos de duas horas.

---

## 2. Levantamento de Carga (Especificação dos Componentes)

A Tabela 1 detalha todos os componentes eletrónicos e eletromecânicos integrados ao robô, seus respetivos consumos nominais de corrente, tensões de operação e estimativa de energia consumida.

### Tabela 1: Especificação de consumo dos componentes do Micromouse.

| Componente | Especificação | Quantidade | Corrente (mA) | Tensão | 
| :--- | :--- | :---: | :---: | :---: | 
| Microcontrolador | ESP32 WROOM 32E | 1 | 117 (com WiFi) | 3.3V | 
| Buck Converter | LM2596 | 1 | 21 | 7.4V | 
| Sensores IR | TCRT5000 | 3 | 20 | 3.3V | 
| Ponte H | TB6612FNG | 1 | 5 | 3.3V | 
| Motor N20 - A | | 1 | 53 | 6V | 
| Motor N20 - B | | 1 | 46 | 6V | 

---

## 3. Caso 1: Cálculo da Corrente com sensores ($I_{c}$)

Para determinar o consumo total no pior cenário operacional (todos os componentes atuando simultaneamente e em carga máxima), aplica-se a seguinte equação de soma das correntes:

$$I_{c} = I_{esp32\_wifi} + I_{buck} + (3 \times I_{ir}) + I_{ponteH} + I_{motorA} + I_{motorB}$$

Substituindo os valores nominais fornecidos pelo relatório técnico:

$$I_{c} = 117\text{ mA} + 21\text{ mA} + (3 \times 20\text{ mA}) + 5\text{ mA} + 53\text{ mA} + 46\text{ mA}$$

$$I_{c} = 117 + 21 + 60 + 5 + 53 + 46$$

$$I_{c} = 302\text{ mA}$$

### 3.1 Cálculo de Autonomia do Sistema com sensores

Para garantir a integridade química das células de LiPo e evitar sub-tensão profunda, adota-se um **Fator de Segurança de 20%** (utilizando apenas 80% da capacidade nominal da bateria). O tempo de uso contínuo estimado ($T_{autonomia}$) é calculado por:

$$T_{autonomia} = \frac{1200}{302} \times 0,8$$

$$T_{autonomia} \approx \mathbf{3,18\text{ horas}}$$

Convertendo o tempo estimado para minutos:
$$T_{autonomia} = 3,18 \times 60 = \mathbf{190\text{ minutos}}$$

---

## 4. Caso 2: Cálculo da corrente sem sensores ($I_{s}$)

O bloco abaixo representa o cálculo da corrente omitindo os sensores infravermelhos:

$$I_{s} = I_{esp32\_wifi} + I_{buck} + I_{ponteH} + I_{motorA} + I_{motorB}$$

$$I_{s} = 117\text{ mA} + 21\text{ mA} + 5\text{ mA} + 53\text{ mA} + 46\text{ mA}$$

$$I_{s} = 117 + 21 + 5 + 53 + 46$$

$$I_{s} = 242\text{ mA}$$

### 4.1 Cálculo de Autonomia do Sistema sem sensores

Usando o fator de segurança para a bateria, temos que ($T_{autonomia}$) é:

$$T_{autonomia} = \frac{1200}{242} \times 0,8$$

$$T_{autonomia} \approx \mathbf{3,97\text{ horas}}$$

Convertendo o tempo estimado para minutos:
$$T_{autonomia} = 3,97 \times 60 = \mathbf{238\text{ minutos}}$$

---

## 5. Conclusão

* **Caso 1:** Com o consumo total de **302 mA**, é estimado para o arranjo de baterias de 1200 mAh com sensores uma autonomia de aproximadamente **190 minutos** (cerca de 3 horas e 10 minutos) de funcionamento contínuo.
* **Caso 2:** Com o consumo total de **242 mA**, é estimado para o arranjo de baterias de 1200 mAh sem sensores uma autonomia de aproximadamente **238 minutos** (cerca de 3 horas e 58 minutos) de funcionamento contínuo.

Considerando também que a bateria escolhida é recarregável e pode ser recarregada completamente em um período de até duas horas.
