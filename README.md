# MATATU TRACKER

Web-based matatu route, tracking and digital ticketing prototype — built for
**BSD 227: Internet Programming I** (BBIT, Year 2 Semester 2), per the
project proposal.

## Running it

No build step and no backend — it's plain HTML/CSS/JS.

**Easiest:** double-click `index.html` to open it in Chrome or Edge.

**More reliable** (recommended, especially for the map on the tracking page):
serve the folder with any static server, then open `http://localhost:<port>`:

```bash
# from inside the matatu-tracker folder
python3 -m http.server 8000
# or, with Node installed:
npx serve .
```

An internet connection is needed for the map's background tiles and the
Google Fonts used in the design (`Space Grotesk`, `Manrope`, `IBM Plex
Mono`) — everything else (Leaflet.js and the QR code generator) is bundled
locally under `lib/`, so it still works if those two remote pieces fail to
load.

## Pages

| File            | Purpose                                                          |
| ---------------- | ----------------------------------------------------------------- |
| `index.html`      | Home — route search (from, to, travel time, seats)               |
| `results.html`    | Matching matatus: sacco, fare, seats left, next departure         |
| `booking.html`    | Seat map, passenger details, simulated M-Pesa STK push            |
| `ticket.html`     | Digital ticket with QR code, printable                            |
| `about.html`      | About — the product story, principles, and prototype scope        |
| `tracking.html`   | Leaflet map with a simulated vehicle moving along the route       |

## How the objectives from the proposal map onto the code

- **Route search** → `index.html` + `js/home.js`
- **Matatu results with fares, seats, ETA** → `results.html` + `js/results.js`
- **Simulated tracking on a map** → `tracking.html` + `js/tracking.js` (Leaflet, animated marker, ETA per stop)
- **Seat booking** → `booking.html` + `js/booking.js` (deterministic seat map, so refreshing shows a consistent layout)
- **Digital ticket with QR code and booking reference** → `ticket.html` + `js/ticket.js`
- **localStorage for bookings** → `MT.saveTicket` / `MT.loadTickets` in `js/util.js` (`localStorage`); the current search is kept in `sessionStorage`
- **~10 sample routes in a data file** → `js/routes.js` (10 routes, 24 vehicles, 26 stops)
- **M-Pesa payment simulation** → the STK-push modal in `booking.html` / `js/booking.js` — clearly labelled as simulated, no real request is sent

## Notes for your presentation / report

- Seat occupancy and departure times are **deterministic**, not random on
  every load — they're derived from each vehicle's `headway`/`offset` and a
  seeded hash (`js/util.js`), so the demo behaves consistently if you show
  it twice or reload mid-demo.
- Vehicle movement on `tracking.html` is simulated along straight lines
  between real stage coordinates, at a fixed animation duration — not real
  GPS, as scoped in the proposal (section 10).
- To extend into the PHP/MySQL version described in the proposal's "future
  improvements" section, the natural next step is to replace `js/routes.js`
  and the `localStorage` calls in `js/util.js` with API calls to a small
  PHP backend backed by the same shape of data.
