/* ─── SCROLL VER DETALHES (offset sticky nav) ─── */
function scrollToDetalhes() {
  const el = document.getElementById('produtos-disponiveis-anchor');
  if (!el) return;
  const navH = 66; // altura do sticky nav
  const top = el.getBoundingClientRect().top + window.scrollY - navH - 16;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

/* ─── GALERIA CAMISAS ─── */
function setCamisaImg(src, btn) {
  const img = document.getElementById('camisa-img-main');
  if (!img) return;
  img.style.opacity = '0';
  setTimeout(() => { img.src = src; img.style.opacity = '1'; }, 180);
  document.querySelectorAll('#camisa-slide ~ div button').forEach(b => {
    b.style.borderColor = 'var(--aria-border-gold)';
  });
  if (btn) btn.style.borderColor = 'var(--aria-wine)';
}

/* ─── NAVEGAÇÃO ENTRE PÁGINAS ─── */
/* Fallback: reload real do navegador, sem fade de <body>.
   Usado quando a navegação SPA (fetch+swap em js/spa-nav.js) não está
   disponível ou falha (rede/CORS/file://). */
function navigateWithFade(url) {
  window.location.href = url;
}

var PAGE_URLS = {
  home:'index.html', quemsomos:'quem-somos.html', projetos:'projetos.html',
  voluntarios:'voluntarios.html', produtos:'produtos.html', impacto:'impacto.html',
  contato:'contato.html', apoie:'apoie.html', restrita:'restrita.html',
  privacidade:'privacidade.html', parceria:'parceria.html'
};

function showPage(id) {
  var url = PAGE_URLS[id];
  if (!url) return;
  // Prefere a navegação client-side (crossfade de conteúdo, sem reload);
  // se o motor SPA não existir/estiver indisponível, cai no fade+reload.
  if (typeof window.ARIA_navigate === 'function') { window.ARIA_navigate(url, false); }
  else { navigateWithFade(url); }
}

/* NOTA: a interceptação de cliques em links internos .html agora vive em
   js/spa-nav.js (navegação client-side com fetch + troca de DOM). Aquele
   módulo tem o fallback pro reload normal quando fetch/DOMParser faltam. */

/* Inicializa o estado da pagina atual (substitui o antigo showPage('home')) */
function initCurrentPage() {
  var id = (document.body.getAttribute('data-page')) || 'home';
  updateActiveLink(id);
  var nav = document.getElementById('sticky-nav');
  if (nav) nav.classList.add('visible');
  setTimeout(function(){ updateNavTop(); initFadeUp(); }, 60);
}

function updateActiveLink(id) {
  const map = {
    home: 0, quemsomos: 1, projetos: 2, voluntarios: 3, produtos: 4, impacto: 5,
    contato: 6, restrita: 7, privacidade: 7
  };
  document.querySelectorAll('.nav-link').forEach((l, i) => {
    l.classList.toggle('active-link', i === map[id]);
  });
  document.querySelectorAll('#nav-apoie-cta').forEach((btn) => {
    btn.classList.toggle('nav-cta-active', id === 'apoie');
  });
}

/* ─── MOBILE OVERLAY ─── */
function openMobile() {
  const ov = document.getElementById('mobile-overlay');
  ov.classList.add('open');
  document.body.style.overflow = 'hidden';
  const hbtn = document.querySelector('.hamburger, .hero-hamburger');
  if (hbtn) hbtn.setAttribute('aria-expanded', 'true');
  ov.querySelector('a, button').focus();
}
function closeMobile() {
  const ov = document.getElementById('mobile-overlay');
  ov.classList.remove('open');
  document.body.style.overflow = '';
  const hbtn = document.querySelector('.hamburger, .hero-hamburger');
  if (hbtn) hbtn.setAttribute('aria-expanded', 'false');
}

/* ─── COOKIE BANNER ─── */
function hideCookie() {
  const c = document.getElementById('cookie');
  c.classList.remove('show');
  try { localStorage.setItem('aria_cookie', '1'); } catch(e) {}
}
window.addEventListener('DOMContentLoaded', () => {
  let accepted = false;
  try { accepted = !!localStorage.getItem('aria_cookie'); } catch(e) {}
  if (!accepted) {
    setTimeout(() => {
      const c = document.getElementById('cookie');
      if (c) c.classList.add('show');
    }, 1800);
  }
});

/* ─── SCROLL GUARD: reseta deslize horizontal residual após toque ─── */
document.addEventListener('touchend', function() {
  if (window.scrollX !== 0) window.scrollTo(0, window.scrollY);
}, { passive: true });

/* ─── FAQ ACORDEÃO ─── */
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const answer = item.querySelector('.faq-answer');
  const icon = item.querySelector('.faq-icon');
  const isOpen = answer.style.maxHeight && answer.style.maxHeight !== '0px';

  // Fechar todos
  document.querySelectorAll('.faq-item').forEach(fi => {
    fi.querySelector('.faq-answer').style.maxHeight = '0px';
    fi.querySelector('.faq-answer').setAttribute('aria-hidden', 'true');
    fi.querySelector('.faq-icon').style.transform = '';
    fi.querySelector('.faq-btn').setAttribute('aria-expanded', 'false');
  });

  if (!isOpen) {
    answer.style.maxHeight = answer.scrollHeight + 'px';
    answer.setAttribute('aria-hidden', 'false');
    icon.style.transform = 'rotate(180deg)';
    btn.setAttribute('aria-expanded', 'true');
  }
}

