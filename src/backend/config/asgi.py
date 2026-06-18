"""
ASGI config for config project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# ProtocolTypeRouter separa as requisicoes HTTP das WebSocket.
# Requisicoes HTTP seguem o fluxo normal do Django.
# Requisicoes WebSocket sao roteadas para os consumers definidos em telemetria/routing.py.
#
# ws/firmware/ — canal de entrada: a ESP32 WROOM 32E conecta aqui e envia
#                os eventos de telemetria (run_started, cell_discovered, etc.)
#                em tempo real durante a execucao do labirinto.
# ws/corrida/live/ — canal de saida: o frontend conecta aqui e recebe
#                    o broadcast dos eventos para atualizar o dashboard.
from telemetria import routing

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': AuthMiddlewareStack(
        URLRouter(routing.websocket_urlpatterns)
    ),
})
