# Sistema de Telemetria

## 1. Objetivo

O sistema de telemetria é responsável por coletar, transmitir, armazenar e disponibilizar informações geradas pelo Micromouse durante sua execução.

A telemetria possui quatro objetivos principais:

* Permitir a visualização da corrida em tempo real;
* Armazenar informações para análises posteriores;
* Possibilitar a reprodução completa de execuções;
* Fornecer métricas para avaliação do desempenho do robô.

---

# 2. Arquitetura Geral

```text
ESP32
 ├── Sensores
 ├── Controle de Movimento
 ├── Algoritmo de Navegação
 ├── Gerenciador de Eventos
 ├── Buffer de Telemetria
 └── Cliente WebSocket
          │
          ▼
Backend
 ├── WebSocket Server
 ├── Persistência
 ├── API
 └── Processamento
          │
          ▼
Banco de Dados
          │
          ▼
Frontend
```

---

# 3. Princípios da Solução

## 3.1 Arquitetura Orientada a Eventos

A telemetria será baseada em eventos.

O firmware não realizará streaming contínuo de sensores ou estados internos.

Apenas acontecimentos relevantes serão transmitidos.

Exemplos:

* início de corrida;
* descoberta de nova célula;
* descoberta de paredes;
* cálculo da rota ótima;
* finalização da corrida.

Essa abordagem reduz:

* consumo de banda;
* uso de memória;
* volume de armazenamento.

---

## 3.2 Fonte Primária dos Dados

A ESP32 é considerada a fonte primária dos dados.

O backend atua como camada de persistência.

Caso a conexão seja perdida:

* os eventos continuam sendo gerados;
* os eventos permanecem armazenados localmente;
* a transmissão é retomada após reconexão.

---

# 4. Convenção Espacial

## Sistema Cartesiano

Origem:

```text
(0,0)
```

Localizada no canto inferior esquerdo do labirinto.

### Eixo X

Cresce para a direita (Leste).

```text
x++
```

### Eixo Y

Cresce para cima (Norte).

```text
y++
```

---

## Movimentação

| Direção | Operação |
| ------- | -------- |
| Norte   | y++      |
| Sul     | y--      |
| Leste   | x++      |
| Oeste   | x--      |

---

# 5. Estrutura Base dos Eventos

Todos os eventos devem possuir a seguinte estrutura:

```json
{
  "event_id": 1,
  "id_corrida": 1,
  "timestamp_ms": 1234,
  "tipo": "event_name",
  "payload": {}
}
```

## Campos

| Campo        | Descrição                           |
| ------------ | ----------------------------------- |
| event_id     | Identificador incremental do evento |
| id_corrida   | Identificador da execução           |
| timestamp_ms | Tempo desde o início da corrida     |
| tipo         | Tipo do evento                      |
| payload      | Dados específicos do evento         |

---

# 6. Eventos

## 6.1 run_started

Disparado uma única vez ao iniciar uma corrida.

```json
{
  "event_id": 1,
  "id_corrida": 1,
  "timestamp_ms": 0,
  "tipo": "run_started",
  "payload": {
    "dimensao": 16,
    "tentativa": 1,
    "bateria": 100
  }
}
```

### Campos

| Campo     | Descrição                     |
| --------- | ----------------------------- |
| dimensao  | 4, 8 ou 16                    |
| tentativa | Número da tentativa           |
| bateria   | Percentual inicial da bateria |

---

## 6.2 cell_discovered

Disparado sempre que o robô entra em uma nova célula.

```json
{
  "event_id": 2,
  "id_corrida": 1,
  "timestamp_ms": 1234,
  "tipo": "cell_discovered",
  "payload": {
    "x": 2,
    "y": 1,
    "w": 5
  }
}
```

### Campos

| Campo | Descrição          |
| ----- | ------------------ |
| x     | Coordenada X       |
| y     | Coordenada Y       |
| w     | Máscara de paredes |

---

### Bitmask de Paredes

