# Armadilhas

Cada item aqui custou um ciclo inteiro de "entreguei → usuário reclamou → capturei
→ corrigi" numa construção real. O template já vem com todas corrigidas. Esta
lista existe para você **não reintroduzir** nenhuma ao mexer no CSS/JS, e para
reconhecer o sintoma rápido se aparecer.

---

## 1. `[hidden]` perde para `display: flex`

**Sintoma:** o painel lateral aparece aberto e vazio desde o carregamento,
roubando a largura e cortando o desenho.

**Causa:** o atributo `hidden` equivale a `display: none` com especificidade
baixíssima. Qualquer `.detail { display: flex }` o anula.

**Correção (já no template, antes dos componentes):**

```css
[hidden] { display: none !important; }
```

Vale para qualquer elemento do projeto que combine `hidden` + `display`.

---

## 2. `display: flex` num parágrafo quebra o texto em colunas

**Sintoma:** a linha de contexto vira três blocos empilhados: o `<strong>` numa
coluna, o texto do meio em outra, o `<strong>` final numa terceira.

**Causa:** num container flex, **cada elemento filho vira um item** e as
sequências de texto nu viram itens anônimos separados. Um parágrafo com
`<strong>` no meio não é mais um parágrafo.

**Correção:** texto corrido nunca é flex container. Para alinhar um ícone, use
`display: block` com `margin-right` no `<i>`.

---

## 3. A barra de rolagem contamina a medida do auto-ajuste

**Sintoma:** o desenho fica num zoom menor que o possível (65% quando cabia 71%)
e não corrige sozinho.

**Causa:** com `overflow: auto` permanente, enquanto o conteúdo não cabe surge a
barra de rolagem, que reduz `clientWidth`/`clientHeight`. O ajuste é calculado
sobre a área já descontada e converge para menos.

**Correção:** a área de desenho é `overflow: hidden` no modo automático (onde,
por definição, tudo cabe) e só vira `auto` quando há zoom manual.

```css
.scroller { overflow: hidden; }
.scroller.is-zoomed { overflow: auto; }
```

---

## 4. `justify-content: center` corta o início do conteúdo

**Sintoma:** com zoom acima do que cabe, não é possível rolar até a borda
esquerda/superior — some um pedaço do desenho.

**Causa:** bug clássico do flex: o espaço negativo de um item centralizado por
`justify-content` fica inacessível à rolagem.

**Correção:** centralize com `margin: auto` no item.

---

## 5. `prefers-reduced-motion` congela o fade e esconde o conteúdo

**Sintoma:** em quem tem "reduzir movimento" ligado no sistema (e em capturas
headless com `--force-prefers-reduced-motion`), a aba inteira aparece quase
invisível.

**Causa:** a animação `fade` começa em `opacity: 0`. Se ela não roda, nada
restaura a opacidade.

**Correção:** respeitar a preferência zerando as durações. É acessibilidade, não
só cosmética — o conteúdo nunca pode depender da animação para existir.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
  }
}
```

---

## 6. Arestas do mesmo nó viram uma "espinha" vertical

**Sintoma:** quatro setas saindo do mesmo card formam uma barra vertical única;
não dá para saber qual vai para onde.

**Causa:** todas usam o mesmo ponto de cotovelo (o meio do vão).

**Correção:** `bend` diferente por aresta, espalhando em leque. Para quatro
saídas num vão de ~150px: `0.2`, `0.38`, `0.56`, `0.74`.

---

## 7. Rótulo maior que o vão desaparece atrás do card

**Sintoma:** "OIDC /signin-oidc" vira "OIDC /signin-oid" ou some.

**Causa:** o rótulo é centralizado no cotovelo, mas o SVG fica **abaixo** dos
cards (`z-index`). O que passar da coluna some.

**Correção, nesta ordem:**
1. Encurte o rótulo (o texto completo já está no painel e na lista de conexões).
   Regra prática: **≤ 18 caracteres** para um vão de 90–110px.
2. Se não der, aumente o vão entre colunas.
3. Em último caso, mova o cotovelo com `bend` para uma região livre.

---

## 8. Caminho em L atravessando um card

**Sintoma:** a linha corta um card no meio do trajeto.

**Causa:** a heurística escolhe o eixo pela maior distância; às vezes o degrau
cai exatamente em cima de outro nó.

**Correção:** `route: "v"` ou `route: "h"` força o eixo de saída. Se ainda
cruzar, mova o nó — na maioria das vezes o problema é o arranjo, não a rota.

---

## 9. Seta para o que não existe

**Sintoma:** o diagrama sugere uma integração que o código não tem.

**Correção:** não desenhe a aresta. Use `badge: "sem integração"` no card. Uma
seta pontilhada para o nada confunde mais do que informa; o selo é explícito.

---

## 10. O viewport mínimo do Chrome headless

**Sintoma:** captura em 430px mostra tudo cortado à direita e você sai caçando um
overflow que não existe.

**Causa:** sem emulação de dispositivo, o headless não encolhe abaixo de ~800px.
A imagem de 430px é um recorte de uma página renderizada em 800.

**Como confirmar:** capture em 800px. Se couber certinho, era artefato.

---

## 11. Escala calculada antes das fontes carregarem

**Sintoma:** o zoom automático trava num valor errado e só acerta ao
redimensionar a janela.

**Causa:** as fontes do Google chegam depois do primeiro cálculo e mudam as
alturas; nenhum evento de resize dispara.

**Correção:** `ResizeObserver` na área de desenho (já no template) em vez de
recalcular só em eventos pontuais. Observar o tamanho real cobre fonte, troca de
aba, abertura de painel e resize de uma vez.
