import json
from datetime import datetime, timezone

from django.test import TestCase

from telemetria.models import Labirinto


class LabirintosApiTests(TestCase):
    endpoint = "/api/labirintos"

    def test_lista_labirintos(self):
        Labirinto.objects.create(nome="Labirinto 01", tamanho=16)

        response = self.client.get(self.endpoint)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]["nome"], "Labirinto 01")
        self.assertIn("created_at", response.json()[0])

    def test_cria_labirinto(self):
        response = self.client.post(
            self.endpoint,
            data=json.dumps({"nome": "Labirinto 02", "tamanho": 8}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["nome"], "Labirinto 02")
        self.assertEqual(response.json()["tamanho"], 8)
        self.assertEqual(Labirinto.objects.count(), 1)

    def test_rejeita_tamanho_fora_do_padrao(self):
        response = self.client.post(
            self.endpoint,
            data=json.dumps({"nome": "Labirinto invalido", "tamanho": 10}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["erro"], "O campo tamanho deve ser 4, 8 ou 16.")
        self.assertEqual(Labirinto.objects.count(), 0)

    def test_rejeita_json_invalido(self):
        response = self.client.post(
            self.endpoint,
            data="{",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["erro"], "JSON invalido.")

    def test_aceita_rota_com_barra_final(self):
        response = self.client.get("/api/labirintos/")

        self.assertEqual(response.status_code, 200)

    def test_busca_labirinto_por_id(self):
        labirinto = Labirinto.objects.create(nome="Labirinto 03", tamanho=4)

        response = self.client.get(f"/api/labirintos/{labirinto.id}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], labirinto.id)
        self.assertEqual(response.json()["nome"], "Labirinto 03")
        self.assertEqual(response.json()["tamanho"], 4)

    def test_retorna_404_para_labirinto_inexistente(self):
        response = self.client.get("/api/labirintos/999")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["erro"], "Labirinto nao encontrado.")

    def test_busca_por_id_aceita_barra_final(self):
        labirinto = Labirinto.objects.create(nome="Labirinto 04", tamanho=8)

        response = self.client.get(f"/api/labirintos/{labirinto.id}/")

        self.assertEqual(response.status_code, 200)



