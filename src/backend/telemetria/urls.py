from django.urls import path

from . import views


urlpatterns = [
    path("labirintos", views.labirintos, name="labirintos"),
    path("labirintos/", views.labirintos, name="labirintos"),
    path(
        "labirintos/<int:labirinto_id>",
        views.labirinto_detalhe,
        name="labirinto_detalhe",
    ),
    path(
        "labirintos/<int:labirinto_id>/",
        views.labirinto_detalhe,
        name="labirinto_detalhe",
    ),
    path("corridas", views.corridas, name="corridas"),
    path("corridas/", views.corridas, name="corridas"),
    path(
        "corridas/<int:corrida_id>",
        views.corrida_detalhe,
        name="corrida_detalhe",
    ),
    path(
        "corridas/<int:corrida_id>/",
        views.corrida_detalhe,
        name="corrida_detalhe",
    ),
]
