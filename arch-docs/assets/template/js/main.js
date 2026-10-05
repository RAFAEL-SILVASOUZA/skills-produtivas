/* ============================================================
   Documentação de Arquitetura — AIGen
   Tema, abas, render dos diagramas, conexões rotuladas,
   foco por clique e painel lateral de detalhes.
   Depende de js/data.js (objeto DIAGRAMS).
   ============================================================ */

/* ---------- Utilidades ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}

const KIND_LABEL = {
  flow: "Fluxo principal",
  dep: "Dependência",
  warn: "Atenção",
  gap: "Manual / inexistente",
};

const NOTE_ICON = {
  warn: "fa-solid fa-triangle-exclamation",
  info: "fa-solid fa-circle-info",
  gap: "fa-solid fa-link-slash",
};

const NOTE_LABEL = { warn: "Atenção", info: "Nota", gap: "Lacuna" };

/* ============================================================
   Tema escuro / claro
   ============================================================ */
(function initTheme() {
  const root = document.documentElement;
  let saved = null;
  try {
    saved = localStorage.getItem("aigen-theme");
  } catch (e) {
    /* storage bloqueado */
  }
  if (saved) root.setAttribute("data-theme", saved);

  const btn = $("#themeToggle");
  if (!btn) return;
  const icon = $("i", btn);
  const label = $("span", btn);

  function sync() {
    const light = root.getAttribute("data-theme") === "light";
    icon.className = light ? "fa-solid fa-sun" : "fa-solid fa-moon";
    label.textContent = light ? "Tema claro" : "Tema escuro";
  }
  sync();

  btn.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("aigen-theme", next);
    } catch (e) {
      /* ignora */
    }
    sync();
  });
})();

/* ============================================================
   Abas e sub-abas
   ============================================================ */
