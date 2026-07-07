# Tutorial de Telemetria — Micromouse

> **Para quem é este tutorial?**
> Qualquer pessoa do grupo que precise colocar o sistema de telemetria para funcionar do zero — da ESP32 até o dashboard.
> Nenhum conhecimento avançado é necessário. Siga os passos na ordem.

---

## 1. O que é a Telemetria e Como Funciona

A telemetria é o sistema que permite **ver o que o robô está fazendo em tempo real** no computador — posição no labirinto, bateria, paredes detectadas e muito mais.

O fluxo completo é este:

```
┌──────────────────────────────────────────────────────────────────┐
│                         FLUXO DE DADOS                           │
│                                                                   │
│  ESP32 (robô)                                                     │
│   ├─ Lê sensores IR (paredes)                                     │
│   ├─ Lê bateria (ADC)                                            │
│   ├─ Executa Flood Fill                                           │
│   └─ Monta JSON → envia via WebSocket ───────────────┐           │
│                                                       ↓           │
│                                            Backend Django         │
│                                             ├─ Recebe evento      │
│                                             ├─ Salva no banco     │
│                                             └─ Broadcast ─────┐  │
│                                                                ↓  │
│                                               Frontend React      │
│                                                └─ Atualiza        │
│                                                   Dashboard       │
└──────────────────────────────────────────────────────────────────┘
```

### Rede Wi-Fi utilizada

A ESP32 **cria um hotspot próprio** chamado `rataturing`. O computador precisa se conectar a essa rede para que a comunicação funcione.

```
ESP32 (Access Point)
  SSID    : rataturing
  Senha   : 87654321
  IP da ESP32 : 192.168.4.1
  IP do PC    : 192.168.4.2  ← use este IP no firmware
```

### Eventos enviados pela ESP32

| Evento | Quando é disparado |
|--------|--------------------|
| `run_started` | Uma vez, ao apertar a chave START |
| `cell_discovered` | A cada nova célula visitada |
| `run_finished` | Ao atingir o centro do labirinto |

---

## 2. Arquivos do Firmware

Todos os arquivos do firmware estão em `src/firmware/`. Veja o que cada um faz:

| Arquivo | Função |
|---------|--------|
| `main.cpp` | Ponto de entrada: `setup()` e `loop()` |
| `Telemetry.h` / `Telemetry.cpp` | **Módulo de telemetria** — WebSocket + buffer FIFO |
| `TelemetryTypes.h` | Estruturas de dados dos eventos |
| `mouse.cpp` | Algoritmo Flood Fill + disparo dos eventos de telemetria |
| `hal.h` | Mapeamento de todos os pinos da ESP32 |
| `sensors.h` / `sensors.cpp` | Leitura dos sensores IR (TCRT5000) |
| `motors.h` / `motors.cpp` | Controle da ponte H (TB6612FNG) + PID + encoders |
| `battery.h` / `battery.cpp` | Leitura da bateria via ADC (divisor de tensão) |
| `dip.h` / `dip.cpp` | Leitura da chave DIP (START / MAPA_4x4 / MAPA_8x8) |
| `ota.h` / `ota.cpp` | Cria o hotspot Wi-Fi `rataturing` + servidor OTA |
| `credentials.h` | SSID e senha da rede Wi-Fi (não alterar) |

### ⚠️ Único arquivo que você PRECISA editar antes do upload

**`src/firmware/Telemetry.cpp` — linha 25:**

```cpp
const char* host = "0.0.0.0"; // <-- COLOQUE O IP DO SEU PC AQUI
```

Descubra o IP do seu computador **depois de conectar na rede `rataturing`**:

```bash
# Linux / macOS
hostname -I

# Windows (no Prompt de Comando)
ipconfig
# procure o adaptador Wi-Fi e anote o "Endereço IPv4"
```

O IP vai ser algo como `192.168.4.2`. Substitua:

```cpp
const char* host = "192.168.4.2"; // exemplo — confirme o seu IP real
```

---

