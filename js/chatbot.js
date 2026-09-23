/* Matatu Tracker help bot - local, no backend required. */
(function () {
  'use strict';

  var suggestions = ['Find a route', 'How do I book?', 'Track a matatu', 'My ticket'];
  var page = window.location.pathname.split('/').pop() || 'index.html';
  var root;
  var messages;
  var input;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char];
    });
  }

  function addMessage(text, from) {
    var item = document.createElement('div');
    item.className = 'chatbot-message chatbot-message-' + from;
    item.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
  }

  function routeSummary(route) {
    var fares = route.vehicles.map(function (vehicle) {
      return MT.fareFor(route, vehicle);
    });
    var low = Math.min.apply(Math, fares);
    var high = Math.max.apply(Math, fares);
    return 'Route ' + route.no + ' (' + route.name + ') has ' + route.vehicles.length + ' vehicles. Fares are KES ' + low + (low === high ? '' : '–' + high) + '. It serves ' + route.stops.slice(0, 3).join(', ') + ', and more.';
  }

  function replyTo(question) {
    var text = question.toLowerCase();
    var route = ROUTES.find(function (candidate) {
      return text.indexOf(candidate.id) !== -1 || text.indexOf(candidate.no) !== -1 || text.indexOf(candidate.name.toLowerCase().split(' – ')[0]) !== -1;
    });

    if (text.indexOf('hello') !== -1 || text.indexOf('hi') !== -1 || text.indexOf('hey') !== -1) {
      return 'Hi! I can help you find routes, compare fares, book a seat, track a matatu, or find your ticket.';
    }
    if (text.indexOf('book') !== -1 || text.indexOf('seat') !== -1 || text.indexOf('pay') !== -1) {
      return 'Search your starting stage and destination, choose a vehicle, then select an available seat. Enter your name and phone number to complete the simulated M-Pesa payment.';
    }
    if (text.indexOf('track') !== -1 || text.indexOf('map') !== -1 || text.indexOf('live') !== -1) {
      return 'Open Live tracking in the top navigation. Choose a route and vehicle to see its simulated movement through each stage.';
    }
    if (text.indexOf('ticket') !== -1 || text.indexOf('qr') !== -1 || text.indexOf('booking') !== -1) {
      var tickets = MT.loadTickets();
      return tickets.length ? 'Your latest ticket is ' + tickets[tickets.length - 1].id + '. You can open it from the confirmation page or use the QR code when boarding.' : 'You do not have a saved ticket on this device yet. Search for a route to book one.';
    }
    if (text.indexOf('fare') !== -1 || text.indexOf('price') !== -1 || text.indexOf('cost') !== -1) {
      return route ? routeSummary(route) : 'Fares start at KES 60 and depend on the route and vehicle. Ask about a route number, such as 101 or 108, for a more specific estimate.';
    }
    if (text.indexOf('route') !== -1 || text.indexOf('where') !== -1 || text.indexOf('from') !== -1 || text.indexOf('to ') !== -1) {
      return route ? routeSummary(route) : 'There are 10 covered routes. Choose two stages on the Search page and I will show the available matatus.';
    }
    if (text.indexOf('help') !== -1 || text.indexOf('what can') !== -1) {
      return 'Try asking “What is the fare for route 108?”, “How do I book?”, “How do I track a matatu?”, or “Where is my ticket?”';
    }
    if (page === 'booking.html') return 'You are choosing a seat. Green seats are available; pick one, fill in your details, and continue with the simulated M-Pesa payment.';
    if (page === 'tracking.html') return 'You are on Live tracking. Use the route and vehicle selectors to explore the simulated journey.';
    if (page === 'ticket.html') return 'This is your ticket page. Keep the QR code ready for boarding, or use the track button to follow the vehicle.';
    return 'I can help with routes, fares, booking, tracking, and tickets. What would you like to do?';
  }

  function send(text) {
    text = (text || input.value).trim();
    if (!text) return;
    input.value = '';
    addMessage(text, 'user');
    window.setTimeout(function () { addMessage(replyTo(text), 'bot'); }, 180);
  }

  function build() {
    root = document.createElement('section');
    root.className = 'chatbot';
    root.innerHTML = '<button class="chatbot-launcher" type="button" aria-expanded="false" aria-controls="chatbot-panel" aria-label="Open Matatu Tracker help">? <span>Help</span></button>' +
      '<div class="chatbot-panel" id="chatbot-panel" hidden>' +
      '<div class="chatbot-head"><div><strong>Route helper</strong><span>Matatu Tracker support</span></div><button class="chatbot-close" type="button" aria-label="Close help">&times;</button></div>' +
      '<div class="chatbot-messages" aria-live="polite"></div>' +
      '<div class="chatbot-suggestions"></div>' +
      '<form class="chatbot-form"><label class="sr-only" for="chatbot-input">Ask the route helper</label><input id="chatbot-input" autocomplete="off" placeholder="Ask about routes or tickets"><button type="submit" aria-label="Send message">Send</button></form>' +
      '</div>';
    document.body.appendChild(root);
    messages = root.querySelector('.chatbot-messages');
    input = root.querySelector('#chatbot-input');
    var panel = root.querySelector('.chatbot-panel');
    var launcher = root.querySelector('.chatbot-launcher');
    root.querySelector('.chatbot-close').addEventListener('click', function () { panel.hidden = true; launcher.setAttribute('aria-expanded', 'false'); });
    launcher.addEventListener('click', function () {
      panel.hidden = !panel.hidden;
      launcher.setAttribute('aria-expanded', String(!panel.hidden));
      if (!panel.hidden) input.focus();
    });
    root.querySelector('.chatbot-form').addEventListener('submit', function (event) { event.preventDefault(); send(); });
    root.querySelector('.chatbot-suggestions').innerHTML = suggestions.map(function (suggestion) { return '<button type="button">' + suggestion + '</button>'; }).join('');
    root.querySelectorAll('.chatbot-suggestions button').forEach(function (button) { button.addEventListener('click', function () { send(button.textContent); }); });
    addMessage('Hi! I can help with routes, fares, booking, tracking, and tickets.', 'bot');
  }

  if (typeof MT !== 'undefined' && typeof ROUTES !== 'undefined' && document.body) build();
})();