function activateTab(tabId) {
  $$(".tabs .tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tabId));
  $$(".tab-panel").forEach((p) => p.classList.toggle("active", p.id === tabId));
  // cada aba tem seu próprio grupo de sub-abas na mesma barra
  $$(".subtabs").forEach((g) => (g.hidden = g.dataset.panel !== tabId));
  drawVisibleDiagrams();
  syncPanelWithTab();
}

function activateSubtab(subId) {
  const btn = $(`.subtab[data-subtab="${subId}"]`);
  if (!btn) return;
  const group = btn.closest(".subtabs");
  const panel = document.getElementById(group.dataset.panel);
  activateTab(panel.id);
  $$(".subtab", group).forEach((s) => s.classList.toggle("active", s === btn));
  $$(".subpanel", panel).forEach((p) => p.classList.toggle("active", p.id === subId));
  drawVisibleDiagrams();
  syncPanelWithTab();
}

$$(".tabs .tab").forEach((tab) => tab.addEventListener("click", () => activateTab(tab.dataset.tab)));
$$(".subtabs .subtab").forEach((sub) =>
  sub.addEventListener("click", () => activateSubtab(sub.dataset.subtab))
);

/* ============================================================
   Render dos diagramas a partir de DIAGRAMS
   ============================================================ */
const focusState = {}; // diagramId -> nodeId em foco

function nodeById(diagram, id) {
  return diagram.nodes.find((n) => n.id === id);
}

/** Arestas que tocam um nó, já resolvidas em "entra" / "sai". */
function connectionsOf(diagram, nodeId) {
  const out = [];
  const inc = [];
  diagram.edges.forEach((e) => {
    if (e.from === nodeId) {
      out.push({ other: e.to, edge: e });
      if (e.dir === "both") inc.push({ other: e.to, edge: e });
    }
    if (e.to === nodeId) {
      inc.push({ other: e.from, edge: e });
      if (e.dir === "both") out.push({ other: e.from, edge: e });
    }
  });
  return { out, inc };
}

function relatedIds(diagram, nodeId) {
  const set = new Set([nodeId]);
  diagram.edges.forEach((e) => {
    if (e.from === nodeId) set.add(e.to);
    if (e.to === nodeId) set.add(e.from);
  });
  return set;
}

function buildDiagram(id) {
  const data = DIAGRAMS[id];
  const host = document.getElementById(id);
  if (!data || !host) return;

  const nodesHtml = data.nodes
    .map(
      (n) => `
      <button type="button" class="node" data-node="${esc(n.id)}"
              style="left:${n.x}px; top:${n.y}px"
              title="${esc(n.title)} — abrir detalhes">
        <span class="ico${n.plain ? " plain" : ""}"><i class="${esc(n.icon)}" aria-hidden="true"></i></span>
        <span class="node-title">${esc(n.title)}</span>
        <span class="node-sub">${esc(n.sub || "")}</span>
        ${n.badge ? `<span class="node-badge"><i class="fa-solid fa-link-slash"></i> ${esc(n.badge)}</span>` : ""}
        ${n.tag ? `<span class="tag">${esc(n.tag)}</span>` : ""}
        <span class="node-cue"><i class="fa-solid fa-arrow-right-long"></i> detalhes</span>
      </button>`
    )
    .join("");

  const legendHtml = (data.legend || [])
    .map((l) => `<span><span class="swatch ${esc(l.kind)}"></span> ${esc(l.text)}</span>`)
    .join("");

  const listHtml = data.edges
    .map((e) => {
      const a = nodeById(data, e.from);
      const b = nodeById(data, e.to);
      if (!a || !b) return "";
      const arrow = e.dir === "both" ? "⇄" : "→";
      return `<li class="ek-${esc(e.kind)}">
          <button type="button" class="edge-jump" data-node="${esc(e.from)}">${esc(a.title)}</button>
          <span class="ea">${arrow}</span>
          <button type="button" class="edge-jump" data-node="${esc(e.to)}">${esc(b.title)}</button>
          <span class="el">${esc(e.label || "")}</span>
        </li>`;
    })
    .join("");

  host.innerHTML = `
    <div class="dg-bar">
      <span class="dg-hint"><i class="fa-solid fa-hand-pointer"></i> Clique em um card para ver os detalhes</span>
      <span class="dg-sp"></span>
      <button type="button" class="dg-btn dg-reset" hidden>
        <i class="fa-solid fa-xmark"></i> Limpar seleção
      </button>
      <span class="dg-zoom">
        <button type="button" class="zb" data-zoom="out" title="Diminuir (tecla −)" aria-label="Diminuir zoom">
          <i class="fa-solid fa-minus"></i>
        </button>
        <button type="button" class="zb zlevel" data-zoom="fit" title="Ajustar à tela (tecla 0)">100%</button>
        <button type="button" class="zb" data-zoom="in" title="Aumentar (tecla +)" aria-label="Aumentar zoom">
          <i class="fa-solid fa-plus"></i>
        </button>
        <span class="zsep"></span>
        <button type="button" class="zb" data-zoom="100" title="Tamanho real, 100% (tecla 1)">1:1</button>
        <button type="button" class="zb" data-zoom="center" title="Centralizar o desenho" aria-label="Centralizar">
          <i class="fa-solid fa-crosshairs"></i>
        </button>
      </span>
    </div>
    <div class="scroller">
      <div class="fit">
        <div class="canvas" style="width:${data.width}px; height:${data.height}px">
          <svg class="wires" aria-hidden="true"></svg>
          ${nodesHtml}
        </div>
      </div>
    </div>
    <div class="legend">${legendHtml}</div>
    <details class="edge-list">
      <summary><i class="fa-solid fa-list"></i> Conexões deste diagrama (${data.edges.length})</summary>
      <ul>${listHtml}</ul>
    </details>
  `;

  // clique nos cards
  $$(".node", host).forEach((el) =>
    el.addEventListener("click", () => selectNode(id, el.dataset.node))
  );
  // clique nos atalhos da lista de conexões
  $$(".edge-jump", host).forEach((el) =>
    el.addEventListener("click", () => selectNode(id, el.dataset.node))
  );
  $(".dg-reset", host).addEventListener("click", () => clearFocus(id));
  $$(".zb", host).forEach((b) => b.addEventListener("click", () => zoomAction(id, b.dataset.zoom)));
  initPanAndWheel(id);
}

/* ============================================================
   Zoom, centralização e arraste do canvas
   ============================================================ */
const ZOOM = {}; // id -> { fit: number, manual: number|null }
const Z_MIN = 0.35;
const Z_MAX = 2.5;
const Z_STEP = 1.2;

const zoomOf = (id) => (ZOOM[id] = ZOOM[id] || { fit: 1, manual: null });
const scaleOf = (id) => {
  const z = zoomOf(id);
  return z.manual != null ? z.manual : z.fit;
};
const clampZoom = (v) => Math.min(Z_MAX, Math.max(Z_MIN, v));

/** Aplica a escala corrente ao canvas e atualiza os controles. */
function applyScale(id) {
  const data = DIAGRAMS[id];
  const host = document.getElementById(id);
  if (!data || !host) return;
  const fit = $(".fit", host);
  const canvas = $(".canvas", host);
  if (!canvas) return;

  if (!wideLayout()) {
    canvas.style.transform = "";
    fit.style.width = "";
    fit.style.height = "";
    return;
  }

  const s = scaleOf(id);
  canvas.style.transform = `scale(${s})`;
  fit.style.width = data.width * s + "px";
  fit.style.height = data.height * s + "px";

  // rolagem só no zoom manual; assim a área medida para o ajuste
  // automático nunca inclui a largura de uma barra de rolagem
  const sc = $(".scroller", host);
  if (sc) sc.classList.toggle("is-zoomed", zoomOf(id).manual != null);

  const level = $(".zlevel", host);
  if (level) {
    level.textContent = Math.round(s * 100) + "%";
    level.classList.toggle("manual", zoomOf(id).manual != null);
    level.title = zoomOf(id).manual != null ? "Voltar ao ajuste automático (0)" : "Ajustar à tela (0)";
  }
  markPannable(id);
}

function markPannable(id) {
  const host = document.getElementById(id);
  const sc = $(".scroller", host);
  if (!sc) return;
  const can = sc.scrollWidth > sc.clientWidth + 1 || sc.scrollHeight > sc.clientHeight + 1;
  sc.classList.toggle("is-pannable", can);
}

function centerDiagram(id) {
  const sc = $(".scroller", document.getElementById(id));
  if (!sc) return;
  sc.scrollLeft = (sc.scrollWidth - sc.clientWidth) / 2;
  sc.scrollTop = (sc.scrollHeight - sc.clientHeight) / 2;
}

/**
 * Muda o zoom mantendo fixo o ponto sob o cursor (ou o centro da área).
 */
function zoomTo(id, target, anchor) {
  const sc = $(".scroller", document.getElementById(id));
  if (!sc) return;
  const before = scaleOf(id);
  const next = clampZoom(target);
  if (next === before) return;

  const ax = anchor ? anchor.x : sc.clientWidth / 2;
  const ay = anchor ? anchor.y : sc.clientHeight / 2;
  // ponto do canvas que está sob a âncora, em coordenadas não escaladas
  const px = (sc.scrollLeft + ax) / before;
  const py = (sc.scrollTop + ay) / before;

  zoomOf(id).manual = next;
  applyScale(id);

  sc.scrollLeft = px * next - ax;
  sc.scrollTop = py * next - ay;
}

function zoomAction(id, action) {
  if (action === "in") zoomTo(id, scaleOf(id) * Z_STEP);
  else if (action === "out") zoomTo(id, scaleOf(id) / Z_STEP);
  else if (action === "center") centerDiagram(id);
  else if (action === "100") {
    // trava em tamanho real: continua 100% mesmo se a janela mudar
    zoomOf(id).manual = 1;
    applyScale(id);
    centerDiagram(id);
  } else {
    zoomOf(id).manual = null; // volta ao ajuste automático
    fitDiagram(id);
    centerDiagram(id);
  }
}

/** Arraste do fundo para navegar e Ctrl/⌘ + roda para ampliar. */
function initPanAndWheel(id) {
  const host = document.getElementById(id);
  const sc = $(".scroller", host);
  if (!sc) return;

  sc.addEventListener(
    "wheel",
    (ev) => {
      if (!ev.ctrlKey && !ev.metaKey) return; // roda sozinha continua rolando
      ev.preventDefault();
      const r = sc.getBoundingClientRect();
      const anchor = { x: ev.clientX - r.left, y: ev.clientY - r.top };
      zoomTo(id, scaleOf(id) * (ev.deltaY < 0 ? Z_STEP : 1 / Z_STEP), anchor);
    },
    { passive: false }
  );

  let drag = null;
  let moved = false;

  sc.addEventListener("mousedown", (ev) => {
    if (ev.button !== 0 || ev.target.closest(".node")) return; // card continua clicável
    moved = false;
    if (!sc.classList.contains("is-pannable")) return;
    drag = { x: ev.clientX, y: ev.clientY, left: sc.scrollLeft, top: sc.scrollTop };
    sc.classList.add("is-panning");
    ev.preventDefault();
  });
  window.addEventListener("mousemove", (ev) => {
    if (!drag) return;
    if (Math.abs(ev.clientX - drag.x) > 3 || Math.abs(ev.clientY - drag.y) > 3) moved = true;
    sc.scrollLeft = drag.left - (ev.clientX - drag.x);
    sc.scrollTop = drag.top - (ev.clientY - drag.y);
  });
  window.addEventListener("mouseup", () => {
    if (!drag) return;
    drag = null;
    sc.classList.remove("is-panning");
  });

  // clique no vazio desmarca o card (arrastar para navegar não conta)
  sc.addEventListener("click", (ev) => {
    if (moved || ev.target.closest(".node")) return;
    clearFocus(id);
  });
}

/* ---------- Geometria das conexões ---------- */
function rectOf(host, nodeId) {
  const el = $(`.node[data-node="${nodeId}"]`, host);
  if (!el) return null;
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const x = el.offsetLeft;
  const y = el.offsetTop;
  return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
}

/**
 * Caminho ortogonal entre dois retângulos.
 * Sai pela borda mais próxima do destino e entra pela borda oposta,
 * com um degrau no meio para não cruzar os cards.
 * `route` força o eixo de saída ("h" ou "v") quando a heurística
 * escolheria um caminho que atravessa outro card.
 */
function edgeGeometry(a, b, route, bend) {
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  const horizontal = route ? route === "h" : Math.abs(dx) >= Math.abs(dy);
  const f = typeof bend === "number" ? bend : 0.5; // posição do cotovelo

  if (horizontal) {
    const right = dx >= 0;
    const x1 = right ? a.x + a.w : a.x;
    const x2 = right ? b.x : b.x + b.w;
    const y1 = a.cy;
    const y2 = b.cy;
    if (Math.abs(y1 - y2) < 4) {
      return { d: `M ${x1} ${y1} L ${x2} ${y2}`, mid: { x: (x1 + x2) / 2, y: y1 } };
    }
    const mx = x1 + (x2 - x1) * f;
    return {
      d: `M ${x1} ${y1} L ${mx} ${y1} L ${mx} ${y2} L ${x2} ${y2}`,
      mid: { x: mx, y: (y1 + y2) / 2 },
    };
  }

  const down = dy >= 0;
  const y1 = down ? a.y + a.h : a.y;
  const y2 = down ? b.y : b.y + b.h;
  const x1 = a.cx;
  const x2 = b.cx;
  if (Math.abs(x1 - x2) < 4) {
    return { d: `M ${x1} ${y1} L ${x2} ${y2}`, mid: { x: x1, y: (y1 + y2) / 2 } };
  }
  const my = y1 + (y2 - y1) * f;
  return {
    d: `M ${x1} ${y1} L ${x1} ${my} L ${x2} ${my} L ${x2} ${y2}`,
    mid: { x: (x1 + x2) / 2, y: my },
  };
}

const SVG_NS = "http://www.w3.org/2000/svg";
function svgEl(name, attrs) {
  const el = document.createElementNS(SVG_NS, name);
  Object.entries(attrs || {}).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

function drawDiagram(id) {
  const data = DIAGRAMS[id];
  const host = document.getElementById(id);
  if (!data || !host) return;
  const canvas = $(".canvas", host);
  const svg = $("svg.wires", host);
  if (!canvas || !svg || !canvas.offsetWidth) return; // painel oculto

  const W = data.width;
  const H = data.height;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("width", W);
  svg.setAttribute("height", H);
  svg.textContent = "";

  // uma marker por tipo de linha (as cores vêm do CSS por variável)
  const defs = svgEl("defs", {});
  ["flow", "dep", "warn", "gap"].forEach((kind) => {
    ["end", "start"].forEach((pos) => {
      const m = svgEl("marker", {
        id: `mk-${id}-${kind}-${pos}`,
        viewBox: "0 0 10 10",
        refX: "9",
        refY: "5",
        markerWidth: "7",
        markerHeight: "7",
        orient: pos === "end" ? "auto" : "auto-start-reverse",
        class: `mk ${kind}`,
      });
      m.appendChild(svgEl("path", { d: "M0,0 L10,5 L0,10 z" }));
      defs.appendChild(m);
    });
  });
  svg.appendChild(defs);

  const focus = focusState[id] || null;
  const related = focus ? relatedIds(data, focus) : null;

  data.edges.forEach((e) => {
    const a = rectOf(host, e.from);
    const b = rectOf(host, e.to);
    if (!a || !b) return;
    const g = edgeGeometry(a, b, e.route, e.bend);
    const hot = focus ? e.from === focus || e.to === focus : false;

    const group = svgEl("g", {
      class: `wire ${e.kind}${focus ? (hot ? " hot" : " dim") : ""}`,
    });

    const path = svgEl("path", {
      d: g.d,
      "marker-end": `url(#mk-${id}-${e.kind}-end)`,
    });
    if (e.dir === "both") path.setAttribute("marker-start", `url(#mk-${id}-${e.kind}-start)`);
    group.appendChild(path);

    if (e.label) {
      const t = svgEl("text", { x: g.mid.x, y: g.mid.y - 6, "text-anchor": "middle" });
      t.textContent = e.label;
      group.appendChild(t);
    }
    svg.appendChild(group);
  });

  // estados dos cards conforme o foco
  $$(".node", host).forEach((el) => {
    const nid = el.dataset.node;
    el.classList.toggle("is-focus", focus === nid);
    el.classList.toggle("is-related", !!focus && focus !== nid && related.has(nid));
    el.classList.toggle("is-dim", !!focus && !related.has(nid));
  });

  $(".dg-reset", host).hidden = !focus;
  host.classList.toggle("has-focus", !!focus);

  // a dica ensina a saída enquanto houver um card marcado
  const hint = $(".dg-hint", host);
  if (hint) {
    hint.innerHTML = focus
      ? '<i class="fa-solid fa-circle-xmark"></i> Clique no card de novo, no fundo ou use Esc para desmarcar'
      : '<i class="fa-solid fa-hand-pointer"></i> Clique em um card para ver os detalhes';
  }
}

/**
 * Recalcula a escala de "ajuste à tela". Enquanto o usuário não mexer no
 * zoom, é ela que vale — o desenho cabe inteiro, sem rolagem.
 */
function fitDiagram(id) {
  const data = DIAGRAMS[id];
  const host = document.getElementById(id);
  if (!data || !host) return;
  const scroller = $(".scroller", host);
  if (!scroller) return;

  if (!wideLayout()) {
    applyScale(id);
    return;
  }

  const cs = getComputedStyle(scroller);
  const availW = scroller.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const availH = scroller.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);

  // área ainda sem tamanho (aba oculta): mantém o ajuste anterior, mas
  // sincroniza o canvas e os controles — o ResizeObserver corrige depois
  if (availW > 0 && availH > 0) {
    zoomOf(id).fit = Math.min(1, availW / data.width, availH / data.height);
  }
  applyScale(id);
}

function drawVisibleDiagrams() {
  Object.keys(DIAGRAMS).forEach((id) => {
    drawDiagram(id);
    fitDiagram(id);
  });
}

/* ============================================================
   Painel lateral de detalhes
   ============================================================ */
const panel = {
  el: null,
  current: null, // { diagramId, nodeId }
};

/* Acima de 1100px vale o layout em colunas: o painel é fixo na direita
   e o desenho se ajusta à altura livre. Abaixo disso a página volta a
   rolar normalmente e o painel vira gaveta. */
const wideLayout = () => window.matchMedia("(min-width: 1100px)").matches;
const fixedPanel = wideLayout;

function initPanel() {
  panel.el = $("#detail");
  if (!panel.el) return;
  $("#detailClose").addEventListener("click", closePanel);
  $("#detailBackdrop").addEventListener("click", closePanel);
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && !panel.el.hidden) {
      if (fixedPanel()) clearFocus(currentDiagramId());
      else closePanel();
      return;
    }
    // atalhos de zoom sobre o diagrama visível
    const id = currentDiagramId();
    if (!id || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (ev.key === "+" || ev.key === "=") zoomAction(id, "in");
    else if (ev.key === "-" || ev.key === "_") zoomAction(id, "out");
    else if (ev.key === "0") zoomAction(id, "fit");
    else if (ev.key === "1") zoomAction(id, "100");
    else return;
    ev.preventDefault();
  });
}

