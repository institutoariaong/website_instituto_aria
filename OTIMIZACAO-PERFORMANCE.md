# Prompt — Otimização de performance do site Instituto ARIA

Use este prompt numa conversa futura para aplicar as otimizações de peso/carregamento discutidas.

---

## Prompt para colar

```
Quero que você deixe o site do Instituto ARIA mais leve, sem quebrar nenhum
efeito visual existente (carrossel do hero, pan das fotos, jardim de plantas,
acordeões, ciclos de texto, etc.). Aplique as otimizações abaixo, nessa ordem
de prioridade, e me avise o peso total antes/depois de cada etapa:

1. IMAGENS (maior impacto)
   - Comprimir e redimensionar todas as imagens do site pro tamanho real de
     exibição (fotos da equipe em "Quem Somos", QR Code do PIX, fotos de
     projetos, galeria do Instagram, e qualquer outra imagem solta).
   - Gerar versões em AVIF com fallback WebP via <picture>, pros navegadores
     que suportam.
   - Adicionar srcset/sizes responsivos onde fizer sentido, servindo versões
     menores em telas pequenas (mobile).
   - Checar se há imagens de fundo via CSS (background-image) fora do padrão
     de otimização e comprimir também.

2. CSS E JAVASCRIPT
   - Minificar main.css e todos os arquivos JS (core.js, plants.js,
     features.js, vine.js, spa-nav.js, behold.js).
   - Concatenar os arquivos JS num único bundle, reduzindo o número de
     requisições (mantendo a ordem de carregamento correta).
   - Remover CSS morto/não utilizado do main.css.
   - Adicionar defer/async nos scripts que não precisam bloquear o parsing
     do HTML.

3. FONTES
   - Reduzir os pesos/variações do Google Fonts pro mínimo realmente usado
     no site (hoje carrega Cormorant Garamond, Libre Baskerville, Nunito
     Sans e Montserrat com vários pesos cada).
   - Confirmar font-display: swap em todas as declarações de fonte.
   - Avaliar hospedar as fontes localmente (self-host) em vez de depender
     do Google Fonts.

4. JAVASCRIPT EM RUNTIME
   - Revisar todos os setInterval/requestAnimationFrame/observers do site
     (contador animado, jardim de plantas, barra de doação, carrossel do
     hero) e garantir que pausam quando o elemento sai da viewport ou a aba
     perde o foco — igual foi feito no efeito de pan do hero.
   - Reduzir a densidade de elementos SVG gerados dinamicamente pelo sistema
     de plantas/vinhas em telas menores.

5. REDE E CACHE (se o hospedeiro final permitir configurar)
   - Ativar compressão Gzip ou Brotli no servidor.
   - Definir headers de cache longos pros assets estáticos versionados
     (imagens, CSS, JS com ?v=).
   - Adicionar preconnect pro domínio de fontes do Google.

Ao final, rode uma auditoria com Lighthouse (Chrome DevTools) e me reporte
o antes/depois de performance, peso total da página e maior conteúdo visual
(LCP).
```

---

## Estimativa de ganho

Baseado no que já foi medido nesta conversa (hero: ~445KB → ~252KB de
imagens, uma redução de ~43% só nessa seção) e em ganhos típicos de cada
técnica listada, a estimativa para o **peso total da página** é:

| Otimização | Peso hoje (estimado) | Redução esperada |
|---|---|---|
| Compressão/resize de imagens (site inteiro) | maior fatia do peso total | 40–60% |
| AVIF com fallback WebP | sobre o que já foi comprimido | +15–30% adicional |
| Minificação de CSS/JS | peso de texto dos arquivos | 20–40% |
| Concatenação de JS (menos requisições) | não reduz peso, reduz *tempo* | latência, não KB |
| Otimização de fontes (pesos/variações) | peso de fontes carregadas | 20–50% |
| Gzip/Brotli no servidor | HTML/CSS/JS transferidos | 60–80% (transferência, não arquivo em disco) |

**Estimativa combinada e realista: o peso total transferido pelo navegador
deve cair entre 45% e 65%**, sendo a compressão de imagens (item 1) responsável
pela maior parte desse ganho — é normal imagens representarem 60-80% do peso
de um site como esse, rico em fotos.

Isso deve refletir num carregamento inicial sensivelmente mais rápido,
principalmente em conexões móveis/mais lentas, sem alterar a aparência ou o
comportamento do site.
