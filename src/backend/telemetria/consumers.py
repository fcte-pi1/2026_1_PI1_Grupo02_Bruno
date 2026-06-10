import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils import timezone 


# FirmwareConsumer — representa a conexão da ESP32 WROOM 32E com o backend.
#
# Fluxo:
#   1. A ESP32 abre o WebSocket em ws/firmware/
#   2. Cada evento gerado durante a corrida chega no método receive()
#   3. O evento é persistido no banco via database_sync_to_async
#   4. Um broadcast é enviado para o grupo "corrida_live"
#   5. O CorridaConsumer repassa o broadcast para o frontend em tempo real
#
# O database_sync_to_async é necessário porque o consumer é assíncrono
# mas o Django ORM é síncrono, sem ele o banco travaria o loop de eventos.

class FirmwareConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        # Aceita qualquer conexão da ESP32, mas só cria o grupo de corrida quando a corrida começar,
        # ela só é criada quando o evento run_started chegar.
        self.group_name = 'corrida_live'
        self.corrida_id = None
        self.event_counter = 0
        self.bateria_atual = 100.0  # atualizado em run_started; repassado para cell_discovered

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        # Ponto de entrada de todos os eventos enviados pela ESP32.
        # Lê o tipo do evento e chama o handler correspondente.
        try:
            dados = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(json.dumps({'erro': 'JSON invalido'}))
            return

        tipo = dados.get('tipo')

        if tipo == 'run_started':
            await self._handle_run_started(dados)
        elif tipo == 'cell_discovered':
            await self._handle_cell_discovered(dados)
        elif tipo == 'optimal_path_calculated':
            await self._handle_broadcast(dados)
        elif tipo == 'fast_run_started':
            await self._handle_broadcast(dados)
        elif tipo == 'run_finished':
            await self._handle_run_finished(dados)
        else:
            await self.send(json.dumps({'erro': f'Tipo de evento desconhecido: {tipo}'}))

    # Handlers

    async def _handle_run_started(self, dados):
        # Cria uma nova Corrida no banco e devolve o corrida_id para a ESP32.
        # A ESP32 usa esse id em todos os eventos seguintes.
        #
        # Payload conforme telemetria.md:
        #   dimensao  — tamanho do labirinto (4, 8 ou 16)
        #   tentativa — número da tentativa; sem campo no modelo ainda, ignorado por ora
        #   bateria   — nível de bateria inicial; guardado em self.bateria_atual
        payload = dados.get('payload', {})
        dimensao  = payload.get('dimensao', 16)
        # tentativa = payload.get('tentativa', 1)  # TODO: adicionar ao modelo Corrida
        self.bateria_atual = float(payload.get('bateria', 100.0))

        corrida = await self._criar_corrida(dimensao)
        self.corrida_id = corrida.id

        # ACK para a ESP32 com o corrida_id gerado pelo banco
        await self.send(json.dumps({
            'ack': dados.get('event_id'),
            'corrida_id': corrida.id,
        }))

        await self.channel_layer.group_send(self.group_name, {
            'type': 'telemetria_update',
            'data': {**dados, 'id_corrida': corrida.id},
        })

    async def _handle_cell_discovered(self, dados):
        # Persiste a célula descoberta e o estado atual do robô,
        # depois faz broadcast para o frontend atualizar o labirinto.
        #
        # Payload conforme telemetria.md: {x, y, w, bateria}
        # 'bateria' é o nível atual enviado pela ESP32 neste evento.
        # self.bateria_atual é atualizado para refletir o valor mais recente.
        if not self.corrida_id:
            await self.send(json.dumps({'erro': 'Corrida nao iniciada'}))
            return

        payload = dados.get('payload', {})
        self.bateria_atual = float(payload.get('bateria', self.bateria_atual))
        await self._salvar_celula(payload, self.bateria_atual)

        await self.send(json.dumps({'ack': dados.get('event_id')}))

        await self.channel_layer.group_send(self.group_name, {
            'type': 'telemetria_update',
            'data': dados,
        })

    async def _handle_run_finished(self, dados):
        # Fecha a corrida no banco com as métricas finais.
        if not self.corrida_id:
            return

        payload = dados.get('payload', {})
        await self._finalizar_corrida(payload)

        await self.send(json.dumps({'ack': dados.get('event_id')}))

        await self.channel_layer.group_send(self.group_name, {
            'type': 'corrida_finalizada',
            'data': dados,
        })

    async def _handle_broadcast(self, dados):
        # Eventos que não precisam persistir no banco — apenas repassar ao frontend.
        # Usado por: optimal_path_calculated, fast_run_started
        await self.send(json.dumps({'ack': dados.get('event_id')}))

        await self.channel_layer.group_send(self.group_name, {
            'type': 'telemetria_update',
            'data': dados,
        })

    # Operações de banco

    @database_sync_to_async
    def _criar_corrida(self, dimensao):
        from .models import Corrida, Labirinto

        # Encerra qualquer corrida ativa anterior antes de criar uma nova
        Corrida.objects.filter(finalizado_em__isnull=True).update(
            finalizado_em=timezone.now()
        )

        labirinto, _ = Labirinto.objects.get_or_create(
            tamanho=dimensao,
            defaults={'nome': f'Lab {dimensao}x{dimensao}'},
        )
        return Corrida.objects.create(labitinto_id=labirinto)

    @database_sync_to_async
    def _salvar_celula(self, payload, bateria_atual=100.0):
        # payload esperado: {x, y, w, bateria}  — conforme telemetria.md
        # bateria_atual é o valor lido do payload do próprio evento cell_discovered
        from .models import Corrida, Celula, EstadoAtual

        corrida = Corrida.objects.get(id=self.corrida_id)

        x = payload.get('x', 0)
        y = payload.get('y', 0)

        # Decodifica a bitmask de paredes: Norte=1, Sul=2, Leste=4, Oeste=8
        w = payload.get('w', 0)
        p_norte = str(bool(w & 1))
        p_sul   = str(bool(w & 2))
        p_leste = str(bool(w & 4))
        p_oeste = str(bool(w & 8))

        celula, _ = Celula.objects.get_or_create(
            labirinto_id=corrida.labitinto_id,
            linha=y,
            coluna=x,
            defaults={
                'parede_norte': p_norte,
                'parede_sul':   p_sul,
                'parede_leste': p_leste,
                'parede_oeste': p_oeste,
            },
        )

        ordem = EstadoAtual.objects.filter(corrida_id=corrida).count()

        EstadoAtual.objects.create(
            corrida_id=corrida,
            celula_id=celula,
            posicao_ordem=ordem,
            x=float(x),
            y=float(y),
            direcao='N',
            velocidade=0.0,
            bateria=bateria_atual,
        )

    @database_sync_to_async
    def _finalizar_corrida(self, payload):
        from .models import Corrida

        try:
            corrida = Corrida.objects.get(id=self.corrida_id)
            corrida.finalizado_em    = timezone.now()
            corrida.desafio_concluido = payload.get('sucesso', False)
            corrida.velocidade_med   = payload.get('v_med', 0.0)
            corrida.consumo_bat      = 100.0 - payload.get('bateria', 100.0)
            corrida.save()
        except Corrida.DoesNotExist:
            pass


# CorridaConsumer — representa a conexão do frontend (dashboard) com o backend.
#
# Não recebe eventos — apenas escuta o grupo "corrida_live" e repassa
# cada mensagem para o browser em tempo real.

class CorridaConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.group_name = 'corrida_live'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # Chamado pelo group_send do FirmwareConsumer para cada evento de telemetria
    async def telemetria_update(self, event):
        await self.send(text_data=json.dumps(event['data']))

    # Chamado pelo group_send do FirmwareConsumer quando a corrida termina
    async def corrida_finalizada(self, event):
        await self.send(text_data=json.dumps(event['data']))