| Parede | Bit | Valor |
| ------ | --- | ----- |
| Norte  | 0   | 1     |
| Sul    | 1   | 2     |
| Leste  | 2   | 4     |
| Oeste  | 3   | 8     |

### Exemplos

```json
{
  "w": 1
}
```

Parede ao Norte.

```json
{
  "w": 5
}
```

Parede ao Norte e Leste.

```json
{
  "w": 15
}
```

Célula cercada por paredes.

---

## 6.3 optimal_path_calculated

Disparado quando o algoritmo encontrar a rota ótima.

```json
{
  "event_id": 50,
  "id_corrida": 1,
  "timestamp_ms": 9000,
  "tipo": "optimal_path_calculated",
  "payload": {
    "rota": [
      [0,0],
      [0,1],
      [0,2],
      [1,2],
      [2,2]
    ]
  }
}
```

### Objetivo

Permitir que a interface web desenhe a rota calculada pelo FloodFill.

---

## 6.4 fast_run_started

Disparado imediatamente antes da corrida rápida.

```json
{
  "event_id": 51,
  "id_corrida": 1,
  "timestamp_ms": 9010,
  "tipo": "fast_run_started"
}
```

---

## 6.5 run_finished

Disparado uma única vez ao finalizar a corrida.

```json
{
  "event_id": 100,
  "id_corrida": 1,
  "timestamp_ms": 14250,
  "tipo": "run_finished",
  "payload": {
    "sucesso": true,
    "v_med": 0.22,
    "bateria": 88
  }
}
```

### Campos

| Campo   | Descrição           |
| ------- | ------------------- |
| sucesso | Conclusão da missão |
| v_med   | Velocidade média    |
| bateria | Bateria restante    |

---

# 7. Comunicação

## Protocolo

A comunicação ocorrerá utilizando WebSocket.

Objetivos:

* Baixa latência;
* Comunicação bidirecional;
* Atualizações em tempo real.

---

# 8. Persistência Local

A ESP32 deverá manter um buffer local contendo eventos ainda não confirmados.

Estrutura conceitual:

```cpp
struct TelemetryEvent {
    uint32_t event_id;
    uint32_t timestamp_ms;
};
```

Os eventos podem permanecer:

* em RAM durante a execução;
* em LittleFS para persistência prolongada.

---

# 9. Reconexão

## Perda de Conexão

Ao detectar desconexão:

1. Continuar gerando eventos;
2. Continuar armazenando eventos localmente;
3. Tentar reconectar automaticamente;
4. Reenviar eventos pendentes.

---

## ACK

O backend poderá confirmar o recebimento:

```json
{
  "ack": 100
}
```

Significando que todos os eventos até o ID 100 foram persistidos.

Após confirmação, os eventos podem ser removidos do buffer.

---

# 10. Banco de Dados

O backend deverá armazenar:

## Corridas

* id_corrida
* data
* dimensão
* tentativa
* duração
* sucesso

## Eventos

* event_id
* id_corrida
* timestamp
* tipo
* payload

---

# 11. Reprodução de Corridas

A reprodução deverá ser possível utilizando apenas os eventos armazenados.

Fluxo:

1. Recuperar eventos da corrida;
2. Ordenar por timestamp;
3. Reaplicar os eventos;
4. Reconstruir o estado do labirinto.

---

# 12. Métricas Futuras

A arquitetura deverá permitir expansão para:

* Telemetria de sensores;
* Telemetria de motores;
* Corrente dos motores;
* Temperatura da ESP32;
* Tensão da bateria;
* Consumo energético;
* Estatísticas por algoritmo;
* Comparação entre corridas.

---

# 13. Responsabilidades

## Firmware

* Gerar eventos;
* Gerenciar buffer local;
* Transmitir eventos;
* Realizar retransmissão após reconexão.

## Backend

* Receber eventos;
* Validar eventos;
* Persistir eventos;
* Disponibilizar APIs.

## Frontend

* Visualização em tempo real;
* Replay de corridas;
* Dashboard de métricas.

## Equipe de Dados

* Definição de métricas;
* Geração de relatórios;
* Análises estatísticas.

```
```