## 3. Configurando o Firmware na Arduino IDE

### 3.1 Pré-requisitos

1. **Arduino IDE 2.x** instalada ([download aqui](https://www.arduino.cc/en/software))
2. **Suporte ao ESP32** instalado:
   - Abra: `Arquivo → Preferências`
   - Em "URLs adicionais para Gerenciadores de Placas", cole:
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Abra: `Ferramentas → Placa → Gerenciador de Placas`
   - Pesquise `esp32` e instale o pacote da **Espressif Systems**

### 3.2 Instalando as Bibliotecas Necessárias

Vá em `Sketch → Incluir Biblioteca → Gerenciar Bibliotecas` e instale as três bibliotecas abaixo:

| Biblioteca | Autor | Para que serve |
|------------|-------|----------------|
| `ArduinoJson` | Benoit Blanchon | Criar e ler JSONs na ESP32 |
| `WebSockets` | Markus Sattler | Conexão WebSocket com o backend |
| `ElegantOTA` | Ayush Sharma | Atualização de firmware via Wi-Fi |

> **Dica:** pesquise pelo nome exato na barra de busca do Gerenciador de Bibliotecas.

### 3.3 Estrutura do Projeto na Arduino IDE

A Arduino IDE trabalha com **sketches** (arquivos `.ino`). Para usar os arquivos `.cpp` e `.h` do projeto, crie uma pasta de sketch e coloque todos os arquivos dentro dela.

**Estrutura esperada:**
```
MicromouseFirmware/
├── MicromouseFirmware.ino   ← arquivo principal da IDE (pode estar vazio)
├── main.cpp
├── Telemetry.h
├── Telemetry.cpp
├── TelemetryTypes.h
├── mouse.cpp
├── hal.h
├── sensors.h
├── sensors.cpp
├── motors.h
├── motors.cpp
├── battery.h
├── battery.cpp
├── dip.h
├── dip.cpp
├── ota.h
├── ota.cpp
└── credentials.h
```

**Como fazer:**

1. Copie todos os arquivos de `src/firmware/` (ignore os `.md` e `.ino` de exemplo) para uma nova pasta chamada `MicromouseFirmware`
2. Dentro dessa pasta, crie um arquivo chamado `MicromouseFirmware.ino` com o conteúdo vazio (a IDE precisa de um arquivo `.ino` para reconhecer como sketch; a lógica real está no `main.cpp`)
3. Abra a pasta na Arduino IDE: `Arquivo → Abrir → selecione MicromouseFirmware.ino`

### 3.4 Selecionando a Placa Correta

`Ferramentas → Placa → ESP32 Arduino → ESP32 Dev Module`

Configurações recomendadas:

| Configuração | Valor |
|---|---|
| Upload Speed | 921600 |
| CPU Frequency | 240MHz (WiFi/BT) |
| Flash Size | 4MB (32Mb) |
| Partition Scheme | Default 4MB with spiffs |

### 3.5 Editando o IP do Backend

Antes de fazer o upload, edite `Telemetry.cpp` (linha 25):

```cpp
// Substitua pelo IP do seu PC na rede rataturing
const char* host = "192.168.4.2";
const int port = 8000; // não altere
```

### 3.6 Fazendo o Upload

1. Conecte a ESP32 ao computador via USB
2. Selecione a porta: `Ferramentas → Porta → COMx` (Windows) ou `/dev/ttyUSB0` (Linux)
3. Clique em **Upload** (→ ou `Ctrl+U`)
4. Aguarde a mensagem `Done uploading`

> Se aparecer erro de porta, tente segurar o botão **BOOT** da ESP32 enquanto o upload inicia.

### 3.7 Monitorando via Serial Monitor

Abra `Ferramentas → Monitor Serial` e configure para **115200 baud**.

Saída esperada ao ligar:
```
=========================================
Hotspot Wi-Fi criado! Rede: rataturing
IP do Hotspot: 192.168.4.1
=========================================
=== Micromouse pronto ===
Aguardando chave START...
```

Quando conectar ao backend e iniciar corrida:
```
[TEL] run_started | dim=16 bat=95%
[TEL] cell_discovered | (0,0) dir=N bat=95%
[TEL] cell_discovered | (0,1) dir=N bat=94%
...
[TEL] run_finished | bat=88%
=== Corrida finalizada — aguardando reset ===
```

---

## 4. Configurando o Firmware no PlatformIO

O PlatformIO é uma alternativa mais profissional à Arduino IDE — gerencia bibliotecas automaticamente e tem melhor integração com o VS Code.

### 4.1 Pré-requisitos

1. **VS Code** instalado ([download](https://code.visualstudio.com/))
2. Extensão **PlatformIO IDE** instalada:
   - Abra o VS Code → Extensions (`Ctrl+Shift+X`)
   - Pesquise `PlatformIO IDE` e instale

### 4.2 Criando o Projeto

1. Abra o VS Code
2. Clique no ícone do PlatformIO na barra lateral (ícone de formiga 🐜)
3. Clique em `New Project`:
   - **Name:** `MicromouseFirmware`
   - **Board:** pesquise e selecione `Espressif ESP32 Dev Module`
   - **Framework:** `Arduino`
4. Clique em **Finish** e aguarde a criação

### 4.3 Copiando os Arquivos

Copie todos os arquivos de `src/firmware/` para a pasta `src/` do projeto criado:

```
MicromouseFirmware/
├── platformio.ini          ← configuração do projeto (editar a seguir)
├── src/
│   ├── main.cpp            ← substitua o que foi criado pela IDE
│   ├── Telemetry.h
│   ├── Telemetry.cpp
│   ├── TelemetryTypes.h
│   ├── mouse.cpp
│   ├── hal.h
│   ├── sensors.h
│   ├── sensors.cpp
│   ├── motors.h
│   ├── motors.cpp
│   ├── battery.h
│   ├── battery.cpp
│   ├── dip.h
│   ├── dip.cpp
│   ├── ota.h
│   ├── ota.cpp
│   └── credentials.h
└── .pio/                   ← gerado automaticamente, não mexa
```

### 4.4 Configurando o `platformio.ini`

Abra o arquivo `platformio.ini` na raiz do projeto e substitua o conteúdo por:

```ini
[env:esp32dev]
platform  = espressif32
board     = esp32dev
framework = arduino

; Velocidade de upload (mais rápido)
upload_speed = 921600

; Velocidade do monitor serial
monitor_speed = 115200

; Bibliotecas — o PlatformIO baixa automaticamente
lib_deps =
    bblanchon/ArduinoJson @ ^7.0.0
    links2004/WebSockets @ ^2.4.1
    ayushsharma82/ElegantOTA @ ^3.1.7
```

> O PlatformIO baixa e instala as bibliotecas automaticamente na primeira compilação. Você não precisa instalar nada manualmente.

### 4.5 Editando o IP do Backend

Mesmo processo da Arduino IDE: edite `src/Telemetry.cpp` linha 25:

```cpp
const char* host = "192.168.4.2"; // IP do seu PC na rede rataturing
```

### 4.6 Compilar, Upload e Monitor

Todos os comandos ficam na barra inferior do VS Code com PlatformIO:

| Botão | Atalho | Função |
|-------|--------|--------|
| ✔ (Build) | `Ctrl+Alt+B` | Compilar o firmware |
| → (Upload) | `Ctrl+Alt+U` | Fazer upload para a ESP32 |
| 🔌 (Monitor) | `Ctrl+Alt+S` | Abrir o monitor serial |

---

## 5. Configurando e Rodando o Backend

O backend é um servidor **Django** com **Daphne** que recebe os eventos da ESP32 via WebSocket, salva no banco e retransmite para o dashboard em tempo real.

### 5.1 Pré-requisitos

- Python 3.10 ou superior instalado
- `pip` disponível no terminal

Verifique:
```bash
python --version   # deve ser 3.10+
pip --version
```

### 5.2 Criando o Ambiente Virtual

```bash
# Na raiz do repositório
cd /caminho/para/2026_1_PI1_Grupo02_Bruno

python -m venv venv
```

Ativando o ambiente virtual:

```bash
# Linux / macOS
source venv/bin/activate

# Windows — Prompt de Comando
venv\Scripts\activate.bat

# Windows — PowerShell
venv\Scripts\Activate.ps1
```

> ✅ Você saberá que funcionou quando aparecer `(venv)` no início da linha do terminal.

### 5.3 Instalando as Dependências

```bash
pip install -r src/backend/requirements.txt
```

As principais dependências são:

| Pacote | Versão | Função |
|--------|--------|--------|
| Django | 6.0.5 | Framework web principal |
| channels | 4.0.0 | Suporte a WebSocket no Django |
| daphne | 4.0.0 | Servidor ASGI (necessário para WebSocket) |
| asgiref | 3.11.1 | Camada de compatibilidade ASGI |

### 5.4 Criando o Banco de Dados

Execute este comando apenas na **primeira vez** (ou se apagar o arquivo `db.sqlite3`):

```bash
cd src/backend
python manage.py migrate
```

Saída esperada:
```
Operations to perform:
  Apply all migrations: admin, auth, contenttypes, sessions, telemetria
Running migrations:
  Applying telemetria.0001_initial... OK
  ...
```

### 5.5 Iniciando o Servidor com Daphne

O sistema de telemetria usa **WebSocket**, que exige um servidor ASGI. O Daphne é o servidor ASGI configurado no projeto e é iniciado automaticamente pelo `manage.py runserver`:

```bash
# Certifique-se de estar na pasta certa com o venv ativo
cd src/backend
python manage.py runserver 0.0.0.0:8000
```

Ou diretamente com o Daphne:
```bash
cd src/backend
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

> **Por que `0.0.0.0`?**
> Isso faz o servidor escutar em **todas as interfaces de rede** do computador — tanto no `localhost` quanto no IP da rede `rataturing` (`192.168.4.2`). Se usar `127.0.0.1`, a ESP32 não consegue alcançar o servidor.

Saída esperada:
```
Starting ASGI/Daphne version 4.0.0 development server at http://0.0.0.0:8000/
```

### 5.6 Rotas WebSocket Disponíveis

O backend expõe dois canais WebSocket:

| Rota | Quem se conecta | Função |
|------|----------------|--------|
| `ws://192.168.4.2:8000/ws/firmware/` | ESP32 | Recebe eventos de telemetria |
| `ws://127.0.0.1:8000/ws/corrida/live/` | Frontend (browser) | Transmite eventos em tempo real |

**Como funciona internamente:**

```
ESP32 ──────► ws/firmware/ ──► FirmwareConsumer ──► Salva no banco
                                                  └──► Broadcast "corrida_live"
                                                             │
Frontend ◄── ws/corrida/live/ ◄── CorridaConsumer ◄─────────┘
```

---

## 6. Conectando Tudo — Passo a Passo Completo

Siga esta ordem **sempre** que for testar o sistema completo:

### Ordem de inicialização

```
Passo 1 ─── Inicie o backend no terminal
Passo 2 ─── Ligue o robô (ele cria a rede rataturing)
Passo 3 ─── Conecte o PC na rede rataturing
Passo 4 ─── Confirme o IP do PC (deve ser 192.168.4.2)
Passo 5 ─── Confirme que o Telemetry.cpp tem o IP correto
Passo 6 ─── Ative a chave START no robô
```

### Passo 1 — Iniciar o Backend

Abra um terminal, ative o venv e execute:

```bash
source venv/bin/activate         # Linux/macOS
# ou: venv\Scripts\activate.bat  # Windows

cd src/backend
python manage.py runserver 0.0.0.0:8000
```

Deixe este terminal aberto durante toda a sessão.

### Passo 2 — Ligar o Robô

- Ligue o robô ou conecte via USB para ver o Serial Monitor
- Ele vai criar automaticamente a rede `rataturing`
- O Serial Monitor mostrará: `IP do Hotspot: 192.168.4.1`

### Passo 3 — Conectar o PC na Rede da ESP32

No seu computador, vá nas configurações de Wi-Fi e conecte à rede:
- **Nome:** `rataturing`
- **Senha:** `87654321`

### Passo 4 — Verificar o IP Recebido

```bash
hostname -I   # Linux/macOS — anote o IP no formato 192.168.4.x
ipconfig      # Windows — procure "Adaptador Wi-Fi" → "Endereço IPv4"
```

O IP deve ser `192.168.4.2` (padrão). Se for diferente, use o IP mostrado.

### Passo 5 — Confirmar o Firmware

Se precisou alterar o IP, edite `Telemetry.cpp` e faça novo upload.

Quando tudo estiver certo, o terminal do backend mostrará:
```
WebSocket CONNECT /ws/firmware/
```

### Passo 6 — Iniciar a Corrida

Ative a chave **START** (pino 27). O Serial Monitor mostrará:

```
=== START ativado — iniciando corrida ===
[TEL] run_started | dim=16 bat=95%
[TEL] cell_discovered | (0,0) dir=N bat=95%
[TEL] cell_discovered | (0,1) dir=N bat=94%
...
[TEL] run_finished | bat=88%
```

E o terminal do backend confirmará o recebimento de cada evento.

---

## 7. Validando sem o Robô Físico (Simulador Python)

Se você não tiver o robô disponível, pode testar o backend com o simulador:

```bash
# Com o backend rodando em outro terminal e o venv ativo:
cd src/backend
python telemetria/tests/simulador_ws.py
```

Saída esperada:
```
Conectando em ws://localhost:8000/ws/firmware/ ...
Conexão estabelecida.

  [OK] run_started — ack=1, corrida_id=3
  [OK] cell_discovered (0,0) dir=N — ack=2
  [OK] cell_discovered (1,0) dir=L — ack=3
  [OK] cell_discovered (2,0) dir=L — ack=4
  ...
  [OK] optimal_path_calculated — ack=10
  [OK] fast_run_started — ack=11
  [OK] run_finished — ack=12

Todos os eventos enviados com sucesso. corrida_id=3
```

---

## 8. Verificando os Dados no Banco de Dados

Para confirmar que os eventos estão sendo salvos corretamente:

```bash
cd src/backend
python manage.py shell
```

No shell interativo:
```python
from telemetria.models import Corrida, Celula, EstadoAtual

# Ver todas as corridas registradas
Corrida.objects.all().values('id', 'iniciado_em', 'finalizado_em', 'desafio_concluido')

# Ver a última corrida
c = Corrida.objects.last()
print(f"Corrida #{c.id} | Início: {c.iniciado_em} | Concluída: {c.desafio_concluido}")

# Quantas células foram mapeadas nessa corrida
estados = EstadoAtual.objects.filter(corrida_id=c).count()
print(f"Células visitadas: {estados}")

# Ver as posições em ordem
for e in EstadoAtual.objects.filter(corrida_id=c).order_by('posicao_ordem'):
    print(f"  Passo {e.posicao_ordem}: ({e.x},{e.y}) dir={e.direcao} bat={e.bateria:.0f}%")
```

---

## 9. Referência dos Eventos JSON

### `run_started` — Início da corrida

```json
{
  "event_id": 1,
  "id_corrida": 0,
  "timestamp_ms": 0,
  "tipo": "run_started",
  "payload": {
    "dimensao": 16,
    "tentativa": 1,
    "bateria": 95
  }
}
```

**ACK retornado pelo backend:**
```json
{ "ack": 1, "corrida_id": 7 }
```

> A partir deste ACK, o firmware usa `"id_corrida": 7` em **todos** os próximos eventos.

---

### `cell_discovered` — Nova célula visitada

```json
{
  "event_id": 2,
  "id_corrida": 7,
  "timestamp_ms": 1340,
  "tipo": "cell_discovered",
  "payload": {
    "x": 0,
    "y": 1,
    "linha": 1,
    "coluna": 0,
    "parede_norte": false,
    "parede_sul": true,
    "parede_leste": false,
    "parede_oeste": true,
    "direcao": "N",
    "velocidade": 0.38,
    "bateria": 94.0
  }
}
```

**ACK:** `{ "ack": 2 }`

> `linha` = alias de `y` | `coluna` = alias de `x` (exigidos pelo backend)

---

### `run_finished` — Corrida finalizada

```json
{
  "event_id": 47,
  "id_corrida": 7,
  "timestamp_ms": 38500,
  "tipo": "run_finished",
  "payload": {
    "sucesso": true,
    "v_med": 0.38,
    "bateria": 88.0
  }
}
```

**ACK:** `{ "ack": 47 }`

---

## 10. Chaves DIP — Configuração do Labirinto

| Pino (HAL) | Chave | Função |
|-----------|-------|--------|
| 27 | `START` | Liga/desliga a corrida |
| 14 | `MAPA_4X4` | Usa labirinto 4×4 |
| 13 | `MAPA_8X8` | Usa labirinto 8×8 |

Se nenhuma chave de mapa estiver ativa, o robô assume labirinto **16×16** (padrão de competição).

---

## 11. Atualização OTA (sem fio, sem cabo USB)

Após o primeiro upload via USB, você pode enviar novas versões do firmware **pelo Wi-Fi**:

1. Conecte o PC na rede `rataturing`
2. Acesse no navegador: `http://192.168.4.1/update`
3. Gere o arquivo `.bin` do firmware:
   - **Arduino IDE:** `Sketch → Exportar Binário Compilado` → o `.bin` fica na pasta do sketch
   - **PlatformIO:** clique em **Build** → o arquivo fica em `.pio/build/esp32dev/firmware.bin`
4. Faça o upload do `.bin` pela página web e aguarde o reinício

---

## 12. Solução de Problemas

### ESP32 não conecta ao backend

| Sintoma | Causa | Solução |
|---------|-------|---------|
| Serial não mostra "WebSocket conectado" | IP errado em `Telemetry.cpp` | Confirme com `hostname -I` e faça upload |
| Backend não exibe nenhum `CONNECT` | Backend não está rodando com `0.0.0.0` | Execute `runserver 0.0.0.0:8000` |
| PC não recebe IP `192.168.4.x` | Não conectou à rede `rataturing` | Verifique o Wi-Fi do computador |
| Erro 400 Bad Request no backend | `ALLOWED_HOSTS` faltando IPs | Confirme `settings.py` com os IPs da rede |

### Erros de compilação

| Erro | Solução |
|------|---------|
| `ArduinoJson.h: No such file` | Instale `ArduinoJson` no Gerenciador de Bibliotecas |
| `WebSocketsClient.h: No such file` | Instale `WebSockets` no Gerenciador de Bibliotecas |
| `ElegantOTA.h: No such file` | Instale `ElegantOTA` no Gerenciador de Bibliotecas |
| `std::array` / `constexpr` errors | Selecione a placa `ESP32 Dev Module` (não Arduino Uno) |
| Porta não encontrada | Instale driver CP2102 ou CH340 para o conversor USB |

### Dados não aparecem no banco

| Sintoma | Causa | Solução |
|---------|-------|---------|
| `"erro": "Corrida nao iniciada"` no log | `cell_discovered` chegou antes do ACK de `run_started` | Verifique a conexão WebSocket — o primeiro ACK deve chegar |
| Banco vazio após corrida | `migrate` não foi executado | Execute `python manage.py migrate` |
| `id_corrida: 0` em todos os eventos | ACK do `run_started` não chegou ao firmware | Verifique o IP e a conectividade entre ESP32 e backend |

---

*Para mais detalhes sobre a arquitetura do protocolo, consulte [`telemetria.md`](./telemetria.md) na mesma pasta.*
