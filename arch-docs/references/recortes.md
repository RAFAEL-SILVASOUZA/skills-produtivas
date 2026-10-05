# Escolha dos diagramas

Três a cinco recortes. Menos que isso vira um emaranhado; mais vira repetição.

Cada diagrama responde **uma** pergunta. Se você não consegue escrever a pergunta
em uma frase, o recorte está errado.

## Catálogo

### 1. Visão geral — sempre

> Quais são as peças e como elas conversam?

Módulos, infraestrutura (banco, fila, cache) e serviços externos (LLM, provedor
de identidade, gateway de pagamento). Inclua o provedor de identidade como nó: é
dependência de verdade, não detalhe.

Marque com `gap` o que é manual ou inexistente. É este diagrama que revela
módulo órfão.

### 2. Fluxo principal de runtime — quase sempre

> O que acontece quando o sistema faz aquilo para o que existe?

Requisição → autorização → processamento → resposta. Num agente: mensagem →
roteamento → workers → saída. Mostre **quem decide** e **quem volta para quem**;
use `dir: "both"` quando o retorno é real.

Não simplifique uma decisão dinâmica em sequência fixa — documente que é decisão.

### 3. Pipeline de dados — quando há ingestão ou transformação

> Como o dado entra, no que ele se transforma e onde para?

Um nó por transformação, não por arquivo. Rotule a aresta com **o que trafega**
(`byte[]`, `JSONL`, `List<Document>`), não com o verbo.

Se há uma trilha offline/manual, desenhe-a separada e marque `gap`.

### 4. Identidade e isolamento — quando há múltiplos usuários ou tenants

> Quem é quem, e o que impede um ver o dado do outro?

Costuma ser o diagrama mais valioso e o que nunca existe. Mostre a cadeia:
credencial → autenticação → escopo da sessão → dado acessível. Deixe explícito o
que garante o isolamento — e, se for só uma convenção de nomes, diga isso.

### 5. Deploy e ambientes — quando o compose/pipeline tem armadilhas

> O que roda onde, com qual configuração?

Só vale a pena se houver contradição real (porta divergente, imagem
desatualizada, dependência sem healthcheck). Senão, uma tabela na aba de texto
basta.

## O que **não** merece diagrama

- Camadas internas de um módulo (Controller → Service → Repo). Isso é lista.
- Modelo de dados completo. Tabela comunica melhor que caixinhas.
- Sequência de chamadas de uma função. Vira o `code` do nó.

## Teste final

Olhe cada diagrama e pergunte: **"o que eu aprendo aqui que não aprenderia lendo
a lista de pastas?"**

Se a resposta for "nada", corte o diagrama ou refaça o recorte.
