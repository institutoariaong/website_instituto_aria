# Instituto ARIA — Site reestruturado (PORT FIEL)

Site do Instituto ARIA **reorganizado em paginas separadas**, gerado por **extracao literal**
do arquivo original `../index.html` (single-page). E um **PORT/EXTRACT, nao um redesign**:
nada foi reescrito, simplificado ou "melhorado". CSS, JS, fontes, widget do Instagram,
carrossel do hero, calendario de projetos e elementos decorativos foram copiados
**exatamente** como no original.

## Preservado (identico ao original)
- **Fontes:** as 4 originais — Cormorant Garamond, Libre Baskerville, Nunito Sans e
  Montserrat — com o mesmo `<link>` do Google Fonts.
- **CSS:** todo o CSS dos 3 blocos `<style>`, sem remover seletores nem alterar valores,
  apenas dividido: `css/main.css` (~2148 linhas), `css/head2.css` (~81), `css/vine.css`
  (~51), carregados nessa ordem (cascata preservada).
- **JS:** toda a logica original, em modulos na ordem original:
  `js/core.js` (navegacao, nav sticky, cookie, FAQ, PIX, contadores, word-cycle, fade-up,
  overlay mobile, barra Doe); `js/plants.js` (jardim procedural, sway, drag, seed-bag,
  recheckPlantPoints); `js/features.js` (deslocamento nav-plant, **calendario de projetos
  completo** timeline+mensal, modais de impacto/depoimento, **questionario de voluntario
  multi-step**); `js/behold.js` (loader do widget Instagram); `js/vine.js` (cipo flutuante).
- **Widget Instagram:** `<behold-widget feed-id="78m0roje4uqF1xhy0waM">` mantido (na home,
  como no original).
- **Carrossel do hero, calendario de projetos e todos os decorativos** (plant-zone,
  seed-bag, vine-cta-layer, mobile-cta-bar, cookie, selo Kupim, WhatsApp float) presentes
  em todas as paginas, iguais ao original.

## Unica mudanca funcional
Navegacao real entre paginas. `onclick="showPage('x')"` em `<a>` virou `href="pagina.html"`.
Para botoes e cards, `showPage(id)` foi reescrita para **navegar** ate a URL (mesmo destino).
O comportamento colateral do antigo showPage (scroll ao topo, nav ativo, nav visivel,
fade-up) e replicado a cada carregamento via `initCurrentPage()` (le `data-page` do `<body>`).
O overlay mobile fecha ao navegar.

Paginas: index.html (home), quem-somos, projetos, voluntarios, produtos, impacto, apoie,
contato, restrita, privacidade, parceria. Adicoes apenas aditivas: `<title>` e `data-page`
por pagina (nao afetam o visual).

## Imagens
Usadas as imagens **originais** (pasta `assets/` copiada integralmente), com os **mesmos
caminhos** do markup original — aparencia identica. O hero usa **hotlinks externos para
`loremflickr.com`** exatamente como no original. Isso foi mantido de proposito; trocar nao
e decisao desta etapa.

## Melhorias FUTURAS (NAO aplicadas — aguardam aprovacao)
A tentativa anterior fez estas mudancas por conta propria, quebrando a fidelidade. Ficam
como possiveis melhorias para etapa seguinte, **so sob aprovacao do usuario**:
- Trocar os hotlinks `loremflickr.com` do hero por fotos definitivas do ARIA.
- Reorganizar `assets/` em subpastas tematicas com nomes semanticos.
- Otimizacoes de responsividade/acessibilidade estritamente aditivas.
- Eventual refino de CSS ou do calendario.

Nenhum destes itens foi feito aqui — esta versao reproduz o original 1:1.
