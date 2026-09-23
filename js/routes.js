/* ==========================================================================
   routes.js — sample data for MATATU TRACKER (prototype)

   Everything in this file is SAMPLE DATA:
   - SACCO names, plate numbers and route numbers are made up.
   - Stop coordinates are approximate and only used to draw / animate the map.

   Seat availability and departure times are NOT stored here. They are worked
   out in app.js from each vehicle's `headway` and `offset`, so the demo stays
   believable at any time of day.
   ========================================================================== */

/* Every stop the system knows about: [latitude, longitude] */
const STOPS = {
  'Nairobi CBD':         [-1.2861, 36.8263],
  'Ngara':               [-1.2758, 36.8296],
  'Pangani':             [-1.2685, 36.8365],
  'Muthaiga':            [-1.2570, 36.8460],
  'Garden City':         [-1.2310, 36.8790],
  'Roysambu':            [-1.2190, 36.8880],
  'Kasarani':            [-1.2170, 36.9080],
  'Githurai 45':         [-1.2010, 36.9060],
  'Kenyatta University': [-1.1800, 36.9320],
  'Kahawa Sukari':       [-1.1890, 36.9500],
  'Ruiru':               [-1.1470, 36.9610],
  'Juja':                [-1.1030, 37.0130],
  'Thika':               [-1.0330, 37.0690],
  'Westlands':           [-1.2670, 36.8110],
  'Kangemi':             [-1.2650, 36.7450],
  'Uthiru':              [-1.2700, 36.7010],
  'Kikuyu':              [-1.2460, 36.6630],
  'Nyayo Stadium':       [-1.3040, 36.8250],
  'Wilson Airport':      [-1.3220, 36.8140],
  'Bomas':               [-1.3440, 36.7800],
  'Rongai':              [-1.3960, 36.7580],
  'Yaya Centre':         [-1.2930, 36.7920],
  'Adams Arcade':        [-1.3010, 36.7850],
  'Dagoretti Corner':    [-1.2990, 36.7470],
  'Karen':               [-1.3190, 36.7080],
  'Ngong':               [-1.3520, 36.6570]
};

/* SACCOs (fictional) and the colour painted on their vehicles */
const SACCOS = {
  simba:    { name: 'Simba Sacco',      color: '#E4572E' },
  twiga:    { name: 'Twiga Express',    color: '#7A3EF0' },
  chui:     { name: 'Chui Metro',       color: '#0E9AA7' },
  duma:     { name: 'Duma Line',        color: '#D6336C' },
  kifaru:   { name: 'Kifaru Coaches',   color: '#2453FF' },
  nyati:    { name: 'Nyati Trans',      color: '#4B5563' },
  tembo:    { name: 'Tembo Travellers', color: '#A16207' },
  swala:    { name: 'Swala Shuttle',    color: '#16A34A' },
  pamoja:   { name: 'Pamoja Sacco',     color: '#0F172A' },
  harambee: { name: 'Harambee Metro',   color: '#EA580C' }
};

