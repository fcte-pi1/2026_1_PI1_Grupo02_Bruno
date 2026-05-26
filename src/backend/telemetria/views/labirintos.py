import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from ..models import Labirinto


TAMANHOS_PERMITIDOS = {4, 8, 16}


def _serializar_labirinto(labirinto):
    return {
        "id": labirinto.id,
        "nome": labirinto.nome,
        "tamanho": labirinto.tamanho,
        "created_at": labirinto.created_ad.isoformat(),
    }


@csrf_exempt
@require_http_methods(["GET", "POST"])
def labirintos(request):
    if request.method == "GET":
        registros = Labirinto.objects.order_by("id")
        return JsonResponse(
            [_serializar_labirinto(labirinto) for labirinto in registros],
            safe=False,
        )

    try:
        dados = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"erro": "JSON invalido."}, status=400)

    if not isinstance(dados, dict):
        return JsonResponse({"erro": "O corpo deve ser um objeto JSON."}, status=400)

    nome = dados.get("nome")
    tamanho = dados.get("tamanho")

    if not isinstance(nome, str) or not nome.strip():
        return JsonResponse({"erro": "O campo nome e obrigatorio."}, status=400)

    nome = nome.strip()
    if len(nome) > 256:
        return JsonResponse(
            {"erro": "O campo nome deve ter no maximo 256 caracteres."},
            status=400,
        )

    if type(tamanho) is not int or tamanho not in TAMANHOS_PERMITIDOS:
        return JsonResponse(
            {"erro": "O campo tamanho deve ser 4, 8 ou 16."},
            status=400,
        )

    labirinto = Labirinto.objects.create(nome=nome, tamanho=tamanho)
    return JsonResponse(_serializar_labirinto(labirinto), status=201)