/* Diagrama da sub-aba visível no momento (null na aba Documentação) */
function currentDiagramId() {
  const active = $("#panel-diagramas.active .subpanel.active");
  if (!active) return null;
  const host = $(".diagram", active);
  return host && DIAGRAMS[host.id] ? host.id : null;
}

/* Mantém o painel coerente com a aba aberta: na aba Diagramas ele
   mostra o primeiro nó do diagrama; na aba Documentação ele sai de cena. */
function syncPanelWithTab() {
  const id = currentDiagramId();
  if (!id) {
    closePanel();
    return;
  }
  if (!fixedPanel()) return; // em tela estreita só abre no clique
  const already = panel.current && panel.current.diagramId === id;
  if (!already) showNode(id, DIAGRAMS[id].nodes[0].id, { focus: false, silent: true });
}

function connectionRow(diagramId, item, direction) {
  const data = DIAGRAMS[diagramId];
  const other = nodeById(data, item.other);
  if (!other) return "";
  const icon = direction === "out" ? "fa-arrow-right-long" : "fa-arrow-left-long";
  return `<li>
      <span class="cx-dir ek-${esc(item.edge.kind)}"><i class="fa-solid ${icon}"></i></span>
      <button type="button" class="cx-node" data-jump="${esc(other.id)}">
        <i class="${esc(other.icon)}"></i> ${esc(other.title)}
      </button>
      <span class="cx-label">${esc(item.edge.label || KIND_LABEL[item.edge.kind] || "")}</span>
    </li>`;
}

