from django.urls import re_path
from . import consumers

# Define as rotas WebSocket do sistema de telemetria.
#
# ws/firmware/ — a ESP32 WROOM 32E conecta nesta rota para enviar
#                os eventos de telemetria durante a execução do labirinto.
#                Tratado pelo FirmwareConsumer.
#
# ws/corrida/live/ — o frontend (dashboard) conecta nesta rota para
#                    receber os eventos em tempo real via broadcast.
#                    Tratado pelo CorridaConsumer.

websocket_urlpatterns = [
    re_path(r'^ws/firmware/$', consumers.FirmwareConsumer.as_asgi()),
    re_path(r'^ws/corrida/live/$', consumers.CorridaConsumer.as_asgi()),
]
