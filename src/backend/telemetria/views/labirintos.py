import json

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from django.utils import timezone

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from ..models import Labirinto,Corrida,Celula,EstadoAtual

from .corridas import _serializar_corrida_detalhe

TAMANHOS_PERMITIDOS = {4, 8, 16}


def _serializar_labirinto(labirinto):
    return {
        "id": labirinto.id,
        "nome": labirinto.nome,
        "tamanho": labirinto.tamanho,
        "created_at": labirinto.created_ad.isoformat(),
    }


def _serializar_estado_atual(estado):
    return {
        "posicao_ordem": estado.posicao_ordem,
        "x": estado.x,
        "y": estado.y,
        "direcao": estado.direcao,
        "velocidade": estado.velocidade,
        "bateria": estado.bateria,
        "registrado_em": estado.registrado_em.isoformat(),
        "celula": {
            "id": estado.celula_id.id,
            "linha": estado.celula_id.linha,
            "coluna": estado.celula_id.coluna,
            "parede_norte": estado.celula_id.parede_norte,
            "parede_sul": estado.celula_id.parede_sul,
            "parede_leste": estado.celula_id.parede_leste,
            "parede_oeste": estado.celula_id.parede_oeste,
        },
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


@require_http_methods(["GET"])
def labirinto_detalhe(request, labirinto_id):
    try:
        labirinto = Labirinto.objects.get(id=labirinto_id)
    except Labirinto.DoesNotExist:
        return JsonResponse({"erro": "Labirinto nao encontrado."}, status=404)

    return JsonResponse(_serializar_labirinto(labirinto))


# leitura de cada celula
@csrf_exempt
@require_http_methods(["POST"])
def telemetria(request,corrida_id):
    try:
        corrida = Corrida.objects.get(id=corrida_id)
    except Corrida.DoesNotExist:
        return JsonResponse({"erro": "Corrida nao encontrada."}, status=404)
    try:
        dados = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"erro": "JSON invalido."}, status=400)

    celula,_=Celula.objects.get_or_create(
        labirinto_id=corrida.labitinto_id,
        linha=dados.get("linha"),
        coluna=dados.get("coluna"),
        defaults={
            "parede_norte": dados.get("parede_norte"),
            "parede_sul": dados.get("parede_sul"),
            "parede_leste": dados.get("parede_leste"),
            "parede_oeste": dados.get("parede_oeste"),
        }

    )
    registro=EstadoAtual.objects.create(
        corrida_id=corrida,
        celula_id=celula,
        posicao_ordem=dados.get("posicao_ordem"),
        x=dados.get("x"),
        y=dados.get("y"),
        direcao=dados.get("direcao"),
        velocidade=dados.get("velocidade"),
        bateria=dados.get("bateria"),
    )

    channel_layer= get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"corrida_live",
        {
            "type": "telemetria_update",
            "data": {
                "corrida_id": corrida_id,
                "posicao_ordem": registro.posicao_ordem,
                "x": registro.x,
                "y": registro.y,
                "direcao": registro.direcao,
                "velocidade": registro.velocidade,
                "bateria": registro.bateria,
                "celula":{
                    "linha": celula.linha,
                    "coluna": celula.coluna,
                    "parede_norte": celula.parede_norte,
                    "parede_sul": celula.parede_sul,
                    "parede_leste": celula.parede_leste,
                    "parede_oeste": celula.parede_oeste,

                }

            }
        }
    )
    return JsonResponse({"id":registro.id}, status=201)

@require_http_methods(["GET"])
def estado_atual(request,corrida_id):
    try:
        corrida = Corrida.objects.get(id=corrida_id)
    except Corrida.DoesNotExist:
        return JsonResponse({"erro": "Corrida nao encontrada."}, status=404)

    ultimo=(
        EstadoAtual.objects.filter(corrida_id=corrida).order_by("-posicao_ordem").first()
    )
    if ultimo is None:
        return JsonResponse({"erro":"Nenhuma telemetria encontrada."},status=404)

    return JsonResponse(_serializar_estado_atual(ultimo))


@require_http_methods(["GET"])
def trajeto(request,corrida_id):
    try:
        corrida = Corrida.objects.get(id=corrida_id)
    except Corrida.DoesNotExist:
        return JsonResponse({"erro": "Corrida nao encontrada."}, status=404)

    estados = (
        EstadoAtual.objects.filter(corrida_id=corrida)
        .select_related("celula_id")
        .order_by("posicao_ordem", "id")
    )

    return JsonResponse([_serializar_estado_atual(estado) for estado in estados], safe=False)

@csrf_exempt
@require_http_methods(["PATCH"])
def finalizar(request,corrida_id):
    try:
        corrida = Corrida.objects.get(id=corrida_id)
    except Corrida.DoesNotExist:
        return JsonResponse({"erro": "Corrida nao encontrada."}, status=404)
    try:
        dados = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"erro": "JSON invalido."}, status=400)

    corrida.tempo_conclusao_sec=dados.get("tempo_conclusao_sec")
    corrida.velocidade_med=dados.get("velocidade_media")
    corrida.consumo_bat=dados.get("consumo_bateria")
    corrida.desafio_concluido=dados.get("desafio_concluido",False)
    corrida.finalizado_em=timezone.now()
    corrida.save()

    channel_layer= get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "corrida_live",{
            "type": "corrida_finalizada",
            "data": _serializar_corrida_detalhe(corrida),
        }
    )
    return JsonResponse(_serializar_corrida_detalhe(corrida))
