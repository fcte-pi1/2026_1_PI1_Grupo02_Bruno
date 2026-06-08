import requests
import random
import time

BASE_URL = "http://127.0.0.1:8000/api"

# cria labirinto 16x16
lab = requests.post(f"{BASE_URL}/labirintos", json={"nome": "Lab 16x16", "tamanho": 16})
labirinto_id = lab.json()["id"]
print(f"Labirinto criado: id={labirinto_id}")

# cria corrida
corrida = requests.post(f"{BASE_URL}/corridas", json={"labirinto_id": labirinto_id})
corrida_id = corrida.json()["id"]
print(f"Corrida criada: id={corrida_id}")

posicao_ordem = 0
direcoes = ["N", "S", "L", "O"]

for linha in range(16):
    # zigue-zague: linha par vai da esquerda pra direita, ímpar ao contrário
    colunas = range(16) if linha % 2 == 0 else range(15, -1, -1)

    for coluna in colunas:
        eh_inicio = linha == 0 and coluna == 0
        eh_fim = linha == 15 and coluna == 15

        payload = {
            "linha": linha,
            "coluna": coluna,
            "parede_norte": linha == 0,           # borda norte
            "parede_sul": linha == 15,            # borda sul
            "parede_leste": coluna == 15,         # borda leste
            "parede_oeste": coluna == 0,          # borda oeste
            "posicao_ordem": posicao_ordem,
            "x": coluna * 18,
            "y": linha * 18,
            "direcao": random.choice(direcoes),
            "velocidade": round(random.uniform(0.1, 0.5), 2),
            "bateria": round(100 - (posicao_ordem * 0.4), 1),
        }

        r = requests.post(f"{BASE_URL}/corridas/{corrida_id}/telemetria", json=payload)
        status = "INICIO" if eh_inicio else "FIM" if eh_fim else ""
        print(f"[{r.status_code}] ({linha},{coluna}) ordem={posicao_ordem} {status}")

        posicao_ordem += 1
        time.sleep(0.2)

# finaliza a corrida
tempo_total = posicao_ordem * 0.2
r = requests.patch(f"{BASE_URL}/corridas/{corrida_id}/finalizar", json={
    "tempo_conclusao_sec": round(tempo_total, 1),
    "velocidade_media": 0.3,
    "consumo_bateria": round(100 - (posicao_ordem * 0.4), 1),
    "desafio_concluido": True,
})
print(f"\nCorrida finalizada: {r.json()}")