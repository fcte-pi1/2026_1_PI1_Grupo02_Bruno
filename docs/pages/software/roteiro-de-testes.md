# Roteiro de Teste Funcionais

Os casos de teste apresentados nesta seção foram definidos com base nas histórias de usuário e nos critérios de aceitação estabelecidos para o projeto. Seu objetivo é verificar se as funcionalidades implementadas atendem aos requisitos especificados, garantindo a qualidade e o correto funcionamento do sistema.

## CT-SE-01 — Exploração do Labirinto

| Campo                  | Descrição                                                                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Código**             | CT-SE-01                                                                                                                                                                         |
| **Nome**               | Exploração do Labirinto                                                                                                                                                          |
| **Objetivo**           | Validar a exploração de células desconhecidas e a atualização do mapa durante a navegação.                                                                                       |
| **Pré-condições**      | Robô inicializado e existência de células desconhecidas no labirinto.                                                                                                            |
| **Procedimentos**      | 1. Iniciar a exploração autônoma.<br>2. Permitir que o robô percorra o ambiente.<br>3. Observar as decisões de navegação.<br>4. Verificar o mapa interno ao final da exploração. |
| **Resultado Esperado** | Células desconhecidas devem ser priorizadas, novas células visitadas devem ser registradas e o mapa deve permanecer consistente durante a exploração.                            |
| **Rastreamento**       | US-05 (CA-01, CA-02, CA-03)                                                                                                                                                      |

---

## CT-SE-02 — Detecção de Obstáculos

| Campo                  | Descrição                                                                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Código**             | CT-SE-02                                                                                                                                                  |
| **Nome**               | Detecção de Obstáculos                                                                                                                                    |
| **Objetivo**           | Validar a identificação de obstáculos e o bloqueio de movimentos que possam resultar em colisões.                                                         |
| **Pré-condições**      | Robô em operação e presença de obstáculos no ambiente.                                                                                                    |
| **Procedimentos**      | 1. Posicionar obstáculos em frente e nas laterais do robô.<br>2. Iniciar a navegação.<br>3. Observar as leituras dos sensores e as decisões de movimento. |
| **Resultado Esperado** | O sistema deve identificar obstáculos, registrar paredes no mapa e impedir movimentos em direções bloqueadas.                                             |
| **Rastreamento**       | US-06 (CA-01, CA-02, CA-03)                                                                                                                               |

---

## CT-SE-03 — Atualização do Mapa

| Campo                  | Descrição                                                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Código**             | CT-SE-03                                                                                                                     |
| **Nome**               | Atualização do Mapa                                                                                                          |
| **Objetivo**           | Validar a atualização contínua do mapa interno do robô.                                                                      |
| **Pré-condições**      | Mapa inicial disponível e sensores operacionais.                                                                             |
| **Procedimentos**      | 1. Iniciar exploração.<br>2. Permitir descoberta de novas células e paredes.<br>3. Solicitar transmissão do mapa atualizado. |
| **Resultado Esperado** | As novas informações devem ser incorporadas ao mapa e refletidas corretamente quando transmitidas.                           |
| **Rastreamento**       | US-07 (CA-01, CA-02, CA-03)                                                                                                  |

---

## CT-SE-04 — Encontrar Objetivo

| Campo                  | Descrição                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Código**             | CT-SE-04                                                                                                      |
| **Nome**               | Identificação da Região Objetivo                                                                              |
| **Objetivo**           | Verificar se o robô identifica corretamente a região objetivo e encerra a corrida.                            |
| **Pré-condições**      | Labirinto configurado com região objetivo definida.                                                           |
| **Procedimentos**      | 1. Iniciar a exploração.<br>2. Permitir que o robô navegue até o centro.<br>3. Monitorar o estado da corrida. |
| **Resultado Esperado** | A região objetivo deve ser identificada, a corrida marcada como concluída e a telemetria atualizada.          |
| **Rastreamento**       | US-08 (CA-01, CA-02, CA-03)                                                                                   |

---

## CT-SE-05 — Planejar Rota

