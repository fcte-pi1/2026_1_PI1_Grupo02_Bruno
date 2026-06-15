# Relatório de Testes de Verificação e Validação: Consumo Energético

## 1. Objetivo

Avaliar o perfil de descarga da alimentação do micromouse sob diferentes regimes de operação.

O sistema utiliza uma bateria composta por 2 células de 3,7 V ligadas em série, resultando em uma tensão nominal de 7,4 V e capacidade de 1200 mAh. O intuito é estimar a autonomia do projeto e garantir que a carga suporte a conclusão do labirinto sem interrupções por queda de tensão durante as avaliações da disciplina.

---

## 2. Metodologia de Verificação (Ensaios em Bancada)

Para mapear o consumo de energia dos diferentes subsistemas, a queda de tensão da bateria foi monitorada via multímetro durante dois ensaios práticos, com duração de 1 hora cada.

### 2.1 Teste 1 – Sistema Lógico em Standby (Perfil Quiescente)

Apenas o microcontrolador (ESP32) e o circuito regulador (Buck Converter) foram mantidos ativos, sem acionamento dos motores.

**Resultado:** Queda de 0,16 V/h.

**Análise:** Consumo mínimo e estável, demonstrando alta eficiência da eletrônica de controle e do regulador chaveado quando não há demanda de potência.

### 2.2 Teste 2 – Atuadores em Vazio (Perfil Dinâmico)

Sistema lógico ativo (com comunicação Wi‑Fi) em conjunto com o acionamento dos motores em velocidade máxima, porém com o robô suspenso em bancada (rodas girando no ar, sem contato com o solo).

**Resultado:** Queda de 0,48 V/h.

**Análise:** O dreno de energia triplicou em relação ao estado de repouso (3×), confirmando que a carga motriz é a variável dominante no consumo do sistema.

---

## 3. Medição de Corrente e Comparação Teórico-Prática

### 3.1 Mapeamento de Corrente (Ensaios Isolados)

- **Sistema Lógico (Sem Wi‑Fi):** 83 mA (ESP) + 21 mA (Buck) = 104 mA
- **Sistema Lógico (Com Wi‑Fi):** 117 mA (ESP) + 21 mA (Buck) = 138 mA
- **Sistema de Tração (Vazio):** 53 mA (Motor A) + 46 mA (Motor B) + 5 mA (Ponte H) = 104 mA

Corrente total de pico:

```text
Itotal = 138 mA + 104 mA = 242 mA
```

### 3.2 Modelagem Teórica vs. Medição Empírica

Considerando a capacidade nominal da bateria de 1200 mAh:

```text
Tempo Teórico = 1200 mAh / 242 mA ≈ 4,95 horas
```

Janela útil de tensão da bateria:

```text
8,4 V - 6,0 V = 2,4 V
```

Taxa teórica esperada:

```text
Taxa Teórica = 2,4 V / 4,95 h ≈ 0,484 V/h
```

| Comparação | Valor |
|------------|--------|
| Modelo Matemático | 0,484 V/h |
| Teste Prático | 0,480 V/h |

### 3.3 Potência e Consumo Energético Total

```text
Ptotal = 7,4 V × 0,242 A ≈ 1,79 W
```

Energia disponível:

```text
E = 8,88 Wh
```

Autonomia energética:

```text
Tempo Teórico = 8,88 Wh / 1,79 W ≈ 4,95 horas
```

**Conclusão da comparação:** O ensaio prático validou o modelo matemático de consumo. A variação registrada é explicada pela incerteza natural do equipamento de medição. O consumo global inferior a 2 W confirma a adequação energética do hardware.

---

## 4. Validação e Projeções para a Apresentação Final

Os dados obtidos em bancada verificam o comportamento elétrico isolado do hardware.

Contudo, para a validação real no labirinto, deve-se considerar que o Teste 2 representa um cenário otimista (rodas livres de atrito).

No chão, os motores demandarão maior corrente elétrica para vencer a inércia, deslocar a massa total do robô e superar o atrito da superfície. Esse esforço mecânico adicional exigirá mais torque, acelerando a taxa de descarga em relação aos 0,48 V/h medidos no ar.

---

## 5. Análise de Atendimento das Demandas Energéticas

### 5.1 Demanda de Autonomia Mínima

O robô necessita de autonomia suficiente para realizar múltiplas tentativas de resolução do labirinto durante a avaliação oficial da disciplina, sem necessidade de recargas constantes.

### 5.2 Margem de Segurança Aplicada

Considerando um cenário real severo com o dobro do consumo aferido no ar:

```text
0,96 V/h = 2 × 0,48 V/h
```

Autonomia estimada:

```text
Autonomia = 2,4 V / 0,96 V/h ≈ 2,5 horas (150 minutos)
```

### 5.3 Status de Atendimento

Os testes documentam que o arranjo de baterias escolhido (1200 mAh, 2S) atende com ampla folga térmica e elétrica às necessidades do projeto, mitigando riscos de reinicialização do microcontrolador por subtensão.

---

## 6. Conclusão

Os ensaios em bancada cumpriram os requisitos de verificação energética.

O mapeamento do consumo permitiu estabelecer um limite inferior confiável de descarga e calcular o tempo de persistência em operação.

Com uma autonomia projetada superior a 2 horas em regime de esforço mecânico, a integridade elétrica do micromouse está validada para a apresentação final da disciplina.
