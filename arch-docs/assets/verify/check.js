/* ============================================================
   Verificação headless da documentação de arquitetura.
   Agnóstico ao projeto: valida estrutura e comportamento, não conteúdo.

     npm install jsdom
     node check.js [caminho-da-pasta-docs]

   ATENÇÃO: jsdom NÃO aplica CSS. Passar aqui não significa que a tela
   está certa. O screenshot do shots.ps1 é obrigatório.
   ============================================================ */
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const DOC = path.resolve(process.argv[2] || ".");
const html = fs.readFileSync(path.join(DOC, "index.html"), "utf8");

const vc = new VirtualConsole();
vc.on("jsdomError", (e) => console.log("JSDOM ERROR:", e.message));

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  url: "http://localhost/index.html",
  pretendToBeVisual: true,
  virtualConsole: vc,
});
const { window } = dom;

// jsdom não faz layout nem media query: simulamos os dois
Object.defineProperties(window.HTMLElement.prototype, {
  offsetWidth: { get() { return this.classList.contains("node") ? 190 : 1200; } },
  offsetHeight: { get() { return this.classList.contains("node") ? 140 : 600; } },
  offsetLeft: { get() { return parseInt(this.style.left || "0", 10); } },
  offsetTop: { get() { return parseInt(this.style.top || "0", 10); } },
});
window.matchMedia = (q) => ({
  matches: /min-width/.test(q), // simula viewport larga
  media: q,
  addEventListener() {}, removeEventListener() {},
  addListener() {}, removeListener() {},
});

const errors = [];
window.addEventListener("error", (e) => errors.push(e.message));

for (const f of ["js/data.js", "js/main.js"]) {
  const el = window.document.createElement("script");
  el.textContent = fs.readFileSync(path.join(DOC, f), "utf8");
  window.document.body.appendChild(el);
}
if (window.document.readyState === "loading") {
  window.document.dispatchEvent(new window.Event("DOMContentLoaded"));
}

const doc = window.document;
const ok = [];
const fail = [];
const t = (n, c, extra) => (c ? ok : fail).push(n + (extra ? " — " + extra : ""));
const click = (el) => el && el.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
const key = (k) => doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: k, bubbles: true }));
const title = () => doc.getElementById("detailTitle").textContent;

const DIAGRAMS = window.eval("typeof DIAGRAMS !== 'undefined' ? DIAGRAMS : null");
t("data.js define DIAGRAMS", !!DIAGRAMS && Object.keys(DIAGRAMS).length > 0);
if (!DIAGRAMS) { console.log("sem DIAGRAMS — abortado"); process.exit(1); }

const first = Object.keys(DIAGRAMS)[0];

/* ---------- 0. HTML e dados falam do mesmo conjunto ---------- */
const nosHtml = Array.from(doc.querySelectorAll(".diagram")).map((e) => e.id);
const semDados = nosHtml.filter((id) => !DIAGRAMS[id]);
t("todo .diagram do HTML tem dados", semDados.length === 0, semDados.join());
const semHtml = Object.keys(DIAGRAMS).filter((id) => !nosHtml.includes(id));
t("todo diagrama dos dados tem um .diagram no HTML", semHtml.length === 0, semHtml.join());

const subtabs = Array.from(doc.querySelectorAll('.subtabs[data-panel="panel-diagramas"] .subtab'))
  .map((b) => b.dataset.subtab);
const semPainel = subtabs.filter((s) => !doc.getElementById(s));
t("toda sub-aba aponta para um painel existente", semPainel.length === 0, semPainel.join());
const painelSemAba = Array.from(doc.querySelectorAll("#panel-diagramas .subpanel"))
  .map((p) => p.id)
  .filter((id) => !subtabs.includes(id));
t("todo painel de diagrama tem sub-aba", painelSemAba.length === 0, painelSemAba.join());

/* ---------- 1. estrutura e coerência dos dados ---------- */
Object.keys(DIAGRAMS).forEach((id) => {
  const host = doc.getElementById(id);
  t("existe <div class='diagram' id='" + id + "'>", !!host);
  if (!host) return;
  const d = DIAGRAMS[id];

  t("nós renderizados em " + id, host.querySelectorAll(".node").length === d.nodes.length);
  const svg = host.querySelector("svg.wires");
  t("arestas desenhadas em " + id, svg.querySelectorAll("g.wire").length === d.edges.length);
  t("toda aresta tem rótulo em " + id, d.edges.every((e) => !!e.label));

  const ids = new Set(d.nodes.map((n) => n.id));
  const orfas = d.edges.filter((e) => !ids.has(e.from) || !ids.has(e.to));
  t("sem aresta órfã em " + id, orfas.length === 0, JSON.stringify(orfas));

  t("ids de nó únicos em " + id, ids.size === d.nodes.length);
  t("todo nó tem resumo em " + id,
    d.nodes.every((n) => n.detail && n.detail.summary),
    d.nodes.filter((n) => !(n.detail && n.detail.summary)).map((n) => n.id).join());
  t("todo nó tem caminho no repo em " + id,
    d.nodes.every((n) => n.detail && n.detail.path),
    d.nodes.filter((n) => !(n.detail && n.detail.path)).map((n) => n.id).join());

  t("canvas cabe em laptop em " + id, d.width <= 1100 && d.height <= 720, d.width + "x" + d.height);
  t("legenda declarada em " + id, Array.isArray(d.legend) && d.legend.length > 0);

  const kinds = new Set(["flow", "dep", "warn", "gap"]);
  t("tipos de aresta válidos em " + id, d.edges.every((e) => kinds.has(e.kind)));

  // nó sem nenhuma aresta deve se explicar com um selo
  const conectados = new Set(d.edges.flatMap((e) => [e.from, e.to]));
  const soltos = d.nodes.filter((n) => !conectados.has(n.id) && !n.badge);
  t("nó solto tem selo explicando em " + id, soltos.length === 0, soltos.map((n) => n.id).join());
});

