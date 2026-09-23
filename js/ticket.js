/* ==========================================================================
   ticket.js — render a saved ticket with a real QR code
   ========================================================================== */

(function () {
  hydrateIcons();

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const ticket = id && MT.getTicket(id);

  const mount = document.getElementById('ticket-mount');
  const actions = document.getElementById('ticket-actions');
  const intro = document.getElementById('ticket-intro');

  if (!ticket) {
    intro.hidden = true;
    document.getElementById('no-ticket').hidden = false;
    return;
  }

  const payload = JSON.stringify({
    ref: ticket.id, route: ticket.routeNo, seat: ticket.seat,
    plate: ticket.plate, from: ticket.from, to: ticket.to
  });

  const qr = qrcode(0, 'M');
  qr.addData(payload);
  qr.make();
  const qrSvg = qr.createSvgTag(4, 0);

  mount.innerHTML =
    '<div class="ticket-card">' +
      '<div class="ticket-top">' +
        '<div>' +
          '<span class="ticket-route-no">' + ticket.routeNo + '</span>' +
          '<div class="ticket-sacco">' + ticket.saccoName + '</div>' +
          '<div class="ticket-plate">' + ticket.plate + ' · ' + ticket.corridor + '</div>' +
        '</div>' +
        '<span class="ticket-badge">PAID · SIMULATED</span>' +
      '</div>' +
      '<div class="ticket-route-line">' +
        '<div class="ticket-stop"><div class="label">FROM</div><div class="name">' + ticket.from + '</div></div>' +
        '<span class="ticket-track-icon" data-icon="bus"></span>' +
        '<div class="ticket-stop to"><div class="label">TO</div><div class="name">' + ticket.to + '</div></div>' +
      '</div>' +
      '<div class="ticket-tear"></div>' +
      '<div class="ticket-bottom">' +
        '<div class="ticket-qr">' + qrSvg + '</div>' +
        '<div class="ticket-details">' +
          '<div><div class="label">SEAT</div><div class="value">' + ticket.seat + '</div></div>' +
          '<div><div class="label">FARE PAID</div><div class="value">KES ' + ticket.fare + '</div></div>' +
          '<div><div class="label">DEPARTS</div><div class="value">' + MT.formatClock(ticket.departAt) + '</div></div>' +
          '<div><div class="label">PASSENGER</div><div class="value">' + ticket.passengerName + '</div></div>' +
          '<div class="ref"><div class="label">BOOKING REFERENCE</div><div class="value">' + ticket.id + '</div></div>' +
        '</div>' +
      '</div>' +
    '</div>';

  hydrateIcons(mount);
  actions.hidden = false;
  document.getElementById('track-link').href = 'tracking.html?route=' + ticket.routeId + '&vehicle=' + ticket.vehicleId;
  document.getElementById('print-btn').addEventListener('click', function () { window.print(); });
})();
