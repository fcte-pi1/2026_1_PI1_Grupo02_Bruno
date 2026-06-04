import json
from channels.generic.websocket import AsyncWebsocketConsumer

class CorridaConsumer(AsyncWebsocketConsumer):

    # abre a conexão
    async def connect(self):
        self.corrida_id = self.scope["url_route"]["kwargs"]["corrida_id"]
        self.group_name = f"corrida_{self.corrida_id}"  # grupo único por corrida

        # Entra no grupo (canal de broadcast)
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    # fecha a conexão
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # Chamado quando chega mensagem do grupo
    async def telemetria_update(self, event):
        await self.send(text_data=json.dumps(event["data"]))