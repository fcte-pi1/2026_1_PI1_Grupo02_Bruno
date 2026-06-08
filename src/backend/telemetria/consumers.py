import json

from channels.db import database_sync_to_async

from channels.generic.websocket import AsyncWebsocketConsumer

class CorridaConsumer(AsyncWebsocketConsumer):

    # abre a conexão
    async def connect(self):
        self.group_name="corrida_live"
        corrida=await self._buscar_corrida_ativa()

        if corrida is None:
            await self.close(code=400, reason="Nenhuma corrida ativa.")
            return

        # Entra no grupo (canal de broadcast)
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    # fecha a conexão
    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # Chamado quando chega mensagem do grupo
    async def telemetria_update(self, event):
        await self.send(text_data=json.dumps(event["data"]))

    async def corrida_finalizada(self, event):
        await self.send(text_data=json.dumps(event["data"]))

    @database_sync_to_async
    def _buscar_corrida_ativa(self):
        from .models import Corrida

        return (
            Corrida.objects.filter(finalizado_em__isnull=True)
            .order_by("-iniciado_em")
            .first()
        )