function renderPanel(diagramId, nodeId) {
  const data = DIAGRAMS[diagramId];
  const node = nodeById(data, nodeId);
  if (!node) return;
  const d = node.detail || {};
  const { out, inc } = connectionsOf(data, nodeId);

  $("#detailKind").textContent = d.kind || "";
  $("#detailIcon").innerHTML = `<i class="${esc(node.icon)}"></i>`;
  $("#detailTitle").textContent = node.title;
  $("#detailSub").textContent = node.sub || "";

  const parts = [];

  if (d.path) {
    parts.push(
      `<div class="d-path"><i class="fa-solid fa-folder-tree"></i><code>${esc(d.path)}</code></div>`
    );
  }
  if (d.summary) parts.push(`<p class="d-summary">${esc(d.summary)}</p>`);

  if (d.facts && d.facts.length) {
    parts.push(
      `<section class="d-sec"><h4><i class="fa-solid fa-circle-dot"></i> Ficha técnica</h4>
       <dl class="d-facts">` +
        d.facts.map((f) => `<dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd>`).join("") +
        `</dl></section>`
    );
  }

  if (d.does && d.does.length) {
    parts.push(
      `<section class="d-sec"><h4><i class="fa-solid fa-list-check"></i> O que faz</h4>
       <ul class="d-list">` +
        d.does.map((t) => `<li>${esc(t)}</li>`).join("") +
        `</ul></section>`
    );
  }

  if (inc.length || out.length) {
    parts.push(
      `<section class="d-sec"><h4><i class="fa-solid fa-diagram-project"></i> Conexões</h4>` +
        (inc.length
          ? `<div class="cx-group"><span class="cx-head">Recebe de</span><ul class="d-cx">` +
            inc.map((i) => connectionRow(diagramId, i, "in")).join("") +
            `</ul></div>`
          : "") +
        (out.length
          ? `<div class="cx-group"><span class="cx-head">Envia para</span><ul class="d-cx">` +
            out.map((i) => connectionRow(diagramId, i, "out")).join("") +
            `</ul></div>`
          : "") +
        `</section>`
    );
  }

  if (d.files && d.files.length) {
    parts.push(
      `<section class="d-sec"><h4><i class="fa-solid fa-file-code"></i> Arquivos-chave</h4>
       <ul class="d-files">` +
        d.files
          .map((f) => `<li><code>${esc(f.path)}</code><span>${esc(f.desc || "")}</span></li>`)
          .join("") +
        `</ul></section>`
    );
  }

  if (d.code && d.code.text) {
    parts.push(
      `<section class="d-sec"><h4><i class="fa-solid fa-code"></i> No código</h4>
       <div class="d-code"><span class="d-code-title">${esc(d.code.title || "")}</span>
       <pre>${esc(d.code.text)}</pre></div></section>`
    );
  }

  if (d.notes && d.notes.length) {
    parts.push(
      `<section class="d-sec"><h4><i class="fa-solid fa-flag"></i> Observações</h4>` +
        d.notes
          .map(
            (n) => `<div class="note ${esc(n.type)}">
              <i class="${esc(NOTE_ICON[n.type] || NOTE_ICON.info)}"></i>
              <div><strong>${esc(NOTE_LABEL[n.type] || "Nota")}</strong> ${esc(n.text)}</div>
            </div>`
          )
          .join("") +
        `</section>`
    );
  }

  const body = $("#detailBody");
  body.innerHTML = parts.join("");
  body.scrollTop = 0;

  $$("[data-jump]", body).forEach((btn) =>
    btn.addEventListener("click", () => selectNode(diagramId, btn.dataset.jump))
  );
}

