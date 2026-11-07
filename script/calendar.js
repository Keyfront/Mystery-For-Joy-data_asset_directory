(function(){
      var calendarConfig = {
        months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
        selectedMonth: 'November',
        selectedYear: 2026
      };
      // the calendar config is made to be easy to edit but still may can content issues... 

      var monthIndex = calendarConfig.months.indexOf(calendarConfig.selectedMonth);
      if (monthIndex === -1) {
        monthIndex = new Date().getMonth();
      }

      var selectedYear = Number(calendarConfig.selectedYear) || new Date().getFullYear();
      var monthName = calendarConfig.months[monthIndex];
      var monthShortName = monthName.slice(0, 3);

      document.querySelector('.month-script').textContent = monthName;
      document.querySelector('.month-year').textContent = selectedYear;

      var scheduleData = {
        "7": [
          {time: '20:00 - 20:30 UTC', title: 'MMD Roumoules medium wave broadcast', cls: 'pre-recorded', freq: '1467 kHz', desc: 'Broadcast on a brand new transmitter in Roumoules, France. This is a pre-recorded test broadcast in the medium wave band.'},
          {time: '22:30 - 23:00 UTC', title: 'WRMI broadcast', freq: '15770 kHz', desc: 'WRMI Okeechobee, 100 kW. For North America.'}
        ],
        "14": [
          {time: '21:00 - 22:00 UTC', title: 'Pre-recorded broadcast from Armenia - 7425 kHz', cls: 'pre-recorded', freq: '7425 kHz', desc: 'A pre-recorded broadcast from Armenia on 7425 kHz.'},
          {time: '17:00 - 18:00 UTC', title: 'Pre-recorded English broadcast from RC292 - 9670 kHz', cls: 'pre-recorded', freq: '9670 kHz', desc: 'A pre-recorded broadcast from RC292 on 9670 kHz.'},
          {time: '18:00 - 19:00 UTC', title: 'Pre-recorded French broadcast from RC292 - 9670 kHz', cls: 'pre-recorded', freq: '9670 kHz', desc: 'A pre-recorded broadcast from RC292 on 9670 kHz.'},
          {time: '22:30 - 23:00 UTC', title: 'WRMI broadcast', freq: '15770 kHz', desc: 'WRMI Okeechobee, 100 kW. For North America.'}
        ],
        "28": [
          {time: '21:00 - 22:00 UTC', title: 'Pre-recorded broadcast from Armenia - 7425 kHz', cls: 'pre-recorded', freq: '7425 kHz', desc: 'A pre-recorded broadcast from Armenia on 7425 kHz.'},
          {time: '22:30 - 23:00 UTC', title: 'WRMI broadcast', freq: '15770 kHz', desc: 'WRMI Okeechobee, 100 kW. For North America.'}
        ],
        // WRMI:
        "2": [
          {time: '02:30 - 03:00 UTC', title: 'WRMI broadcast', freq: '5850 kHz', desc: 'WRMI Okeechobee, 100 kW. For North America.'}
        ],
        "9": [
          {time: '02:30 - 03:00 UTC', title: 'WRMI broadcast', freq: '5850 kHz', desc: 'WRMI Okeechobee, 100 kW. For North America.'}
        ],
        "16": [
          {time: '02:30 - 03:00 UTC', title: 'WRMI broadcast', freq: '5850 kHz', desc: 'WRMI Okeechobee, 100 kW. For North America.'}
        ],
        "21": [
          {time: '22:30 - 23:00 UTC', title: 'WRMI broadcast', freq: '15770 kHz', desc: 'WRMI Okeechobee, 100 kW. For North America.'}
        ],
        "23": [
          {time: '02:30 - 03:00 UTC', title: 'WRMI broadcast', freq: '5850 kHz', desc: 'WRMI Okeechobee, 100 kW. For North America.'}
        ],
        "30": [
          {time: '02:30 - 03:00 UTC', title: 'WRMI broadcast', freq: '5850 kHz', desc: 'WRMI Okeechobee, 100 kW. For North America.'}
        ]
      };

      function buildCalendar(){
        var grid = document.getElementById('monthGrid');
        if (!grid) return;

        grid.innerHTML = '';

        var firstOfMonth = new Date(selectedYear, monthIndex, 1);
        var daysInMonth = new Date(selectedYear, monthIndex + 1, 0).getDate();
        var firstWeekday = (firstOfMonth.getDay() + 6) % 7;
        var totalCells = 42;

        for (let i = 0; i < totalCells; i++) {
          let dayNumber = i - firstWeekday + 1;
          let currentDayNumber = dayNumber;
          let isCurrentMonth = currentDayNumber > 0 && currentDayNumber <= daysInMonth;
          let cellDate = new Date(selectedYear, monthIndex, currentDayNumber);
          let displayDay = isCurrentMonth ? currentDayNumber : cellDate.getDate();

          let cell = document.createElement('div');
          cell.className = 'calendar-cell' + (isCurrentMonth ? '' : ' muted');

          var dateNumber = document.createElement('span');
          dateNumber.className = 'date-number';
          dateNumber.textContent = displayDay;
          cell.appendChild(dateNumber);

          if (isCurrentMonth) {
            let events = scheduleData[String(currentDayNumber)];
            if (events && events.length) {
              let details = document.createElement('div');
              details.className = 'day-details';
              let ul = document.createElement('ul');

              events.forEach(function(ev){
                let li = document.createElement('li');
                li.className = 'time-slot' + (ev.cls ? ' ' + ev.cls : '');
                li.textContent = ev.time + ' — ' + ev.title + (ev.freq ? (' | ' + ev.freq) : '');
                li.style.cursor = 'pointer';
                li.addEventListener('click', function(evt){
                  evt.stopPropagation();
                  openSlotModal(ev, currentDayNumber, monthShortName);
                });
                ul.appendChild(li);

                let ind = document.createElement('div');
                ind.className = 'slot-indicator' + (ev.cls ? ' ' + ev.cls : '');
                ind.title = ev.time + ' — ' + ev.title;

                if (!cell.querySelector(':scope .slot-indicators')) {
                  let indicatorRow = document.createElement('div');
                  indicatorRow.className = 'slot-indicators';
                  cell.appendChild(indicatorRow);
                }

                cell.querySelector(':scope .slot-indicators').appendChild(ind);
              });

              details.appendChild(ul);
              cell.appendChild(details);
            }
          }

          grid.appendChild(cell);
        }
      }

      function renderAppointments(){
        var appList = document.getElementById('appointmentsList');
        if (!appList) return;
        appList.innerHTML = '';

        Object.keys(scheduleData).forEach(function(date){
          scheduleData[date].forEach(function(ev){
            var li = document.createElement('li');
            li.textContent = date + ' ' + monthShortName + ' — ' + ev.time + ' — ' + ev.title + (ev.freq ? (' (' + ev.freq + ')') : '');
            appList.appendChild(li);
          });
        });
      }

      buildCalendar();
      renderAppointments();

      document.addEventListener('click', function(e){
        var cell = e.target.closest('.calendar-cell');
        if(!cell){
          return;
        }
        var dateNum = cell.querySelector('.date-number');
        if(!dateNum) return;
        var day = Number(dateNum.textContent);
        if(isNaN(day)) return;
        var events = scheduleData[String(day)];
        if(events && events.length){
          openDayModal(day, events);
        }
      }, false);

      function openSlotModal(ev, date, monthLabel){
        var modal = document.getElementById('slotModal');
        modal.querySelector('#modalTitle').textContent = ev.title || '';
        modal.querySelector('#modalTime').textContent = (date ? (date + ' ' + monthLabel + ' — ') : '') + (ev.time || '');
        modal.querySelector('#modalFreq').textContent = ev.freq || '';
        modal.querySelector('#modalDesc').textContent = ev.desc || '';
        modal.classList.add('show');
        modal.setAttribute('aria-hidden','false');
      }

      function openDayModal(day, events){
        var modal = document.getElementById('dayModal');
        modal.querySelector('#dayModalTitle').textContent = day + ' ' + monthShortName + ' — Hourly schedule';
        var body = modal.querySelector('#dayModalBody');
        body.innerHTML = '';

        var labels = document.createElement('div');
        labels.className = 'labels';
        for(var h=0; h<24; h++){
          var lbl = document.createElement('div');
          lbl.className = 'time-cell';
          lbl.textContent = (h<10? '0'+h : h) + ':00';
          lbl.style.gridRow = (h*4 + 1) + ' / span 4';
          labels.appendChild(lbl);
        }

        var timeline = document.createElement('div');
        timeline.className = 'timeline';
        for(var r=0;r<96;r++){ var m = document.createElement('div'); timeline.appendChild(m); }

        body.appendChild(labels);
        body.appendChild(timeline);

        modal.classList.add('show');
        modal.setAttribute('aria-hidden','false');

        events.forEach(function(ev){
          var times = (ev.time || '').split('-');
          if(times.length < 2) return;
          var startStr = times[0].trim().split(' ')[0];
          var endStr = times[1].trim().split(' ')[0];
          var sParts = startStr.split(':');
          var eParts = endStr.split(':');
          var sHour = parseInt(sParts[0]||0,10);
          var sMin = parseInt(sParts[1]||0,10);
          var eHour = parseInt(eParts[0]||0,10);
          var eMin = parseInt(eParts[1]||0,10);
          var startIndex = (sHour*4) + Math.round(sMin/15) + 1; 
          var endIndex = (eHour*4) + Math.round(eMin/15) + 1;
          if(endIndex <= startIndex) endIndex = startIndex + 1;

          var b = document.createElement('div');
          b.className = 'program-block' + (ev.cls ? ' ' + ev.cls : '');
          b.innerHTML = '<strong>' + (ev.time||'') + '</strong><div style="font-size:0.92em;opacity:0.95;margin-top:4px;">' + (ev.title||'') + '</div>';
          b.title = ev.desc || '';
          b.style.cursor = 'pointer';
          b.style.gridRow = startIndex + ' / ' + endIndex;
          b.addEventListener('click', function(evt){ evt.stopPropagation(); openSlotModal(ev, day, monthShortName); });
          timeline.appendChild(b);
        });
      }

      var modalEl = document.getElementById('slotModal');
      modalEl.querySelector('.modal-close').addEventListener('click', function(){ modalEl.classList.remove('show'); modalEl.setAttribute('aria-hidden','true'); });
      modalEl.querySelector('.modal-backdrop').addEventListener('click', function(){ modalEl.classList.remove('show'); modalEl.setAttribute('aria-hidden','true'); });
      var dayModalEl = document.getElementById('dayModal');
      dayModalEl.querySelector('.modal-close').addEventListener('click', function(){ dayModalEl.classList.remove('show'); dayModalEl.setAttribute('aria-hidden','true'); });
      dayModalEl.querySelector('.modal-backdrop').addEventListener('click', function(){ dayModalEl.classList.remove('show'); dayModalEl.setAttribute('aria-hidden','true'); });

      var calSelector = document.getElementById('calendarSelector');
      var internalCal = document.getElementById('internalCalendar');
      var elfCal = document.getElementById('elfsightContainer');
      if(calSelector){
        calSelector.addEventListener('change', function(e){
          var val = calSelector.value;
          if(val === 'elfsight'){
            internalCal.style.display = 'none';
            elfCal.style.display = '';
          } else {
            internalCal.style.display = '';
            elfCal.style.display = 'none';
          }
        });
      }
    })();