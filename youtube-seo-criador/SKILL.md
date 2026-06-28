---
name: youtube-seo-criador
description: Cria do zero título, descrição, hashtags e tags de um vídeo do YouTube a partir do tema e dos detalhes informados pelo usuário, fundamentando tudo em pesquisa real de tendências e concorrência. Não há metadados pré-existentes.
---

# Skill: Criação de SEO para Vídeos do YouTube

## Objetivo
A partir do **tema e dos detalhes** que o usuário fornecer sobre um vídeo, **criar do zero** título, descrição, hashtags e tags otimizados para descoberta no YouTube, fundamentados em **pesquisa real de tendências e concorrência** — nunca em suposições. O alvo é fazer o vídeo aparecer nas buscas que o público realmente faz e maximizar a relevância no algoritmo.

## Entrada esperada
O usuário descreve, com suas próprias palavras, o **tema** e os **detalhes** do vídeo (o que mostra, ferramentas usadas, formato, diferencial). **Não existe título, descrição ou tags ainda — o agente cria tudo do zero.** Não assuma o nicho nem reutilize nomes, modelos, jargões ou exemplos de outros contextos: trabalhe apenas com o que o usuário informou + a pesquisa.

## Ferramentas necessárias
- **webSearch** — para pesquisar tendências, termos e concorrência.
- **webScraping** — para ler autocomplete e páginas de resultados do YouTube.

---

## Princípios fundamentais (o "tato")

1. **Gancho pesquisável antes de nomes técnicos.** Nomes próprios, versões ou códigos de produto/ferramenta têm volume de busca quase nulo. Coloque o benefício ou o tema buscável na frente; jogue o nome técnico para o fim, entre parênteses, se for relevante.

2. **Idioma consistente com o público falado.** Identifique o idioma do conteúdo a partir dos detalhes do usuário e mantenha título, descrição, hashtags e tags predominantemente nesse idioma. Use poucos termos estrangeiros, apenas os de alto valor de busca. Idioma misturado prejudica a classificação.

3. **Primeiros ~150 caracteres da descrição são SEO crítico.** A primeira frase deve conter a palavra-chave principal + o diferencial do canal + uma pergunta-gancho. Sem aquecimento conversacional na abertura.

4. **As 3 primeiras hashtags importam mais.** O YouTube só exibe 3 acima do título; coloque ali as mais fortes e pesquisáveis. Nunca use hashtags quebradas, com underscores estranhos ou versões impronunciáveis.

5. **Tags cobrindo intenções de busca reais.** Derive-as da pesquisa de tendências, não da imaginação. Inclua o diferencial do canal e, quando fizer sentido, uma tag com o nome técnico completo para quem procura especificamente. Mire 12–16 tags e fique bem abaixo do limite de 500 caracteres.

6. **Honestidade sobre limites.** Nunca prometa posição garantida ("top 5", "1º lugar"). Metadado coloca o vídeo na corrida; CTR (miniatura + título) e retenção decidem o ranking final. Comunique isso ao usuário.

7. **Sem clickbait enganoso.** O gancho precisa refletir o conteúdo real descrito pelo usuário. Promessa não cumprida derruba retenção e ranking.

8. **Miniatura é responsabilidade do usuário.** O agente não a gera; deve lembrar o usuário de que ela é o fator nº 1 de cliques.

---

## Procedimento passo a passo

### Passo 1 — Entender o vídeo (a partir do tema e detalhes informados)
Extraia do que o usuário disse: tema central, ferramentas/stack, formato (comparação, tutorial, teste, review, etc.), público-alvo provável, idioma e o diferencial do canal. Se algo essencial para o SEO estiver ausente ou ambíguo, faça **uma** pergunta objetiva antes de prosseguir.

### Passo 2 — Pesquisar tendências e concorrência
Levante os termos que o público realmente busca:

- **Autocomplete do YouTube** (variações reais de busca):
  `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=<termo>`
  Consulte tanto o tema amplo quanto recortes de nicho derivados dos detalhes do usuário.
- **Páginas de resultados** (concorrência e linguagem dos vídeos que ranqueiam):
  `https://www.youtube.com/results?search_query=<termo>`
  Faça scraping dos títulos e canais do top ~15 para entender padrões de redação e nível de competição.
- Identifique 1–2 **termos amplos** (alto volume, mais disputados) e 2–3 **termos de nicho** (menor volume, mais fáceis de ranquear) onde o vídeo tem chance real.

### Passo 3 — Criar os metadados do zero
Com base na pesquisa e nos detalhes do usuário, escreva:

- **Título:** gancho/benefício buscável na frente, nome técnico (se houver) entre parênteses no fim. Claro, honesto e atraente.
- **Descrição:** primeira linha com palavra-chave principal + diferencial + pergunta-gancho. Depois, 2–3 frases de contexto e uma lista curta de tópicos com "✅". Encerre com uma linha de setup/contexto e as 3 hashtags.
- **Hashtags:** 3 fortes e pesquisáveis (as exibidas), podendo somar mais algumas na descrição.
- **Tags:** 12–16, derivadas da pesquisa, no idioma do público, incluindo o diferencial do canal e uma tag com o nome técnico completo, se aplicável.

### Passo 4 — Apresentar ao usuário
Entregue as propostas (título, descrição, hashtags, tags) junto com os **termos-alvo** identificados na pesquisa, explicando brevemente por que cada escolha foi feita. Se o usuário for publicar/editar no YouTube Studio em seguida, **aguarde aprovação explícita** antes de qualquer ação que altere conteúdo, respeitando as regras de permissão.

### Passo 5 — (Opcional) Testar a descoberta após publicação
Depois da indexação (pode levar de horas a dias), pesquise os termos-alvo no YouTube e relate em quais posições o vídeo aparece, separando termos amplos de nicho.

---

## Checklist de qualidade
- [ ] Tudo criado a partir do tema/detalhes do usuário + pesquisa (nada reaproveitado de outros contextos).
- [ ] Idioma consistente com o público.
- [ ] Gancho buscável antes de nomes técnicos no título.
- [ ] Primeira linha da descrição com palavra-chave + diferencial + gancho.
- [ ] 3 hashtags fortes e pesquisáveis; nenhuma quebrada.
- [ ] Tags derivadas de pesquisa real, dentro do limite de 500 caracteres.
- [ ] Termos-alvo (amplos e nicho) documentados.
- [ ] Nenhuma promessa de ranking garantido.

## Erros a evitar
- Inventar tags/termos sem pesquisar.
- Liderar o título com nome/código técnico de baixo volume.
- Misturar idiomas nas tags e hashtags.
- Reutilizar exemplos, modelos ou jargões de outros contextos (enviesa o resultado).
- Prometer posições de ranking.