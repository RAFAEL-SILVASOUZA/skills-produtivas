/* ============================================================
   data.js — FONTE ÚNICA do conteúdo dos diagramas.
   Este é o ÚNICO arquivo que você escreve. Renomeie para data.js.

   Regra de ouro: cada campo aqui sai de um arquivo que você LEU.
   Se não leu, não escreva — marque como lacuna.
   Contrato completo: references/data-model.md
   ============================================================ */

/* completa as chaves opcionais do detalhe — não remova */
function D(o) {
  return Object.assign(
    { kind: "", path: "", summary: "", facts: [], does: [], files: [], code: null, notes: [] },
    o
  );
}

const DIAGRAMS = {
  /* a chave bate com o id do <div class="diagram"> no index.html */
  "dg-visao": {
    /* tamanho do canvas: o maior x+190+20 e o maior y+150+20.
       Mantenha width <= 1100 e height <= 720 para caber em laptop. */
    width: 1070,
    height: 590,

    legend: [
      { kind: "flow", text: "Fluxo principal (o que roda em runtime)" },
      { kind: "dep", text: "Dependência / integração configurada" },
      { kind: "warn", text: "Acoplamento frágil (URL ou porta fixa no código)" },
      { kind: "gap", text: "Passo manual ou integração que não existe hoje" },
    ],

    nodes: [
      {
        id: "api",
        title: "NomeDoModulo",
        sub: "Uma linha: o que é, com que stack",
        tag: "LINGUAGEM",            // opcional, vira etiqueta laranja
        icon: "fa-solid fa-server",  // Font Awesome 6
        plain: false,                // true = ícone neutro (apoio, não protagonista)
        // grade: colunas de 280 em 280 (20, 300, 580, 860), linhas de 200 em 200
        x: 20,
        y: 220,
        detail: D({
          kind: "Módulo — backend",
          path: "src/api",
          summary:
            "Duas ou três frases dizendo o papel deste nó no sistema. Escreva o que " +
            "só se descobre lendo o código, não o que o nome já diz.",
          facts: [
            { label: "Framework", value: "versão exata que está no manifesto" },
            { label: "Portas", value: "o que está no compose/config" },
          ],
          does: [
            "Uma ação concreta por linha, citando a função ou arquivo.",
          ],
          files: [
            { path: "src/api/server.ts", desc: "bootstrap e rotas" },
          ],
          code: {
            title: "server.ts — o trecho que prova o que foi dito acima",
            text:
              "app.use(auth());\n" +
              "app.listen(3000);",
          },
          notes: [
            { type: "warn", text: "Risco real encontrado no código, com a correção." },
            { type: "info", text: "Detalhe não óbvio que ajuda quem for mexer." },
            { type: "gap", text: "O que deveria existir e não existe." },
          ],
        }),
      },

      {
        id: "db",
        title: "PostgreSQL",
        sub: "Banco único — porta 5432",
        tag: "POSTGRES",
        icon: "fa-solid fa-database",
        x: 300,
        y: 220,
        detail: D({
          kind: "Infraestrutura",
          path: "docker-compose.yml",
          summary: "Onde o estado vive e quem escreve nele.",
          facts: [{ label: "Imagem", value: "postgres:16" }],
        }),
      },

      {
        id: "spa",
        title: "Front de exemplo",
        sub: "SPA sem integração",
        badge: "sem integração", // selo para nó órfão: melhor que uma seta falsa
        icon: "fa-brands fa-angular",
        plain: true,
        x: 580,
        y: 220,
        detail: D({
          kind: "Módulo — frontend",
          path: "web",
          summary: "Existe no repo mas não consome nada da plataforma.",
          notes: [{ type: "gap", text: "Sem cliente HTTP e sem API para chamar." }],
        }),
      },
    ],

    edges: [
      // kind: flow | dep | warn | gap
      // dir: "both" para seta nas duas pontas (ida e volta reais)
      // route: "h" | "v" força o eixo de saída quando o caminho cruzaria um card
      // bend: 0..1 move o cotovelo; use valores diferentes quando várias
      //       arestas saem do mesmo nó, senão elas viram uma barra só
      { from: "api", to: "db", label: "SQL", kind: "flow" },
    ],
  },
};
