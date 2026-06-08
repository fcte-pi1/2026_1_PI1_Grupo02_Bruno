import json
from unittest.mock import patch

from asgiref.sync import async_to_sync
from channels.testing import WebsocketCommunicator
from django.test import TestCase, TransactionTestCase

from config.asgi import application
from telemetria.consumers import CorridaConsumer
from telemetria.models import Celula, Corrida, EstadoAtual, Labirinto


def telemetria_payload(**overrides):
    payload = {
        "linha": 0,
        "coluna": 0,
        "parede_norte": "parede",
        "parede_sul": "livre",
        "parede_leste": "livre",
        "parede_oeste": "parede",
        "posicao_ordem": 1,
        "x": 0.5,
        "y": 0.5,
        "direcao": "norte",
        "velocidade": 1.0,
        "bateria": 0.95,
    }
    payload.update(overrides)
    return payload


class CtSwApiTests(TestCase):
    def test_ct_sw_03_criacao_de_sessao_finaliza_corrida_ativa_anterior(self):
        labirinto = Labirinto.objects.create(nome="Labirinto sessoes", tamanho=4)
        primeira = Corrida.objects.create(labitinto_id=labirinto)

        response = self.client.post(
            "/api/corridas",
            data=json.dumps({"labirinto_id": labirinto.id}),
            content_type="application/json",
        )

        primeira.refresh_from_db()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Corrida.objects.count(), 2)
        self.assertIsNotNone(primeira.finalizado_em)
        self.assertFalse(response.json()["desafio_concluido"])

    def test_ct_sw_01_03_04_telemetria_atualiza_mapa_estado_e_posicao(self):
        labirinto = Labirinto.objects.create(nome="Labirinto telemetria", tamanho=4)
        corrida = Corrida.objects.create(labitinto_id=labirinto)

        response = self.client.post(
            f"/api/corridas/{corrida.id}/telemetria/",
            data=json.dumps(
                telemetria_payload(
                    linha=2,
                    coluna=1,
                    parede_norte="livre",
                    parede_sul="parede",
                    posicao_ordem=7,
                    x=1.5,
                    y=2.5,
                    direcao="leste",
                    velocidade=1.4,
                    bateria=0.72,
                )
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        celula = Celula.objects.get()
        estado = EstadoAtual.objects.get()
        self.assertEqual(celula.labirinto_id, labirinto)
        self.assertEqual((celula.linha, celula.coluna), (2, 1))
        self.assertEqual(celula.parede_norte, "livre")
        self.assertEqual(celula.parede_sul, "parede")
        self.assertEqual(estado.corrida_id, corrida)
        self.assertEqual(estado.celula_id, celula)
        self.assertEqual(estado.posicao_ordem, 7)
        self.assertEqual((estado.x, estado.y), (1.5, 2.5))
        self.assertEqual(estado.direcao, "leste")
        self.assertEqual(estado.velocidade, 1.4)
        self.assertEqual(estado.bateria, 0.72)

        estado_response = self.client.get(f"/api/corridas/{corrida.id}/estado-atual/")
        self.assertEqual(estado_response.status_code, 200)
        self.assertEqual(estado_response.json()["posicao_ordem"], 7)
        self.assertEqual(estado_response.json()["x"], 1.5)
        self.assertEqual(estado_response.json()["y"], 2.5)
        self.assertEqual(estado_response.json()["celula"]["linha"], 2)
        self.assertEqual(estado_response.json()["celula"]["coluna"], 1)

    def test_ct_sw_04_estado_atual_considera_apenas_a_corrida_consultada(self):
        labirinto = Labirinto.objects.create(nome="Labirinto isolado", tamanho=4)
        corrida_consultada = Corrida.objects.create(labitinto_id=labirinto)
        outra_corrida = Corrida.objects.create(labitinto_id=labirinto)
        celula = Celula.objects.create(
            labirinto_id=labirinto,
            linha=0,
            coluna=0,
            parede_norte="parede",
            parede_sul="livre",
            parede_leste="livre",
            parede_oeste="parede",
        )
        EstadoAtual.objects.create(
            corrida_id=outra_corrida,
            celula_id=celula,
            posicao_ordem=99,
            x=9,
            y=9,
            direcao="sul",
            velocidade=2,
            bateria=0.2,
        )
        EstadoAtual.objects.create(
            corrida_id=corrida_consultada,
            celula_id=celula,
            posicao_ordem=2,
            x=1,
            y=1,
            direcao="norte",
            velocidade=1,
            bateria=0.8,
        )

        response = self.client.get(f"/api/corridas/{corrida_consultada.id}/estado-atual/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["posicao_ordem"], 2)
        self.assertEqual(response.json()["x"], 1)
        self.assertEqual(response.json()["y"], 1)

    def test_ct_sw_05_08_trajeto_permanece_registrado_apos_finalizacao(self):
        labirinto = Labirinto.objects.create(nome="Labirinto trajeto", tamanho=4)
        corrida = Corrida.objects.create(labitinto_id=labirinto)

        for ordem, linha, coluna in [(1, 0, 0), (2, 0, 1), (3, 1, 1)]:
            response = self.client.post(
                f"/api/corridas/{corrida.id}/telemetria/",
                data=json.dumps(
                    telemetria_payload(
                        linha=linha,
                        coluna=coluna,
                        posicao_ordem=ordem,
                        x=coluna + 0.5,
                        y=linha + 0.5,
                    )
                ),
                content_type="application/json",
            )
            self.assertEqual(response.status_code, 201)

        response = self.client.patch(
            f"/api/corridas/{corrida.id}/finalizar/",
            data=json.dumps(
                {
                    "tempo_conclusao_sec": 12.4,
                    "velocidade_media": 0.8,
                    "consumo_bateria": 0.3,
                    "desafio_concluido": True,
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            list(
                EstadoAtual.objects.filter(corrida_id=corrida)
                .order_by("posicao_ordem")
                .values_list("posicao_ordem", "celula_id__linha", "celula_id__coluna")
            ),
            [(1, 0, 0), (2, 0, 1), (3, 1, 1)],
        )

    def test_ct_sw_08_10_detalhe_exibe_resultado_persistido(self):
        labirinto = Labirinto.objects.create(nome="Labirinto detalhes", tamanho=8)
        corrida = Corrida.objects.create(labitinto_id=labirinto)

        finalizar_response = self.client.patch(
            f"/api/corridas/{corrida.id}/finalizar/",
            data=json.dumps(
                {
                    "tempo_conclusao_sec": 88.2,
                    "velocidade_media": 1.7,
                    "consumo_bateria": 0.44,
                    "desafio_concluido": True,
                }
            ),
            content_type="application/json",
        )
        detalhe_response = self.client.get(f"/api/corridas/{corrida.id}/")

        self.assertEqual(finalizar_response.status_code, 200)
        self.assertEqual(detalhe_response.status_code, 200)
        self.assertEqual(detalhe_response.json()["tempo_conclusao_sec"], 88.2)
        self.assertEqual(detalhe_response.json()["velocidade_media"], 1.7)
        self.assertEqual(detalhe_response.json()["consumo_bateria"], 0.44)
        self.assertTrue(detalhe_response.json()["desafio_concluido"])
        self.assertIsNotNone(detalhe_response.json()["finalizado_em"])

    @patch("telemetria.views.labirintos.get_channel_layer")
    @patch("telemetria.views.labirintos.async_to_sync")
    def test_ct_sw_01_telemetria_dispara_broadcast_para_interface(
        self, async_to_sync_mock, get_channel_layer_mock
    ):
        labirinto = Labirinto.objects.create(nome="Labirinto broadcast", tamanho=4)
        corrida = Corrida.objects.create(labitinto_id=labirinto)
        group_send = async_to_sync_mock.return_value
        channel_layer = get_channel_layer_mock.return_value

        response = self.client.post(
            f"/api/corridas/{corrida.id}/telemetria/",
            data=json.dumps(telemetria_payload(posicao_ordem=4, x=2.5, y=1.5)),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        get_channel_layer_mock.assert_called_once_with()
        async_to_sync_mock.assert_called_once_with(channel_layer.group_send)
        group_send.assert_called_once()
        grupo, evento = group_send.call_args.args
        self.assertEqual(grupo, "corrida_live")
        self.assertEqual(evento["type"], "telemetria_update")
        self.assertEqual(evento["data"]["corrida_id"], corrida.id)
        self.assertEqual(evento["data"]["posicao_ordem"], 4)
        self.assertEqual(evento["data"]["x"], 2.5)
        self.assertEqual(evento["data"]["y"], 1.5)
        self.assertEqual(evento["data"]["celula"]["linha"], 0)
        self.assertEqual(evento["data"]["celula"]["coluna"], 0)

    @patch("telemetria.views.labirintos.get_channel_layer")
    @patch("telemetria.views.labirintos.async_to_sync")
    def test_ct_sw_07_finalizacao_dispara_broadcast_para_interface(
        self, async_to_sync_mock, get_channel_layer_mock
    ):
        labirinto = Labirinto.objects.create(nome="Labirinto fim broadcast", tamanho=4)
        corrida = Corrida.objects.create(labitinto_id=labirinto)
        group_send = async_to_sync_mock.return_value
        channel_layer = get_channel_layer_mock.return_value

        response = self.client.patch(
            f"/api/corridas/{corrida.id}/finalizar/",
            data=json.dumps(
                {
                    "tempo_conclusao_sec": 10.5,
                    "velocidade_media": 1.1,
                    "consumo_bateria": 0.25,
                    "desafio_concluido": True,
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        get_channel_layer_mock.assert_called_once_with()
        async_to_sync_mock.assert_called_once_with(channel_layer.group_send)
        grupo, evento = group_send.call_args.args
        self.assertEqual(grupo, "corrida_live")
        self.assertEqual(evento["type"], "corrida_finalizada")
        self.assertEqual(evento["data"]["id"], corrida.id)
        self.assertEqual(evento["data"]["tempo_conclusao_sec"], 10.5)
        self.assertTrue(evento["data"]["desafio_concluido"])


class CtSwWebSocketTests(TransactionTestCase):
    def test_ct_sw_02_websocket_recusa_conexao_sem_corrida_ativa(self):
        communicator = WebsocketCommunicator(application, "/ws/corrida/live/")

        connected, close_code = async_to_sync(communicator.connect)()

        self.assertFalse(connected)
        self.assertEqual(close_code, 400)

    def test_ct_sw_01_websocket_entrega_telemetria_recebida_pelo_grupo(self):
        consumer = CorridaConsumer()
        mensagens = []

        async def fake_send(text_data=None, bytes_data=None, close=False):
            mensagens.append(json.loads(text_data))

        consumer.send = fake_send
        async_to_sync(consumer.telemetria_update)(
            {
                "data": {
                    "corrida_id": 10,
                    "posicao_ordem": 5,
                    "x": 3.5,
                    "y": 2.5,
                    "celula": {"linha": 0, "coluna": 0},
                }
            },
        )

        mensagem = mensagens[0]
        self.assertEqual(mensagem["corrida_id"], 10)
        self.assertEqual(mensagem["posicao_ordem"], 5)
        self.assertEqual(mensagem["x"], 3.5)
        self.assertEqual(mensagem["y"], 2.5)
        self.assertEqual(mensagem["celula"]["linha"], 0)
        self.assertEqual(mensagem["celula"]["coluna"], 0)

    def test_ct_sw_07_websocket_entrega_finalizacao_recebida_pelo_grupo(self):
        consumer = CorridaConsumer()
        mensagens = []

        async def fake_send(text_data=None, bytes_data=None, close=False):
            mensagens.append(json.loads(text_data))

        consumer.send = fake_send
        async_to_sync(consumer.corrida_finalizada)(
            {
                "data": {
                    "id": 20,
                    "tempo_conclusao_sec": 10.5,
                    "velocidade_media": 1.1,
                    "consumo_bateria": 0.25,
                    "desafio_concluido": True,
                },
            },
        )

        mensagem = mensagens[0]
        self.assertEqual(mensagem["id"], 20)
        self.assertEqual(mensagem["tempo_conclusao_sec"], 10.5)
        self.assertEqual(mensagem["velocidade_media"], 1.1)
        self.assertEqual(mensagem["consumo_bateria"], 0.25)
        self.assertTrue(mensagem["desafio_concluido"])
