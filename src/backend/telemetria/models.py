from django.db import models
from django.core.validators import MinValueValidator

# Create your models here.

"""
python manage.py makemigrations   ( Apenas se ouver alguma alteracao no banco )
python manage.py migrate          ( Primeira vez clonando o projeto )
"""

class Labirinto(models.Model):
    tamanho = models.IntegerField() # tamanhos padrao: 4, 8, 16
    nome = models.CharField(max_length=256)
    created_ad= models.DateTimeField(auto_now_add=True)

class Corrida(models.Model):
    labitinto_id= models.ForeignKey(Labirinto, on_delete=models.CASCADE)
    tempo_conclusao_sec= models.FloatField(null=True)
    velocidade_med= models.FloatField(null=True)
    consumo_bat= models.FloatField(null=True)
    desafio_concluido= models.BooleanField(default=False)
    iniciado_em= models.DateTimeField(auto_now_add=True)
    finalizado_em=models.DateTimeField(null=True)

class Celula(models.Model):
    labirinto_id=models.ForeignKey(Labirinto, on_delete=models.CASCADE)
    linha= models.IntegerField()
    coluna= models.IntegerField()
    parede_norte=models.CharField(max_length=100) #desconhecido, parede, livre
    parede_sul=models.CharField(max_length=100)
    parede_leste=models.CharField(max_length=100)
    parede_oeste=models.CharField(max_length=100)

class EstadoAtual(models.Model):
    corrida_id=models.ForeignKey(Corrida, on_delete=models.CASCADE)
    celula_id=models.ForeignKey(Celula, on_delete=models.CASCADE)
    posicao_ordem= models.IntegerField()
    x= models.FloatField()
    y=models.FloatField()
    direcao=models.CharField(max_length=100) #direcao atual, norte sul etc
    velocidade=models.FloatField()
    bateria= models.FloatField()
    registrado_em=models.DateTimeField(auto_now_add=True)