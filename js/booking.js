/* ==========================================================================
   booking.js — seat selection & simulated payment for booking.html
   ========================================================================== */

(function () {
  hydrateIcons();

  const params = new URLSearchParams(window.location.search);
  const routeId = params.get('route');
  const vehicleId = params.get('vehicle');
  const depIndex = parseInt(params.get('dep'), 10) || 0;

  const route = MT.getRoute(routeId);
  const vehicle = route && MT.getVehicle(routeId, vehicleId);

  const main = document.getElementById('booking-main');
  if (!route || !vehicle) {
    main.innerHTML = '<div class="empty-state"><span data-icon="alert"></span>' +
      '<h3>We could not find that vehicle</h3><p>It may have already departed. Try searching again.</p>' +
      '<a class="btn btn-primary" href="index.html">Back to search</a></div>';
    hydrateIcons(main);
    return;
  }

  const sacco = MT.saccoOf(vehicle);
  const fare = MT.fareFor(route, vehicle);
  const dep = { index: depIndex, atMinutes: (5 * 60) + vehicle.offset + depIndex * vehicle.headway };
  const seats = MT.seatMapFor(vehicle, depIndex);
  const query = MT.loadQuery();
  const fromStop = (query && query.from) || route.stops[0];
  const toStop = (query && query.to) || route.stops[route.stops.length - 1];

  document.getElementById('vehicle-heading').textContent = sacco.name + ' · ' + vehicle.plate;

  /* ---- seat grid ---- */
  const grid = document.getElementById('seat-grid');
  let html = '';
  for (let i = 0; i < seats.length; i += 4) {
    const chunk = seats.slice(i, i + 4);
    chunk.slice(0, 2).forEach(function (s) { html += seatButtonHtml(s); });
    html += '<div class="seat-gap"></div>';
    chunk.slice(2, 4).forEach(function (s) { html += seatButtonHtml(s); });
  }
  grid.innerHTML = html;

  function seatButtonHtml(seat) {
    return '<button type="button" class="seat-btn" data-seat="' + seat.number + '"' +
      (seat.taken ? ' disabled' : '') + '>' + seat.number + '</button>';
  }

  let selectedSeat = null;
  grid.addEventListener('click', function (e) {
    const btn = e.target.closest('.seat-btn');
    if (!btn || btn.disabled) return;
    grid.querySelectorAll('.seat-btn.selected').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
    selectedSeat = parseInt(btn.dataset.seat, 10);
    document.getElementById('pay-btn').disabled = false;
    document.getElementById('seat-hint').textContent = 'Seat ' + selectedSeat + ' selected — payable at KES ' + fare + '.';
  });

  /* ---- trip summary ---- */
  document.getElementById('summary-list').innerHTML =
    row('Route', route.no + ' · ' + route.name) +
    row('From', fromStop) +
    row('To', toStop) +
    row('Departs', MT.formatClock(dep.atMinutes)) +
    row('Vehicle', vehicle.plate + ' (' + vehicle.seats + '-seater)');

  function row(label, value) {
    return '<div class="row"><span>' + label + '</span><span>' + value + '</span></div>';
  }
  document.getElementById('fare-total').textContent = 'KES ' + fare;

  /* ---- payment simulation ---- */
  const form = document.getElementById('passenger-form');
  const veil = document.getElementById('modal-veil');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!selectedSeat) return;

    const name = document.getElementById('pax-name').value.trim();
    const phone = document.getElementById('pax-phone').value.trim();
    if (!name || !phone) return;

    document.getElementById('mpesa-phone').textContent = phone;
    document.getElementById('mpesa-amount').textContent = 'KES ' + fare;
    document.getElementById('mpesa-step-prompt').hidden = false;
    document.getElementById('mpesa-step-success').hidden = true;
    veil.hidden = false;

    setTimeout(function () {
      document.getElementById('mpesa-step-prompt').hidden = true;
      document.getElementById('mpesa-step-success').hidden = false;

      const ticket = {
        id: MT.makeBookingRef(),
        routeId: route.id, routeNo: route.no, routeName: route.name,
        vehicleId: vehicle.id, plate: vehicle.plate, saccoName: sacco.name, saccoColor: sacco.color,
        seat: selectedSeat, fare: fare,
        from: fromStop, to: toStop,
        departAt: dep.atMinutes, corridor: route.corridor,
        passengerName: name, phone: phone,
        createdAt: Date.now()
      };
      MT.saveTicket(ticket);
      MT.addNotification({ title: 'Booking confirmed', message: 'Ticket ' + ticket.id + ' is ready for ' + ticket.from + ' to ' + ticket.to + '.', icon: 'ticket' });

      setTimeout(function () {
        window.location.href = 'ticket.html?id=' + encodeURIComponent(ticket.id);
      }, 1100);
    }, 2200);
  });
})();
