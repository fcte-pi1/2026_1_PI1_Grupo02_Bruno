import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from ..models import Corrida, Labirinto


def _serializar_corrida(corrida):
    return {
        "id": corrida.id,
        "labirinto_id": corrida.labitinto_id_id,
        "desafio_concluido": corrida.desafio_concluido,
        "iniciado_em": corrida.iniciado_em.isoformat(),
    }


def _serializar_corrida_detalhe(corrida):
    return {
        "id": corrida.id,
        "labirinto_id": corrida.labitinto_id_id,
        "tempo_conclusao_sec": corrida.tempo_conclusao_sec,
        "velocidade_media": corrida.velocidade_med,
        "consumo_bateria": corrida.consumo_bat,
        "desafio_concluido": corrida.desafio_concluido,
        "iniciado_em": corrida.iniciado_em.isoformat(),
        "finalizado_em": (
            corrida.finalizado_em.isoformat() if corrida.finalizado_em else None
        ),
    }


@csrf_exempt
@require_http_methods(["POST"])
def corridas(request):
    try:
        dados = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"erro": "JSON invalido."}, status=400)

    if not isinstance(dados, dict):
        return JsonResponse({"erro": "O corpo deve ser um objeto JSON."}, status=400)

    labirinto_id = dados.get("labirinto_id")
    if type(labirinto_id) is not int:
        return JsonResponse(
            {"erro": "O campo labirinto_id e obrigatorio e deve ser inteiro."},
            status=400,
        )

    try:
        labirinto = Labirinto.objects.get(id=labirinto_id)
    except Labirinto.DoesNotExist:
        return JsonResponse({"erro": "Labirinto nao encontrado."}, status=404)

    corrida = Corrida.objects.create(labitinto_id=labirinto)
    return JsonResponse(_serializar_corrida(corrida), status=201)


@require_http_methods(["GET"])
def corrida_detalhe(request, corrida_id):
    try:
        corrida = Corrida.objects.get(id=corrida_id)
    except Corrida.DoesNotExist:
        return JsonResponse({"erro": "Corrida nao encontrada."}, status=404)

    return JsonResponse(_serializar_corrida_detalhe(corrida))
