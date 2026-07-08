# Núcleo de Estruturas & Mecânica — Micromouse

Este documento detalha o desenvolvimento mecânico, os requisitos de projeto, a seleção de materiais e o processo de montagem tanto do chassi do robô quanto do labirinto de testes, enfatizando o caráter multidisciplinar integrado à eletrônica e alimentação.

---

## Abordagem Multidisciplinar & Requisitos de Design

O design mecânico do Micromouse foi inteiramente concebido sob a ótica da **multidisciplinaridade**. O chassi não atua apenas como suporte físico, mas sim como uma interface otimizada para acomodar de forma compacta e estratégica os subsistemas das outras áreas:

* **Arquitetura em Dois Andares:** * **Primeiro Andar (Inferior):** Dedicado exclusivamente à acomodação dos componentes de alimentação e potência (baterias e fiação pesada), rebaixando o centro de gravidade.
    * **Segundo Andar (Superior):** Dedicado à proteção e fixação das placas de circuito, sensores e hardware de processamento.
* **Locomoção e Manobrabilidade:** Utiliza um sistema de direção diferencial com **2 motores N20 individuais e independentes** (um para cada roda) e **1 roda boba (*caster*)** posicionada na parte frontal. Essa configuração permite que o robô gire em torno do seu próprio eixo, economizando tempo e espaço.
* **Restrição Geométrica:** O robô foi projetado para caber perfeitamente e se mover de forma fluida dentro de uma única célula do labirinto (**18x18 cm**), garantindo folga nas curvas e evitando colisões com as paredes.

---

## Especificações Técnicas e Dimensões

### O Chassi
* **Material:** Impressão 3D (Polímero).
* **Dimensões Gerais:** 100 mm de comprimento × 70 mm de largura.
* **Pilares de Sustentação:** 16 mm de altura (espaçamento entre os andares).
* **Rodas:** 43 mm de diâmetro × 18 mm de largura.

### O Labirinto (Concepção Modular)
O labirinto de testes adota uma filosofia de **modularidade** para montagem e desmontagem rápida, crucial para os testes práticos da equipe de software. Ele foi projetado para mitigar interferências nos sensores ópticos e de distância do robô:
* **Dimensões da Base Principal:** 795 × 795 mm.
* **Malha da Base:** Matriz contendo **25 furos** para acoplamento dinâmico.
* **Células:** Padrão de 18 × 18 cm cada.
* **Paredes e Pilares:** 6 cm de altura.
* **Materiais e Acabamento Visual (Requisito Sensorial):**
    * **Base:** Feita em MDF com pintura em **preto fosco**, evitando reflexos ópticos indesejados que comprometeriam a leitura dos sensores de linha/distância.
    * **Paredes:** Feitas em MDF com acabamento em **branco** e o **topo em vermelho**, garantindo o contraste necessário para a navegação do robô.
    * **Pilares de Encaixe:** Impressos em 3D para acoplamento firme na base.

---

## Processo de Montagem

### Montagem do Robô:
1.  **Fixação dos Motores:** Os dois motores N20 são posicionados no primeiro andar e firmados utilizando **clamps parafusados**, o que elimina folgas mecânicas e garante rigidez durante acelerações bruscas.
2.  **Acoplamento das Rodas:** As rodas principais são conectadas diretamente aos eixos dos motores N20 e a roda boba é posicionada na seção frontal inferior.
3.  **União dos Andares:** O segundo andar é fixado sobre o primeiro utilizando os pilares de sustentação de 16 mm.

### Montagem do Labirinto:
1.  As paredes de MDF possuem um design com **extremidades dentadas**.
2.  Esses dentes se acoplam diretamente aos **pilares de encaixe em 3D**.
3.  O conjunto (parede + pilar) é encaixado por pressão na **matriz de 25 furos** da base de MDF preta, permitindo alterar a configuração do labirinto facilmente entre as sessões de teste.

---

## Análise Estrutural Computacional (ANSYS)

Para garantir a confiabilidade do robô antes da fabricação dos componentes físicos, o modelo tridimensional do chassi foi submetido a uma **Análise Estrutural Numérica no software ANSYS**. 
O estudo focou na simulação estática e dinâmica para verificar o comportamento do polímero impresso sob a ação das cargas reais do projeto (peso das baterias, placas eletrotécnicas, forças de aceleração e frenagem dos motores N20). A análise validou que a espessura das paredes e a disposição dos pilares de 16 mm suportam os esforços operacionais com margem de segurança adequada, evitando trincas ou deformações excessivas durante as manobras.

---

## Localização dos Arquivos no Repositório

Toda a modelagem 3D (arquivos `.CATPart`), simulações, arquivos de impressão e detalhamentos estão centralizados na pasta de mecânica do projeto:

```text
📂 Mec/
├── 📂 CAD Labirinto/           # Modelagem tridimensional do labirinto modular em CATIA
├── 📂 Desenho Técnico/         # Desenhos técnicos detalhados com as cotas e dimensões formais
├── 📂 Robô/                    # Modelos finais do chassi (CATPart), análises estruturais (ANSYS) e Resultados.
└── 📂 STL para impressão 3D/   # Arquivos de impressão (STL)
