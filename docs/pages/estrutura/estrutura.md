# Estruturas: Chassi e Labirinto

## 1. Visão Geral do Projeto

O chassi e o labirinto do Micromouse foram modelados no CATIA, priorizando **compactação, estabilidade, modularidade e desempenho em navegação autônoma**.

O chassi foi desenvolvido com **direção diferencial**, utilizando duas rodas de tração independentes, permitindo curvas rápidas e rotações no próprio eixo. Já o labirinto foi projetado de forma **modular**, facilitando montagem, desmontagem e criação de diferentes cenários de teste.

---

## 2. Escolha dos Materiais

Após análise comparativa entre acrílico, MDF e impressão 3D, optou-se pela **impressão 3D** para o chassi devido aos seguintes fatores:

### Justificativas principais:

* **Maior liberdade geométrica**, permitindo peças complexas e encaixes específicos;
* **Boa resistência mecânica** para o uso esperado;
* **Baixo custo do material**, especialmente considerando que não haverá cobrança de produção.

---

## 3. Sistema de Locomoção (Rodas)

Foi adotada uma configuração de **duas rodas de tração independentes + roda boba frontal**.

### Justificativas:

* Permite o robô **girar sobre o próprio eixo**;
* Facilita curvas rápidas e precisas;
* Reduz tempo de navegação no labirinto;
* Melhora a eficiência em espaços reduzidos.

Essa arquitetura é amplamente utilizada em robôs Micromouse por oferecer **alta manobrabilidade**.

---

## 4. Chassi

| Característica     | Chassi Novo |
| ------------------ | ----------: |
| Comprimento        |      100 mm |
| Largura            |       70 mm |
| Altura dos pilares |       16 mm |

---

## 5. Centro de Gravidade e Momento de Inércia

Foi realizada uma análise física no CATIA para verificar estabilidade.

### Resultado principal:

O **centro de gravidade ficou próximo ao centro geométrico do robô**, indicando **boa distribuição de massa**.

### Benefícios:

* Menor oscilação em curvas;
* Mais estabilidade em aceleração e frenagem;
* Melhor comportamento em mudanças bruscas de direção.

Além disso, houve **redução dos momentos de inércia**, o que significa:

### Impacto prático:

* O robô exige **menos torque dos motores** para girar;
* Faz curvas mais rápidas;
* Tem respostas mais ágeis nas correções de trajetória;
* Melhor desempenho em testes de Micromouse.

A redução da altura dos pilares foi essencial para concentrar a massa mais próxima do plano central do robô.

---

## 6. Projeto do Labirinto

O labirinto foi desenvolvido pensando em **precisão dimensional, modularidade e confiabilidade dos sensores**.

### Estrutura:

* Base em **MDF preto fosco**;
* Pilares produzidos em **impressão 3D**;
* Sistema de encaixe modular;
* Matriz de furos para diferentes configurações do percurso.

### Justificativas importantes:

#### 6.1 Base Preto Fosco

Escolhida para reduzir reflexos de luz.

**Benefício:**
Evita interferência nos sensores do robô, melhorando a leitura das paredes e do solo.

---

#### 6.2 Tolerância de Encaixe

Foi criada uma folga entre furos e pinos (**0,5 mm**).

**Benefício:**

* Facilita montagem;
* Compensa pequenas imperfeições da impressão 3D;
* Evita esforço excessivo e deformações.

---

#### 6.3 Estabilidade Mecânica

A espessura da estrutura foi escolhida para evitar vibração das paredes.

**Benefício:**
Evita erros de mapeamento do robô durante deslocamentos rápidos.

---

#### 6.4 Modularidade

O sistema permite **alterar rapidamente a configuração do labirinto**.

**Benefícios:**

* Criar vários cenários de teste;
* Validar o algoritmo BFS;
* Repetir experimentos com diferentes layouts.

Furos não utilizados serão nivelados com peças impressas em 3D para evitar irregularidades no piso e erros de odometria.