/* ─── COPIAR PIX ─── */
function copiarPix() {
  const key = '67.555.170/0001-03';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(key).then(() => {
      const btn = document.getElementById('pix-btn');
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = '✓ Copiado!';
        btn.style.background = 'var(--aria-sage)';
        setTimeout(() => {
          btn.textContent = orig;
          btn.style.background = '';
        }, 2200);
      }
    });
  }
}

/* ─── FADE-UP AO SCROLL ─── */
function initFadeUp() {
  const items = document.querySelectorAll('.fade-up:not(.visible)');
  if (!items.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  items.forEach(el => obs.observe(el));
}

/* ─── STICKY NAV (scroll) ─── */
/* ─── posição do nav relativa à barra de anúncio ─── */
function getAnnH() {
  const ann = document.getElementById('announce-bar');
  return (ann && ann.offsetParent !== null) ? ann.offsetHeight : 0;
}
function updateNavTop() {
  const nav = document.getElementById('sticky-nav');
  if (!nav) return;
  const annH = getAnnH();
  const navH = nav.offsetHeight || 66;
  nav.style.top = annH + 'px';
  document.querySelectorAll('.page-spacer').forEach(el => {
    el.style.height = (annH + navH) + 'px';
  });
}
window.addEventListener('scroll', () => {
  const nav = document.getElementById('sticky-nav');
  if (!nav) return;
  const annH = getAnnH();
  nav.classList.add('visible');
  const offset = Math.max(0, annH - window.scrollY);
  nav.style.top = offset + 'px';
}, { passive: true });

/* ─── COUNTER ANIMATION ─── */
function completedYearsSince(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const today = new Date();
  let years = today.getFullYear() - year;
  const anniversaryHasPassed =
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day);
  if (!anniversaryHasPassed) years--;
  return Math.max(0, years);
}

function animateCounters() {
  const activePageId = document.querySelector('.page.active')?.id;
  const counters = document.querySelectorAll(`#${activePageId} .stat-num[data-target]`);
  if (!counters.length) return;

  const obsC = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (el.dataset.counted) return;
      el.dataset.counted = '1';
      const target = el.dataset.startDate
        ? completedYearsSince(el.dataset.startDate)
        : parseInt(el.dataset.target, 10);
      const suffix = el.dataset.suffix || '';
      const dur = 1400;
      const start = performance.now();

      function step(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / dur, 1);
        // Ease out cubic
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(ease * target);
        el.textContent = (target >= 1000 ? current.toLocaleString('pt-BR') : current) + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = (target >= 1000 ? target.toLocaleString('pt-BR') : target) + suffix;
      }
      requestAnimationFrame(step);
      obsC.unobserve(el);
    });
  }, { threshold: 0.4 });

  counters.forEach(c => obsC.observe(c));
}

