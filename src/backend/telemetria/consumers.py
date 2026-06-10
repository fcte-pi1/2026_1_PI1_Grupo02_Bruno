import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils import timezone


# FirmwareConsumer representa a conexao da ESP32 WROOM 32E com o backend.
#
# Fluxo:
#   1. A ESP32 abre o WebSocket em ws/firmware/
#   2. Cada evento gerado durante a corrida chega no metodo receive()
#   3. O evento e persistido no banco via database_sync_to_async
#   4. Um broadcast e enviado para o grupo "corrida_live"
#   5. O CorridaConsumer repassa o broadcast para o frontend em tempo real
#
# O database_sync_to_async e necessario porque o consumer e assíncrono
# mas o Django ORM e sincrono, sem ele o banco travaria o loop de eventos.

class FirmwareConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        # FirmwareConsumer e apenas emissor — nao entra no grupo corrida_live.
        # Se entrasse, o group_send voltaria para ele e causaria
        # "No handler for message type telemetria_update".
        self.group_name = 'corrida_live'
        self.corrida_id = None
        self.event_counter = 0
        self.bateria_atual = 100.0  # atualizado em run_started; repassado para cell_discovered

        await self.accept()

    async def disconnect(self, close_code):
        pass  # nao entrou no grupo, nao precisa sair

    async def receive(self, text_data):
        # Ponto de entrada de todos os eventos enviados pela ESP32.
        # Le o tipo do evento e chama o handler correspondente.
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

    # --- Handlers por tipo de evento ---

    async def _handle_run_started(self, dados):
        # Cria uma nova Corrida no banco e devolve o corrida_id para a ESP32.
        # Payload: { dimensao, tentativa, bateria }
        payload = dados.get('payload', {})
        dimensao = payload.get('dimensao', 16)
        # tentativa = payload.get('tentativa', 1)  # TODO: adicionar ao modelo Corrida
        self.bateria_atual = float(payload.get('bateria', 100.0))

        corrida = await self._criar_corrida(dimensao)
        self.corrida_id = corrida.id

        await self.send(json.dumps({
            'ack': dados.get('event_id'),
            'corrida_id': corrida.id,
        }))

        await self.channel_layer.group_send(self.group_name, {
            'type': 'telemetria_update',
            'data': {**dados, 'id_corrida': corrida.id},
        })

    async def _handle_cell_discovered(self, dados):
        # Persiste a celula descoberta e o estado atual do robo.
        # Payload: { x, y, w, bateria }
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
        # Fecha a corrida no banco com as metricas finais.
        # Payload: { sucesso, v_med, bateria }
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
        # Eventos sem persistencia no banco: optimal_path_calculated, fast_run_started
        await self.send(json.dumps({'ack': dados.get('event_id')}))

        await self.channel_layer.group_send(self.group_name, {
            'type': 'telemetria_update',
            'data': dados,
        })

    # --- Operacoes de banco (todas via database_sync_to_async) ---

    @database_sync_to_async
    def _criar_corrida(self, dimensao):
        from .models import Corrida, Labirinto

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
        # payload: { x, y, w, bateria } — conforme telemetria.md
        from .models import Corrida, Celula, EstadoAtual

        corrida = Corrida.objects.get(id=self.corrida_id)

        x = payload.get('x', 0)
        y = payload.get('y', 0)

        # Decodifica bitmask de paredes: Norte=1, Sul=2, Leste=4, Oeste=8
        w = payload.get('w', 0)
        p_norte = 'parede' if (w & 1) else 'livre'
        p_sul   = 'parede' if (w & 2) else 'livre'
        p_leste = 'parede' if (w & 4) else 'livre'
        p_oeste = 'parede' if (w & 8) else 'livre'

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
            corrida.finalizado_em     = timezone.now()
            corrida.desafio_concluido = payload.get('sucesso', False)
            corrida.velocidade_med    = payload.get('v_med', 0.0)
            corrida.consumo_bat       = 100.0 - payload.get('bateria', 100.0)
            corrida.save()
        except Corrida.DoesNotExist:
            pass


# CorridaConsumer representa a conexao do frontend (dashboard) com o backend.
#
# Nao recebe eventos — apenas escuta o grupo "corrida_live" e repassa
# cada mensagem para o browser em tempo real.
#
# connect() rejeita se nao existe corrida ativa no banco,
# evitando que o frontend receba broadcasts de sessoes anteriores.

class CorridaConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.group_name = 'corrida_live'

        corrida = await self._buscar_corrida_ativa()
        if corrida is None:
            await self.close(code=4000)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def telemetria_update(self, event):
        await self.send(text_data=json.dumps(event['data']))

    async def corrida_finalizada(self, event):
        await self.send(text_data=json.dumps(event['data']))

    @database_sync_to_async
    def _buscar_corrida_ativa(self):
        from .models import Corrida
        return (
            Corrida.objects.filter(finalizado_em__isnull=True)
            .order_by('-iniciado_em')
            .first()
        )
