---
name: arch-docs
description: Cria documentação de arquitetura navegável a partir do código de um repositório — diagramas clicáveis com painel de detalhes, zoom e aba de riscos, em HTML estático sem build. Use quando pedirem para documentar a arquitetura, desenhar/revisar diagramas de um projeto, criar um guia de onboarding técnico, ou quando uma documentação existente estiver desatualizada, incompleta ou divergente do código.
---

# Documentação de arquitetura navegável

Produz uma pasta `documentos/` com quatro arquivos estáticos (sem build, sem
dependência de runtime) contendo diagramas clicáveis, painel lateral de detalhes,
zoom, e abas de texto com módulos, contratos, infraestrutura e **riscos reais
encontrados no código**.

O template já está pronto e testado. **Você escreve apenas o `data.js`.**

## Princípio

> Todo card, toda seta e todo número sai de um arquivo que você abriu.

README e diagramas antigos são hipóteses a verificar, não fonte. A documentação
só vale se discordar do que estava errado.

## Processo

### 1. Levantar (não pule)

Leia o manifesto de orquestração, os manifestos de dependência, os pontos de
entrada, a configuração por ambiente e o caminho principal de execução.

Responda por escrito as cinco perguntas de `references/levantamento.md` — são
elas que revelam o que ninguém documentou: a chave que amarra o sistema, as
configurações que se contradizem, o que está no repo e não é chamado.

Anote tudo que você corrigiria, com severidade. Vira a aba de riscos.

### 2. Escolher os recortes

Três a cinco diagramas, cada um respondendo **uma** pergunta.
Catálogo e critérios em `references/recortes.md`.

### 3. Copiar o template

```
cp -r <skill>/assets/template/* documentos/
mv documentos/js/data.example.js documentos/js/data.js
```

Ajuste no `index.html`: título, marca, números da topbar, sub-abas (uma por
diagrama), as linhas `.dg-note` e as abas de texto.

**Não edite `css/styles.css` nem `js/main.js`** — comportamento e armadilhas já
resolvidos. Mexer sem ler `references/pitfalls.md` reintroduz bugs conhecidos.

### 4. Escrever o `data.js`

Contrato completo em `references/data-model.md`. O essencial:

- Grade: colunas em `20, 300, 580, 860`; linhas em `20, 220, 420, 620`.
- `width` ≤ 1100 e `height` ≤ 720 — é o que cabe num laptop.
- Toda aresta tem `label` (≤ 18 caracteres) e `kind`:
  `flow` (roda de verdade) · `dep` (configurada) · `warn` (frágil) · `gap` (não existe).
- Todo nó tem `path`, `summary` e, quando couber, um `code` **copiado do arquivo**.
- Nó sem aresta leva `badge` explicando por quê — nunca uma seta para o nada.

### 5. Verificar — obrigatório

```bash
npm install jsdom          # uma vez
node <skill>/assets/verify/check.js documentos/
powershell <skill>/assets/verify/shots.ps1 -Docs documentos   # ou ./shots.sh
```

O `check.js` valida estrutura e comportamento. **jsdom não aplica CSS**: passar
nele não significa que a tela está certa.

> Nunca entregue sem abrir o screenshot de 1366×768.

Numa construção real, 53 asserções passavam enquanto a tela tinha um painel
fantasma aberto e o diagrama não cabia na primeira dobra. Só a imagem mostrou.

Olhando cada captura, procure: painel aberto e vazio, card cortado, rótulo atrás
de card, linhas empilhadas numa barra só, desenho fora da primeira tela.

### 6. Revisar o desenho

Para cada diagrama: *"o que eu aprendo aqui que não aprenderia lendo a lista de
pastas?"* Se a resposta for "nada", refaça o recorte.

## O que o template entrega pronto

Layout de altura fixa (a página não rola no desktop) · conteúdo à esquerda e
painel fixo à direita, já carregado no primeiro nó · clique destaca o nó e seus
vizinhos e esmaece o resto · desmarcar por clique no card, clique no fundo, Esc
ou botão · zoom com ajuste automático, 1:1, centralizar, `Ctrl`+roda e arraste ·
atalhos `+` `−` `0` `1` · deep link `#diagrama:no` · tema claro/escuro · barras
de rolagem estilizadas · telas estreitas empilham os cards e trocam as linhas por
uma lista textual de conexões.

## Referências

| arquivo | quando ler |
|---|---|
| `references/levantamento.md` | antes de escrever qualquer coisa |
| `references/recortes.md` | ao decidir quais diagramas fazer |
| `references/data-model.md` | ao escrever o `data.js` |
| `references/pitfalls.md` | antes de tocar no CSS/JS, ou se a tela sair errada |
