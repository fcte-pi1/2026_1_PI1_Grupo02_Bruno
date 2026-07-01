"""
Simulador visual do MazeCanvas

Conecta em ws://localhost:8000/ws/firmware/ e envia eventos em ritmo lento
para testar, no dashboard React, o desenho do labirinto, paredes, rastro e
movimentacao da bolinha do micromouse.

Uso:
    1. Suba o backend em src/backend:
       daphne config.asgi:application

    2. Suba o frontend e abra a dashboard:
       npm run dev

    3. Em outro terminal, rode em src/backend:
       python telemetria/tests/simulador_ws_maze_canvas.py

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


def evento_run_finished(event_id, sucesso=True, v_med=0.34, bateria=86.0):
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


async def simular_maze_canvas():
    print(f"Conectando em {WS_URL} ...")
    print("Abra a dashboard antes de iniciar para ver o desenho em tempo real.\n")

    try:
        async with websockets.connect(WS_URL) as ws:
            event_id = 1

            resultado = await enviar_e_aguardar_ack(
                ws,
                evento_run_started(event_id),
                "run_started: cria corrida 4x4",
            )
            if resultado is None:
                return

            corrida_id = resultado
            event_id += 1
            await asyncio.sleep(INTERVALO_SEGUNDOS)

            # Percurso planejado para validar visualmente:
            # - comeca no canto inferior esquerdo
            # - anda para leste, sobe, volta para oeste, sobe de novo
            # - termina no canto superior direito
            # - paredes compartilhadas entre celulas vizinhas sao coerentes
            celulas = [
                # x, y, norte, sul, leste, oeste, direcao, velocidade, bateria
                (0, 0, True,  True,  False, True,  "Leste", 0.10, 99.0),
                (1, 0, True,  True,  False, False, "Leste", 0.18, 98.0),
                (2, 0, False, True,  True,  False, "Norte", 0.21, 97.0),
                (2, 1, True,  False, True,  False, "Oeste", 0.19, 96.0),
                (1, 1, False, True,  False, True,  "Norte", 0.23, 95.0),
                (1, 2, True,  False, False, True,  "Leste", 0.25, 93.5),
                (2, 2, True,  True,  False, False, "Leste", 0.28, 92.0),
                (3, 2, False, True,  True,  False, "Norte", 0.30, 90.5),
                (3, 3, True,  False, True,  True,  "Sul",   0.00, 89.0),
            ]

            for x, y, norte, sul, leste, oeste, direcao, velocidade, bateria in celulas:
                descricao = (
                    f"cell_discovered: pos=({x},{y}) dir={direcao} "
                    f"paredes N={norte} S={sul} L={leste} O={oeste}"
                )
                evento = evento_cell_discovered(
                    event_id,
                    x,
                    y,
                    norte,
                    sul,
                    leste,
                    oeste,
                    direcao,
                    velocidade,
                    bateria,
                )

                if await enviar_e_aguardar_ack(ws, evento, descricao) is None:
                    return

                event_id += 1
                await asyncio.sleep(INTERVALO_SEGUNDOS)

            if await enviar_e_aguardar_ack(
                ws,
                evento_run_finished(event_id),
                "run_finished: finaliza corrida visual",
            ) is None:
                return

            print("\nSimulacao concluida.")
            print(f"Corrida criada: #{corrida_id}")
            print("No MazeCanvas, confira:")
            print("  - bolinha pequena terminando em (3,3)")
            print("  - rastro em zigue-zague")
            print("  - paredes compartilhadas consistentes entre celulas vizinhas")
            print("  - paredes internas nas celulas (1,0), (2,1), (1,2), (2,2)")

    except ConnectionRefusedError:
        print("ERRO: backend nao esta rodando. Execute: daphne config.asgi:application")
    except asyncio.TimeoutError:
        print("ERRO: timeout aguardando ACK do backend")
    except Exception as erro:
        print(f"ERRO inesperado: {erro}")


if __name__ == "__main__":
    asyncio.run(simular_maze_canvas())
