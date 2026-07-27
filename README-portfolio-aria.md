# Instituto ARIA — Reestruturação do site institucional

Projeto real para uma ONG (Instituto ARIA): reestruturar um site de página única em páginas separadas, preservando 100% do visual e comportamento originais. Este README documenta as decisões técnicas, o que foi preservado de propósito, e o roadmap de QA que ainda falta executar.

> Documentação técnica linha a linha (o que cada arquivo contém) está em [`README.md`](./README.md). Este arquivo é o resumo voltado a quem quer entender as decisões de engenharia por trás do projeto.

## O problema

O site original era um único `index.html` com tudo dentro: navegação simulada via JavaScript (`showPage('id')` trocava a visibilidade de blocos, sem trocar de URL real), carrossel do hero, jardim de plantas interativo com drag e balanço (SVG gerado dinamicamente), calendário de projetos com visualização em timeline e mensal, questionário de voluntariado em múltiplas etapas, widget do Instagram, barra fixa de doação e cookie banner.

Funcionava. Estava aprovado visualmente pela equipe da ONG. O problema era estrutural: uma SPA disfarçada de página única, difícil de manter, sem URLs reais por seção, sem separação de responsabilidades entre navegação e apresentação.

## A decisão: port, não redesign

Toda alteração precisava ser aditiva ou estrutural, nunca visual. Isso significa:

- **CSS** dividido em três arquivos (`css/main.css`, `css/head2.css`, `css/vine.css`) mantendo a ordem de carregamento e a cascata originais, sem remover seletores ou alterar valores.
- **JavaScript** separado em módulos por responsabilidade (`core.js`, `plants.js`, `features.js`, `behold.js`, `vine.js`), preservando a ordem de execução original.
- **Fontes, imagens, widget do Instagram e todos os elementos decorativos** copiados exatamente como estavam, inclusive os hotlinks externos de imagem do hero — decisão deliberada, documentada, não descuido.
- **Única mudança funcional real**: `onclick="showPage('x')"` virou `href="pagina.html"`, com navegação real entre páginas HTML. A função `showPage()` foi reescrita para navegar de fato, e seus efeitos colaterais (scroll ao topo, item ativo no menu, animações de fade-up) foram replicados a cada carregamento via `initCurrentPage()`, lendo o atributo `data-page` do `<body>`.

O que eu decidi **não** fazer nesta etapa, e por quê, está documentado explicitamente: trocar os hotlinks de imagem por fotos definitivas, reorganizar `assets/` em subpastas semânticas, e otimizações de acessibilidade e responsividade. São mudanças que afetam a experiência final e cabem à ONG aprovar antes de eu executar.

## Stack

HTML estático, CSS puro (sem framework), JavaScript vanilla modular. Sem build step, sem dependências de terceiros além do widget behold.so (Instagram) e Google Fonts.

## Como rodar localmente

```bash
git clone https://github.com/allanlauzid/site-instituto-aria.git
cd site-instituto-aria
```

Windows: execute `servidor-local.bat`. Qualquer sistema: sirva a pasta com um servidor estático simples, por exemplo `python -m http.server`, e abra `index.html`.

## Roadmap de performance (planejado, ainda não executado)

Prompt e estimativas completas em [`OTIMIZACAO-PERFORMANCE.md`](./OTIMIZACAO-PERFORMANCE.md). Resumo das frentes:

1. Compressão e conversão de imagens para AVIF com fallback WebP, com `srcset`/`sizes` responsivo.
2. Minificação e concatenação de CSS/JS, com `defer`/`async` onde aplicável.
3. Redução de pesos/variações de fontes carregadas do Google Fonts, com `font-display: swap`.
4. Revisão de todo `setInterval`/`requestAnimationFrame`/observer para pausar fora da viewport.
5. Compressão Gzip/Brotli e cache de assets estáticos no servidor final.

Estimativa combinada de redução de peso total: 45% a 65%, com a compressão de imagens respondendo pela maior parte do ganho.

## Roadmap de QA (o que falta validar antes de considerar o projeto pronto)

Reestruturar sem quebrar nada visualmente é a primeira validação, não a última. Ainda faltam:

- **Auditoria Lighthouse** antes e depois de cada otimização de performance, com métricas reais de peso de página e LCP.
- **Teste cross-browser**, com atenção especial ao jardim de plantas (drag, SVG gerado dinamicamente) e ao carrossel do hero, pontos com maior risco de comportamento inconsistente entre navegadores.
- **Teste de responsividade** em dispositivos reais, não só em emulação de DevTools.
- **Validação funcional dos formulários** (contato, inscrição de voluntário, questionário multi-step) após a separação em páginas, já que fluxos com estado são os mais propensos a quebrar numa reestruturação como essa.
- **Comparação visual página a página** contra o site original, para confirmar que a fidelidade declarada no README técnico se sustenta na prática.
- **Checagem de acessibilidade** (contraste, navegação por teclado, leitura por screen reader) como próxima etapa aditiva, sob aprovação da ONG.

Nenhum desses itens está marcado como concluído até ter evidência (relatório de auditoria, captura de teste, ou registro equivalente) anexada a este repositório.

## Repositórios

- Este repositório (processo técnico completo): [`allanlauzid/site-instituto-aria`](https://github.com/allanlauzid/site-instituto-aria)
- Repositório oficial da ONG, vinculado ao site em produção: [`institutoariaong/website_instituto_aria`](https://github.com/institutoariaong/website_instituto_aria)

## O que este projeto demonstra

Separar estrutura de comportamento sem alterar aparência exige mais disciplina do que construir do zero. As decisões documentadas aqui, principalmente o que ficou de fora de propósito e o que ainda falta testar, fazem parte do trabalho tanto quanto o código em si.
