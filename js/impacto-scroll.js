/* ═══ IMPACTO — carrossel coverflow (depoimentos + casos de resgate) ═══
   Card central em destaque, laterais parcialmente visíveis à esquerda e
   à direita, com profundidade 3D real (perspective + translateZ, SEM
   rotação — assim as fotos ficam sempre retas/recortadas, sem "angular").
   Clique num card lateral, setas, teclado (← →) ou gesto de arrastar no
   celular giram o carrossel. Só o card central expande.

   O site troca de página em "estilo SPA" (fetch + DOMParser, ver
   js/spa-nav.js), então este script roda de novo toda vez que a página
   Impacto é (re)inserida no DOM — não só na primeira carga. Por isso
   tudo fica dentro de initAll(), chamado no load e no evento
   'aria:navigated' disparado pelo spa-nav.js. */
(function () {
  var cleanupFns = [];

  function initCoverflow(stage) {
    var cards = Array.prototype.slice.call(stage.querySelectorAll('.carousel-card'));
    if (!cards.length) return null;

    var wrap = stage.closest('.carousel-wrap') || stage;
    var active = 0;

    // Mede a altura FINAL do card ativo (mesmo com painéis expandidos cuja
    // altura está no meio de uma transição CSS) clonando-o fora da tela sem
    // transições — assim o palco nunca "corta" o conteúdo enquanto ele anima.
    function updateHeight() {
      var card = cards[active];
      var clone = card.cloneNode(true);
      clone.style.position = 'absolute';
      clone.style.visibility = 'hidden';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.transform = 'none';
      clone.style.transition = 'none';
      clone.style.width = card.offsetWidth + 'px';
      document.body.appendChild(clone);
      var h = clone.offsetHeight;
      document.body.removeChild(clone);
      if (h) stage.style.height = h + 'px';
    }

    // instant = true → aplica a posição sem animar (usado na carga inicial
    // e no resize, pra não fazer o carrossel "deslizar" sozinho ao abrir a página).
    function layout(instant) {
      var stageW = stage.clientWidth;
      var cardW = cards[0].offsetWidth || 260;
      var spacing = Math.min(cardW * 0.62, stageW / 2.3);

      cards.forEach(function (card, i) {
        var offset = i - active;
        var abs = Math.abs(offset);
        var x = offset * spacing;
        var scale = abs === 0 ? 1 : abs === 1 ? 0.82 : 0.68;
        var opacity = abs === 0 ? 1 : abs === 1 ? 0.75 : abs === 2 ? 0.4 : 0;
        var isActive = i === active;

        // Profundidade 3D: só recuo no eixo Z (sem rotateY), então o card
        // fica menor/mais distante mas continua "de frente" — sem distorcer a foto.
        var z = -abs * 130;

        if (instant) card.style.transition = 'none';
        card.style.transform = 'translateX(-50%) translateX(' + x + 'px) translateZ(' + z + 'px) scale(' + scale + ')';
        card.style.opacity = String(opacity);
        card.style.zIndex = String(100 - abs);
        card.style.pointerEvents = abs <= 2 ? 'auto' : 'none';
        card.classList.toggle('is-active', isActive);
        card.setAttribute('aria-hidden', String(!isActive));
        card.setAttribute('tabindex', isActive ? '0' : '-1');

        var innerBtn = card.querySelector('.carousel-expand-btn');
        if (innerBtn) innerBtn.setAttribute('tabindex', isActive ? '0' : '-1');

        if (!isActive) {
          card.classList.remove('expanded');
          if (innerBtn) innerBtn.setAttribute('aria-expanded', 'false');
        }
      });

      if (instant) {
        // Força o navegador a "commitar" o transition:none antes de tirá-lo,
        // senão o próximo clique também sairia sem animação.
        void stage.offsetHeight;
        window.requestAnimationFrame(function () {
          cards.forEach(function (card) { card.style.transition = ''; });
        });
      }

      updateHeight();
    }

    function setActive(index) {
      if (index < 0 || index >= cards.length || index === active) return;
      active = index;
      layout(false);
      cards[active].focus({ preventScroll: true });
    }

    // ── Clique: lateral gira até o centro; central deixa passar (botão) ────
    function onStageClick(e) {
      var card = e.target.closest('.carousel-card');
      if (!card) return;
      var idx = cards.indexOf(card);
      if (idx !== active) {
        e.preventDefault();
        e.stopPropagation();
        setActive(idx);
      }
    }
    stage.addEventListener('click', onStageClick, true);

    // ── Teclado: setas movem o carrossel a partir de QUALQUER ponto do
    //    componente (palco, card ativo ou botões de seta) ─────────────────
    stage.setAttribute('tabindex', '0');
    stage.setAttribute('role', 'region');
    function onKeydown(e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); setActive(active + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); setActive(active - 1); }
      else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
      else if (e.key === 'End') { e.preventDefault(); setActive(cards.length - 1); }
    }
    wrap.addEventListener('keydown', onKeydown);

    // ── Gesto de arrastar (mobile/touch) ─────────────────────────────────
    var touchX = 0, touchY = 0, touching = false;
    function onTouchStart(e) {
      var t = e.touches[0];
      touchX = t.clientX; touchY = t.clientY; touching = true;
    }
    function onTouchEnd(e) {
      if (!touching) return;
      touching = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - touchX;
      var dy = t.clientY - touchY;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) setActive(active + 1); else setActive(active - 1);
    }
    stage.addEventListener('touchstart', onTouchStart, { passive: true });
    stage.addEventListener('touchend', onTouchEnd, { passive: true });

    function onResize() { layout(true); }
    window.addEventListener('resize', onResize, { passive: true });
    layout(true); // posição inicial sem animação

    return {
      next: function () { setActive(active + 1); },
      prev: function () { setActive(active - 1); },
      updateHeight: updateHeight,
      destroy: function () {
        window.removeEventListener('resize', onResize);
        stage.removeEventListener('click', onStageClick, true);
        wrap.removeEventListener('keydown', onKeydown);
        stage.removeEventListener('touchstart', onTouchStart);
        stage.removeEventListener('touchend', onTouchEnd);
      }
    };
  }

  // ── Painel "Ver jornada" de cada card de resgate: adiciona uma prévia
  //    grande, escondida por padrão, que expande ao clicar numa miniatura. ──
  function setupMiniTimeline(panel) {
    var timeline = panel.querySelector('.rescue-mini-timeline');
    if (!timeline || panel.dataset.miniPreviewReady) return null;
    panel.dataset.miniPreviewReady = '1';

    var preview = document.createElement('div');
    preview.className = 'rescue-mini-preview';
    preview.innerHTML =
      '<div class="rescue-mini-preview-inner"><img alt=""/></div>' +
      '<span class="rescue-mini-preview-label"></span>';
    panel.appendChild(preview);
    var previewImg = preview.querySelector('img');
    var previewLabel = preview.querySelector('.rescue-mini-preview-label');

    var items = Array.prototype.slice.call(timeline.children);
    var selected = null;

    function closePreview() {
      preview.classList.remove('is-open');
      if (selected) selected.classList.remove('is-selected');
      selected = null;
    }

    var handlers = items.map(function (item) {
      var img = item.querySelector('img');
      var label = item.querySelector('span');
      function handler() {
        if (selected === item) { closePreview(); return; }
        if (selected) selected.classList.remove('is-selected');
        selected = item;
        item.classList.add('is-selected');
        previewImg.src = img.src;
        previewImg.alt = img.alt;
        previewLabel.textContent = label ? label.textContent : '';
        preview.classList.add('is-open');
      }
      item.addEventListener('click', handler);
      return { item: item, handler: handler };
    });

    return {
      reset: closePreview,
      destroy: function () {
        handlers.forEach(function (h) { h.item.removeEventListener('click', h.handler); });
      }
    };
  }

  function initAll() {
    // Desliga tudo que ficou de uma renderização anterior da página (SPA nav)
    // antes de religar nos elementos novos, evitando listeners duplicados/presos.
    cleanupFns.forEach(function (fn) { try { fn(); } catch (e) {} });
    cleanupFns = [];

    var instances = {};
    document.querySelectorAll('.coverflow-stage').forEach(function (stage) {
      var inst = initCoverflow(stage);
      if (inst) {
        instances[stage.id] = inst;
        cleanupFns.push(inst.destroy);
      }
    });
    if (!Object.keys(instances).length) return;

    document.querySelectorAll('.carousel-nav').forEach(function (btn) {
      var handler = function () {
        var inst = instances[btn.getAttribute('data-target')];
        if (!inst) return;
        if (btn.classList.contains('prev')) inst.prev(); else inst.next();
      };
      btn.addEventListener('click', handler);
      cleanupFns.push(function () { btn.removeEventListener('click', handler); });
    });

    // ── Expandir/recolher conteúdo do card central (sem modal) ────────────
    document.querySelectorAll('.carousel-expand-btn').forEach(function (btn) {
      var card = btn.closest('.carousel-card');
      var panel = card ? card.querySelector('.carousel-expand-panel') : null;
      var stage = card ? card.closest('.coverflow-stage') : null;
      if (!panel) return;

      var miniCtrl = setupMiniTimeline(panel);
      if (miniCtrl) cleanupFns.push(miniCtrl.destroy);

      var labelClosed = btn.textContent;
      var labelOpen = panel.querySelector('.rescue-mini-timeline') ? 'Fechar jornada' : 'Fechar depoimento';

      function closeCard() {
        if (!card.classList.contains('expanded')) return;
        card.classList.remove('expanded');
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = labelClosed;
        if (miniCtrl) miniCtrl.reset();
        var inst = stage && instances[stage.id];
        if (inst) inst.updateHeight();
      }

      // Exposto no elemento para o listener global de "clique fora fecha".
      card._closeExpand = closeCard;

      var handler = function (e) {
        if (!card.classList.contains('is-active')) return; // só o central expande
        e.stopPropagation();
        if (card.classList.contains('expanded')) {
          closeCard();
        } else {
          card.classList.add('expanded');
          btn.setAttribute('aria-expanded', 'true');
          btn.textContent = labelOpen;
          var inst = stage && instances[stage.id];
          if (inst) inst.updateHeight();
        }
      };
      btn.addEventListener('click', handler);
      cleanupFns.push(function () {
        btn.removeEventListener('click', handler);
        delete card._closeExpand;
      });
    });

    // Miniatura clicada também deve reajustar a altura do palco (a prévia
    // grande cresce o card).
    document.querySelectorAll('.rescue-mini-timeline').forEach(function (timeline) {
      var stage = timeline.closest('.coverflow-stage');
      var inst = stage && instances[stage.id];
      if (!inst) return;
      var handler = function () { inst.updateHeight(); };
      timeline.addEventListener('click', handler);
      cleanupFns.push(function () { timeline.removeEventListener('click', handler); });
    });

    // ── Clicar fora do card fecha a jornada/depoimento aberto ───────────────
    function onDocumentClick(e) {
      document.querySelectorAll('.carousel-card.expanded').forEach(function (card) {
        if (!card.contains(e.target) && typeof card._closeExpand === 'function') {
          card._closeExpand();
        }
      });
    }
    document.addEventListener('click', onDocumentClick);
    cleanupFns.push(function () { document.removeEventListener('click', onDocumentClick); });
  }

  initAll();
  document.addEventListener('aria:navigated', initAll);
})();