/* ---------- 2. painel fixo já carregado ---------- */
const painel = doc.getElementById("detail");
t("painel abre no load", painel.hidden === false);
t("painel mostra o primeiro nó", title() === DIAGRAMS[first].nodes[0].title, title());
t("body marcado como detail-open", doc.body.classList.contains("detail-open"));
t("URL intocada na carga automática", window.location.hash === "");
t("desenho sem foco no load", doc.querySelectorAll("#" + first + " .node.is-dim").length === 0);

/* ---------- 3. clique, foco e desmarcar ---------- */
const alvo = doc.querySelector("#" + first + " .node");
click(alvo);
t("clique destaca o card", doc.querySelectorAll("#" + first + " .node.is-focus").length === 1);
t("botão de limpar aparece", doc.querySelector("#" + first + " .dg-reset").hidden === false);
t("dica ensina a desmarcar", /desmarcar/.test(doc.querySelector("#" + first + " .dg-hint").textContent));
t("clique grava deep link", /^#/.test(window.location.hash), window.location.hash);

const corpo = doc.getElementById("detailBody").innerHTML;
t("painel traz ficha técnica", corpo.includes("Ficha técnica"));
t("painel traz conexões", corpo.includes("Conexões"));

click(alvo);
t("clicar de novo desmarca", doc.querySelectorAll("#" + first + " .node.is-focus").length === 0);
t("painel segue mostrando o nó", !!title());

click(alvo);
doc.querySelector("#" + first + " .scroller").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
t("clique no fundo desmarca", doc.querySelectorAll("#" + first + " .node.is-focus").length === 0);

click(alvo);
key("Escape");
t("Esc desmarca", doc.querySelectorAll("#" + first + " .node.is-focus").length === 0);
t("Esc mantém o painel", painel.hidden === false);

/* ---------- 4. zoom ---------- */
const dg = doc.getElementById(first);
const canvas = dg.querySelector(".canvas");
const nivel = dg.querySelector(".zlevel");
const escala = () => {
  const m = /scale\(([\d.]+)\)/.exec(canvas.style.transform || "");
  return m ? parseFloat(m[1]) : null;
};
t("controles de zoom presentes", dg.querySelectorAll(".zb").length === 5);
t("nível exibido em %", /%$/.test(nivel.textContent), nivel.textContent);
const base = escala();
t("escala aplicada no canvas", base !== null);

click(dg.querySelector('[data-zoom="in"]'));
t("aumentar amplia", escala() > base);
t("zoom manual sinalizado", nivel.classList.contains("manual"));
click(dg.querySelector('[data-zoom="fit"]'));
t("ajustar volta ao automático", nivel.classList.contains("manual") === false);
t("ajustar restaura a escala", Math.abs(escala() - base) < 1e-9);
click(dg.querySelector('[data-zoom="100"]'));
t("1:1 vai para 100%", Math.abs(escala() - 1) < 1e-9);
t("1:1 trava em manual", nivel.classList.contains("manual"));
key("0");
t("tecla 0 reajusta", nivel.classList.contains("manual") === false);

for (let i = 0; i < 15; i++) click(dg.querySelector('[data-zoom="out"]'));
t("respeita o zoom mínimo", escala() >= 0.35 - 1e-9, String(escala()));
for (let i = 0; i < 30; i++) click(dg.querySelector('[data-zoom="in"]'));
t("respeita o zoom máximo", escala() <= 2.5 + 1e-9, String(escala()));
key("0");

/* ---------- 5. abas ---------- */
const abas = Array.from(doc.querySelectorAll(".tabs .tab"));
if (abas[1]) {
  click(abas[1]);
  t("segunda aba ativa", doc.getElementById(abas[1].dataset.tab).classList.contains("active"));
  t("sub-abas trocam com a aba",
    doc.querySelector('.subtabs[data-panel="' + abas[1].dataset.tab + '"]').hidden === false);
  t("painel sai de cena fora dos diagramas", painel.hidden === true);
  click(abas[0]);
  t("painel volta nos diagramas", painel.hidden === false);
}

const subs = Array.from(doc.querySelectorAll('.subtabs[data-panel="panel-diagramas"] .subtab'));
if (subs[1]) {
  click(subs[1]);
  const segundo = Object.keys(DIAGRAMS)[1];
  t("sub-aba troca o diagrama", doc.getElementById(subs[1].dataset.subtab).classList.contains("active"));
  if (segundo) t("painel segue a sub-aba", title() === DIAGRAMS[segundo].nodes[0].title, title());
  click(subs[0]);
}

/* ---------- 6. deep link ---------- */
const alvoDeep = DIAGRAMS[first].nodes[DIAGRAMS[first].nodes.length - 1];
window.location.hash = "#" + first + ":" + alvoDeep.id;
window.dispatchEvent(new window.Event("hashchange"));
t("deep link abre o nó", title() === alvoDeep.title, title());

t("sem erro de script", errors.length === 0, errors.join(" | "));

console.log("\n=== PASSOU (" + ok.length + ") ===");
ok.forEach((s) => console.log("  ok  " + s));
if (fail.length) {
  console.log("\n=== FALHOU (" + fail.length + ") ===");
  fail.forEach((s) => console.log("  XX  " + s));
  process.exit(1);
}
console.log("\nTodos os " + ok.length + " checks passaram.");
console.log("LEMBRE: jsdom não aplica CSS. Rode shots.ps1 e OLHE as imagens.");
