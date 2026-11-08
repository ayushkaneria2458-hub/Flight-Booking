const express = require('express');
const { db } = require('../database/db');

const router = express.Router();

// Get all airports
router.get('/airports', (req, res) => {
  try {
    const airports = db.prepare('SELECT * FROM airports ORDER BY city').all();
    res.json(airports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch airports' });
  }
});

// Get all airlines
router.get('/airlines', (req, res) => {
  try {
    const airlines = db.prepare('SELECT * FROM airlines ORDER BY name').all();
    res.json(airlines);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch airlines' });
  }
});

// Search flights
router.get('/search', (req, res) => {
  try {
    const { origin, destination, date, passengers, cabinClass, sortBy } = req.query;

    if (!origin || !destination || !date) {
      return res.status(400).json({ error: 'Origin, destination, and date are required' });
    }

    const passengerCount = parseInt(passengers) || 1;
    const cabin = cabinClass || 'economy';

    let seatColumn;
    switch (cabin) {
      case 'business': seatColumn = 'available_business_seats'; break;
      case 'first': seatColumn = 'available_first_seats'; break;
      default: seatColumn = 'available_economy_seats';
    }

    let priceColumn;
    switch (cabin) {
      case 'business': priceColumn = 'f.business_price'; break;
      case 'first': priceColumn = 'f.first_class_price'; break;
      default: priceColumn = 'f.economy_price';
    }

    let orderBy = `${priceColumn} ASC`;
    if (sortBy === 'duration') orderBy = 'f.duration_minutes ASC';
    else if (sortBy === 'departure') orderBy = 'f.departure_time ASC';
    else if (sortBy === 'arrival') orderBy = 'f.arrival_time ASC';
    else if (sortBy === 'price_desc') orderBy = `${priceColumn} DESC`;

    const flights = db.prepare(`
      SELECT 
        f.*,
        a.name as airline_name, a.code as airline_code, a.logo_emoji, a.rating as airline_rating,
        orig.name as origin_name, orig.city as origin_city, orig.country as origin_country, orig.code as origin_code,
        dest.name as dest_name, dest.city as dest_city, dest.country as dest_country, dest.code as dest_code
      FROM flights f
      JOIN airlines a ON f.airline_id = a.id
      JOIN airports orig ON f.origin_airport_id = orig.id
      JOIN airports dest ON f.destination_airport_id = dest.id
      WHERE orig.code = ? AND dest.code = ?
        AND date(f.departure_time) = ?
        AND f.${seatColumn} >= ?
        AND f.status = 'scheduled'
      ORDER BY ${orderBy}
    `).all(origin, destination, date, passengerCount);

    const results = flights.map(f => ({
      id: f.id,
      flightNumber: f.flight_number,
      airline: {
        name: f.airline_name,
        code: f.airline_code,
        logo: f.logo_emoji,
        rating: f.airline_rating
      },
      origin: {
        name: f.origin_name,
        city: f.origin_city,
        country: f.origin_country,
        code: f.origin_code
      },
      destination: {
        name: f.dest_name,
        city: f.dest_city,
        country: f.dest_country,
        code: f.dest_code
      },
      departureTime: f.departure_time,
      arrivalTime: f.arrival_time,
      duration: f.duration_minutes,
      prices: {
        economy: f.economy_price,
        business: f.business_price,
        firstClass: f.first_class_price
      },
      availableSeats: {
        economy: f.available_economy_seats,
        business: f.available_business_seats,
        firstClass: f.available_first_seats
      },
      aircraftType: f.aircraft_type,
      status: f.status
    }));

    res.json({
      count: results.length,
      flights: results
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get flight details
router.get('/:id', (req, res) => {
  try {
    const flight = db.prepare(`
      SELECT 
        f.*,
        a.name as airline_name, a.code as airline_code, a.logo_emoji, a.rating as airline_rating,
        orig.name as origin_name, orig.city as origin_city, orig.country as origin_country, orig.code as origin_code,
        dest.name as dest_name, dest.city as dest_city, dest.country as dest_country, dest.code as dest_code
      FROM flights f
      JOIN airlines a ON f.airline_id = a.id
      JOIN airports orig ON f.origin_airport_id = orig.id
      JOIN airports dest ON f.destination_airport_id = dest.id
      WHERE f.id = ?
    `).get(req.params.id);

    if (!flight) return res.status(404).json({ error: 'Flight not found' });

    res.json({
      id: flight.id,
      flightNumber: flight.flight_number,
      airline: {
        name: flight.airline_name,
        code: flight.airline_code,
        logo: flight.logo_emoji,
        rating: flight.airline_rating
      },
      origin: {
        name: flight.origin_name,
        city: flight.origin_city,
        country: flight.origin_country,
        code: flight.origin_code
      },
      destination: {
        name: flight.dest_name,
        city: flight.dest_city,
        country: flight.dest_country,
        code: flight.dest_code
      },
      departureTime: flight.departure_time,
      arrivalTime: flight.arrival_time,
      duration: flight.duration_minutes,
      prices: {
        economy: flight.economy_price,
        business: flight.business_price,
        firstClass: flight.first_class_price
      },
      availableSeats: {
        economy: flight.available_economy_seats,
        business: flight.available_business_seats,
        firstClass: flight.available_first_seats
      },
      aircraftType: flight.aircraft_type,
      status: flight.status
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch flight details' });
  }
});

module.exports = router;
