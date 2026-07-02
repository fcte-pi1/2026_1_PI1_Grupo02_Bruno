# Dimensionamento Energético

## 1. Introdução

Dimensionar e implementar um sistema de alimentação que garanta uma autonomia mínima de 30 minutos de operação contínua, utilizando baterias que possam ser recarregadas totalmente em menos de duas horas.

---

## 2. Levantamento de Carga (Especificação dos Componentes)

A Tabela 1 detalha todos os componentes eletrônicos e eletromecânicos integrados ao robô, seus respectivos consumos nominais de corrente, tensões de operação e estimativa de energia consumida.

### Tabela 1: Especificação de consumo dos componentes do Micromouse

| Componente | Especificação | Quantidade | Corrente (mA) | Tensão | Energia (J) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| Microcontrolador | ESP32 WROOM 32E | 1 | 117 (com WiFi) | 3.3V | 695,16 |
| Buck Converter | LM2596 | 1 | 21 | 7.4V | 279,72 |
| Sensores IR | TCRT5000 | 3 | 20 | 3.3V | 356,40 |
| Ponte H | TB6612FNG | 1 | 5 | 3.3V | 29,70 |
| Motor N20 - A | | 1 | 53 | 6V | 572,40 |
| Motor N20 - B | | 1 | 46 | 6V | 496,80 |

---

## 3. Cálculo da Corrente Total ($I_{total}$)

Para determinar o consumo total no pior cenário operacional (todos os componentes atuando simultaneamente e em carga máxima), aplica-se a seguinte equação de soma das correntes:

$$I_{total} = I_{esp32\_wifi} + I_{buck} + (3 \times I_{ir}) + I_{ponteH} + I_{motorA} + I_{motorB}$$

Substituindo os valores nominais fornecidos pelo relatório técnico:

$$I_{total} = 117\text{ mA} + 21\text{ mA} + (3 \times 20\text{ mA}) + 5\text{ mA} + 53\text{ mA} + 46\text{ mA}$$
$$I_{total} = 117 + 21 + 60 + 5 + 53 + 46$$
$$I_{total} = 242\text{ mA}$$

---

## 4. Cálculo de Autonomia do Sistema

Para a validação real do comportamento elétrico no solo (labirinto), adota-se uma margem de segurança severa com fator de correção de $2\times$ sobre o consumo medido em vazio, resultando em uma taxa de queda projetada de $0,96\text{ V/h}$. O tempo de uso contínuo estimado ($T_{autonomia}$) considerando a janela útil de tensão de $2,4\text{ V}$ da bateria é calculado por:

$$T_{autonomia} = \frac{2,4\text{ V}}{0,96\text{ V/h}}$$

$$T_{autonomia} \approx \mathbf{2,5\text{ horas}}$$

Convertendo o tempo estimado para minutos:

$$T_{autonomia} = 2,5 \times 60 = \mathbf{150\text{ minutos}}$$

---

## 5. Conclusão

Com o consumo total de **242 mA**, é estimado para o arranjo de baterias de 1200 mAh uma autonomia de aproximadamente **150 minutos** (cerca de 2 horas e meia) de funcionamento contínuo pro micromouse. Considerando também que a bateria escolhida é recarregável e pode ser recarregada completamente em um período de até duas horas.
