/* ==========================================================================
   results.js — populate results.html from a saved search or a direct route
   ========================================================================== */

(function () {
  hydrateIcons();

  const params = new URLSearchParams(window.location.search);
  const directRouteId = params.get('route');
  const query = MT.loadQuery();

  let matches = []; // [{route, reversed}]
  let headingFrom = null, headingTo = null;

  if (directRouteId) {
    const r = MT.getRoute(directRouteId);
    if (r) matches = [{ route: r, reversed: false }];
  } else if (query) {
    matches = MT.findRoutes(query.from, query.to);
    headingFrom = query.from; headingTo = query.to;
  }

  const countEl = document.getElementById('results-count');
  const titleEl = document.getElementById('results-title');
  const listEl = document.getElementById('results-list');
  const emptyEl = document.getElementById('empty-state');

  if (!matches.length) {
    countEl.textContent = headingFrom ? (headingFrom + ' → ' + headingTo) : 'No route selected';
    titleEl.textContent = 'No direct matatu found';
    emptyEl.hidden = false;
    document.getElementById('fallback-routes').innerHTML = ROUTES.slice(0, 6).map(function (r) {
      return '<a class="route-chip" href="results.html?route=' + r.id + '">' +
        '<span class="route-badge">' + r.no + '</span> ' + r.name + '</a>';
    }).join('');
    return;
  }

  const totalVehicles = matches.reduce(function (n, m) { return n + m.route.vehicles.length; }, 0);
  countEl.textContent = (headingFrom ? headingFrom + ' → ' + headingTo : 'Direct link') +
    ' · ' + totalVehicles + ' vehicle' + (totalVehicles === 1 ? '' : 's') + ' found';
  titleEl.textContent = matches.length === 1 ? matches[0].route.name : 'Matatus on your route';

  const amenityIcon = { wifi: 'wifi', usb: 'usb', music: 'music' };
  const amenityLabel = { wifi: 'Wi-Fi', usb: 'USB charging', music: 'Music' };

  listEl.innerHTML = matches.map(function (m) {
    const route = m.route;
    const stopsInOrder = MT.orderedStops(route, m.reversed);

    const rows = route.vehicles.map(function (vehicle) {
      const sacco = MT.saccoOf(vehicle);
      const deps = MT.nextDepartures(vehicle, 1);
      const dep = deps[0];
      const mins = MT.minutesUntil(dep.atMinutes);
      const departText = mins <= 1 ? 'Boarding' : ('in ' + mins + ' min');
      const seatsLeft = MT.availableSeatCount(vehicle, dep.index);
      const fillPct = Math.round(((vehicle.seats - seatsLeft) / vehicle.seats) * 100);
      const fillColor = seatsLeft === 0 ? 'var(--coral)' : (seatsLeft <= 3 ? 'var(--marigold)' : 'var(--teal)');
      const fare = MT.fareFor(route, vehicle);

      return '<div class="vehicle-row" style="border-left-color:' + sacco.color + '">' +
        '<div class="vehicle-sacco">' +
          '<strong>' + sacco.name + '</strong>' +
          '<span class="plate">' + vehicle.plate + ' · ' + vehicle.seats + '-seater</span>' +
        '</div>' +
        '<div class="vehicle-amenities">' +
          vehicle.amenities.map(function (a) {
            return '<span class="tag"><span data-icon="' + amenityIcon[a] + '"></span>' + amenityLabel[a] + '</span>';
          }).join('') +
        '</div>' +
        '<div class="vehicle-metrics">' +
          '<div class="vehicle-metric"><span class="label">FARE</span><span class="value">KES ' + fare + '</span></div>' +
          '<div class="vehicle-metric"><span class="label">DEPARTS</span><span class="value">' + departText + '</span></div>' +
          '<div class="vehicle-metric">' +
            '<span class="label">SEATS LEFT</span>' +
            '<span class="value">' + (seatsLeft === 0 ? 'Full' : seatsLeft + ' / ' + vehicle.seats) + '</span>' +
            '<div class="seat-bar"><div class="seat-bar-fill" style="width:' + fillPct + '%;background:' + fillColor + '"></div></div>' +
          '</div>' +
        '</div>' +
        '<a class="btn btn-primary btn-sm" href="' + (seatsLeft === 0 ? '#' : 'booking.html?route=' + route.id + '&vehicle=' + vehicle.id + '&dep=' + dep.index) + '"' +
          (seatsLeft === 0 ? ' aria-disabled="true" onclick="return false;" style="opacity:.5;cursor:not-allowed"' : '') + '>' +
          (seatsLeft === 0 ? 'Full' : 'Select seat') + ' <span data-icon="arrow-right"></span>' +
        '</a>' +
      '</div>';
    }).join('');

    return '<section class="route-group">' +
      '<div class="route-group-head">' +
        '<span class="route-badge">' + route.no + '</span>' +
        '<div><h2>' + route.name + '</h2><span class="corridor">' + route.corridor + ' · ' + stopsInOrder.join(' → ') + '</span></div>' +
        '<a class="btn btn-ghost btn-sm" style="margin-left:auto" href="tracking.html?route=' + route.id + '"><span data-icon="pin"></span> Track on map</a>' +
      '</div>' +
      rows +
    '</section>';
  }).join('');

  hydrateIcons(listEl);
})();
