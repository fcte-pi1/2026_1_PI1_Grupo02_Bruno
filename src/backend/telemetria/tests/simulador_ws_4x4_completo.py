"""
Simulador 4x4 completo com volta do robo

Percorre um labirinto 4x4 completo, incluindo o caso onde
o robo volta para uma celula ja visitada.

Uso:
    1. Suba o backend:
       daphne config.asgi:application

    2. Suba o frontend:
       npm run dev

    3. Rode em src/backend:
       python telemetria/tests/simulador_ws_4x4_completo.py

Dependencia:
    pip install websockets
"""

import asyncio
import json
import sys

try:
    import websockets
except ImportError:
    print("ERRO: instale websockets com: pip install websockets")
    sys.exit(1)

WS_URL = "ws://localhost:8000/ws/firmware/"
DIMENSAO = 4
INTERVALO_SEGUNDOS = 0.7


def evento_run_started(event_id=1):
    return {
        "event_id": event_id,
        "timestamp_ms": 0,
        "tipo": "run_started",
        "payload": {
            "dimensao": DIMENSAO,
            "tentativa": 1,
            "bateria": 100.0,
        },
    }


def evento_cell_discovered(event_id, x, y, norte, sul, leste, oeste, direcao, velocidade, bateria):
    return {
        "event_id": event_id,
        "timestamp_ms": event_id * 700,
        "tipo": "cell_discovered",
        "payload": {
            "x": x,
            "y": y,
            "linha": y,
            "coluna": x,
            "parede_norte": norte,
            "parede_sul": sul,
            "parede_leste": leste,
            "parede_oeste": oeste,
            "direcao": direcao,
            "velocidade": velocidade,
            "bateria": bateria,
        },
    }


def evento_run_finished(event_id, sucesso=True, v_med=0.25, bateria=80.0):
    return {
        "event_id": event_id,
        "timestamp_ms": event_id * 700,
        "tipo": "run_finished",
        "payload": {
            "sucesso": sucesso,
            "v_med": v_med,
            "bateria": bateria,
        },
    }


async def enviar_e_aguardar_ack(ws, evento, descricao):
    await ws.send(json.dumps(evento))
    resposta_raw = await asyncio.wait_for(ws.recv(), timeout=5.0)
    resposta = json.loads(resposta_raw)

    if resposta.get("ack") != evento["event_id"]:
        print(f"[ERRO] {descricao}: ACK inesperado: {resposta}")
        return None

    corrida_id = resposta.get("corrida_id")
    sufixo = f", corrida_id={corrida_id}" if corrida_id else ""
    print(f"[OK] {descricao} ack={resposta['ack']}{sufixo}")
    return corrida_id if corrida_id else True


async def simular():
    print(f"Conectando em {WS_URL} ...")
    print("Abra a dashboard antes de iniciar.\n")

    try:
        async with websockets.connect(WS_URL) as ws:
            event_id = 1

            resultado = await enviar_e_aguardar_ack(
                ws,
                evento_run_started(event_id),
                "run_started: labirinto 4x4 completo",
            )
            if resultado is None:
                return

            corrida_id = resultado
            event_id += 1
            await asyncio.sleep(INTERVALO_SEGUNDOS)

            # Labirinto 4x4
            # Origem (0,0) canto inferior esquerdo
            # X cresce para Leste, Y cresce para Norte
            #
            # Layout visual (y=3 em cima, y=0 embaixo):
            #
            # y=3: (0,3)(1,3)(2,3)(3,3)
            # y=2: (0,2)(1,2)(2,2)(3,2)
            # y=1: (0,1)(1,1)(2,1)(3,1)
            # y=0: (0,0)(1,0)(2,0)(3,0)  <- inicio aqui
            #
            # Percurso:
            # linha 0: (0,0)->(1,0)->(2,0)->(3,0)  Leste
            # sobe: (3,0)->(3,1)                    Norte
            # linha 1: (3,1)->(2,1)->(1,1)->(0,1)  Oeste
            # sobe: (0,1)->(0,2)                    Norte
            # linha 2: (0,2)->(1,2)->(2,2)->(3,2)  Leste
            # sobe: (3,2)->(3,3)                    Norte
            # linha 3: (3,3)->(2,3)->(1,3)->(0,3)  Oeste
            # VOLTA para celula ja visitada: (0,3)->(0,2) Sul (teste!)

            celulas = [
            # x,  y,  N      S      L      O      dir      vel   bat
            # --- parte de (0,0) vai para Leste ---
            (0,  0,  False, True,  False, True,  "Leste", 0.10, 99.5),
            (1,  0,  False, True,  False, False, "Leste", 0.18, 99.0),
            (2,  0,  False, True,  False, False, "Leste", 0.20, 98.5),
            (3,  0,  False, True,  True,  False, "Norte", 0.22, 98.0),
            # --- sobe coluna 3 ---
            (3,  1,  False, False, True,  False, "Norte", 0.22, 97.5),
            (3,  2,  False, False, True,  False, "Norte", 0.24, 97.0),
            (3,  3,  True,  False, True,  False, "Oeste", 0.24, 96.5),
            # --- linha 3 indo Oeste ---
            (2,  3,  True,  False, False, False, "Oeste", 0.25, 96.0),
            (1,  3,  True,  False, False, False, "Oeste", 0.25, 95.5),
            (0,  3,  True,  False, False, True,  "Sul",   0.22, 95.0),
            # --- desce coluna 0 ---
            (0,  2,  False, False, False, True,  "Sul",   0.22, 94.5),
            (0,  1,  False, False, False, True,  "Sul",   0.20, 94.0),
            # --- chega em (0,0) ja visitada - VOLTA! ---
            (0,  0,  False, True,  False, True,  "Leste", 0.15, 93.5),
            # --- volta pelo caminho ja visitado ---
            (1,  0,  False, True,  False, False, "Leste", 0.15, 93.0),
            (2,  0,  False, True,  False, False, "Leste", 0.15, 92.5),
        ]        

            for x, y, norte, sul, leste, oeste, direcao, velocidade, bateria in celulas:
                descricao = f"cell_discovered: ({x},{y}) dir={direcao}"
                evento = evento_cell_discovered(
                    event_id, x, y, norte, sul, leste, oeste, direcao, velocidade, bateria
                )

                if await enviar_e_aguardar_ack(ws, evento, descricao) is None:
                    return

                event_id += 1
                await asyncio.sleep(INTERVALO_SEGUNDOS)

            if await enviar_e_aguardar_ack(
                ws,
                evento_run_finished(event_id),
                "run_finished",
            ) is None:
                return

            print(f"\nSimulacao concluida. Corrida #{corrida_id}")
            print("Confira no MazeCanvas:")
            print("  - percurso em zigue-zague cobrindo todas as 16 celulas")
            print("  - bolinha voltando para (0,2) sem adicionar nova seta")
            print("  - paredes coerentes entre celulas vizinhas")

    except ConnectionRefusedError:
        print("ERRO: backend nao esta rodando.")
    except asyncio.TimeoutError:
        print("ERRO: timeout aguardando ACK.")
    except Exception as erro:
        print(f"ERRO inesperado: {erro}")


if __name__ == "__main__":
    asyncio.run(simular())
