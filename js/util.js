/* ==========================================================================
   util.js — shared logic used across pages
   Depends on ROUTES / STOPS / SACCOS from routes.js being loaded first.
   ========================================================================== */

const MT = (function () {

  const STORAGE_KEY = 'mt_tickets_v1';
  const QUERY_KEY = 'mt_query_v1';
  const SAVED_TRIPS_KEY = 'mt_saved_trips_v1';
  const NOTIFICATIONS_KEY = 'mt_notifications_v1';

  /* ---------------------------------------------------------------- time */

  function pad(n) { return String(n).padStart(2, '0'); }

  function formatClock(mins) {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    const suffix = h < 12 ? 'AM' : 'PM';
    let h12 = h % 12; if (h12 === 0) h12 = 12;
    return h12 + ':' + pad(m) + ' ' + suffix;
  }

  function nowMinutesOfDay() {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }

  /* Minutes since 05:00 (the day's first departure) */
  function minutesSinceServiceStart() {
    return Math.max(0, nowMinutesOfDay() - 5 * 60);
  }

  /*
    Deterministic "random" in [0,1) seeded from a string + integer.
    Keeps seat maps and delays stable across page loads for the same
    vehicle/departure, without needing a backend.
  */
  function seededRandom(seed) {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h += h << 13; h ^= h >>> 7; h += h << 3; h ^= h >>> 17; h += h << 7;
    return ((h >>> 0) % 100000) / 100000;
  }

  /* -------------------------------------------------------- departures */

  /* Returns the next N departures for a vehicle as [{index, atMinutes}] */
  function nextDepartures(vehicle, count) {
    const elapsed = minutesSinceServiceStart();
    const firstIndex = Math.ceil((elapsed - vehicle.offset) / vehicle.headway);
    const list = [];
    for (let i = Math.max(0, firstIndex); list.length < count; i++) {
      list.push({ index: i, atMinutes: (5 * 60) + vehicle.offset + i * vehicle.headway });
    }
    return list;
  }

  function minutesUntil(atMinutes) {
    return atMinutes - nowMinutesOfDay();
  }

  /* ----------------------------------------------------------- pricing */

  function fareFor(route, vehicle) {
    return Math.max(20, route.baseFare + (vehicle.fareAdj || 0));
  }

  /* -------------------------------------------------------------- seats */

  /* Deterministic occupied-seat count for a given vehicle + departure index */
  function occupiedCount(vehicle, depIndex) {
    const r = seededRandom(vehicle.id + ':' + depIndex);
    const base = 0.35 + (vehicle.popularity || 0) * 2;
    const fill = Math.min(0.97, base + r * 0.5);
    return Math.round(fill * vehicle.seats);
  }

  function seatMapFor(vehicle, depIndex, extraTakenSeat) {
    const occupied = occupiedCount(vehicle, depIndex);
    const seats = [];
    for (let n = 1; n <= vehicle.seats; n++) {
      const r = seededRandom(vehicle.id + ':' + depIndex + ':' + n);
      seats.push({ number: n, taken: r < (occupied / vehicle.seats) });
    }
    // guarantee the seat the user is holding shows as taken-by-them, not free
    if (extraTakenSeat) {
      const s = seats.find(function (s) { return s.number === extraTakenSeat; });
      if (s) s.taken = false;
    }
    return seats;
  }

  function availableSeatCount(vehicle, depIndex) {
    return vehicle.seats - occupiedCount(vehicle, depIndex);
  }

  /* ------------------------------------------------------------- routes */

  function getRoute(id) { return ROUTES.find(function (r) { return r.id === id; }); }

  function getVehicle(routeId, vehicleId) {
    const route = getRoute(routeId);
    if (!route) return null;
    return route.vehicles.find(function (v) { return v.id === vehicleId; });
  }

  function saccoOf(vehicle) { return SACCOS[vehicle.sacco]; }

  /* Find routes serving both `from` and `to` stop names, in either direction */
  function findRoutes(from, to) {
    return ROUTES.filter(function (r) {
      return r.stops.indexOf(from) !== -1 && r.stops.indexOf(to) !== -1;
    }).map(function (r) {
      const iFrom = r.stops.indexOf(from);
      const iTo = r.stops.indexOf(to);
      return { route: r, reversed: iFrom < iTo };
    });
  }

  function orderedStops(route, reversed) {
    return reversed ? route.stops.slice().reverse() : route.stops.slice();
  }

  /* ------------------------------------------------------------ storage */

  function saveQuery(q) { sessionStorage.setItem(QUERY_KEY, JSON.stringify(q)); }
  function loadQuery() {
    try { return JSON.parse(sessionStorage.getItem(QUERY_KEY)); } catch (e) { return null; }
  }

  function loadSavedTrips() {
    try { return JSON.parse(localStorage.getItem(SAVED_TRIPS_KEY)) || []; }
    catch (e) { return []; }
  }

  function saveSavedTrip(trip) {
    const trips = loadSavedTrips().filter(function (saved) {
      return !(saved.from === trip.from && saved.to === trip.to);
    });
    trips.unshift({
      id: Date.now().toString(),
      name: trip.name || (trip.from + ' to ' + trip.to),
      from: trip.from,
      to: trip.to,
      when: trip.when || 'now',
      seats: trip.seats || '1'
    });
    localStorage.setItem(SAVED_TRIPS_KEY, JSON.stringify(trips.slice(0, 6)));
    return trips[0];
  }

  function removeSavedTrip(id) {
    const trips = loadSavedTrips().filter(function (trip) { return trip.id !== id; });
    localStorage.setItem(SAVED_TRIPS_KEY, JSON.stringify(trips));
  }

  function loadNotifications() {
    try { return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY)) || []; }
    catch (e) { return []; }
  }

  function addNotification(notification) {
    const items = loadNotifications();
    items.unshift({
      id: Date.now().toString(),
      title: notification.title,
      message: notification.message,
      icon: notification.icon || 'info',
      timeLabel: 'Just now',
      read: false
    });
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(items.slice(0, 12)));
  }

  function markNotificationsRead() {
    const items = loadNotifications().map(function (item) { item.read = true; return item; });
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(items));
  }

  function clearNotifications() { localStorage.removeItem(NOTIFICATIONS_KEY); }

  function saveTicket(ticket) {
    const all = loadTickets();
    all.push(ticket);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  function loadTickets() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch (e) { return []; }
  }

  function getTicket(id) {
    return loadTickets().find(function (t) { return t.id === id; });
  }

  function makeBookingRef() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = 'MT-';
    for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  return {
    formatClock: formatClock, nowMinutesOfDay: nowMinutesOfDay,
    nextDepartures: nextDepartures, minutesUntil: minutesUntil,
    fareFor: fareFor, occupiedCount: occupiedCount, seatMapFor: seatMapFor,
    availableSeatCount: availableSeatCount,
    getRoute: getRoute, getVehicle: getVehicle, saccoOf: saccoOf,
    findRoutes: findRoutes, orderedStops: orderedStops,
    saveQuery: saveQuery, loadQuery: loadQuery,
    loadSavedTrips: loadSavedTrips, saveSavedTrip: saveSavedTrip, removeSavedTrip: removeSavedTrip,
    loadNotifications: loadNotifications, addNotification: addNotification,
    markNotificationsRead: markNotificationsRead, clearNotifications: clearNotifications,
    saveTicket: saveTicket, loadTickets: loadTickets, getTicket: getTicket,
    makeBookingRef: makeBookingRef
  };
})();
