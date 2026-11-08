const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');
const { randomUUID: uuidv4 } = require('crypto');

const dbPath = path.join(__dirname, 'skyway.db');
const db = new DatabaseSync(dbPath);

// Enable foreign keys and WAL mode
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

function initialize() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      passport_number TEXT,
      nationality TEXT,
      date_of_birth TEXT,
      role TEXT DEFAULT 'user',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Airlines table
  db.exec(`
    CREATE TABLE IF NOT EXISTS airlines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      logo_emoji TEXT DEFAULT '✈️',
      rating REAL DEFAULT 4.0
    )
  `);

  // Airports table
  db.exec(`
    CREATE TABLE IF NOT EXISTS airports (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      country TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      timezone TEXT
    )
  `);

  // Flights table
  db.exec(`
    CREATE TABLE IF NOT EXISTS flights (
      id TEXT PRIMARY KEY,
      flight_number TEXT NOT NULL,
      airline_id TEXT NOT NULL,
      origin_airport_id TEXT NOT NULL,
      destination_airport_id TEXT NOT NULL,
      departure_time TEXT NOT NULL,
      arrival_time TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      economy_price REAL NOT NULL,
      business_price REAL NOT NULL,
      first_class_price REAL NOT NULL,
      total_economy_seats INTEGER DEFAULT 150,
      total_business_seats INTEGER DEFAULT 30,
      total_first_seats INTEGER DEFAULT 10,
      available_economy_seats INTEGER DEFAULT 150,
      available_business_seats INTEGER DEFAULT 30,
      available_first_seats INTEGER DEFAULT 10,
      aircraft_type TEXT DEFAULT 'Boeing 737',
      status TEXT DEFAULT 'scheduled',
      FOREIGN KEY (airline_id) REFERENCES airlines(id),
      FOREIGN KEY (origin_airport_id) REFERENCES airports(id),
      FOREIGN KEY (destination_airport_id) REFERENCES airports(id)
    )
  `);

  // Bookings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      booking_reference TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      flight_id TEXT NOT NULL,
      passenger_count INTEGER NOT NULL DEFAULT 1,
      cabin_class TEXT NOT NULL DEFAULT 'economy',
      total_price REAL NOT NULL,
      status TEXT DEFAULT 'confirmed',
      payment_status TEXT DEFAULT 'paid',
      payment_method TEXT DEFAULT 'credit_card',
      contact_email TEXT,
      contact_phone TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (flight_id) REFERENCES flights(id)
    )
  `);

  // Passengers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS passengers (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      date_of_birth TEXT,
      passport_number TEXT,
      seat_number TEXT,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    )
  `);

  // Seed data
  seedData();
}

