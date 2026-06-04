from urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/telemetria/(?P<corrida_id>\d+)/live/$)", consumers.CorridaConsumer.as_asgi())
]