# Reestruturar um site sem quebrar nada: o port fiel do Instituto ARIA

Peguei um projeto real para colocar em prática algo que puxa mais disciplina do que criatividade: reestruturar um site inteiro sem mudar absolutamente nada do que já funcionava.

O Instituto ARIA é uma ONG e o site original era uma única página HTML gigante, com tudo dentro dela: navegação simulada por JavaScript (`showPage()`), carrossel do hero, jardim de plantas animado com drag e sway, calendário de projetos, questionário de voluntariado em múltiplas etapas, widget do Instagram, barra de doação, cookie banner. Tudo funcionando, tudo visualmente aprovado pela equipe da ONG. O problema era estrutural, não visual.

Minha tarefa foi separar isso em páginas reais (`index.html`, `quem-somos.html`, `projetos.html`, `voluntarios.html` e por aí vai), sem redesenhar, sem simplificar, sem "melhorar" nada pelo caminho. Isso tem um nome técnico: port, não redesign. E é mais difícil do que parece, porque a tentação de mexer no que você está lendo é constante.

## A regra que guiou o trabalho

Toda mudança precisava ser aditiva ou estrutural, nunca visual. Na prática:

CSS foi dividido em três arquivos mantendo a cascata original intacta. JavaScript foi separado em módulos por responsabilidade, mas na mesma ordem de carregamento do arquivo único. As quatro fontes originais, os hotlinks de imagem, o widget do Instagram, cada elemento decorativo, tudo copiado exatamente como estava.

A única mudança funcional real foi trocar `onclick="showPage('x')"` por `href="pagina.html"`, e reescrever `showPage()` para navegar de verdade entre páginas em vez de simular navegação dentro de uma SPA. O efeito colateral que a função antiga tinha (scroll ao topo, marcar item ativo no menu, animações de fade-up) foi replicado a cada carregamento de página, lendo um atributo `data-page` no `<body>`.

Documentei tudo isso num README técnico dentro do repositório: o que foi preservado, o que mudou, e principalmente o que eu decidi *não* fazer nessa etapa (trocar os hotlinks de imagem por fotos definitivas, reorganizar a pasta de assets, otimizações de acessibilidade) porque são decisões que cabem à ONG aprovar, não a mim tomar sozinho.

## Onde entra o QA que ainda falta

Terminar o port não é terminar o trabalho. Já tenho um plano de otimização de performance escrito e pronto para execução (compressão e conversão de imagens para AVIF/WebP, minificação e concatenação de CSS/JS, revisão de fontes carregadas, pausar animações fora da viewport), mas isso é só metade da validação que um site como esse precisa antes de eu chamar de pronto.

O que ainda está na minha lista de testes:

Auditoria Lighthouse antes e depois de cada otimização, com números reais de peso de página e LCP, não estimativa. Teste cross-browser, porque o jardim de plantas usa drag e SVG gerado dinamicamente, e isso é exatamente o tipo de coisa que se comporta diferente entre navegadores. Teste de responsividade em telas reais, não só no inspector do DevTools. Validação funcional de cada formulário (contato, inscrição de voluntário, questionário multi-step) depois da reestruturação, porque separar em páginas é o tipo de mudança que quebra fluxos state-dependent se você não prestar atenção. E uma comparação visual página a página contra o site original, pra garantir que "porte fiel" não virou só uma frase bonita no README.

Nenhum desses itens é opcional. Prefiro documentar o que falta testar publicamente do que apresentar um "site pronto" que ainda não passou por rigor nenhum.

## Por que estou escrevendo isso

Porque a parte visível de um projeto (o antes e depois de um site) conta uma fração pequena da história. A parte que mostra como alguém trabalha está nas decisões de não mexer no que não pediram, documentar o que ficou de fora de propósito, e ter um roteiro de validação antes de declarar vitória.

O código está em dois repositórios: o meu, onde documento o processo técnico completo, e o da própria ONG, vinculado ao site oficial do Instituto ARIA.

Se você quiser ver o README técnico completo ou acompanhar os testes conforme forem saindo, o link está nos comentários.

Já passou por um projeto onde a parte mais difícil não foi construir, e sim não estragar o que já existia?

#EngenhariaDeSoftware #QA #Performance #DesenvolvimentoWeb #Frontend #ImpactoSocial #Tecnologia
