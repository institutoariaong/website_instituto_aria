  // Selo Kupim Digital — suporte a toque (mobile): primeiro toque abre e
  // revela o texto, segundo toque no mesmo local segue o link.
  (function(){
    var wrap = document.getElementById('kupim-badge-wrap');
    var badge = document.getElementById('kupim-badge');

    document.querySelectorAll('.kupim-year').forEach(function(el){
      el.textContent = new Date().getFullYear();
    });

    function updateShift(){
      var full = badge.scrollWidth;
      wrap.style.setProperty('--k-shift', Math.max(full - 44, 0) + 'px');
    }
    updateShift();
    window.addEventListener('load', updateShift);
    window.addEventListener('resize', updateShift);
    if(document.fonts && document.fonts.ready){
      document.fonts.ready.then(updateShift);
    }
    requestAnimationFrame(function(){ requestAnimationFrame(updateShift); });

    var isTouch = matchMedia('(hover: none)').matches;
    if(!isTouch) return;

    badge.addEventListener('click', function(e){
      if(!wrap.classList.contains('is-open')){
        e.preventDefault();
        wrap.classList.add('is-open');
        document.addEventListener('click', function closeOnce(ev){
          if(!wrap.contains(ev.target)){
            wrap.classList.remove('is-open');
            document.removeEventListener('click', closeOnce);
          }
        });
      }
    });
  })();

  (function(){
    var projectMonthCursor = new Date();
    projectMonthCursor.setDate(1);

    /*
      Adicione aqui as ações com data confirmada.
      Exemplo:
      { date: '2026-08-15', project: 'Viralatinha', title: 'Feira de adoção' }
    */
    var projectActionEvents = [];

    function projectDateKey(year, month, day){
      return year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    }

    function renderProjectCalendar(){
      var label = document.getElementById('project-month-label');
      var grid = document.getElementById('project-calendar-grid');
      var note = document.getElementById('project-calendar-note');
      if(!label || !grid || !note) return;

      var year = projectMonthCursor.getFullYear();
      var month = projectMonthCursor.getMonth();
      var firstWeekday = new Date(year, month, 1).getDay();
      var monthDays = new Date(year, month + 1, 0).getDate();
      var previousMonthDays = new Date(year, month, 0).getDate();
      var today = new Date();
      var eventsInMonth = 0;

      label.textContent = new Intl.DateTimeFormat('pt-BR', {
        month: 'long',
        year: 'numeric'
      }).format(projectMonthCursor);

      grid.innerHTML = '';

      for(var cell = 0; cell < 42; cell++){
        var displayedDay = cell - firstWeekday + 1;
        var displayedMonth = month;
        var displayedYear = year;
        var outside = false;

        if(displayedDay < 1){
          displayedMonth = month - 1;
          if(displayedMonth < 0){
            displayedMonth = 11;
            displayedYear--;
          }
          displayedDay = previousMonthDays + displayedDay;
          outside = true;
        } else if(displayedDay > monthDays){
          displayedDay -= monthDays;
          displayedMonth = month + 1;
          if(displayedMonth > 11){
            displayedMonth = 0;
            displayedYear++;
          }
          outside = true;
        }

        var key = projectDateKey(displayedYear, displayedMonth, displayedDay);
        var dayEvents = projectActionEvents.filter(function(event){ return event.date === key; });
        if(!outside) eventsInMonth += dayEvents.length;

        var day = document.createElement('div');
        day.className = 'project-calendar-day' + (outside ? ' is-outside' : '');
        if(
          displayedYear === today.getFullYear() &&
          displayedMonth === today.getMonth() &&
          displayedDay === today.getDate()
        ){
          day.className += ' is-today';
        }
        day.setAttribute('aria-label', new Intl.DateTimeFormat('pt-BR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }).format(new Date(displayedYear, displayedMonth, displayedDay)));

        var number = document.createElement('span');
        number.className = 'project-calendar-day-number';
        number.textContent = displayedDay;
        day.appendChild(number);

        dayEvents.forEach(function(event){
          var eventElement = document.createElement('span');
          eventElement.className = 'project-calendar-event';
          eventElement.textContent = event.title;
          eventElement.title = event.project + ' — ' + event.title;
          day.appendChild(eventElement);
        });

        grid.appendChild(day);
      }

      note.textContent = eventsInMonth
        ? eventsInMonth + (eventsInMonth === 1 ? ' ação confirmada neste mês.' : ' ações confirmadas neste mês.')
        : 'Nenhuma ação com data específica cadastrada para este mês. Os projetos contínuos seguem ativos conforme suas agendas.';
    }

    window.setProjectCalendarView = function(view){
      var timelineButton = document.getElementById('project-timeline-tab');
      var monthButton = document.getElementById('project-month-tab');
      var timelinePanel = document.getElementById('project-timeline-panel');
      var monthPanel = document.getElementById('project-month-panel');
      var showMonth = view === 'month';
      if(!timelineButton || !monthButton || !timelinePanel || !monthPanel) return;

      timelineButton.setAttribute('aria-selected', String(!showMonth));
      monthButton.setAttribute('aria-selected', String(showMonth));
      timelinePanel.hidden = showMonth;
      monthPanel.hidden = !showMonth;
      if(showMonth) renderProjectCalendar();
    };

    window.changeProjectMonth = function(offset){
      projectMonthCursor.setMonth(projectMonthCursor.getMonth() + offset);
      renderProjectCalendar();
    };

    // Reinit idempotente pro motor SPA: o calendário só existe dentro do
    // .page de projetos.html, que é trocado via swap. renderProjectCalendar()
    // consulta o DOM por id em tempo de chamada e retorna cedo se o grid não
    // existir, então é seguro chamar em qualquer página. As demais funções
    // (questionário de voluntariado, modais) são globais e consultam o DOM ao
    // vivo, portanto não precisam de reinit.
    window.ARIA_reinitFeatures = function () {
      renderProjectCalendar();
    };

    renderProjectCalendar();
  })();

  (function(){
    var questionnairePreviousFocus = null;
    var questionnairePreviousOverflow = '';

    window.openVolunteerQuestionnaire = function(){
      var modal = document.getElementById('volunteer-questionnaire-modal');
      var form = document.getElementById('volunteer-questionnaire-form');
      var success = document.getElementById('volunteer-questionnaire-success');
      if(!modal || !form || !success) return;

      questionnairePreviousFocus = document.activeElement;
      questionnairePreviousOverflow = document.body.style.overflow;
      form.hidden = false;
      success.hidden = true;
      modal.hidden = false;
      document.body.style.overflow = 'hidden';

      requestAnimationFrame(function(){
        var firstField = document.getElementById('candidate-name');
        if(firstField) firstField.focus();
      });
    };

    window.closeVolunteerQuestionnaire = function(){
      var modal = document.getElementById('volunteer-questionnaire-modal');
      if(!modal) return;
      modal.hidden = true;
      document.body.style.overflow = questionnairePreviousOverflow;
      if(questionnairePreviousFocus && typeof questionnairePreviousFocus.focus === 'function'){
        questionnairePreviousFocus.focus();
      }
    };

    window.closeVolunteerQuestionnaireFromBackdrop = function(event){
      if(event.target === event.currentTarget) closeVolunteerQuestionnaire();
    };

    window.submitVolunteerQuestionnaire = function(event){
      event.preventDefault();
      var form = event.currentTarget;
      var success = document.getElementById('volunteer-questionnaire-success');
      if(!form || !success) return;

      if(!form.checkValidity()){
        form.reportValidity();
        return;
      }

      form.hidden = true;
      success.hidden = false;
      success.setAttribute('tabindex', '-1');
      success.focus();
      success.scrollIntoView({ block: 'start' });
    };

    window.reviewVolunteerQuestionnaire = function(){
      var form = document.getElementById('volunteer-questionnaire-form');
      var success = document.getElementById('volunteer-questionnaire-success');
      if(!form || !success) return;
      success.hidden = true;
      form.hidden = false;
      var firstField = document.getElementById('candidate-name');
      if(firstField) firstField.focus();
    };

    document.addEventListener('keydown', function(event){
      var modal = document.getElementById('volunteer-questionnaire-modal');
      if(event.key === 'Escape' && modal && !modal.hidden){
        closeVolunteerQuestionnaire();
      }
    });
  })();