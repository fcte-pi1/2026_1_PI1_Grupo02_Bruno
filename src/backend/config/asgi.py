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

# ProtocolTypeRouter separa as requisições HTTP das WebSocket.
# Requisições HTTP seguem o fluxo normal do Django.
# Requisições WebSocket são roteadas para os consumers definidos em telemetria/routing.py.
#
# ws/firmware/ — canal de entrada: a ESP32 WROOM 32E conecta aqui e envia
#                os eventos de telemetria (run_started, cell_discovered, etc.)
#                em tempo real durante a execução do labirinto.
# ws/corrida/live/ — canal de saída: o frontend conecta aqui e recebe
#                    o broadcast dos eventos para atualizar o dashboard.
from telemetria import routing

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': AuthMiddlewareStack(
        URLRouter(routing.websocket_urlpatterns)
    ),
})