/**
 * Mostra um nó no painel.
 * focus  — destaca o nó e seus vizinhos no desenho (só em clique)
 * silent — não mexe na URL nem rola o diagrama (carga automática)
 */
function showNode(diagramId, nodeId, opts) {
  const o = opts || {};
  if (!DIAGRAMS[diagramId] || !nodeById(DIAGRAMS[diagramId], nodeId)) return;

  if (o.focus === false) delete focusState[diagramId];
  else focusState[diagramId] = nodeId;

  panel.current = { diagramId, nodeId };
  renderPanel(diagramId, nodeId);
  openPanel();
  drawDiagram(diagramId);

  if (o.silent) return;

  const el = $(`#${diagramId} .node[data-node="${nodeId}"]`);
  if (el) {
    el.focus({ preventScroll: true });
    // com zoom aplicado, traz o card para o centro da área visível
    const sc = el.closest(".scroller");
    if (sc && (sc.scrollWidth > sc.clientWidth + 1 || sc.scrollHeight > sc.clientHeight + 1)) {
      const s = scaleOf(diagramId);
      sc.scrollTo({
        left: (el.offsetLeft + el.offsetWidth / 2) * s - sc.clientWidth / 2,
        top: (el.offsetTop + el.offsetHeight / 2) * s - sc.clientHeight / 2,
        behavior: "smooth",
      });
    }
  }
  history.replaceState(null, "", `#${diagramId}:${nodeId}`);
}

