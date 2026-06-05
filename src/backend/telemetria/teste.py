# simular_esp32.py
import requests
import time
import random

CORRIDA_ID = 1
URL = f"http://localhost:8000/api/corridas/{CORRIDA_ID}/telemetria"

linha, coluna = 0, 0

while True:
    payload = {
        "linha": linha,
        "coluna": coluna,
        "parede_norte": random.choice([True, False]),
        "parede_sul": random.choice([True, False]),
        "parede_leste": random.choice([True, False]),
        "parede_oeste": random.choice([True, False]),
        "posicao_ordem": linha * 4 + coluna,
        "x": coluna * 18,
        "y": linha * 18,
        "direcao": random.choice(["N", "S", "L", "O"]),
        "velocidade": round(random.uniform(0.1, 0.5), 2),
        "bateria": round(random.uniform(70, 100), 1),
    }

    r = requests.post(URL, json=payload)
    print(f"[{r.status_code}] Célula ({linha},{coluna}) enviada")

    # avança no grid simulando o robô andando
    coluna += 1
    if coluna >= 4:
        coluna = 0
        linha += 1
    if linha >= 4:
        linha = 0

    # time.sleep(0.1)  # simula 200ms entre leituras