/* ─── WORD CYCLE (hero) ─── */
(function wordCycle() {
  const words = ['mulheres', 'crianças', 'comunidades'];
  let idx = 0;
  function cycle() {
    const el = document.getElementById('cycle-word');
    if (!el) return;
    el.classList.add('fading');
    setTimeout(() => {
      idx = (idx + 1) % words.length;
      el.textContent = words[idx];
      el.classList.remove('fading');
    }, 280);
  }
  setInterval(cycle, 2400);
})();

/* ─── KEYBOARD NAV (ESC fecha overlay) ─── */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMobile();
});

/* ─── INICIALIZAÇÃO ─── */
document.addEventListener('DOMContentLoaded', () => {
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);
  initCurrentPage();
  updateNavTop();
  // nav visível desde o carregamento
  const navEl = document.getElementById('sticky-nav');
  if (navEl) navEl.classList.add('visible');
  initFadeUp();
  animateCounters();
});
window.addEventListener('resize', updateNavTop, { passive: true });

/* Reexecutar counters e replantio ao trocar de página */
const origShowPage = showPage;
window.showPage = function(id) {
  origShowPage(id);
  setTimeout(animateCounters, 120);
  setTimeout(() => { if (window.recheckPlantPoints) window.recheckPlantPoints(); }, 120);
};

/* Hero carousel — avança a cada 3 segundos.
   Reescrito como função reinicializável: o carrossel só existe dentro do
   .page da home, que é trocado via swap SPA. Guardamos o interval pra poder
   limpá-lo antes de descartar a página antiga (senão vira timer fantasma). */
var _heroCarouselInterval = null;
function ARIA_reinitCarousel() {
  if (_heroCarouselInterval) { clearInterval(_heroCarouselInterval); _heroCarouselInterval = null; }
  var slides = document.querySelectorAll('#heroCarousel .hero-slide');
  if (slides.length < 2) return;
  var cur = 0;
  // garante que só o primeiro slide esteja ativo ao (re)iniciar
  slides.forEach(function(s, i){ s.classList.toggle('active', i === 0); });
  _heroCarouselInterval = setInterval(function() {
    slides[cur].classList.remove('active');
    cur = (cur + 1) % slides.length;
    slides[cur].classList.add('active');
  }, 3000);
}
ARIA_reinitCarousel();

/* ─── HOOKS DE REINICIALIZAÇÃO (chamados por js/spa-nav.js após cada swap) ─── */
// Limpa timers/observers presos ao .page antigo, antes de descartá-lo.
window.ARIA_teardownCore = function () {
  if (_heroCarouselInterval) { clearInterval(_heroCarouselInterval); _heroCarouselInterval = null; }
};
// Reinicializa tudo que vive dentro do .page recém-inserido.
window.ARIA_reinitCore = function () {
  initCurrentPage();     // active-link (via data-page), sticky-nav visível, fade-up
  updateNavTop();
  initFadeUp();
  animateCounters();
  ARIA_reinitCarousel(); // só faz algo na home; no-op nas demais
};

/* Barra "Doe" — slide após 5s, esconde ao rolar, volta após 5s parado */
(function() {
  var bar = document.getElementById('mobile-cta-bar');
  if (!bar) return;
  var scrollTimer = null;
  function mostrar() { bar.classList.add('visible'); }
  function esconder() { bar.classList.remove('visible'); }
  setTimeout(function() {
    mostrar();
    window.addEventListener('scroll', function() {
      esconder();
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(mostrar, 5000);
    }, { passive: true });
  }, 5000);
})();