function seedData() {
  const airlineCount = db.prepare('SELECT COUNT(*) as count FROM airlines').get();
  if (airlineCount.count > 0) return;

  // Seed Airlines
  const airlines = [
    { id: uuidv4(), name: 'SkyWay Airlines', code: 'SW', logo_emoji: '🛫', rating: 4.5 },
    { id: uuidv4(), name: 'Emirates', code: 'EK', logo_emoji: '🌟', rating: 4.8 },
    { id: uuidv4(), name: 'Singapore Airlines', code: 'SQ', logo_emoji: '🦁', rating: 4.7 },
    { id: uuidv4(), name: 'Delta Air Lines', code: 'DL', logo_emoji: '🔺', rating: 4.2 },
    { id: uuidv4(), name: 'British Airways', code: 'BA', logo_emoji: '🇬🇧', rating: 4.3 },
    { id: uuidv4(), name: 'Lufthansa', code: 'LH', logo_emoji: '🦅', rating: 4.4 },
    { id: uuidv4(), name: 'Air India', code: 'AI', logo_emoji: '🇮🇳', rating: 3.9 },
    { id: uuidv4(), name: 'Qatar Airways', code: 'QR', logo_emoji: '🏆', rating: 4.6 }
  ];

  const insertAirline = db.prepare('INSERT INTO airlines (id, name, code, logo_emoji, rating) VALUES (?, ?, ?, ?, ?)');
  airlines.forEach(a => insertAirline.run(a.id, a.name, a.code, a.logo_emoji, a.rating));

  // Seed Airports
  const airports = [
    { id: uuidv4(), name: 'Indira Gandhi International', city: 'New Delhi', country: 'India', code: 'DEL', timezone: 'Asia/Kolkata' },
    { id: uuidv4(), name: 'Chhatrapati Shivaji Maharaj International', city: 'Mumbai', country: 'India', code: 'BOM', timezone: 'Asia/Kolkata' },
    { id: uuidv4(), name: 'Kempegowda International', city: 'Bangalore', country: 'India', code: 'BLR', timezone: 'Asia/Kolkata' },
    { id: uuidv4(), name: 'John F. Kennedy International', city: 'New York', country: 'USA', code: 'JFK', timezone: 'America/New_York' },
    { id: uuidv4(), name: 'London Heathrow', city: 'London', country: 'UK', code: 'LHR', timezone: 'Europe/London' },
    { id: uuidv4(), name: 'Dubai International', city: 'Dubai', country: 'UAE', code: 'DXB', timezone: 'Asia/Dubai' },
    { id: uuidv4(), name: 'Changi Airport', city: 'Singapore', country: 'Singapore', code: 'SIN', timezone: 'Asia/Singapore' },
    { id: uuidv4(), name: 'Los Angeles International', city: 'Los Angeles', country: 'USA', code: 'LAX', timezone: 'America/Los_Angeles' },
    { id: uuidv4(), name: 'Tokyo Narita International', city: 'Tokyo', country: 'Japan', code: 'NRT', timezone: 'Asia/Tokyo' },
    { id: uuidv4(), name: 'Sydney Kingsford Smith', city: 'Sydney', country: 'Australia', code: 'SYD', timezone: 'Australia/Sydney' },
    { id: uuidv4(), name: 'Paris Charles de Gaulle', city: 'Paris', country: 'France', code: 'CDG', timezone: 'Europe/Paris' },
    { id: uuidv4(), name: 'Chennai International', city: 'Chennai', country: 'India', code: 'MAA', timezone: 'Asia/Kolkata' }
  ];

  const insertAirport = db.prepare('INSERT INTO airports (id, name, city, country, code, timezone) VALUES (?, ?, ?, ?, ?, ?)');
  airports.forEach(a => insertAirport.run(a.id, a.name, a.city, a.country, a.code, a.timezone));

  // Seed Flights - Generate flights for the next 30 days
  const airlineIds = db.prepare('SELECT id, code FROM airlines').all();
  const airportIds = db.prepare('SELECT id, code, city FROM airports').all();
  const aircraftTypes = ['Boeing 737-800', 'Airbus A320', 'Boeing 777-300ER', 'Airbus A380', 'Boeing 787 Dreamliner', 'Airbus A350'];

  const insertFlight = db.prepare(`
    INSERT INTO flights (id, flight_number, airline_id, origin_airport_id, destination_airport_id,
    departure_time, arrival_time, duration_minutes, economy_price, business_price, first_class_price,
    total_economy_seats, total_business_seats, total_first_seats,
    available_economy_seats, available_business_seats, available_first_seats, aircraft_type, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const routes = [
    { from: 'DEL', to: 'BOM', duration: 130, basePrice: 4500 },
    { from: 'DEL', to: 'BLR', duration: 165, basePrice: 5200 },
    { from: 'BOM', to: 'DEL', duration: 130, basePrice: 4500 },
    { from: 'BOM', to: 'BLR', duration: 105, basePrice: 3800 },
    { from: 'DEL', to: 'DXB', duration: 225, basePrice: 15000 },
    { from: 'DEL', to: 'LHR', duration: 540, basePrice: 35000 },
    { from: 'DEL', to: 'JFK', duration: 930, basePrice: 52000 },
    { from: 'DEL', to: 'SIN', duration: 330, basePrice: 18000 },
    { from: 'BOM', to: 'DXB', duration: 195, basePrice: 13000 },
    { from: 'BOM', to: 'LHR', duration: 570, basePrice: 38000 },
    { from: 'LHR', to: 'JFK', duration: 480, basePrice: 45000 },
    { from: 'DXB', to: 'LHR', duration: 435, basePrice: 28000 },
    { from: 'SIN', to: 'SYD', duration: 480, basePrice: 32000 },
    { from: 'JFK', to: 'LAX', duration: 330, basePrice: 22000 },
    { from: 'LHR', to: 'CDG', duration: 75, basePrice: 8000 },
    { from: 'DEL', to: 'NRT', duration: 450, basePrice: 28000 },
    { from: 'BLR', to: 'SIN', duration: 270, basePrice: 14000 },
    { from: 'DEL', to: 'MAA', duration: 170, basePrice: 4800 },
    { from: 'MAA', to: 'SIN', duration: 255, basePrice: 12000 },
    { from: 'DXB', to: 'SIN', duration: 420, basePrice: 25000 },
  ];

  for (let day = 0; day < 30; day++) {
    const date = new Date();
    date.setDate(date.getDate() + day);
    const dateStr = date.toISOString().split('T')[0];

    routes.forEach(route => {
      const timesPerDay = Math.floor(Math.random() * 3) + 1;
      for (let t = 0; t < timesPerDay; t++) {
        const airline = airlineIds[Math.floor(Math.random() * airlineIds.length)];
        const originAirport = airportIds.find(a => a.code === route.from);
        const destAirport = airportIds.find(a => a.code === route.to);

        const depHour = Math.floor(Math.random() * 18) + 5;
        const depMin = Math.random() < 0.5 ? '00' : '30';
        const depTime = `${dateStr}T${String(depHour).padStart(2, '0')}:${depMin}:00`;

        const arrDate = new Date(depTime);
        arrDate.setMinutes(arrDate.getMinutes() + route.duration);
        const arrTime = arrDate.toISOString().replace('Z', '');

        const priceVariation = 0.8 + Math.random() * 0.5;
        const economyPrice = Math.round(route.basePrice * priceVariation);
        const businessPrice = Math.round(economyPrice * 2.5);
        const firstPrice = Math.round(economyPrice * 4.5);

        const flightNum = `${airline.code}${Math.floor(Math.random() * 900) + 100}`;
        const aircraft = aircraftTypes[Math.floor(Math.random() * aircraftTypes.length)];

        const econSeats = Math.floor(Math.random() * 50) + 100;
        const busSeats = Math.floor(Math.random() * 15) + 15;
        const firstSeats = Math.floor(Math.random() * 5) + 5;

        insertFlight.run(
          uuidv4(), flightNum, airline.id, originAirport.id, destAirport.id,
          depTime, arrTime, route.duration, economyPrice, businessPrice, firstPrice,
          econSeats, busSeats, firstSeats, econSeats, busSeats, firstSeats, aircraft, 'scheduled'
        );
      }
    });
  }

  // Create demo admin user
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare(`INSERT INTO users (id, first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(uuidv4(), 'Admin', 'SkyWay', 'admin@skyway.com', hashedPassword, 'admin');

  console.log('✅ Database seeded successfully with sample data!');
}

module.exports = { db, initialize };
