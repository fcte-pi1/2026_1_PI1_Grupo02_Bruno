# Como testar a telemetria WebSocket

Valida a comunicação ESP32 → Backend via WebSocket e a persistência no SQLite.

---

## Pré-requisitos

```bash
# Na raiz do repositório
cd src/backend

# Instalar dependências (com venv ativo)
pip install -r requirements.txt
pip install websockets

# Criar as tabelas no banco
python manage.py migrate
```

---

## Passo 1 — Iniciar o servidor

```bash
daphne config.asgi:application
```

Saída esperada:

```
Listening on TCP address 127.0.0.1:8000
```

---

## Passo 2 — Rodar o simulador (outro terminal)

```bash
python telemetria/tests/simulador_ws.py
```

Saída esperada:
```
Conectando em ws://localhost:8000/ws/firmware/ ...
Conexão estabelecida.

  [OK] run_started — ack=1, corrida_id=<N>
  [OK] cell_discovered (0,0) w=9 — ack=2
  [OK] cell_discovered (1,0) w=1 — ack=3
  [OK] cell_discovered (2,0) w=1 — ack=4
  [OK] cell_discovered (3,0) w=5 — ack=5
  [OK] cell_discovered (3,1) w=4 — ack=6
  [OK] cell_discovered (2,1) w=0 — ack=7
  [OK] cell_discovered (1,1) w=0 — ack=8
  [OK] cell_discovered (0,1) w=8 — ack=9
  [OK] optimal_path_calculated — ack=10
  [OK] fast_run_started — ack=11
  [OK] run_finished — ack=12

Todos os eventos enviados com sucesso. corrida_id=<N>
```

Qualquer linha `[ERRO]` indica falha.

---

## Passo 3 — Verificar persistência no banco

```bash
python manage.py shell
```

```python
from telemetria.models import Corrida, Celula, EstadoAtual

c = Corrida.objects.last()
print("corrida_id      :", c.id)
print("finalizado_em   :", c.finalizado_em)    # deve ter data/hora
print("desafio_concluido:", c.desafio_concluido) # deve ser True
print("velocidade_med  :", c.velocidade_med)   # deve ser 0.31
print("consumo_bat     :", c.consumo_bat)       # deve ser 12.0 (100 - 88)
print("celulas         :", Celula.objects.filter(labirinto_id=c.labitinto_id).count())  # 8
print("estados         :", EstadoAtual.objects.filter(corrida_id=c).count())            # 8
```

Resultado esperado:
```
corrida_id      : <N>
finalizado_em   : 2026-...  (não nulo)
desafio_concluido: True
velocidade_med  : 0.31
consumo_bat     : 12.0
celulas         : 8
estados         : 8
```

---

## O que cada verificação prova

| Verificação | Critério de aceite |
|---|---|
| 12 ACKs recebidos | Backend processa todos os eventos do protocolo (CA-10-03) |
| `finalizado_em` preenchido | `run_finished` fecha a corrida no banco (CA-10-01) |
| `desafio_concluido = True` | Payload `sucesso` persistido corretamente |
| 8 células no banco | `cell_discovered` persiste cada célula com paredes (CA-10-02) |
| 8 estados no banco | `EstadoAtual` registra posição e bateria por evento |

---

## Rastreamento

- **US-10** — Comunicação em Tempo Real
- **CT-SW-01** — Sincronização de Telemetria
- **Issue #180** — Backend Core: WebSocket ESP32 → Backend