/* Clique do usuário: destaca o card. Clicar de novo no card já
   destacado desmarca — o painel continua mostrando o conteúdo. */
function selectNode(diagramId, nodeId) {
  if (focusState[diagramId] === nodeId) {
    clearFocus(diagramId);
    return;
  }
  showNode(diagramId, nodeId, { focus: true });
}

function openPanel() {
  if (!panel.el) return;
  panel.el.hidden = false;
  $("#detailBackdrop").hidden = fixedPanel();
  document.body.classList.add("detail-open");
}

function closePanel() {
  if (!panel.el) return;
  panel.el.hidden = true;
  $("#detailBackdrop").hidden = true;
  document.body.classList.remove("detail-open");
  if (panel.current) clearFocus(panel.current.diagramId);
  panel.current = null;
  history.replaceState(null, "", location.pathname + location.search);
}

function clearFocus(diagramId) {
  delete focusState[diagramId];
  drawDiagram(diagramId);
}

/* ============================================================
   Deep link: #dg-visao:py abre a aba, o diagrama e o detalhe
   ============================================================ */
function applyHash() {
  const raw = decodeURIComponent(location.hash.replace(/^#/, ""));
  if (!raw) return false;
  if (!raw.includes(":")) {
    // #sub-rag abre só a sub-aba, sem painel
    if (document.getElementById(raw) && $(`.subtab[data-subtab="${raw}"]`)) {
      activateSubtab(raw);
      return true;
    }
    return false;
  }
  const [diagramId, nodeId] = raw.split(":");
  if (!DIAGRAMS[diagramId]) return false;
  const host = document.getElementById(diagramId);
  const subpanel = host && host.closest(".subpanel");
  if (subpanel) activateSubtab(subpanel.id);
  selectNode(diagramId, nodeId);
  return true;
}

/* ============================================================
   Boot
   ============================================================ */
/* O espaço livre muda quando as fontes carregam, quando o painel abre ou
   quando a janela muda. Observar a área é mais confiável do que recalcular
   em cada evento. */
function watchSizes() {
  if (typeof ResizeObserver !== "function") return;
  const ro = new ResizeObserver((entries) => {
    entries.forEach((e) => {
      const host = e.target.closest(".diagram");
      if (host) fitDiagram(host.id);
    });
  });
  $$(".diagram .scroller").forEach((el) => ro.observe(el));
}

function boot() {
  initPanel();
  Object.keys(DIAGRAMS).forEach(buildDiagram);
  drawVisibleDiagrams();
  // o link direto manda; sem ele, o painel já abre no primeiro nó
  if (!applyHash()) syncPanelWithTab();
  watchSizes();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(drawVisibleDiagrams);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

window.addEventListener("load", drawVisibleDiagrams);
window.addEventListener("hashchange", applyHash);

let rt = null;
window.addEventListener("resize", () => {
  clearTimeout(rt);
  rt = setTimeout(() => {
    drawVisibleDiagrams();
    // cruzar os 1280px troca entre coluna fixa e gaveta
    if (fixedPanel()) syncPanelWithTab();
    else if (panel.el && !panel.el.hidden) $("#detailBackdrop").hidden = false;
  }, 120);
});
