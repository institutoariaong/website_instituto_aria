  (() => {
    const d = document, s = d.createElement('script');
    s.type = 'module';
    s.src = 'https://w.behold.so/widget.js';
    d.head.append(s);

    // Esconde o skeleton colorido padrão do widget assim que ele terminar de
    // carregar (detecta o primeiro <img> real dentro dele), com um limite de
    // segurança de 5s pra não deixar o véu preso caso algo falhe.
    function hideVeil() {
      d.querySelectorAll('.behold-loading-veil').forEach(v => v.classList.add('hidden'));
    }
    d.querySelectorAll('behold-widget').forEach(function (widget) {
      const hasRealImg = () => !!((widget.shadowRoot || widget).querySelector('img'));
      const deadline = Date.now() + 5000;
      (function poll() {
        if (hasRealImg() || Date.now() > deadline) { hideVeil(); return; }
        setTimeout(poll, 150);
      })();
    });
  })();