| Campo                  | Descrição                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Código**             | CT-SE-05                                                                                                                                         |
| **Nome**               | Planejamento e Replanejamento de Rotas                                                                                                           |
| **Objetivo**           | Validar a geração de rotas eficientes e o replanejamento diante de obstáculos.                                                                   |
| **Pré-condições**      | Mapa conhecido contendo origem e destino.                                                                                                        |
| **Procedimentos**      | 1. Solicitar cálculo de rota.<br>2. Verificar a rota escolhida.<br>3. Inserir obstáculo inesperado.<br>4. Observar o comportamento do algoritmo. |
| **Resultado Esperado** | O sistema deve gerar uma rota válida, selecionar a mais eficiente e recalculá-la quando necessário.                                              |
| **Rastreamento**       | US-09 (CA-01, CA-02, CA-03, CA-04)                                                                                                               |

---

## CT-SW-01 — Comunicação em Tempo Real

| Campo                  | Descrição                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Código**             | CT-SW-01                                                                                                            |
| **Nome**               | Sincronização de Telemetria                                                                                         |
| **Objetivo**           | Validar a transmissão e sincronização dos dados entre o robô e a interface web.                                     |
| **Pré-condições**      | Comunicação ativa entre firmware e sistema web.                                                                     |
| **Procedimentos**      | 1. Iniciar corrida.<br>2. Movimentar o robô.<br>3. Atualizar mapa e estado operacional.<br>4. Observar a interface. |
| **Resultado Esperado** | Posição, mapa e estado operacional devem ser atualizados em tempo real.                                             |
| **Rastreamento**       | US-10 (CA-01, CA-02, CA-03)                                                                                         |

---

## CT-SW-02 — Reconexão Automática

| Campo                  | Descrição                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| **Código**             | CT-SW-02                                                                                                |
| **Nome**               | Recuperação de Comunicação                                                                              |
| **Objetivo**           | Verificar o comportamento do sistema após perda de conexão.                                             |
| **Pré-condições**      | Sessão ativa e comunicação estabelecida.                                                                |
| **Procedimentos**      | 1. Interromper a conexão.<br>2. Aguardar a tentativa de reconexão.<br>3. Restabelecer a comunicação.    |
| **Resultado Esperado** | O sistema deve tentar reconectar automaticamente, informar a falha e atualizar o status após reconexão. |
| **Rastreamento**       | US-11 (CA-01, CA-02, CA-03)                                                                             |

---

## CT-SW-03 — Iniciar Sessão

| Campo                  | Descrição                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Código**             | CT-SW-03                                                                                                           |
| **Nome**               | Criação de Sessão de Monitoramento                                                                                 |
| **Objetivo**           | Validar a criação e identificação de uma nova sessão.                                                              |
| **Pré-condições**      | Sistema web disponível.                                                                                            |
| **Procedimentos**      | 1. Criar uma nova sessão.<br>2. Iniciar recebimento de telemetria.<br>3. Verificar associação dos dados recebidos. |
| **Resultado Esperado** | Uma sessão única deve ser criada e os dados devem ser vinculados corretamente.                                     |
| **Rastreamento**       | US-12 (CA-01, CA-02)                                                                                               |

---

## CT-SW-04 — Exibir Posição

| Campo                  | Descrição                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------- |
| **Código**             | CT-SW-04                                                                            |
| **Nome**               | Atualização da Posição do Robô                                                      |
| **Objetivo**           | Verificar a exibição da posição do robô em tempo real.                              |
| **Pré-condições**      | Sessão ativa e telemetria disponível.                                               |
| **Procedimentos**      | 1. Iniciar movimentação do robô.<br>2. Observar representação gráfica na interface. |
| **Resultado Esperado** | A posição exibida deve acompanhar os movimentos sem recarregar a página.            |
| **Rastreamento**       | US-13 (CA-01, CA-02)                                                                |

---

## CT-SW-05 — Exibir Caminho Percorrido

