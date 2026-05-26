from django.urls import path

from . import views


urlpatterns = [
    path("labirintos", views.labirintos, name="labirintos"),
    path("labirintos/", views.labirintos, name="labirintos"),
]
