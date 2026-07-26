(function(){
  var layer   = document.getElementById('vine-cta-layer');
  var svg     = document.getElementById('vine-cta-svg');
  var ropeOut = document.getElementById('vine-rope-outer');
  var ropeIn  = document.getElementById('vine-rope-inner');
  var leavesLayer  = document.getElementById('vine-leaves-layer');
  var flowersLayer = document.getElementById('vine-flowers-layer');
  var signG   = document.getElementById('vine-cta-sign');
  var cordPin = document.getElementById('vine-cord-pin');
  var cord1   = document.getElementById('vine-cord-1');
  var cord2   = document.getElementById('vine-cord-2');
  var signCardGroup = document.getElementById('vine-sign-card-group');
  var apoieBtn = document.getElementById('nav-apoie-cta');
  if (!layer || !apoieBtn) return;

  // ─── Config física — "pesado", sem chicote/estica-e-solta ───
  var NUM_POINTS   = 22;
  var SEG_LEN      = 30;
  var GRAVITY      = 0.55;
  var CONSTRAINT_ITERATIONS = 5;
  var CONSTRAINT_STIFFNESS  = 0.42;  // < 0.5 = corda um pouco "mole", sem repuxar
  var DAMPING      = 0.90;           // bem mais atrito que um cipó "elástico" — mata oscilação rápido
  var MAX_STEP     = 3.2;            // clamp de velocidade por frame — evita qualquer solavanco
  var windPhase = Math.random() * 1000;

  var ANCHOR_OFFSET_X = 20; // 20px depois do botão "Apoie o ARIA", no cabeçalho
  var anchor = { x: 0, y: 0 };       // posição alvo real (recalculada a cada frame)
  var anchorSim = { x: 0, y: 0 };    // posição usada na simulação — persegue `anchor` devagar
  var ANCHOR_TAU = 1.8; // segundos — leva ~3×tau (~5-6s) pra convergir na posição nova

  var points = [];
  var isDragging = false, dragMoved = false;
  var hideForPage = false;

  function isApoieVisible(){
    return apoieBtn.offsetParent !== null && apoieBtn.getBoundingClientRect().width > 0;
  }

  function computeAnchorTarget(){
    var r = apoieBtn.getBoundingClientRect();
    return { x: r.right + ANCHOR_OFFSET_X, y: r.top + r.height / 2 };
  }

  function initPoints(){
    anchor = computeAnchorTarget();
    anchorSim.x = anchor.x; anchorSim.y = anchor.y;
    points = [];
    for (var i = 0; i < NUM_POINTS; i++) {
      var y = anchorSim.y + i * SEG_LEN;
      points.push({ x: anchorSim.x, y: y, oldx: anchorSim.x, oldy: y, pinned: i === 0 });
    }
    buildOrnaments();
  }

  // ─── Folhas/flores reais, distribuídas ao longo da corda ───
  var LEAF_TPLS = ['vine-leaf-tpl-1', 'vine-leaf-tpl-2', 'vine-leaf-tpl-3', 'vine-leaf-tpl-4'];
  var FLOWER_TPLS = ['vine-flower-tpl-1', 'vine-flower-tpl-2'];
  var leafSlots = [];
  var flowerSlots = [];

  function buildOrnaments(){
    leavesLayer.innerHTML = '';
    flowersLayer.innerHTML = '';
    leafSlots = [];
    flowerSlots = [];
    var step = 2;
    for (var i = 2; i < NUM_POINTS - 2; i += step) {
      var side = (i % 4 === 0) ? 1 : -1;
      var tpl = LEAF_TPLS[Math.floor(Math.random() * LEAF_TPLS.length)];
      var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      use.setAttribute('href', '#' + tpl);
      leavesLayer.appendChild(use);
      leafSlots.push({ el: use, index: i, side: side, scaleV: 0.5 + Math.random() * 0.3 });
      step = 2 + Math.floor(Math.random() * 2);
    }
    [Math.floor(NUM_POINTS * 0.35), Math.floor(NUM_POINTS * 0.65)].forEach(function(idx, k){
      var tpl = FLOWER_TPLS[k % FLOWER_TPLS.length];
      var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      use.setAttribute('href', '#' + tpl);
      flowersLayer.appendChild(use);
      flowerSlots.push({ el: use, index: idx });
    });
  }

  function clamp(v, a, b){ return Math.min(Math.max(v, a), b); }

  function updateAnchor(dt){
    anchor = computeAnchorTarget();
    var alpha = 1 - Math.exp(-dt / ANCHOR_TAU);
    anchorSim.x += (anchor.x - anchorSim.x) * alpha;
    anchorSim.y += (anchor.y - anchorSim.y) * alpha;
    points[0].x = anchorSim.x;
    points[0].y = anchorSim.y;
  }

  function updatePoints(t){
    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      if (p.pinned) continue;
      var vx = clamp((p.x - p.oldx) * DAMPING, -MAX_STEP, MAX_STEP);
      var vy = clamp((p.y - p.oldy) * DAMPING, -MAX_STEP, MAX_STEP);
      p.oldx = p.x; p.oldy = p.y;
      var depth = i / (points.length - 1);
      var wind = Math.sin(t * 0.0006 + windPhase + i * 0.5) * 0.12 * (0.3 + depth * 1.1);
      p.x += vx + wind;
      p.y += vy + GRAVITY;
    }
  }

  function applyConstraints(){
    for (var iter = 0; iter < CONSTRAINT_ITERATIONS; iter++) {
      for (var i = 0; i < points.length - 1; i++) {
        var p1 = points[i], p2 = points[i + 1];
        var dx = p2.x - p1.x, dy = p2.y - p1.y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        var diff = (dist - SEG_LEN) / dist;
        var offX = dx * CONSTRAINT_STIFFNESS * diff;
        var offY = dy * CONSTRAINT_STIFFNESS * diff;
        if (!p1.pinned) { p1.x += offX; p1.y += offY; }
        if (!p2.pinned && !(isDragging && i + 1 === points.length - 1)) { p2.x -= offX; p2.y -= offY; }
      }
      points[0].x = anchorSim.x;
      points[0].y = anchorSim.y;
    }
  }

  function pathThroughPoints(pts){
    var d = 'M ' + pts[0].x + ' ' + pts[0].y;
    for (var i = 1; i < pts.length - 1; i++) {
      var xc = (pts[i].x + pts[i + 1].x) / 2;
      var yc = (pts[i].y + pts[i + 1].y) / 2;
      d += ' Q ' + pts[i].x + ' ' + pts[i].y + ' ' + xc + ' ' + yc;
    }
    var last = pts[pts.length - 1];
    d += ' L ' + last.x + ' ' + last.y;
    return d;
  }

  function render(){
    var d = pathThroughPoints(points);
    ropeOut.setAttribute('d', d);
    ropeIn.setAttribute('d', d);

    leafSlots.forEach(function(s){
      var p = points[s.index], next = points[s.index + 1] || p;
      var angle = Math.atan2(next.y - p.y, next.x - p.x) * 180 / Math.PI;
      s.el.setAttribute('transform',
        'translate(' + p.x + ',' + p.y + ') rotate(' + (angle + s.side * 65) + ') scale(' + (s.side * s.scaleV) + ',' + s.scaleV + ')');
    });
    flowerSlots.forEach(function(s){
      var p = points[s.index];
      s.el.setAttribute('transform', 'translate(' + p.x + ',' + p.y + ')');
    });

    var last = points[points.length - 1];
    var prev = points[points.length - 2];
    var angle = Math.atan2(last.y - prev.y, last.x - prev.x) * 180 / Math.PI - 90;
    var swing = clamp(angle * 0.3, -14, 14);

    cordPin.setAttribute('cx', last.x); cordPin.setAttribute('cy', last.y);
    cord1.setAttribute('x1', last.x); cord1.setAttribute('y1', last.y);
    cord2.setAttribute('x1', last.x); cord2.setAttribute('y1', last.y);
    var cardX = last.x - 100, cardY = last.y + 40;
    cord1.setAttribute('x2', cardX + 56); cord1.setAttribute('y2', cardY);
    cord2.setAttribute('x2', cardX + 144); cord2.setAttribute('y2', cardY);
    signCardGroup.setAttribute('transform', 'translate(' + cardX + ',' + cardY + ') rotate(' + swing + ' 100 -40)');
  }

  // ─── Clique navega, arraste reposiciona (sem soltar "estilingue") ───
  function goToVolunteers(){
    if (dragMoved) { dragMoved = false; return; }
    if (typeof showPage === 'function') showPage('voluntarios');
  }
  signG.addEventListener('click', goToVolunteers);
  signG.addEventListener('keydown', function(e){
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToVolunteers(); }
  });

  signG.addEventListener('pointerdown', function(e){
    isDragging = true; dragMoved = false;
    signG.classList.add('dragging');
    signG.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  signG.addEventListener('pointermove', function(e){
    if (!isDragging) return;
    dragMoved = true;
    var last = points[points.length - 1];
    last.x = e.clientX; last.y = e.clientY;
    // sem transferir velocidade de arraste pra corda — evita o "estica e volta rápido"
    last.oldx = last.x; last.oldy = last.y;
  });
  function endDrag(e){
    if (!isDragging) return;
    isDragging = false;
    signG.classList.remove('dragging');
    var last = points[points.length - 1];
    last.oldx = last.x; last.oldy = last.y; // zera qualquer velocidade residual do solto
    try { signG.releasePointerCapture(e.pointerId); } catch(err){}
  }
  signG.addEventListener('pointerup', endDrag);
  signG.addEventListener('pointercancel', endDrag);

  function applyVisibility(){
    layer.style.display = (hideForPage || !isApoieVisible()) ? 'none' : '';
  }

  if (typeof showPage === 'function' && !showPage.__vinePatched) {
    var originalShowPage = showPage;
    window.showPage = function(id){
      originalShowPage(id);
      hideForPage = (id === 'voluntarios');
      applyVisibility();
    };
    window.showPage.__vinePatched = true;
  }

  // Na navegação SPA (fetch+swap), showPage nem sempre é o gatilho — um clique
  // num link comum <a href="voluntarios.html"> também troca de página. O motor
  // (js/spa-nav.js) dispara 'aria:navigated' com o data-page de destino após
  // cada troca, então recalculamos hideForPage a partir dele. Isso evita que a
  // vinha fique "presa" escondida depois de passar por voluntarios.html.
  document.addEventListener('aria:navigated', function(ev){
    var page = ev && ev.detail && ev.detail.page;
    hideForPage = (page === 'voluntarios');
    applyVisibility();
  });

  var resizeTimer = null;
  window.addEventListener('resize', function(){
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function(){ applyVisibility(); }, 150);
  });

  var lastT = performance.now();
  var pointsReady = false;
  function loop(t){
    var dt = Math.min((t - lastT) / 1000, 0.05);
    lastT = t;
    var visible = isApoieVisible() && !hideForPage;
    // se auto-corrige a cada frame — não depende de um único check no carregamento
    applyVisibility();
    if (visible) {
      if (!pointsReady) { initPoints(); pointsReady = true; }
      updateAnchor(dt);
      updatePoints(t);
      applyConstraints();
      render();
    }
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
