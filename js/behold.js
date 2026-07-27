  (() => {
    const d = document;
    const widgets = d.querySelectorAll('behold-widget');

    // Nada de widget nesta página → não carrega o script externo do Behold
    // à toa (antes isso acontecia em toda página do site, mesmo sem feed).
    if (!widgets.length) return;

    let scriptLoaded = false;
    function loadBeholdScript() {
      if (scriptLoaded) return;
      scriptLoaded = true;
      const s = d.createElement('script');
      s.type = 'module';
      s.src = 'https://w.behold.so/widget.js';
      d.head.append(s);
    }

    // Esconde o skeleton colorido padrão do widget assim que ele terminar de
    // carregar (detecta o primeiro <img> real dentro dele), com um limite de
    // segurança de 6s pra não deixar o véu preso caso algo falhe.
    function hideVeil() {
      d.querySelectorAll('.behold-loading-veil').forEach(v => v.classList.add('hidden'));
    }
    function watchForImage(widget) {
      const hasRealImg = () => !!((widget.shadowRoot || widget).querySelector('img'));
      const deadline = Date.now() + 6000;
      (function poll() {
        if (hasRealImg() || Date.now() > deadline) { hideVeil(); return; }
        setTimeout(poll, 150);
      })();
    }

    // Só busca o script (e só então começa a carregar as fotos do Instagram)
    // quando o feed estiver perto de entrar na tela, em vez de na abertura
    // da página — evita competir por banda com o resto do carregamento.
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          io.unobserve(entry.target);
          loadBeholdScript();
          watchForImage(entry.target);
        });
      }, { rootMargin: '600px 0px' }); // começa um pouco antes de aparecer, sem atraso perceptível

      widgets.forEach(function (widget) { io.observe(widget); });
    } else {
      // Fallback sem IntersectionObserver: carrega normalmente.
      loadBeholdScript();
      widgets.forEach(watchForImage);
    }
  })();