/* ═══ JARDIM ANIMADO — do cabeçalho ao rodapé · 3 a 5 por página · distribuição zonada ═══ */
(function () {

  // ── CSS dinâmico para drag ─────────────────────────────────────────────────
  var _s = document.createElement('style');
  _s.textContent =
    '.plant-point { cursor: grab; }' +
    '.plant-point.dragging { cursor: grabbing !important; z-index: 97;' +
    '  user-select: none; -webkit-user-select: none; }' +
    '.plant-point.dragging .plant-slot { opacity: 0.82;' +
    '  filter: drop-shadow(0 6px 18px rgba(90,52,71,.38)); }';
  document.head.appendChild(_s);

  // ── PRNG seedado (mulberry32) ──────────────────────────────────────────────
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // seed muda a cada 20 minutos
  function getTimeSeed() {
    return Math.floor(Date.now() / (1000 * 60 * 20));
  }

  var TOTAL_PLANTS    = 49;
  var WIDE_PLANTS     = [2, 4, 11, 12, 13, 20, 22]; // plantas com pata de pet / flores espremidas — slot mais largo
  var MIN_PLANTS      = 3;   // mínimo de plantas por página (cabeçalho → rodapé)
  var MAX_PLANTS      = 5;   // máximo de plantas por página

  // ── Âncoras de posicionamento seguro (Zonas Permitidas) ───────────────────
  var W = [65, 30, 5]; // pesos para 3, 4 e 5 plantas — maioria com 3 (menos concentração)
  var W_CUM = (function () {
    var c = [], s = 0;
    W.forEach(function (w) { s += w; c.push(s); });
    return c;
  })();
  var W_TOT = W_CUM[W_CUM.length - 1];

  function skewedCount(rand) {
    var r = rand() * W_TOT;
    for (var i = 0; i < W_CUM.length; i++) {
      if (r < W_CUM[i]) return MIN_PLANTS + i;
    }
    return MAX_PLANTS;
  }

  // ── Observer global ───────────────────────────────────────────────────────
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var svg = entry.target._plantSvg;
        if (svg) svg.classList.add('born');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });

  // ── Click & Hold para arrastar · click simples dispara shake ─────────────
  function makeDraggable(anchor, slot, svg, zone) {

    function startDrag(startX, startY) {
      var isDrag = false;
      // Captura posição inicial do anchor no viewport
      var initRect = anchor.getBoundingClientRect();
      var fixedLeft = initRect.left;
      var fixedTop  = initRect.top;

      function move(cx, cy) {
        var dx = cx - startX;
        var dy = cy - startY;
        if (!isDrag && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
          isDrag = true;
          anchor.classList.add('dragging');
          // Eleva para o body com position:fixed, posicionado no viewport
          anchor.style.position = 'fixed';
          anchor.style.left     = fixedLeft + 'px';
          anchor.style.top      = fixedTop  + 'px';
          anchor.style.zIndex   = '9998';
          anchor.style.width    = '';
          anchor.style.margin   = '0';
          document.body.appendChild(anchor);
        }
        if (!isDrag) return;
        anchor.style.left = (fixedLeft + dx) + 'px';
        anchor.style.top  = (fixedTop  + dy) + 'px';
      }

      function end() {
        document.removeEventListener('mousemove', onMM);
        document.removeEventListener('mouseup',   onMU);
        document.removeEventListener('touchmove', onTM);
        document.removeEventListener('touchend',  onTE);
        anchor.classList.remove('dragging');
        if (!isDrag) {
          // Click simples → animação shake
          svg.classList.remove('clicked');
          void svg.offsetWidth;
          svg.classList.add('clicked');
        } else {
          // Converte de fixed → absolute em body (planta fica no lugar do drop)
          var finalLeft = parseFloat(anchor.style.left) + window.scrollX;
          var finalTop  = parseFloat(anchor.style.top)  + window.scrollY;
          anchor.style.position = 'absolute';
          anchor.style.left     = finalLeft + 'px';
          anchor.style.top      = finalTop  + 'px';
          anchor.style.zIndex   = '9997';
          // Remove ghost se estava fantasmado — usuário decidiu onde quer
          anchor.classList.remove('ghost');
        }
      }

      function onMM(e) { move(e.clientX, e.clientY); }
      function onMU()  { end(); }
      function onTM(e) { var t = e.touches[0]; move(t.clientX, t.clientY); if (isDrag) e.preventDefault(); }
      function onTE()  { end(); }

      document.addEventListener('mousemove', onMM);
      document.addEventListener('mouseup',   onMU);
      document.addEventListener('touchmove', onTM, { passive: false });
      document.addEventListener('touchend',  onTE);
    }

    slot.addEventListener('mousedown',  function (e) {
      e.preventDefault();
      startDrag(e.clientX, e.clientY);
    });
    slot.addEventListener('touchstart', function (e) {
      var t = e.touches[0];
      startDrag(t.clientX, t.clientY);
    }, { passive: true });
  }

  // ── Planta uma flor numa zona, numa posição pré-aprovada (âncora) ─────────
  function plantAt(zoneEl, xPct, yPct, plantId, allowDrag, eligibleForGiant, isGhost) {
    var symbol = document.getElementById('plant-' + plantId);
    if (!symbol) return;

    var anchor = document.createElement('div');
    anchor.className = 'plant-point' + (allowDrag ? '' : ' deco') + (isGhost ? ' ghost' : '');
    anchor.style.left = xPct;
    anchor.style.top  = yPct;

    var slot = document.createElement('div');
    slot.className = 'plant-slot' + (WIDE_PLANTS.indexOf(plantId) !== -1 ? ' wide' : '');

    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.classList.add('plant-graphic');
    svg.style.setProperty('--sway-dur',   (3.2 + Math.random() * 2.2).toFixed(2) + 's');
    svg.style.setProperty('--sway-delay', (Math.random() * 2).toFixed(2) + 's');
    svg.style.setProperty('--size-scale', (1.0 + Math.random() * 0.25).toFixed(2)); // original até 25% maior
    svg.setAttribute('viewBox', symbol.getAttribute('viewBox'));

    var use = document.createElementNS(svgNS, 'use');
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#plant-' + plantId);
    svg.appendChild(use);
    slot.appendChild(svg);
    anchor.appendChild(slot);
    zoneEl.appendChild(anchor);

    anchor._plantSvg = svg;
    observer.observe(anchor);

    // Sorteio global de plantas "gigantes" — só entre as elegíveis
    // (jardim normal das páginas), nunca nav/rodapé/sway-slow.
    if (eligibleForGiant) considerForGiant(svg);

    if (allowDrag) makeDraggable(anchor, slot, svg, zoneEl);
  }

  // ── Âncoras de posicionamento seguro (Zonas Permitidas) ───────────────────
    // Em vez de sortear aleatoriamente e calcular colisão com texto, usamos
    // posições pré-aprovadas (âncoras) baseadas na geometria do layout.
    // As laterais usam calc(50% ± 620px) para ficarem exatamente nas margens
    // em telas grandes, e naturalmente fora da tela em telas pequenas.
    var ANCHOR_POOL_DESKTOP = [
      // ── Margens laterais (12) — fora do container · opacidade 1 ──
      { x: 'calc(50% - 620px)', y: '15%', textSafe: true },
      { x: 'calc(50% - 620px)', y: '30%', textSafe: true },
      { x: 'calc(50% - 620px)', y: '45%', textSafe: true },
      { x: 'calc(50% - 620px)', y: '60%', textSafe: true },
      { x: 'calc(50% - 620px)', y: '75%', textSafe: true },
      { x: 'calc(50% - 620px)', y: '88%', textSafe: true },
      { x: 'calc(50% + 620px)', y: '15%', textSafe: true },
      { x: 'calc(50% + 620px)', y: '30%', textSafe: true },
      { x: 'calc(50% + 620px)', y: '45%', textSafe: true },
      { x: 'calc(50% + 620px)', y: '60%', textSafe: true },
      { x: 'calc(50% + 620px)', y: '75%', textSafe: true },
      { x: 'calc(50% + 620px)', y: '88%', textSafe: true },
      // ── Interior (12) — sobre conteúdo · ghost 60% transparente ──
      { x: '22%', y: '20%', textSafe: false },
      { x: '22%', y: '50%', textSafe: false },
      { x: '22%', y: '80%', textSafe: false },
      { x: '38%', y: '20%', textSafe: false },
      { x: '38%', y: '50%', textSafe: false },
      { x: '38%', y: '80%', textSafe: false },
      { x: '62%', y: '20%', textSafe: false },
      { x: '62%', y: '50%', textSafe: false },
      { x: '62%', y: '80%', textSafe: false },
      { x: '78%', y: '20%', textSafe: false },
      { x: '78%', y: '50%', textSafe: false },
      { x: '78%', y: '80%', textSafe: false },
    ];

    // Mobile: 4 posições por lado com opacidade 1 (padding das seções) +
    // 8 posições interiores ghost (60% transparente)
    var ANCHOR_POOL_MOBILE = [
      // ── Laterais (8) — dentro do padding superior e inferior · opacidade 1 ──
      { x: '5%',  y: '4%',  textSafe: true },
      { x: '5%',  y: '11%', textSafe: true },
      { x: '5%',  y: '88%', textSafe: true },
      { x: '5%',  y: '94%', textSafe: true },
      { x: '94%', y: '4%',  textSafe: true },
      { x: '94%', y: '11%', textSafe: true },
      { x: '94%', y: '88%', textSafe: true },
      { x: '94%', y: '94%', textSafe: true },
      // ── Interior (8) — sobre conteúdo · ghost 60% transparente ──
      { x: '25%', y: '20%', textSafe: false },
      { x: '25%', y: '55%', textSafe: false },
      { x: '25%', y: '78%', textSafe: false },
      { x: '50%', y: '30%', textSafe: false },
      { x: '50%', y: '65%', textSafe: false },
      { x: '75%', y: '20%', textSafe: false },
      { x: '75%', y: '55%', textSafe: false },
      { x: '75%', y: '78%', textSafe: false },
    ];

    // ── Gera plantas para um conjunto de zonas usando apenas âncoras ──────────
    function buildGarden(zones, rand, opts) {
      zones = Array.prototype.filter.call(zones, function (z) { return !!z; });
      if (!zones.length) return;
      opts = opts || {};
      var allowDrag      = opts.allowDrag !== false;
      var eligibleForGiant = !!opts.eligibleForGiant;

      var isMobile = window.innerWidth < 1100;
      var pool = isMobile ? ANCHOR_POOL_MOBILE : ANCHOR_POOL_DESKTOP;
      var heroContent = document.querySelector('.hero-body > .container');
      var heroIsLifted = heroContent && getComputedStyle(heroContent).transform !== 'none';
      var heroLift = window.innerWidth >= 769 && heroIsLifted
        ? parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hero-content-lift')) || 0
        : 0;

      // Separa pool em lateral (opacidade 1) e interior (ghost)
      var lateralPts = [];
      var interiorPts = [];
      zones.forEach(function (zoneEl) {
        pool.forEach(function (anchor) {
          var y = heroLift && zoneEl.classList.contains('hero-section')
            ? 'calc(' + anchor.y + ' - ' + heroLift + 'px)'
            : anchor.y;
          var pt = { zone: zoneEl, x: anchor.x, y: y, textSafe: anchor.textSafe !== false };
          if (pt.textSafe) lateralPts.push(pt);
          else             interiorPts.push(pt);
        });
      });

      // Contagens separadas por lado/interior; ajustadas por dispositivo
      var minLat = isMobile ? 3 : 4;
      var maxLat = isMobile ? 5 : 6;
      var minInt = isMobile ? 2 : 4;
      var maxInt = isMobile ? 4 : 6;

      function pickFrom(pool, minC, maxC) {
        var count = minC + Math.floor(rand() * (maxC - minC + 1));
        count = Math.min(count, pool.length);
        var shuffled = pool.slice().sort(function () { return rand() - 0.5; });
        return shuffled.slice(0, count);
      }

      var active = pickFrom(lateralPts, minLat, maxLat).concat(pickFrom(interiorPts, minInt, maxInt));

      // ── Distância mínima entre plantas e margens ──────────────────────────────
      var MIN_PLANT_DIST = 90;   // px entre centros de quaisquer duas plantas
      var MARGIN_ZONE_V  = 40;   // px mínimos do topo/base de cada zone
      var MARGIN_ZONE_H  = 20;   // px mínimos das bordas esq/dir de cada zone (só desktop)

      // Resolve âncora percentual/calc para coordenadas absolutas de página
      function resolveAbsPos(zoneEl, xVal, yVal) {
        var probe = document.createElement('div');
        probe.style.cssText = 'position:absolute;left:' + xVal + ';top:' + yVal +
          ';width:1px;height:1px;visibility:hidden;pointer-events:none;z-index:-1;';
        zoneEl.appendChild(probe);
        var pRect = probe.getBoundingClientRect();
        var zRect = zoneEl.getBoundingClientRect();
        zoneEl.removeChild(probe);
        return {
          absX: pRect.left + window.scrollX,
          absY: pRect.top  + window.scrollY,
          relX: pRect.left - zRect.left,
          relY: pRect.top  - zRect.top,
          zoneH: zRect.height,
          zoneW: zRect.width
        };
      }

      var placed  = [];   // {x, y} absolutas das plantas já aceites
      var toPlace = [];   // pontos que passaram nos filtros

      active.forEach(function (point) {
        var pos = resolveAbsPos(point.zone, point.x, point.y);

        // Margem do topo e base da zone (sempre)
        if (pos.relY < MARGIN_ZONE_V || pos.relY > pos.zoneH - MARGIN_ZONE_V) return;

        // Margem das bordas esq/dir da zone (só desktop)
        if (!isMobile) {
          if (pos.relX < MARGIN_ZONE_H || pos.relX > pos.zoneW - MARGIN_ZONE_H) return;
        }

        // Distância mínima entre plantas
        for (var _i = 0; _i < placed.length; _i++) {
          var _dx = pos.absX - placed[_i].x;
          var _dy = pos.absY - placed[_i].y;
          if (Math.sqrt(_dx * _dx + _dy * _dy) < MIN_PLANT_DIST) return;
        }

        placed.push({ x: pos.absX, y: pos.absY });
        toPlace.push(point);
      });

      // ── Distribuição 26 / 37 / 37 — topo / meio / base da página ─────────────
      // Topo recebe 30% menos que as outras zonas (mid = bot = X, top = 0.7X).
      // Divide a página em três faixas verticais iguais e garante a proporção.
      if (toPlace.length > 2) {
        var pageH = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
          1
        );
        var cut1 = pageH * 0.333;
        var cut2 = pageH * 0.667;
        var bTop = [], bMid = [], bBot = [];
        toPlace.forEach(function (p) {
          var pos = resolveAbsPos(p.zone, p.x, p.y);
          if      (pos.absY < cut1) bTop.push(p);
          else if (pos.absY < cut2) bMid.push(p);
          else                      bBot.push(p);
        });
        var n    = toPlace.length;
        var nTop = Math.round(n * 0.26); // 30% menos que mid/bot
        var nMid = Math.round(n * 0.37);
        var nBot = n - nTop - nMid;      // ~37%
        function pickBand(arr, count) {
          return arr.slice()
            .sort(function () { return rand() - 0.5; })
            .slice(0, Math.min(count, arr.length));
        }
        toPlace = pickBand(bTop, nTop)
          .concat(pickBand(bMid, nMid))
          .concat(pickBand(bBot, nBot));
      }
      // ── Planta cada ponto selecionado ─────────────────────────────────────────

      toPlace.forEach(function (point) {
        var plantId = 1 + Math.floor(rand() * TOTAL_PLANTS);
        var giantOk = eligibleForGiant && isGiantEligible(point.zone);
        plantAt(point.zone, point.x, point.y, plantId, allowDrag, giantOk, !point.textSafe);
      });
    }

  var baseSeed = getTimeSeed();

  // ── Sorteio global de plantas "gigantes" (dobro do tamanho mínimo) ────────
  var giantRand    = mulberry32(baseSeed * 131 + 11);
  var GIANT_COUNT  = giantRand() < 0.5 ? 1 : 2;
  var GIANT_SCALE  = window.innerWidth < 768 ? '1.00' : '2.00';
  var giantSeen    = 0;
  var giantReservoir = [];

  // ── Restrição: plantas gigantes só abaixo de "Nossa história" ─────────────
  var _nossaHistSect = null;
  function isGiantEligible(zoneEl) {
    if (!_nossaHistSect) {
      var h = document.getElementById('home-sobre-h');
      _nossaHistSect = h ? h.closest('section') : null;
    }
    if (!_nossaHistSect) return true;
    return !!(_nossaHistSect.compareDocumentPosition(zoneEl) & 4);
  }

  function considerForGiant(svgEl) {
    giantSeen++;
    if (giantReservoir.length < GIANT_COUNT) {
      giantReservoir.push(svgEl);
      svgEl.style.setProperty('--size-scale', GIANT_SCALE);
    } else {
      var j = Math.floor(giantRand() * giantSeen);
      if (j < GIANT_COUNT) {
        var old = giantReservoir[j];
        old.style.setProperty('--size-scale', (1.0 + Math.random() * 0.25).toFixed(2));
        giantReservoir[j] = svgEl;
        svgEl.style.setProperty('--size-scale', GIANT_SCALE);
      }
    }
  }

  // ── Constrói o jardim de uma página específica (lazy) ────────────────────
  function buildPageGarden(pageEl, pi) {
    if (!pageEl || pageEl.dataset.gardenBuilt) return;
    var zones = pageEl.querySelectorAll('.plant-zone');
    if (!zones.length) return;
    pageEl.dataset.gardenBuilt = '1';
    var rand = mulberry32(baseSeed * 97 + pi * 31);
    buildGarden(zones, rand, { allowDrag: true, eligibleForGiant: true });
  }

  function buildAllVisiblePages() {
    document.querySelectorAll('.page').forEach(function (pageEl, pi) {
      if (pageEl.classList.contains('active')) buildPageGarden(pageEl, pi);
    });
  }

  // ── Sway-slow decorativas ─────────────────────────────────────────────────
  function buildSwaySlowZone(zoneEl) {
    if (!zoneEl) return;
    zoneEl.querySelectorAll('.plant-point').forEach(function(p) {
      if (p.parentNode) p.parentNode.removeChild(p);
    });
    var rand = mulberry32(baseSeed * 53 + getTimeSeed() * 7);
    var pid  = 1 + Math.floor(rand() * TOTAL_PLANTS);
    // Para a zona do overlay mobile: posição horizontal aleatória, nasce da base
    var xPos = zoneEl.id === 'sway-slow-zone-1'
      ? (20 + Math.floor(rand() * 60)) + '%'
      : '50%';
    var yPos = zoneEl.id === 'sway-slow-zone-1' ? '80%' : '55%';
    plantAt(zoneEl, xPos, yPos, pid, false, false, false);
  }

  // ── Inicialização ─────────────────────────────────────────────────────────
  function initGarden() {
    buildAllVisiblePages();
    window.recheckPlantPoints = buildAllVisiblePages;
    document.querySelectorAll('.sway-slow-zone').forEach(function(z) {
      setTimeout(function(){ buildSwaySlowZone(z); }, 650);
    });
  }

  // ── Reinit idempotente pro motor SPA (js/spa-nav.js) ──────────────────────
  // O CSS de drag já foi injetado uma única vez no topo desta IIFE, então NÃO
  // é reinserido aqui. Só re-escaneamos as .plant-zone do .page ativo recém
  // trocado. buildPageGarden é guardado por dataset.gardenBuilt, e o novo
  // nó vem "fresco" (sem esse dataset), então planta o jardim uma vez só.
  // As sway-slow-zone ficam no cabeçalho compartilhado (fora do .page), então
  // não precisam ser reconstruídas a cada navegação.
  window.ARIA_reinitPlants = function () {
    buildAllVisiblePages();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGarden);
  } else if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(initGarden);
  } else {
    setTimeout(initGarden, 80);
  }

  // ── Timer 20 min: renova sway-slow ───────────────────────────────────────
  setInterval(function() {
    document.querySelectorAll('.sway-slow-zone').forEach(function(z) {
      z.querySelectorAll('.plant-point').forEach(function(p) {
        if (p.parentNode) p.parentNode.removeChild(p);
      });
      setTimeout(function(){ buildSwaySlowZone(z); }, 650);
    });
  }, 20 * 60 * 1000);

  // ── Broto de Semente: sistema de plantio pelo usuário ─────────────────────
  (function initSeedBag() {
    var container = document.getElementById('seed-bag-container');
    var btn       = document.getElementById('seed-bag-btn');
    var helpBtn   = document.getElementById('seed-help-btn');
    var tooltip   = document.getElementById('seed-help-tooltip');
    if (!btn) return;

    var activeSeed  = null;
    var DBLCLICK_MS = 320;

    // ── Tooltip de ajuda ─────────────────────────────────────────────
    if (helpBtn) {
      helpBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        var vis = tooltip.classList.toggle('visible');
        tooltip.setAttribute('aria-hidden', vis ? 'false' : 'true');
      });
      document.addEventListener('click', function(e) {
        if (container && !container.contains(e.target)) {
          tooltip.classList.remove('visible');
          tooltip.setAttribute('aria-hidden', 'true');
        }
      });
    }

    // ── Duplo clique/toque no broto → libera semente ──────────────────
    var bagLastClick = 0;
    function onBagActivate(e) {
      e.stopPropagation();
      var now = Date.now();
      if (now - bagLastClick < DBLCLICK_MS) {
        bagLastClick = 0;
        activeSeed ? removeSeed() : spawnSeed();
      } else {
        bagLastClick = now;
      }
    }
    btn.addEventListener('click', onBagActivate);
    btn.addEventListener('touchend', function(e) {
      e.preventDefault();
      onBagActivate(e);
    }, { passive: false });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && activeSeed) removeSeed();
    });

    // ── Cria a semente flutuante ─────────────────────────────────────
    function spawnSeed() {
      btn.classList.remove('glowing');
      void btn.offsetWidth;
      btn.classList.add('glowing');
      btn.addEventListener('animationend', function() {
        btn.classList.remove('glowing');
      }, { once: true });

      var seedEl = document.createElement('div');
      seedEl.className = 'floating-seed';
      seedEl.innerHTML =
        '<svg viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">' +
          '<ellipse cx="14" cy="17" rx="8" ry="9.5" fill="#C6A15B"/>' +
          '<ellipse cx="14" cy="17" rx="5" ry="6.5" fill="#9A7535" opacity=".42"/>' +
          '<path d="M14 8 Q12 3 10 1 Q13 4 14 8Z" fill="#5D8B3A"/>' +
          '<path d="M14 8 Q16 3 18 1 Q15 4 14 8Z" fill="#5D8B3A" opacity=".8"/>' +
        '</svg>';

      var bRect = btn.getBoundingClientRect();
      seedEl.style.left = Math.max(4, bRect.left - 44) + 'px';
      seedEl.style.top  = (bRect.top + bRect.height / 2 - 13) + 'px';
      document.body.appendChild(seedEl);
      activeSeed = seedEl;
      makeSeedDraggable(seedEl);
    }

    function removeSeed() {
      if (activeSeed && activeSeed.parentNode) activeSeed.parentNode.removeChild(activeSeed);
      activeSeed = null;
    }

    // ── Arrastar a semente ───────────────────────────────────────────
    function makeSeedDraggable(seedEl) {
      var sx, sy, initLeft, initTop, isDragging;
      var seedLastTap = 0;

      function onSeedStart(cx, cy) {
        isDragging = false;
        sx = cx; sy = cy;
        initLeft = parseFloat(seedEl.style.left);
        initTop  = parseFloat(seedEl.style.top);
      }

      function onSeedMove(cx, cy) {
        var dx = cx - sx, dy = cy - sy;
        if (!isDragging && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
          isDragging = true;
          seedEl.classList.add('dragging');
        }
        if (!isDragging) return;
        seedEl.style.left = (initLeft + dx) + 'px';
        seedEl.style.top  = (initTop  + dy) + 'px';
      }

      function onSeedEnd() {
        document.removeEventListener('mousemove', onMM);
        document.removeEventListener('mouseup',   onMU);
        document.removeEventListener('touchmove', onTM);
        document.removeEventListener('touchend',  onTE);
        seedEl.classList.remove('dragging');
        if (!isDragging) {
          var now = Date.now();
          if (now - seedLastTap < DBLCLICK_MS) {
            seedLastTap = 0;
            var r = seedEl.getBoundingClientRect();
            triggerPlantAnim(r.left + r.width/2, r.top + r.height/2,
                             r.left + r.width/2 + window.scrollX,
                             r.top  + r.height/2 + window.scrollY);
          } else { seedLastTap = now; }
        }
      }

      function onMM(e) { onSeedMove(e.clientX, e.clientY); }
      function onMU()  { onSeedEnd(); }
      function onTM(e) { e.preventDefault(); onSeedMove(e.touches[0].clientX, e.touches[0].clientY); }
      function onTE()  { onSeedEnd(); }

      seedEl.addEventListener('mousedown', function(e) {
        e.preventDefault();
        onSeedStart(e.clientX, e.clientY);
        document.addEventListener('mousemove', onMM);
        document.addEventListener('mouseup', onMU);
      });
      seedEl.addEventListener('touchstart', function(e) {
        onSeedStart(e.touches[0].clientX, e.touches[0].clientY);
        document.addEventListener('touchmove', onTM, { passive: false });
        document.addEventListener('touchend', onTE);
      }, { passive: true });
    }

    // ── Duplo clique/toque em qualquer lugar para plantar ────────────
    var docLastTap = 0;
    document.addEventListener('dblclick', function(e) {
      if (!activeSeed) return;
      if (container && container.contains(e.target)) return;
      triggerPlantAnim(e.clientX, e.clientY,
                       e.clientX + window.scrollX, e.clientY + window.scrollY);
    });
    document.addEventListener('touchend', function(e) {
      if (!activeSeed) return;
      if (container && container.contains(e.target)) return;
      var now = Date.now();
      var t = e.changedTouches[0];
      if (now - docLastTap < DBLCLICK_MS) {
        docLastTap = 0;
        e.preventDefault();
        triggerPlantAnim(t.clientX, t.clientY,
                         t.clientX + window.scrollX, t.clientY + window.scrollY);
      } else { docLastTap = now; }
    }, { passive: false });

    // ── Animação de plantio: semente desce, flor nasce ───────────────
    function triggerPlantAnim(vx, vy, absX, absY) {
      if (!activeSeed) return;
      var captured = activeSeed;
      activeSeed = null;

      captured.style.left       = (vx - 13) + 'px';
      captured.style.top        = (vy - 13) + 'px';
      captured.style.animation  = 'none';
      captured.style.transition = 'transform .32s ease-in, opacity .32s ease-in';
      captured.style.transform  = 'scale(0.15) translateY(14px)';
      captured.style.opacity    = '0';

      var ring = document.createElement('div');
      ring.className      = 'plant-drop-ring';
      ring.style.position = 'absolute';
      ring.style.left     = absX + 'px';
      ring.style.top      = absY + 'px';
      document.body.appendChild(ring);
      setTimeout(function() { if (ring.parentNode) ring.parentNode.removeChild(ring); }, 900);

      setTimeout(function() {
        if (captured && captured.parentNode) captured.parentNode.removeChild(captured);
        plantUserFlower(absX, absY);
      }, 360);
    }

    // ── Faz nascer uma flor aleatória ────────────────────────────────
    function plantUserFlower(absX, absY) {
      var plantId = 1 + Math.floor(Math.random() * TOTAL_PLANTS);
      var symbol  = document.getElementById('plant-' + plantId);
      if (!symbol) return;

      var anchor = document.createElement('div');
      anchor.className      = 'plant-point user-planted';
      anchor.style.position = 'absolute';
      anchor.style.left     = absX + 'px';
      anchor.style.top      = absY + 'px';
      anchor.style.zIndex   = '9997';

      var slot = document.createElement('div');
      slot.className = 'plant-slot' + (WIDE_PLANTS.indexOf(plantId) !== -1 ? ' wide' : '');

      var svgNS = 'http://www.w3.org/2000/svg';
      var svg   = document.createElementNS(svgNS, 'svg');
      svg.classList.add('plant-graphic');
      svg.style.setProperty('--sway-dur',   (3.2 + Math.random() * 2.2).toFixed(2) + 's');
      svg.style.setProperty('--sway-delay', '0s');
      svg.style.setProperty('--size-scale', (0.85 + Math.random() * 0.75).toFixed(2));
      svg.setAttribute('viewBox', symbol.getAttribute('viewBox'));

      var use = document.createElementNS(svgNS, 'use');
      use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#plant-' + plantId);
      svg.appendChild(use);
      slot.appendChild(svg);
      anchor.appendChild(slot);
      document.body.appendChild(anchor);

      requestAnimationFrame(function() {
        requestAnimationFrame(function() { svg.classList.add('born'); });
      });
      makeDraggable(anchor, slot, svg, document.body);
    }
  })();

})();

