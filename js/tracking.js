/* ==========================================================================
   tracking.js — simulated live tracking for tracking.html
   ========================================================================== */

(function () {
  hydrateIcons();

  const params = new URLSearchParams(window.location.search);
  const routeSel = document.getElementById('route-select');
  const vehicleSel = document.getElementById('vehicle-select');
  const playBtn = document.getElementById('play-btn');
  const playLabel = document.getElementById('play-label');
  const replayBtn = document.getElementById('replay-btn');

  routeSel.innerHTML = ROUTES.map(function (r) {
    return '<option value="' + r.id + '">' + r.no + ' · ' + r.name + '</option>';
  }).join('');

  const initialRoute = params.get('route') && MT.getRoute(params.get('route')) ? params.get('route') : ROUTES[0].id;
  routeSel.value = initialRoute;

  function fillVehicles(routeId, preferId) {
    const route = MT.getRoute(routeId);
    vehicleSel.innerHTML = route.vehicles.map(function (v) {
      const sacco = MT.saccoOf(v);
      return '<option value="' + v.id + '">' + sacco.name + ' · ' + v.plate + '</option>';
    }).join('');
    if (preferId && route.vehicles.some(function (v) { return v.id === preferId; })) {
      vehicleSel.value = preferId;
    }
  }
  fillVehicles(initialRoute, params.get('vehicle'));

  /* ---------------------------------------------------------- map setup */

  const map = L.map('map', { zoomControl: true, attributionControl: true }).setView([-1.24, 36.87], 11);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 19
  }).addTo(map);

  let polyline = null;
  let stopMarkers = [];
  let vehicleMarker = null;
  let animFrame = null;
  let animStart = null;
  let progress = 0; // 0..1
  let playing = true;
  const DURATION_MS = 42000;

  const vehicleIcon = L.divIcon({ className: '', html: '<div class="vehicle-marker"></div>', iconSize: [20, 20] });

  function loadScenario() {
    cancelAnimationFrame(animFrame);
    const route = MT.getRoute(routeSel.value);
    const vehicle = MT.getVehicle(routeSel.value, vehicleSel.value);
    const sacco = MT.saccoOf(vehicle);
    const stopNames = route.stops; // outer -> CBD
    const latlngs = stopNames.map(function (name) { return STOPS[name]; });

    if (polyline) map.removeLayer(polyline);
    stopMarkers.forEach(function (m) { map.removeLayer(m); });
    stopMarkers = [];
    if (vehicleMarker) map.removeLayer(vehicleMarker);

    polyline = L.polyline(latlngs, { color: sacco.color, weight: 4, opacity: 0.85 }).addTo(map);
    map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

    stopNames.forEach(function (name, i) {
      const m = L.circleMarker(STOPS[name], {
        radius: i === 0 || i === stopNames.length - 1 ? 6 : 4,
        color: '#0F1526', weight: 2, fillColor: '#F6F4EC', fillOpacity: 1
      }).addTo(map).bindPopup('<strong>' + name + '</strong>');
      stopMarkers.push(m);
    });

    vehicleMarker = L.marker(latlngs[0], { icon: vehicleIcon }).addTo(map);

    /* cumulative distance along the route, for even real-world-paced motion */
    const segLengths = [];
    let total = 0;
    for (let i = 0; i < latlngs.length - 1; i++) {
      const d = L.latLng(latlngs[i]).distanceTo(L.latLng(latlngs[i + 1]));
      segLengths.push(d);
      total += d;
    }

    document.getElementById('active-route-badge').textContent = route.no;
    document.getElementById('active-route-name').textContent = route.name;
    document.getElementById('active-vehicle-line').textContent = sacco.name + ' · ' + vehicle.plate + ' · ' + vehicle.seats + '-seater';

    const stopsListEl = document.getElementById('stops-list');
    stopsListEl.innerHTML = stopNames.map(function (name, i) {
      return '<li class="stop-item" data-index="' + i + '">' +
        '<span class="stop-dot"></span>' +
        '<div class="stop-name">' + name + '</div>' +
        '<div class="stop-eta" data-eta="' + i + '">—</div>' +
      '</li>';
    }).join('');

    progress = 0;
    animStart = null;

    function positionAt(p) {
      const dist = p * total;
      let covered = 0;
      for (let i = 0; i < segLengths.length; i++) {
        if (covered + segLengths[i] >= dist || i === segLengths.length - 1) {
          const segP = segLengths[i] > 0 ? (dist - covered) / segLengths[i] : 0;
          const a = L.latLng(latlngs[i]), b = L.latLng(latlngs[i + 1]);
          return { lat: a.lat + (b.lat - a.lat) * segP, lng: a.lng + (b.lng - a.lng) * segP, segIndex: i, segP: segP };
        }
        covered += segLengths[i];
      }
      return { lat: latlngs[latlngs.length - 1][0], lng: latlngs[latlngs.length - 1][1], segIndex: segLengths.length - 1, segP: 1 };
    }

    function updateStopsList(p) {
      const pos = positionAt(p);
      const items = stopsListEl.querySelectorAll('.stop-item');
      items.forEach(function (item, i) {
        item.classList.remove('passed', 'current');
        const etaEl = item.querySelector('.stop-eta');
        if (i < pos.segIndex || (i === pos.segIndex && pos.segP > 0.97)) {
          item.classList.add('passed');
          etaEl.textContent = 'Passed';
        } else if (i === pos.segIndex + (pos.segP > 0.97 ? 1 : 0) || (i === pos.segIndex && pos.segP <= 0.97 && i === pos.segIndex)) {
          if (i === pos.segIndex) {
            item.classList.add('current');
            const remainingMs = (1 - p) > 0 ? DURATION_MS * ((1 - p)) : 0;
            etaEl.textContent = i === stopNames.length - 1 ? 'Arriving' : ('~' + Math.max(1, Math.round((segLengths[i] * (1 - pos.segP) / total) * (DURATION_MS / 1000))) + 's to next stop');
          }
        } else {
          const remainMs = estimateEta(i, p);
          etaEl.textContent = remainMs <= 0 ? 'Arriving' : ('ETA ~' + Math.round(remainMs / 1000) + 's');
        }
      });
    }

    function estimateEta(stopIndex, p) {
      const distAtStop = segLengths.slice(0, stopIndex).reduce(function (a, b) { return a + b; }, 0);
      const remainingDist = distAtStop - (p * total);
      if (remainingDist <= 0) return 0;
      return (remainingDist / total) * DURATION_MS;
    }

    function step(ts) {
      if (!animStart) animStart = ts - progress * DURATION_MS;
      if (playing) {
        progress = Math.min(1, (ts - animStart) / DURATION_MS);
      }
      const pos = positionAt(progress);
      vehicleMarker.setLatLng([pos.lat, pos.lng]);
      updateStopsList(progress);

      if (progress < 1) {
        animFrame = requestAnimationFrame(step);
      } else {
        playing = false;
        playLabel.textContent = 'Replay';
        playBtn.querySelector('.icon').outerHTML = icon('replay');
      }
    }
    animFrame = requestAnimationFrame(step);
  }

  routeSel.addEventListener('change', function () { fillVehicles(routeSel.value); loadScenario(); playing = true; syncPlayButton(); });
  vehicleSel.addEventListener('change', loadScenario);

  function syncPlayButton() {
    playLabel.textContent = playing ? 'Pause' : 'Play';
    playBtn.querySelector('.icon').outerHTML = icon(playing ? 'pause' : 'play');
  }

  playBtn.addEventListener('click', function () {
    if (progress >= 1) {
      progress = 0; animStart = null; playing = true;
      syncPlayButton();
      loadScenario();
      return;
    }
    playing = !playing;
    animStart = null; // recalibrate against current progress
    syncPlayButton();
  });

  replayBtn.addEventListener('click', function () {
    progress = 0; animStart = null; playing = true;
    syncPlayButton();
    loadScenario();
  });

  loadScenario();
})();