/*
  Routes. `stops` always runs TOWARDS Nairobi CBD; the return trip
  (CBD -> outer stage) is the same list reversed.

  baseFare  = fare in KES for the full route (peak-time rates)
  vehicles  = seats: 14 | 25 | 33
              headway: minutes between departures from the first stage
              offset: minutes after 05:00 that the first vehicle leaves
              fareAdj: KES added to / taken off the route's baseFare
              popularity: 0-0.15, how often this vehicle fills up
              amenities: any of 'wifi', 'usb', 'music'
*/
const ROUTES = [
  {
    id: 'ruiru', no: '101', name: 'Ruiru – Nairobi CBD', corridor: 'Thika Road', baseFare: 100,
    stops: ['Ruiru', 'Kenyatta University', 'Githurai 45', 'Roysambu', 'Garden City', 'Muthaiga', 'Pangani', 'Nairobi CBD'],
    vehicles: [
      { id: 'ruiru-1', sacco: 'simba',    plate: 'KDG 214Q', seats: 14, headway: 10, offset: 0, amenities: ['wifi', 'usb'],   fareAdj: 0,   popularity: 0.10 },
      { id: 'ruiru-2', sacco: 'twiga',    plate: 'KCX 077M', seats: 33, headway: 15, offset: 4, amenities: ['usb', 'music'],  fareAdj: -10, popularity: 0.05 },
      { id: 'ruiru-3', sacco: 'chui',     plate: 'KDD 902B', seats: 25, headway: 12, offset: 7, amenities: ['wifi', 'music'], fareAdj: 10,  popularity: 0 }
    ]
  },
  {
    id: 'kasarani', no: '102', name: 'Kasarani – Nairobi CBD', corridor: 'Thika Road', baseFare: 70,
    stops: ['Kasarani', 'Roysambu', 'Garden City', 'Muthaiga', 'Pangani', 'Nairobi CBD'],
    vehicles: [
      { id: 'kasarani-1', sacco: 'duma',     plate: 'KDA 431L', seats: 14, headway: 10, offset: 2, amenities: ['usb', 'music'], fareAdj: 0, popularity: 0.10 },
      { id: 'kasarani-2', sacco: 'harambee', plate: 'KCM 588H', seats: 25, headway: 14, offset: 6, amenities: ['wifi'],          fareAdj: 0, popularity: 0 }
    ]
  },
  {
    id: 'thika', no: '103', name: 'Thika – Nairobi CBD', corridor: 'Thika Road', baseFare: 150,
    stops: ['Thika', 'Juja', 'Ruiru', 'Kenyatta University', 'Githurai 45', 'Roysambu', 'Garden City', 'Muthaiga', 'Pangani', 'Nairobi CBD'],
    vehicles: [
      { id: 'thika-1', sacco: 'kifaru', plate: 'KDH 355T', seats: 33, headway: 20, offset: 3, amenities: ['wifi', 'usb'], fareAdj: 10,  popularity: 0.10 },
      { id: 'thika-2', sacco: 'nyati',  plate: 'KCU 618R', seats: 25, headway: 15, offset: 9, amenities: ['usb'],         fareAdj: 0,   popularity: 0.05 },
      { id: 'thika-3', sacco: 'tembo',  plate: 'KDB 120N', seats: 14, headway: 12, offset: 1, amenities: ['music'],       fareAdj: -10, popularity: 0 }
    ]
  },
  {
    id: 'juja', no: '104', name: 'Juja – Nairobi CBD', corridor: 'Thika Road', baseFare: 130,
    stops: ['Juja', 'Ruiru', 'Kenyatta University', 'Githurai 45', 'Roysambu', 'Garden City', 'Muthaiga', 'Pangani', 'Nairobi CBD'],
    vehicles: [
      { id: 'juja-1', sacco: 'swala', plate: 'KDF 774W', seats: 25, headway: 15, offset: 5,  amenities: ['wifi', 'usb'],  fareAdj: 0,   popularity: 0.08 },
      { id: 'juja-2', sacco: 'simba', plate: 'KCZ 309K', seats: 33, headway: 18, offset: 11, amenities: ['usb', 'music'], fareAdj: -10, popularity: 0 }
    ]
  },
  {
    id: 'githurai', no: '105', name: 'Githurai – Nairobi CBD', corridor: 'Thika Road', baseFare: 70,
    stops: ['Githurai 45', 'Roysambu', 'Garden City', 'Muthaiga', 'Pangani', 'Ngara', 'Nairobi CBD'],
    vehicles: [
      { id: 'githurai-1', sacco: 'pamoja', plate: 'KDJ 861C', seats: 14, headway: 8,  offset: 0, amenities: ['music'],        fareAdj: 0,  popularity: 0.15 },
      { id: 'githurai-2', sacco: 'chui',   plate: 'KDC 246P', seats: 25, headway: 12, offset: 4, amenities: ['wifi', 'usb'],  fareAdj: 10, popularity: 0.05 }
    ]
  },
  {
    id: 'kahawa-sukari', no: '106', name: 'Kahawa Sukari – Nairobi CBD', corridor: 'Kahawa / Thika Road', baseFare: 100,
    stops: ['Kahawa Sukari', 'Kenyatta University', 'Githurai 45', 'Roysambu', 'Garden City', 'Muthaiga', 'Pangani', 'Nairobi CBD'],
    vehicles: [
      { id: 'kahawa-1', sacco: 'twiga', plate: 'KDE 593V', seats: 14, headway: 15, offset: 3,  amenities: ['wifi', 'usb'], fareAdj: 0, popularity: 0.05 },
      { id: 'kahawa-2', sacco: 'duma',  plate: 'KCY 715G', seats: 25, headway: 20, offset: 10, amenities: ['usb'],         fareAdj: 0, popularity: 0 }
    ]
  },
  {
    id: 'roysambu', no: '107', name: 'Roysambu – Nairobi CBD', corridor: 'Thika Road', baseFare: 60,
    stops: ['Roysambu', 'Garden City', 'Muthaiga', 'Pangani', 'Ngara', 'Nairobi CBD'],
    vehicles: [
      { id: 'roysambu-1', sacco: 'harambee', plate: 'KDK 408D', seats: 14, headway: 10, offset: 5, amenities: ['music', 'usb'], fareAdj: 0, popularity: 0.10 },
      { id: 'roysambu-2', sacco: 'swala',    plate: 'KDL 152S', seats: 25, headway: 12, offset: 8, amenities: ['wifi'],          fareAdj: 0, popularity: 0 }
    ]
  },
  {
    id: 'kikuyu', no: '108', name: 'Kikuyu – Nairobi CBD', corridor: 'Waiyaki Way', baseFare: 90,
    stops: ['Kikuyu', 'Uthiru', 'Kangemi', 'Westlands', 'Nairobi CBD'],
    vehicles: [
      { id: 'kikuyu-1', sacco: 'nyati',  plate: 'KCT 930F', seats: 33, headway: 15, offset: 2,  amenities: ['wifi', 'usb'], fareAdj: 0,   popularity: 0.10 },
      { id: 'kikuyu-2', sacco: 'kifaru', plate: 'KDM 667J', seats: 14, headway: 10, offset: 6,  amenities: ['music'],       fareAdj: 10,  popularity: 0 },
      { id: 'kikuyu-3', sacco: 'pamoja', plate: 'KDN 281X', seats: 25, headway: 18, offset: 12, amenities: ['usb'],         fareAdj: -10, popularity: 0 }
    ]
  },
  {
    id: 'rongai', no: '109', name: 'Rongai – Nairobi CBD', corridor: 'Langata Road', baseFare: 100,
    stops: ['Rongai', 'Bomas', 'Wilson Airport', 'Nyayo Stadium', 'Nairobi CBD'],
    vehicles: [
      { id: 'rongai-1', sacco: 'tembo', plate: 'KCV 349A', seats: 25, headway: 12, offset: 3, amenities: ['wifi', 'usb'], fareAdj: 0,  popularity: 0.10 },
      { id: 'rongai-2', sacco: 'simba', plate: 'KDP 826Z', seats: 14, headway: 10, offset: 7, amenities: ['music'],       fareAdj: 10, popularity: 0.05 }
    ]
  },
  {
    id: 'ngong', no: '110', name: 'Ngong – Nairobi CBD', corridor: 'Ngong Road', baseFare: 90,
    stops: ['Ngong', 'Karen', 'Dagoretti Corner', 'Adams Arcade', 'Yaya Centre', 'Nairobi CBD'],
    vehicles: [
      { id: 'ngong-1', sacco: 'chui', plate: 'KCW 054Y', seats: 33, headway: 16, offset: 1, amenities: ['wifi', 'usb'], fareAdj: 0, popularity: 0.08 },
      { id: 'ngong-2', sacco: 'duma', plate: 'KDQ 713E', seats: 14, headway: 10, offset: 4, amenities: ['music'],       fareAdj: 0, popularity: 0.05 }
    ]
  }
];
