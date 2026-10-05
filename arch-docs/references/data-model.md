# Contrato do `data.js`

`data.js` é o único arquivo que você escreve. `index.html` dá a moldura,
`main.js` dá o comportamento, `styles.css` dá a aparência — nenhum dos três
precisa ser tocado.

```js
const DIAGRAMS = {
  "<id do div.diagram>": { width, height, legend[], nodes[], edges[] },
};
```

## Diagrama

| campo | obrigatório | nota |
|---|---|---|
| `width` / `height` | sim | tamanho do canvas em px. **Mantenha ≤ 1100 × 720** — é o que cabe num laptop 1366×768 sem o zoom ficar ilegível. |
| `legend` | sim | `[{ kind, text }]`. Explique o que cada tipo de linha significa **neste** diagrama. |
| `nodes` | sim | ver abaixo |
| `edges` | sim | ver abaixo |

## Nó

```js
{
  id: "api",                    // único no diagrama; usado nas arestas e no deep link
  title: "NomeDoModulo",        // curto; é o que aparece no card
  sub: "o que é, em uma linha",
  tag: "PYTHON",                // opcional, etiqueta laranja
  badge: "sem integração",      // opcional; para nó sem nenhuma aresta
  icon: "fa-solid fa-server",   // Font Awesome 6
  plain: true,                  // ícone neutro: apoio, não protagonista
  x: 20, y: 220,                // grade: colunas de 280, linhas de 200
  detail: D({ ... })
}
```

**Grade.** Cards têm 190px de largura e ~140 de altura. Colunas em
`20, 300, 580, 860`; linhas em `20, 220, 420, 620`. Isso deixa ~90px de vão
horizontal — o espaço onde o rótulo da aresta precisa caber.

## Detalhe do nó

O que aparece no painel da direita. É aqui que a documentação deixa de ser um
desenho bonito e vira algo útil.

| campo | o que entra |
|---|---|
| `kind` | categoria curta em maiúsculas no painel: "Módulo — backend", "Infraestrutura", "Worker", "Tabela", "Ator", "Serviço externo" |
| `path` | caminho real no repositório. **Obrigatório** — é o que permite verificar |
| `summary` | 2–3 frases com o que só se descobre lendo o código |
| `facts` | `[{label, value}]` — versões exatas, portas, modelos, chaves de config |
| `does` | `[string]` — uma ação por linha, citando função ou arquivo |
| `files` | `[{path, desc}]` — os arquivos que alguém abriria para mexer nisso |
| `code` | `{title, text}` — **trecho real**, copiado do arquivo, que prova o que o resumo afirma |
| `notes` | `[{type, text}]` — `warn` (risco), `info` (detalhe não óbvio), `gap` (o que falta) |

Regra do `code`: colar de verdade, não reescrever. É a diferença entre
documentação e ficção. Corte para 8–15 linhas e preserve a indentação.

## Aresta

```js
{ from: "api", to: "db", label: "EF Core", kind: "flow",
  dir: "both", route: "v", bend: 0.3 }
```

| campo | valores | quando usar |
|---|---|---|
| `label` | **obrigatório** | ≤ 18 caracteres. Seta sem rótulo não informa nada |
| `kind` | `flow` | o caminho que roda de verdade em runtime (laranja) |
| | `dep` | dependência configurada, integração estática (cinza) |
| | `warn` | acoplamento frágil: URL/porta fixa, entrega manual (amarelo tracejado) |
| | `gap` | passo manual ou integração que não existe (pontilhado) |
| `dir` | `"both"` | ida e volta reais (ex.: worker que retorna ao supervisor) |
| `route` | `"h"` / `"v"` | força o eixo de saída quando o caminho cruzaria um card |
| `bend` | `0..1` | move o cotovelo; **use valores distintos quando várias arestas saem do mesmo nó** |

### O `gap` é o campo mais valioso

É ele que permite documentar honestamente o que **não** existe: o módulo que não
chama ninguém, o script cujo resultado ninguém importa, o front sem cliente HTTP.
Diagrama que só mostra o caminho feliz esconde exatamente a informação que o
leitor precisa.

Se um nó não tem nenhuma aresta, dê a ele um `badge` explicando por quê — o
`check.js` cobra isso.