| Campo                  | Descrição                                                                         |
| ---------------------- | --------------------------------------------------------------------------------- |
| **Código**             | CT-SW-05                                                                          |
| **Nome**               | Visualização do Trajeto                                                           |
| **Objetivo**           | Validar o registro e exibição do caminho percorrido.                              |
| **Pré-condições**      | Corrida em andamento.                                                             |
| **Procedimentos**      | 1. Executar navegação.<br>2. Finalizar a corrida.<br>3. Consultar o mapa exibido. |
| **Resultado Esperado** | O trajeto percorrido deve ser exibido e permanecer disponível após a conclusão.   |
| **Rastreamento**       | US-14 (CA-01, CA-02)                                                              |

---

## CT-SW-06 — Exibir Status do Robô

| Campo                  | Descrição                                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Código**             | CT-SW-06                                                                                                               |
| **Nome**               | Monitoramento do Estado Operacional                                                                                    |
| **Objetivo**           | Verificar a exibição do estado operacional e de falhas.                                                                |
| **Pré-condições**      | Sistema em execução.                                                                                                   |
| **Procedimentos**      | 1. Monitorar o robô durante a operação.<br>2. Simular uma falha ou desconexão.<br>3. Observar os indicadores exibidos. |
| **Resultado Esperado** | O sistema deve exibir corretamente condições operacionais, falhas e estado da conexão.                                 |
| **Rastreamento**       | US-15 (CA-01, CA-02, CA-03)                                                                                            |

---

## CT-SW-07 — Exibir Status do Desafio

| Campo                  | Descrição                                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| **Código**             | CT-SW-07                                                                                        |
| **Nome**               | Acompanhamento da Corrida                                                                       |
| **Objetivo**           | Verificar a atualização do status da corrida.                                                   |
| **Pré-condições**      | Sessão ativa.                                                                                   |
| **Procedimentos**      | 1. Iniciar corrida.<br>2. Concluir a navegação até o objetivo.<br>3. Observar o status exibido. |
| **Resultado Esperado** | O sistema deve indicar "Em andamento" durante a execução e "Sucesso" ao final.                  |
| **Rastreamento**       | US-16 (CA-01, CA-02)                                                                            |

---

## CT-SW-08 — Registrar Dados Finais

| Campo                  | Descrição                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| **Código**             | CT-SW-08                                                                                  |
| **Nome**               | Persistência dos Resultados                                                               |
| **Objetivo**           | Validar o armazenamento dos resultados de uma corrida.                                    |
| **Pré-condições**      | Corrida concluída.                                                                        |
| **Procedimentos**      | 1. Encerrar uma corrida.<br>2. Reiniciar o sistema.<br>3. Consultar os dados armazenados. |
| **Resultado Esperado** | Tempo, bateria, trajeto e resultado devem permanecer disponíveis para consulta.           |
| **Rastreamento**       | US-17 (CA-01, CA-02, CA-03)                                                               |

---

## CT-SW-09 — Consultar Histórico

| Campo                  | Descrição                                                                        |
| ---------------------- | -------------------------------------------------------------------------------- |
| **Código**             | CT-SW-09                                                                         |
| **Nome**               | Visualização do Histórico de Corridas                                            |
| **Objetivo**           | Validar a listagem das corridas armazenadas.                                     |
| **Pré-condições**      | Existência de corridas registradas.                                              |
| **Procedimentos**      | 1. Acessar a página de histórico.<br>2. Verificar a listagem apresentada.        |
| **Resultado Esperado** | Todas as corridas registradas devem ser exibidas com suas informações resumidas. |
| **Rastreamento**       | US-18 (CA-01, CA-02)                                                             |

---

## CT-SW-10 — Consultar Corrida Individual

| Campo                  | Descrição                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Código**             | CT-SW-10                                                                                                           |
| **Nome**               | Análise Detalhada de Corrida                                                                                       |
| **Objetivo**           | Validar a exibição completa das informações de uma corrida específica.                                             |
| **Pré-condições**      | Existência de corrida registrada.                                                                                  |
| **Procedimentos**      | 1. Selecionar uma corrida no histórico.<br>2. Abrir sua página de detalhes.<br>3. Verificar os dados apresentados. |
| **Resultado Esperado** | Todos os dados da corrida, incluindo trajeto e métricas registradas, devem ser exibidos corretamente.              |
| **Rastreamento**       | US-19 (CA-01, CA-02)                                                                                               |
