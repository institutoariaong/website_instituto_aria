/* ═══════════════════════════════════════════════════════════════════════════
   NAVEGAÇÃO CLIENT-SIDE "ESTILO SPA" — Instituto ARIA
   ---------------------------------------------------------------------------
   Mantém os 11 arquivos .html separados, mas troca apenas o miolo
   (<div class="page active">) via fetch + DOMParser, fazendo crossfade real
   de conteúdo. O cabeçalho, nav, rodapé, modais, selo Kupim e a vinha ficam
   parados (estão FORA do .page). Fallback seguro pro reload normal quando
   fetch/DOMParser faltam, ou quando a requisição falha (rede/CORS/file://).

   Deve ser incluído DEPOIS de core.js, plants.js, features.js e vine.js.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // Evita registrar o listener duas vezes se o script rodar mais de uma vez.
  if (window.__ariaSpaInit) return;
  window.__ariaSpaInit = true;

  var SUPPORTED = ('fetch' in window) &&
                  ('DOMParser' in window) &&
                  !!(window.history && history.pushState);

  var FADE_MS       = 320;   // ~mesmo timing do fade antigo do body (PAGE_FADE_MS)
  var FETCH_TIMEOUT = 4000;  // 4s → cai no reload normal
  var isSwapping    = false;

  /* ─── Fallback: reload real do navegador (com o fade rosa do body) ─── */
  function hardNav(url) {
    if (typeof window.navigateWithFade === 'function') { window.navigateWithFade(url); }
    else { window.location.href = url; }
  }

  /* ─── Deve interceptar este link? (mesma regra do listener antigo) ─── */
  function shouldIntercept(a, href) {
    if (!href || href.charAt(0) === '#') return false;
    if (a.target && a.target !== '_self') return false;
    if (a.hasAttribute('download')) return false;
    if (/^(mailto:|tel:|https?:\/\/|whatsapp:)/i.test(href)) return false;
    // .html mesmo com querystring/hash (ex.: "produtos.html?x#y")
    var path = href.split('#')[0].split('?')[0];
    if (!path.toLowerCase().endsWith('.html')) return false;
    return true;
  }

  /* ─── fetch com timeout → Document parseado ─── */
  function fetchDocument(url) {
    var controller = ('AbortController' in window) ? new AbortController() : null;
    var timer = setTimeout(function () { if (controller) controller.abort(); }, FETCH_TIMEOUT);
    var opts = controller ? { signal: controller.signal, credentials: 'same-origin' }
                          : { credentials: 'same-origin' };
    return fetch(url, opts).then(function (res) {
      clearTimeout(timer);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    }, function (err) {
      clearTimeout(timer);
      throw err;
    }).then(function (text) {
      return new DOMParser().parseFromString(text, 'text/html');
    });
  }

  /* ─── Chama os hooks de reinicialização dos módulos, na ordem certa ─── */
  function runReinit(dataPage) {
    // 1) core: active-link (usa data-page, já setado), sticky-nav, fade-up,
    //    counters, carrossel do hero.
    try { if (window.ARIA_reinitCore) window.ARIA_reinitCore(); } catch (e) {}
    // 2) plants: replanta o jardim do .page recém-inserido (CSS injetado uma vez).
    try { if (window.ARIA_reinitPlants) window.ARIA_reinitPlants(); } catch (e) {}
    // 3) features: re-renderiza o calendário de projetos, se presente.
    try { if (window.ARIA_reinitFeatures) window.ARIA_reinitFeatures(); } catch (e) {}
    // 4) avisa quem escuta (ex.: vine.js recalcula hideForPage).
    try {
      document.dispatchEvent(new CustomEvent('aria:navigated', { detail: { page: dataPage } }));
    } catch (e) {
      // CustomEvent legado
      try {
        var ev = document.createEvent('CustomEvent');
        ev.initCustomEvent('aria:navigated', false, false, { page: dataPage });
        document.dispatchEvent(ev);
      } catch (e2) {}
    }
  }

  /* ─── Troca o .page atual pelo novo, com crossfade ─── */
  function swap(newDoc, href) {
    var oldPage = document.querySelector('.page');
    var newPage = newDoc.querySelector('.page');
    if (!oldPage || !newPage) { hardNav(href); return; }

    var parent = oldPage.parentNode;

    // ── Atualiza <head> ──
    if (newDoc.title) document.title = newDoc.title;
    var newDesc = newDoc.querySelector('meta[name="description"]');
    var curDesc = document.querySelector('meta[name="description"]');
    if (newDesc && curDesc) curDesc.setAttribute('content', newDesc.getAttribute('content') || '');

    var newDataPage = newDoc.body ? newDoc.body.getAttribute('data-page') : null;

    // ── Fade-out do conteúdo antigo ──
    oldPage.style.transition = 'opacity ' + FADE_MS + 'ms ease';
    oldPage.style.opacity = '0';
    oldPage.style.pointerEvents = 'none';

    setTimeout(function () {
      // Limpa timers/observers presos ao .page antigo antes de descartá-lo.
      try { if (window.ARIA_teardownCore) window.ARIA_teardownCore(); } catch (e) {}

      // Importa o novo nó pro document atual e insere no mesmo lugar.
      var imported = document.importNode(newPage, true);
      imported.style.opacity = '0';
      imported.style.transition = 'none';
      parent.replaceChild(imported, oldPage);

      // Atualiza data-page ANTES do reinit (updateActiveLink depende dele).
      if (newDataPage) document.body.setAttribute('data-page', newDataPage);

      // Sobe pro topo sem scroll suave.
      window.scrollTo(0, 0);

      // Força reflow com opacidade 0 aplicada.
      void imported.offsetWidth;

      // Reinicializa as funcionalidades da nova página.
      runReinit(newDataPage);

      // Fade-in do conteúdo novo.
      imported.style.transition = 'opacity ' + FADE_MS + 'ms ease';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { imported.style.opacity = '1'; });
      });

      // Limpa estilos inline após o fade.
      setTimeout(function () {
        imported.style.transition = '';
        imported.style.opacity = '';
        isSwapping = false;
      }, FADE_MS + 60);
    }, FADE_MS);
  }

  /* ─── Ponto de entrada da navegação SPA ─── */
  function navigate(href, isPop) {
    if (!SUPPORTED) { hardNav(href); return; }
    if (isSwapping) return;
    isSwapping = true;

    fetchDocument(href).then(function (doc) {
      // Só empurra no histórico em navegação "pra frente" (não no popstate).
      if (!isPop) {
        try { history.pushState({ ariaSpa: 1 }, '', href); } catch (e) {}
      }
      swap(doc, href);
    }).catch(function () {
      isSwapping = false;
      hardNav(href); // rede/CORS/file:// → reload normal, sem quebrar nada.
    });
  }

  // Exposto pra showPage() (core.js) e pra vine.js reutilizarem.
  window.ARIA_navigate = navigate;

  /* ─── Interceptação de cliques em links internos .html ─── */
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href');
    if (!shouldIntercept(a, href)) return;
    // Sem suporte a SPA: NÃO faz preventDefault — deixa o <a> navegar normal
    // (site continua funcional sem JS / em navegadores antigos / crawlers).
    if (!SUPPORTED) return;
    e.preventDefault();
    navigate(href, false);
  });

  /* ─── Botão voltar/avançar do navegador ─── */
  window.addEventListener('popstate', function () {
    if (!SUPPORTED) return;
    // Refaz o fetch+swap pro caminho atual, SEM novo pushState.
    navigate(location.pathname + location.search, true);
  });

  /* ─── Garante um state inicial pra primeira entrada (histórico limpo) ─── */
  if (SUPPORTED) {
    try {
      if (!history.state || !history.state.ariaSpa) {
        history.replaceState({ ariaSpa: 1 }, '', location.href);
      }
    } catch (e) {}
  }
})();