// ── IMPACT MODAL (Depoimentos & Casos de Resgate) ──────────────────────────
(function() {
  var depData = {
    camyle:    { name: 'Camyle',      role: 'Participante · Projeto Se Prepara Menina', img: 'assets/img/depoimentos/se-prepara-menina-01.webp', text: null },
    orelie:    { name: 'Orelie',      role: 'Participante · Projeto Se Prepara Menina', img: 'assets/img/depoimentos/se-prepara-menina-02.webp', text: null },
    part3:     { name: 'Participante',role: 'Projeto Se Prepara Menina',                img: 'assets/img/depoimentos/se-prepara-menina-03.webp', text: null },
    part4:     { name: 'Participante',role: 'Projeto Se Prepara Menina',                img: 'assets/img/depoimentos/se-prepara-menina-04.webp', text: null },
    andriellen:{ name: 'Andriellen',  role: 'Participante · Projeto Se Prepara Menina', img: 'assets/img/depoimentos/se-prepara-menina-05.webp', text: null },
    part6:     { name: 'Participante',role: 'Instituto ARIA',                           img: 'assets/img/depoimentos/se-prepara-menina-06.webp', text: null },
    vol1: { name: 'Voluntária', role: 'Instituto ARIA', emoji: '🐾', bg: 'var(--aria-plum)',
      text: '"O voluntariado nos ensina que pequenas ações podem gerar grandes mudanças. Nem sempre conseguimos ajudar todos, mas cada animal que tem seu destino transformado nos lembra por que continuamos."' },
    vol2: { name: 'Voluntária', role: 'Instituto ARIA', emoji: '💛', bg: 'var(--aria-wine)',
      text: '"Quando comecei, pensei que estava apenas ajudando animais em situação de abandono. Com o tempo, percebi que eles também estavam me ajudando. Sou grata por ter descoberto esse caminho."' },
    vol3: { name: 'Voluntária', role: 'Instituto ARIA', emoji: '🌱', bg: 'var(--aria-brown)',
      text: '"O Instituto ARIA me fez refletir sobre como uma vida salva muda a história daquele animal... Mas participar dessa mudança transforma também a minha própria história."' }
  };

  var rescueData = {
    mel:         { name: 'Caso Mel',            role: 'Resgate Animal · Instituto ARIA', img: 'assets/img/depoimentos/resgate-animal-01.webp',
      text: 'Resgatada em grave situação de maus-tratos, com ferimentos sérios no pescoço e corpo. Após cuidados emergenciais, Mel se recuperou completamente e hoje vive saudável e feliz.' },
    sansao:      { name: 'Caso Sansão',         role: 'Resgate Animal · Instituto ARIA', img: 'assets/img/depoimentos/resgate-animal-02.webp',
      text: 'Encontrado em estado crítico nas ruas. Com tratamento veterinário e muito carinho, Sansão ganhou força e encontrou um lar amoroso.' },
    bethoven:    { name: 'Caso Bethoven',       role: 'Resgate Animal · Instituto ARIA', img: 'assets/img/depoimentos/resgate-animal-03.webp',
      text: 'Resgatado com infecções e desnutrição severa. A dedicação da equipe ARIA garantiu sua recuperação e encaminhamento para adoção responsável.' },
    trigemeos:   { name: 'Caso Trigêmeos',      role: 'Resgate Animal · Instituto ARIA', img: 'assets/img/depoimentos/resgate-animal-04.webp',
      text: 'Três filhotes resgatados juntos, ainda muito pequenos. Receberam os cuidados necessários e foram adotados por famílias que os aguardavam.' },
    felicia:     { name: 'Caso Felícia',        role: 'Resgate Animal · Instituto ARIA', img: 'assets/img/depoimentos/resgate-animal-05.webp',
      text: 'Resgatada em situação de abandono, assustada e machucada. Com amor e cuidado, Felícia se tornou uma cadela alegre e sociável.' },
    apolo:       { name: 'Caso Apolo',          role: 'Resgate Animal · Instituto ARIA', img: 'assets/img/depoimentos/resgate-animal-06.webp',
      text: 'Encontrado sozinho e ferido. A intervenção rápida do ARIA garantiu tratamento a tempo e uma segunda chance de vida para Apolo.' },
    melinaamora: { name: 'Caso Melina e Amora', role: 'Resgate Animal · Instituto ARIA', img: 'assets/img/depoimentos/resgate-animal-07.webp',
      text: 'Dupla de fêmeas resgatada juntas. Passaram por tratamento e foram adotadas — inseparáveis até hoje no novo lar.' }
  };

  var backdrop  = document.getElementById('impact-modal-backdrop');
  var panel     = document.getElementById('impact-modal-panel');
  var visualEl  = document.getElementById('impact-modal-visual');
  var nameEl    = document.getElementById('impact-modal-name');
  var roleEl    = document.getElementById('impact-modal-role');
  var textEl    = document.getElementById('impact-modal-text');
  var galleryEl = document.getElementById('impact-modal-gallery');
  var closeBtn  = document.getElementById('impact-modal-close-btn');
  var lastFocus = null;

  function populateModal(data, isRescue) {
    if (data.img) {
      visualEl.innerHTML = '<img class="impact-modal-photo" src="' + data.img + '" alt="' + data.name + '"/>';
    } else {
      visualEl.innerHTML = '<div class="impact-modal-photo-ph" style="background:' + data.bg + ';"><span style="font-size:56px;" aria-hidden="true">' + data.emoji + '</span></div>';
    }
    nameEl.textContent = data.name;
    roleEl.textContent = data.role;
    if (data.text) {
      textEl.textContent = data.text;
      textEl.style.display = '';
    } else {
      textEl.textContent = '';
      textEl.style.display = 'none';
    }
    if (isRescue) {
      panel.classList.add('rescue-variant');
      galleryEl.style.display = 'grid';
      galleryEl.innHTML =
        '<div class="impact-placeholder"><div class="impact-placeholder-inner">Foto adicional<br>em breve</div></div>' +
        '<div class="impact-placeholder"><div class="impact-placeholder-inner">Foto adicional<br>em breve</div></div>' +
        '<div class="impact-placeholder"><div class="impact-placeholder-inner">Foto adicional<br>em breve</div></div>';
    } else {
      panel.classList.remove('rescue-variant');
      galleryEl.style.display = 'none';
      galleryEl.innerHTML = '';
    }
  }

  function openModal(data, isRescue) {
    lastFocus = document.activeElement;
    populateModal(data, isRescue);
    backdrop.style.display = 'flex';
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function() { closeBtn.focus(); }, 50);
  }

  function closeModal() {
    backdrop.classList.remove('open');
    setTimeout(function() { backdrop.style.display = 'none'; }, 310);
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  window.openImpactModal = function(id) {
    var data = depData[id];
    if (data) openModal(data, false);
  };
  window.openRescueModal = function(id) {
    var data = rescueData[id];
    if (data) openModal(data, true);
  };

  backdrop.addEventListener('click', function(e) {
    if (e.target === backdrop) closeModal();
  });
  closeBtn.addEventListener('click', closeModal);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
  });

})();