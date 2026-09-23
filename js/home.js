/* ==========================================================================
   home.js — search form behaviour for index.html
   ========================================================================== */

(function () {
  hydrateIcons();

  const fromSel = document.getElementById('from');
  const toSel = document.getElementById('to');
  const form = document.getElementById('search-form');
  const errorEl = document.getElementById('search-error');
  const swapBtn = document.getElementById('swap-btn');
  const tripName = document.getElementById('trip-name');
  const saveTripBtn = document.getElementById('save-trip-btn');
  const saveTripStatus = document.getElementById('save-trip-status');
  const savedTripsSection = document.getElementById('saved-trips-section');
  const savedTripList = document.getElementById('saved-trip-list');

  const stopNames = Object.keys(STOPS).sort(function (a, b) {
    if (a === 'Nairobi CBD') return 1;
    if (b === 'Nairobi CBD') return -1;
    return a.localeCompare(b);
  });

  function fillSelect(sel, selected) {
    sel.innerHTML = stopNames.map(function (name) {
      return '<option value="' + name + '"' + (name === selected ? ' selected' : '') + '>' + name + '</option>';
    }).join('');
  }

  const savedQuery = MT.loadQuery();
  fillSelect(fromSel, (savedQuery && savedQuery.from) || 'Ruiru');
  fillSelect(toSel, (savedQuery && savedQuery.to) || 'Nairobi CBD');

  swapBtn.addEventListener('click', function () {
    const a = fromSel.value;
    fromSel.value = toSel.value;
    toSel.value = a;
    swapBtn.classList.add('spun');
    setTimeout(function () { swapBtn.classList.remove('spun'); }, 200);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (fromSel.value === toSel.value) {
      errorEl.hidden = false;
      return;
    }
    errorEl.hidden = true;
    MT.saveQuery({
      from: fromSel.value,
      to: toSel.value,
      when: document.getElementById('depart-time').value,
      seats: document.getElementById('seats-needed').value
    });
    window.location.href = 'results.html';
  });

  function currentTrip() {
    return {
      name: tripName.value.trim() || (fromSel.value + ' to ' + toSel.value),
      from: fromSel.value,
      to: toSel.value,
      when: document.getElementById('depart-time').value,
      seats: document.getElementById('seats-needed').value
    };
  }

  function applyTrip(trip) {
    fromSel.value = trip.from;
    toSel.value = trip.to;
    document.getElementById('depart-time').value = trip.when || 'now';
    document.getElementById('seats-needed').value = trip.seats || '1';
    tripName.value = trip.name || '';
    saveTripStatus.textContent = 'Trip loaded. Search when you are ready.';
  }

  function renderSavedTrips() {
    const trips = MT.loadSavedTrips();
    savedTripsSection.hidden = trips.length === 0;
    savedTripList.innerHTML = trips.map(function (trip) {
      return '<article class="saved-trip-card">' +
        '<div class="saved-trip-icon">' + icon('route') + '</div>' +
        '<div class="saved-trip-info"><strong>' + escapeText(trip.name) + '</strong><span>' + escapeText(trip.from) + ' <b>to</b> ' + escapeText(trip.to) + '</span></div>' +
        '<button type="button" class="saved-trip-use" data-trip-id="' + trip.id + '">Use trip</button>' +
        '<button type="button" class="saved-trip-delete" data-delete-trip="' + trip.id + '" aria-label="Delete ' + escapeText(trip.name) + '">' + icon('trash') + '</button>' +
        '</article>';
    }).join('');

    savedTripList.querySelectorAll('[data-trip-id]').forEach(function (button) {
      button.addEventListener('click', function () {
        const trip = MT.loadSavedTrips().find(function (saved) { return saved.id === button.dataset.tripId; });
        if (trip) applyTrip(trip);
      });
    });
    savedTripList.querySelectorAll('[data-delete-trip]').forEach(function (button) {
      button.addEventListener('click', function () {
        MT.removeSavedTrip(button.dataset.deleteTrip);
        renderSavedTrips();
      });
    });
  }

  function escapeText(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char];
    });
  }

  saveTripBtn.addEventListener('click', function () {
    if (fromSel.value === toSel.value) {
      errorEl.hidden = false;
      saveTripStatus.textContent = 'Choose two different stages first.';
      return;
    }
    errorEl.hidden = true;
    MT.saveSavedTrip(currentTrip());
    MT.addNotification({ title: 'Trip saved', message: currentTrip().name + ' is ready from your shortcuts.', icon: 'route' });
    saveTripStatus.textContent = 'Trip saved on this device.';
    renderSavedTrips();
  });
  renderSavedTrips();

  /* ---- popular routes strip: first 6 routes by no. of vehicles ---- */
  const popular = ROUTES.slice().sort(function (a, b) { return b.vehicles.length - a.vehicles.length; }).slice(0, 6);
  document.getElementById('popular-routes').innerHTML = popular.map(function (r) {
    return '<a class="route-chip" href="results.html?route=' + r.id + '">' +
      '<span class="route-badge">' + r.no + '</span> ' + r.name + '</a>';
  }).join('');

  /* ---- hero media slider ---- */
  const slides = Array.from(document.querySelectorAll('.hero-slide'));
  const dots = Array.from(document.querySelectorAll('.hero-dots button'));
  const slideLabel = document.getElementById('hero-slide-label');
  const labels = ['The road ahead, less uncertain.', 'Every stage, easier to read.', 'Your next ride is already moving.'];
  let activeSlide = 0;
  let slideTimer;

  function showSlide(index) {
    activeSlide = index;
    slides.forEach(function (slide, slideIndex) { slide.classList.toggle('is-active', slideIndex === index); });
    dots.forEach(function (dot, dotIndex) { dot.classList.toggle('is-active', dotIndex === index); });
    if (slideLabel) slideLabel.textContent = labels[index];
    slides.forEach(function (slide) {
      const video = slide.querySelector('video');
      if (video && slide.classList.contains('is-active')) video.play().catch(function () {});
      if (video && !slide.classList.contains('is-active')) video.pause();
    });
  }

  function startSlider() {
    window.clearInterval(slideTimer);
    slideTimer = window.setInterval(function () { showSlide((activeSlide + 1) % slides.length); }, 6500);
  }

  dots.forEach(function (dot, index) {
    dot.addEventListener('click', function () { showSlide(index); startSlider(); });
  });
  if (slides.length > 1) startSlider();
})();
