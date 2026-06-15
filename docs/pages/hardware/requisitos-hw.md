# Requisitos de Hardware

| Código          | Descrição                                                                                                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **RF-ELEC-01**  | **Redução e Estabilização de Tensão para a Lógica:** Medição estável de **3.3V (±0.1V)** nos terminais de saída do módulo.                                                                      |
| **RF-ELEC-02**  | **Monitoramento de Tensão da Bateria via ADC:** O Serial Monitor do ESP32 deve exibir a voltagem real da bateria com margem de erro de **±0.2V**.                                               |
| **RF-ELEC-03**  | **Interface de Segurança e Proteção de Polaridade:** O sistema deve ligar/desligar via chave física e bloquear a passagem de energia se a bateria for conectada invertida.                      |
| **RF-ELEC-04**  | **Detecção de Barreiras Físicas via Infravermelho (IR):** O hardware deve gerar uma variação de tensão entre **0V e 3.3V** proporcional à distância da parede.                                  |
| **RF-ELEC-05**  | **Mapeamento da Curva de Resposta dos Sensores:** O firmware deve converter os valores do ADC (**0–4095**) em distância linear (**cm**) com precisão de **±1 cm** na faixa de **3 cm a 15 cm**. |
| **RF-ELEC-06**  | **Definição e Mapeamento de Pinos (Pinout) do ESP32:** Conexão física de todos os periféricos (sensores e motores) sem conflitos de GPIOs ou funções especiais.                                 |
| **RF-ELEC-07**  | **Controle de Direção e Potência dos Motores:** Acionamento bi-direcional das rodas utilizando a tensão da bateria sob comando lógico do ESP32.                                                 |
| **RF-ELEC-08**  | **Modulação de Velocidade por Largura de Pulso (PWM):** Variação linear da rotação dos motores controlada pelo software entre **10% e 100%** da potência.                                       |
| **RNF-ELEC-01** | **Filtragem de Interferência Eletromagnética (EMI):** A leitura do sensor no Serial Monitor não deve oscilar mais que **2%** quando os motores estiverem em carga máxima.                       |
