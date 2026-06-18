# Descrição de Hardware

O núcleo de hardware do projeto RataTuring é responsável pela **percepção do ambiente**, **controle de movimentação** e **transmissão de telemetria** em tempo real. Para atender aos requisitos do Micromouse, foram selecionados componentes capazes de oferecer processamento eficiente, leitura precisa do ambiente e controle confiável dos atuadores.

## 1. Microcontrolador

A unidade central de controle do robô é a **ESP32 WROOM-32E de 38 pinos**, escolhida por oferecer quantidade suficiente de portas GPIO *(General Purpose Input/Output)* para integração simultânea com encoders magnéticos, sensores infravermelhos e chave DIP de configuração.

Além da maior disponibilidade de interfaces físicas, a ESP32 atende às necessidades computacionais do projeto ao oferecer arquitetura de **32 bits**, frequência de operação de até **240 MHz**, conectividade **Wi‑Fi e Bluetooth integradas** e suporte à execução paralela por meio de **dois núcleos de processamento**.

Essa arquitetura permite que o robô execute simultaneamente tarefas como processamento de sensores, controle de movimentação, mapeamento do labirinto e transmissão de telemetria em tempo real para o sistema web.

A utilização da versão de 38 pinos também demandou um planejamento cuidadoso do mapeamento das GPIOs, especialmente devido à presença de portas associadas à memória flash interna do chip, garantindo estabilidade no funcionamento do sistema embarcado.

## 2. Sensores de Percepção

Para a detecção de paredes e leitura do ambiente, foram selecionados **sensores infravermelhos (IR)**. Essa escolha foi motivada pela baixa latência de leitura e pela adequação ao ambiente controlado do Micromouse, onde as superfícies do labirinto possuem características visuais padronizadas.

Os sensores IR permitem detectar obstáculos por meio da emissão e reflexão de luz infravermelha, possibilitando a estimativa da distância até paredes próximas. Foram definidos **três sensores** reflexivos TCRT5000, posicionados à esquerda, à frente e à direita do robô.

## 3. Sistema de Locomoção e Odometria

O sistema de movimentação utiliza **motores DC N20 com encoders magnéticos integrados**, responsáveis tanto pela propulsão quanto pela medição do deslocamento do robô.

Os encoders geram pulsos elétricos proporcionais à rotação do eixo do motor, permitindo ao microcontrolador calcular com precisão a **distância percorrida** e a **velocidade das rodas**. Essas informações são fundamentais para o rastreamento da posição do robô no labirinto, especialmente em trechos onde os sensores infravermelhos não conseguem fornecer referências suficientes do ambiente.

Assim, os encoders complementam o sistema de percepção, fornecendo dados essenciais para o mapeamento e navegação.

## 4. Sistema de Alimentação

O robô é alimentado por uma **bateria LiPo de 7,4 V**, cuja tensão é superior à suportada pela ESP32. Para adequar a alimentação do sistema, optou-se pela utilização de um **conversor DC-DC Step-Down (Buck Converter LM2596)**.

A escolha do conversor buck ocorreu devido à sua **alta eficiência energética**, reduzindo a tensão da bateria sem dissipar grande parte da energia em forma de calor, diferentemente de reguladores lineares ou divisores resistivos. Essa característica contribui para maior autonomia energética do robô e maior estabilidade operacional durante a execução da corrida.

Além disso, para atender ao requisito de monitoramento energético em tempo real, foi implementado um **circuito divisor de tensão**, permitindo que a ESP32 realize a leitura segura da tensão da bateria e envie essas informações ao sistema de telemetria.

## 5. Controle dos Motores

O acionamento dos motores é realizado por meio da **ponte H TB6612FNG**, responsável por intermediar a comunicação entre a ESP32 e os motores DC.

Esse componente foi escolhido em substituição ao modelo L298N devido ao **menor tamanho físico**, **menor resistência interna** e **maior eficiência energética**, resultando em maior estabilidade de tensão e melhor desempenho no controle dos motores.

Além disso, a TB6612FNG suporta frequências elevadas de controle PWM, permitindo ajustes mais precisos de velocidade e reduzindo vibrações ou perda de torque em baixas velocidades, aspecto essencial para a navegação precisa em um labirinto Micromouse.

## 6. Considerações Gerais

A arquitetura de hardware proposta foi definida de forma a atender aos requisitos funcionais do projeto, principalmente aqueles relacionados à **navegação autônoma**, **mapeamento do labirinto**, **precisão de movimento** e **transmissão de telemetria em tempo real**. A combinação entre ESP32, sensores IR, encoders, conversor buck e ponte H fornece uma base robusta para o funcionamento do sistema embarcado do RataTuring.
