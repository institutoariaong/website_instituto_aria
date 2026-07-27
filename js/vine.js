(function(){
  var layer   = document.getElementById('vine-cta-layer');
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
  var CONSTRAINT_STIFFNESS  = 0.42;
  var DAMPING      = 0.90;
  var MAX_STEP     = 3.2;
  var windPhase = Math.random() * 1000;

  var ANCHOR_OFFSET_X = 170; // mais para a direita do botão "Apoie o ARIA"
  var ANCHOR_OFFSET_Y = -226; // mais para cima do botão
  var anchor = { x: 0, y: 0 };
  var anchorSim = { x: 0, y: 0 };
  var ANCHOR_TAU = 1.8;

  var points = [];
  var isDragging = false, dragMoved = false;
  var hideForPage = false;

  function isMobileWidth(){
    return window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  }

  function computeAnchorTarget(){
    var r = apoieBtn.getBoundingClientRect();
    if (!r || r.width === 0) {
      return { x: window.innerWidth - 120, y: 90 };
    }
    return { x: r.right + ANCHOR_OFFSET_X, y: r.top + r.height / 2 + ANCHOR_OFFSET_Y };
  }

  function initPoints(){
    anchor = computeAnchorTarget();
    anchorSim.x = anchor.x; anchorSim.y = anchor.y;
    var birthY = anchorSim.y - 34;
    points = [];
    for (var i = 0; i < NUM_POINTS; i++) {
      points.push({
        x: anchorSim.x + i * 0.4, y: birthY,
        oldx: anchorSim.x + i * 0.4, oldy: birthY,
        pinned: i === 0
      });
    }
    buildOrnaments();
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){ layer.classList.add('vine-born'); });
    });
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

  // ─── Retração proporcional à velocidade de scroll ───
  var retractAmount = 0;
  var RETRACT_STRENGTH = 0.55, RETRACT_SPEED_FULL = 1400;
  var RETRACT_RISE_TAU = 0.12, RETRACT_FALL_TAU = 1.7;
  var lastScrollY = window.scrollY || 0;
  function updateRetract(dt){
    var currentScrollY = window.scrollY || 0;
    var speed = Math.abs(currentScrollY - lastScrollY) / Math.max(dt, 0.001);
    lastScrollY = currentScrollY;
    var target = Math.min(speed / RETRACT_SPEED_FULL, 1);
    var tau = (target > retractAmount) ? RETRACT_RISE_TAU : RETRACT_FALL_TAU;
    var alpha = 1 - Math.exp(-dt / tau);
    retractAmount += (target - retractAmount) * alpha;
  }

  function applyConstraints(){
    var segLenNow = SEG_LEN * (1 - retractAmount * RETRACT_STRENGTH);
    for (var iter = 0; iter < CONSTRAINT_ITERATIONS; iter++) {
      for (var i = 0; i < points.length - 1; i++) {
        var p1 = points[i], p2 = points[i + 1];
        var dx = p2.x - p1.x, dy = p2.y - p1.y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        var diff = (dist - segLenNow) / dist;
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

  // ─── Texto da placa muda suavemente conforme a página ───
  var textLayer = document.getElementById('vine-sign-text-layer');
  var titleEl = document.getElementById('vine-sign-title');
  var mainEl  = document.getElementById('vine-sign-main');
  var subEl   = document.getElementById('vine-sign-sub');
  var onVolPage = false;
  var TEXT_FADE_MS = 220;
  function setSignMode(isVolPage){
    if (!textLayer || !titleEl || !mainEl || !subEl) return;
    var wantTitle = isVolPage ? '🌱 VENHA AJUDAR' : '🌱 FAÇA PARTE';
    var wantMain  = isVolPage ? 'QUERO ME INSCREVER' : 'VOLUNTÁRIO';
    var wantSub   = isVolPage ? '✦ Clique e preencha o formulário ✦' : '✦ Clique aqui e saiba mais ✦';
    var wantMainSize = isVolPage ? '14px' : '20px';
    if (titleEl.textContent === wantTitle && mainEl.textContent === wantMain) return;
    textLayer.classList.add('vine-text-fading');
    setTimeout(function(){
      titleEl.textContent = wantTitle;
      mainEl.textContent = wantMain;
      subEl.textContent = wantSub;
      mainEl.style.fontSize = wantMainSize;
      textLayer.classList.remove('vine-text-fading');
    }, TEXT_FADE_MS);
  }

  // ─── Clique navega, arraste reposiciona (sem soltar "estilingue") ───
  function goHref(){
    return onVolPage ? 'inscricao.html' : 'voluntarios.html';
  }
  function goToVolunteers(){
    if (dragMoved) { dragMoved = false; return; }
    var href = goHref();
    if (typeof window.ARIA_navigate === 'function') { window.ARIA_navigate(href, false); }
    else { window.location.href = href; }
  }
  signG.addEventListener('click', goToVolunteers);
  signG.addEventListener('keydown', function(e){
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToVolunteers(); }
  });

  // ─── Arraste: se puxar além do limite, a placa "foge" da tela e desce devagar ───
  var RETREAT_THRESHOLD = 50;
  var RETREAT_FADE_MS = 260;
  var pointsReady = false;
  function triggerRetreat(){
    layer.classList.remove('vine-born');
    setTimeout(function(){
      initPoints();
    }, RETREAT_FADE_MS);
  }

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
    last.oldx = last.x; last.oldy = last.y;
  });
  function endDrag(e){
    if (!isDragging) return;
    isDragging = false;
    signG.classList.remove('dragging');
    var last = points[points.length - 1];
    var below = last.y - anchorSim.y;
    last.oldx = last.x; last.oldy = last.y;
    try { signG.releasePointerCapture(e.pointerId); } catch(err){}
    if (below > RETREAT_THRESHOLD * (NUM_POINTS * 0.7)) {
      triggerRetreat();
    }
  }
  signG.addEventListener('pointerup', endDrag);
  signG.addEventListener('pointercancel', endDrag);

  function applyVisibility(){
    layer.style.display = (hideForPage || isMobileWidth()) ? 'none' : '';
  }

  function updatePageState(page){
    onVolPage = (page === 'voluntarios' || page === 'inscricao');
    hideForPage = false; // o cipó também aparece na página de Voluntários/Inscrição
    setSignMode(onVolPage);
    applyVisibility();
    // A troca de página (SPA) faz window.scrollTo(0,0) instantaneamente. Sem isto,
    // o próximo cálculo de "velocidade de scroll" interpretaria esse salto como um
    // scroll muito rápido do usuário, disparando a retração da corda ao máximo —
    // que depois se estica de volta devagar, parecendo o cipó "caindo" de novo.
    lastScrollY = window.scrollY || 0;
    retractAmount = 0;
  }

  // Estado inicial, a partir do data-page já presente no <body>.
  updatePageState(document.body.getAttribute('data-page'));

  // A cada troca de página pelo motor SPA (js/spa-nav.js), reavalia o modo da placa.
  document.addEventListener('aria:navigated', function(ev){
    var page = ev && ev.detail && ev.detail.page;
    updatePageState(page);
  });

  var resizeTimer = null;
  window.addEventListener('resize', function(){
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function(){ applyVisibility(); }, 150);
  });

  var lastT = performance.now();
  function loop(t){
    var dt = Math.min((t - lastT) / 1000, 0.05);
    lastT = t;
    var visible = !isMobileWidth();
    applyVisibility();
    if (visible) {
      if (!pointsReady) { initPoints(); pointsReady = true; }
      updateAnchor(dt);
      updateRetract(dt);
      updatePoints(t);
      applyConstraints();
      render();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
