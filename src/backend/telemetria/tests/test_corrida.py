from django.test import TestCase
from datetime import datetime, timezone
import json
from telemetria.models import Labirinto, Corrida

class CorridasApiTests(TestCase):
    endpoint = "/api/corridas"

    def test_cria_corrida(self):
        labirinto = Labirinto.objects.create(nome="Labirinto corrida", tamanho=16)

        response = self.client.post(
            self.endpoint,
            data=json.dumps({"labirinto_id": labirinto.id}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["labirinto_id"], labirinto.id)
        self.assertFalse(response.json()["desafio_concluido"])
        self.assertIn("iniciado_em", response.json())
        self.assertEqual(Corrida.objects.count(), 1)

    def test_retorna_404_quando_labirinto_nao_existe(self):
        response = self.client.post(
            self.endpoint,
            data=json.dumps({"labirinto_id": 999}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["erro"], "Labirinto nao encontrado.")
        self.assertEqual(Corrida.objects.count(), 0)

    def test_rejeita_labirinto_id_invalido(self):
        response = self.client.post(
            self.endpoint,
            data=json.dumps({"labirinto_id": "1"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["erro"],
            "O campo labirinto_id e obrigatorio e deve ser inteiro.",
        )

    def test_rejeita_json_invalido(self):
        response = self.client.post(
            self.endpoint,
            data="{",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["erro"], "JSON invalido.")

    def test_rejeita_corpo_json_que_nao_e_objeto(self):
        response = self.client.post(
            self.endpoint,
            data=json.dumps([1]),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["erro"], "O corpo deve ser um objeto JSON.")
        self.assertEqual(Corrida.objects.count(), 0)

    def test_aceita_rota_com_barra_final(self):
        labirinto = Labirinto.objects.create(nome="Labirinto barra", tamanho=4)

        response = self.client.post(
            "/api/corridas/",
            data=json.dumps({"labirinto_id": labirinto.id}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)

    def test_busca_corrida_por_id(self):
        labirinto = Labirinto.objects.create(nome="Labirinto detalhe", tamanho=8)
        finalizado_em = datetime(2026, 5, 26, 18, 30, tzinfo=timezone.utc)
        corrida = Corrida.objects.create(
            labitinto_id=labirinto,
            tempo_conclusao_sec=42.7,
            velocidade_med=16.9,
            consumo_bat=0.8,
            desafio_concluido=True,
            finalizado_em=finalizado_em,
        )

        response = self.client.get(f"/api/corridas/{corrida.id}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], corrida.id)
        self.assertEqual(response.json()["labirinto_id"], labirinto.id)
        self.assertEqual(response.json()["tempo_conclusao_sec"], 42.7)
        self.assertEqual(response.json()["velocidade_media"], 16.9)
        self.assertEqual(response.json()["consumo_bateria"], 0.8)
        self.assertTrue(response.json()["desafio_concluido"])
        self.assertIn("iniciado_em", response.json())
        self.assertEqual(response.json()["finalizado_em"], "2026-05-26T18:30:00+00:00")

    def test_detalhe_de_corrida_em_andamento_retorna_campos_nulos(self):
        labirinto = Labirinto.objects.create(nome="Labirinto em andamento", tamanho=16)
        corrida = Corrida.objects.create(labitinto_id=labirinto)

        response = self.client.get(f"/api/corridas/{corrida.id}")

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()["tempo_conclusao_sec"])
        self.assertIsNone(response.json()["velocidade_media"])
        self.assertIsNone(response.json()["consumo_bateria"])
        self.assertIsNone(response.json()["finalizado_em"])

    def test_retorna_404_para_corrida_inexistente(self):
        response = self.client.get("/api/corridas/999")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["erro"], "Corrida nao encontrada.")

    def test_busca_corrida_por_id_aceita_barra_final(self):
        labirinto = Labirinto.objects.create(nome="Labirinto detalhe barra", tamanho=4)
        corrida = Corrida.objects.create(labitinto_id=labirinto)

        response = self.client.get(f"/api/corridas/{corrida.id}/")

        self.assertEqual(response.status_code, 200)

    def test_cria_telemetria(self):
        labirinto=Labirinto.objects.create(nome="Labirinto telemetria", tamanho=4)
        corrida = Corrida.objects.create(labitinto_id=labirinto)
        response = self.client.post(f"/api/corridas/{corrida.id}/telemetria/",
            data=json.dumps({
                "linha": 0,
                "coluna": 0,
                "parede_norte": "livre",
                "parede_sul": "desconhecido",
                "parede_leste": "livre",
                "parede_oeste": "parede",
                "posicao_ordem": 1,
                "x": 0.5,
                "y": 0.5,
                "direcao": "norte",
                "velocidade": 1.0,
                "bateria": 0.5,
            }),content_type="application/json",
        )
        print(response.json())
        self.assertEqual(response.status_code, 201)
        self.assertIn("id", response.json())

    def test_corrida_inexistente_404(self):
        response = self.client.post(f"/api/corridas/999/telemetria/",
            data=json.dumps({
                "linha": 0,
                "coluna": 0,
                "parede_norte": "livre",
                "parede_sul": "desconhecido",
                "parede_leste": "livre",
                "parede_oeste": "parede",
                "posicao_ordem": 1,
                "x": 0.5,
                "y": 0.5,
                "direcao": "norte",
                "velocidade": 1.0,
                "bateria": 0.5,
            }),content_type="application/json",
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(
            response.json()["erro"], "Corrida nao encontrada."
        )

    def test_telemetria_invalida_400(self):
        labirinto=Labirinto.objects.create(nome="Labirinto telemetria", tamanho=4)
        corrida = Corrida.objects.create(labitinto_id=labirinto)
        response = self.client.post(f"/api/corridas/{corrida.id}/telemetria/",
            data="{",content_type="application/json",
        )
        # print(response)
        self.assertEqual(response.status_code, 400)

    def test_estado_atual_sem_telemetria(self):
        labirinto=Labirinto.objects.create(nome="Labirinto telemetria", tamanho=4)
        corrida = Corrida.objects.create(labitinto_id=labirinto)
        response = self.client.get(f"/api/corridas/{corrida.id}/estado-atual/")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(
            response.json()["erro"], "Nenhuma telemetria encontrada."
        )

    def test_estado_atual_com_telemetria(self):
        labirinto=Labirinto.objects.create(nome="Labirinto telemetria", tamanho=4)
        corrida = Corrida.objects.create(labitinto_id=labirinto)
        response1 = self.client.post(f"/api/corridas/{corrida.id}/telemetria/",
            data=json.dumps({
                "linha": 0,
                "coluna": 0,
                "parede_norte": "livre",
                "parede_sul": "desconhecido",
                "parede_leste": "livre",
                "parede_oeste": "parede",
                "posicao_ordem": 1,
                "x": 0.5,
                "y": 0.5,
                "direcao": "norte",
                "velocidade": 1.0,
                "bateria": 0.5,
            }),content_type="application/json",
        )
        response2 = self.client.get(f"/api/corridas/{corrida.id}/estado-atual/")
        self.assertEqual(response2.status_code, 200)

    def test_finalizar_corrida(self):
        labiritinto=Labirinto.objects.create(nome="Labirinto finalizar", tamanho=4)
        corrida = Corrida.objects.create(labitinto_id=labiritinto)
        response = self.client.patch(f"/api/corridas/{corrida.id}/finalizar/",
            data=json.dumps({
                "tempo_conclusao_sec": 123.4,
                "velocidade_med": 10.5,
                "consumo_bat": 0.7,
                "desafio_concluido": True,

            }),content_type="application/json")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["desafio_concluido"])

    def test_finalizar_corrida_inexistente(self):
        response = self.client.patch("/api/corridas/999/finalizar/",
            data=json.dumps({}),
            content_type="application/json")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["erro"], "Corrida nao encontrada.")
