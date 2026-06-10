"""
Simulador WebSocket — Issue #180

Conecta em ws://localhost:8000/ws/firmware/ e envia os 5 eventos do protocolo
de telemetria em sequência, validando os ACKs e a persistência no banco.

Uso:
    python manage.py shell < telemetria/tests/simulador_ws.py
    # ou direto (com o servidor rodando):
    python telemetria/tests/simulador_ws.py

Dependências:
    pip install websockets
"""

import asyncio
import json
import sys
import time

try:
    import websockets
except ImportError:
    print("ERRO: instale websockets — pip install websockets")
    sys.exit(1)

WS_URL = "ws://localhost:8000/ws/firmware/"

# ---------------------------------------------------------------------------
# Eventos do protocolo (conforme telemetria.md)
# ---------------------------------------------------------------------------

def evento_run_started(event_id=1):
    return {
        "event_id": event_id,
        "timestamp_ms": 0,
        "tipo": "run_started",
        "payload": {
            "dimensao": 4,
            "tentativa": 1,
            "bateria": 100.0,
        },
    }


def evento_cell_discovered(event_id, x, y, w, bateria):
    """
    w — bitmask de paredes: Norte=1, Sul=2, Leste=4, Oeste=8
    """
    return {
        "event_id": event_id,
        "timestamp_ms": event_id * 500,
        "tipo": "cell_discovered",
        "payload": {
            "x": x,
            "y": y,
            "w": w,
            "bateria": bateria,
        },
    }


def evento_optimal_path_calculated(event_id, rota):
    return {
        "event_id": event_id,
        "timestamp_ms": event_id * 500,
        "tipo": "optimal_path_calculated",
        "payload": {"rota": rota},
    }


def evento_fast_run_started(event_id):
    return {
        "event_id": event_id,
        "timestamp_ms": event_id * 500,
        "tipo": "fast_run_started",
    }


def evento_run_finished(event_id, sucesso=True, v_med=0.22, bateria=88.0):
    return {
        "event_id": event_id,
        "timestamp_ms": event_id * 500,
        "tipo": "run_finished",
        "payload": {
            "sucesso": sucesso,
            "v_med": v_med,
            "bateria": bateria,
        },
    }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def enviar_e_aguardar_ack(ws, evento, descricao):
    """Envia um evento e aguarda o ACK do backend."""
    await ws.send(json.dumps(evento))
    resposta_raw = await asyncio.wait_for(ws.recv(), timeout=5.0)
    resposta = json.loads(resposta_raw)

    ack = resposta.get("ack")
    corrida_id = resposta.get("corrida_id")

    if ack == evento["event_id"]:
        print(f"  [OK] {descricao} — ack={ack}" + (f", corrida_id={corrida_id}" if corrida_id else ""))
    else:
        print(f"  [ERRO] {descricao} — esperado ack={evento['event_id']}, recebido: {resposta}")
        return None

    return corrida_id if corrida_id else True


async def simular():
    print(f"\nConectando em {WS_URL} ...")

    try:
        async with websockets.connect(WS_URL) as ws:
            print("Conexão estabelecida.\n")
            corrida_id = None
            event_id = 1

            # 1. run_started
            ev = evento_run_started(event_id)
            resultado = await enviar_e_aguardar_ack(ws, ev, "run_started")
            if resultado is None:
                return
            corrida_id = resultado
            event_id += 1

            # 2. cell_discovered — percorre um labirinto 4x4 em zigue-zague
            # Bitmask: células de borda têm paredes externas
            celulas = [
                (0, 0, 9,  99.0),   # x=0,y=0 — parede Norte(1)+Oeste(8)=9
                (1, 0, 1,  98.5),   # x=1,y=0 — parede Norte(1)
                (2, 0, 1,  98.0),
                (3, 0, 5,  97.5),   # x=3,y=0 — parede Norte(1)+Leste(4)=5
                (3, 1, 4,  97.0),   # parede Leste(4)
                (2, 1, 0,  96.5),   # sem paredes internas
                (1, 1, 0,  96.0),
                (0, 1, 8,  95.5),   # parede Oeste(8)
            ]

            for x, y, w, bat in celulas:
                ev = evento_cell_discovered(event_id, x, y, w, bat)
                resultado = await enviar_e_aguardar_ack(ws, ev, f"cell_discovered ({x},{y}) w={w}")
                if resultado is None:
                    return
                event_id += 1
                await asyncio.sleep(0.1)

            # 3. optimal_path_calculated
            rota = [[0,0],[0,1],[1,1],[2,1],[3,1]]
            ev = evento_optimal_path_calculated(event_id, rota)
            resultado = await enviar_e_aguardar_ack(ws, ev, "optimal_path_calculated")
            if resultado is None:
                return
            event_id += 1

            # 4. fast_run_started
            ev = evento_fast_run_started(event_id)
            resultado = await enviar_e_aguardar_ack(ws, ev, "fast_run_started")
            if resultado is None:
                return
            event_id += 1

            # 5. run_finished
            ev = evento_run_finished(event_id, sucesso=True, v_med=0.31, bateria=88.0)
            resultado = await enviar_e_aguardar_ack(ws, ev, "run_finished")
            if resultado is None:
                return

            print(f"\nTodos os eventos enviados com sucesso. corrida_id={corrida_id}")

    except ConnectionRefusedError:
        print("ERRO: servidor não está rodando. Execute: daphne config.asgi:application")
    except asyncio.TimeoutError:
        print("ERRO: timeout aguardando ACK do backend")
    except Exception as e:
        print(f"ERRO inesperado: {e}")


def verificar_banco(corrida_id):
    """Verifica persistência no SQLite após a simulação."""
    import django
    import os
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    django.setup()

    from telemetria.models import Corrida, Celula, EstadoAtual

    try:
        corrida = Corrida.objects.get(id=corrida_id)
        estados = EstadoAtual.objects.filter(corrida_id=corrida).count()
        celulas = Celula.objects.filter(
            labirinto_id=corrida.labitinto_id
        ).count()

        print("\n--- Verificação do banco ---")
        print(f"  Corrida #{corrida.id}: iniciado_em={corrida.iniciado_em}")
        print(f"  finalizado_em : {corrida.finalizado_em}")
        print(f"  desafio_concluido: {corrida.desafio_concluido}")
        print(f"  velocidade_med: {corrida.velocidade_med}")
        print(f"  celulas no banco : {celulas}")
        print(f"  estados no banco : {estados}")

        assert corrida.finalizado_em is not None, "FALHA: corrida não foi finalizada"
        assert corrida.desafio_concluido is True, "FALHA: desafio_concluido deveria ser True"
        assert celulas > 0, "FALHA: nenhuma célula foi persistida"
        assert estados > 0, "FALHA: nenhum estado foi persistido"

        print("\n[PASS] Persistência validada com sucesso.")

    except Corrida.DoesNotExist:
        print(f"\n[FALHA] Corrida #{corrida_id} não encontrada no banco.")


if __name__ == "__main__":
    asyncio.run(simular())
