const express = require('express');
const { randomUUID: uuidv4 } = require('crypto');
const { db } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function generateBookingRef() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = 'SW';
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

// Create booking
router.post('/', authenticateToken, (req, res) => {
  try {
    const { flightId, passengers, cabinClass, contactEmail, contactPhone, paymentMethod } = req.body;

    if (!flightId || !passengers || passengers.length === 0) {
      return res.status(400).json({ error: 'Flight and passenger details are required' });
    }

    const cabin = cabinClass || 'economy';
    const flight = db.prepare('SELECT * FROM flights WHERE id = ?').get(flightId);

    if (!flight) return res.status(404).json({ error: 'Flight not found' });

    let seatColumn, pricePerSeat;
    switch (cabin) {
      case 'business':
        seatColumn = 'available_business_seats';
        pricePerSeat = flight.business_price;
        break;
      case 'first':
        seatColumn = 'available_first_seats';
        pricePerSeat = flight.first_class_price;
        break;
      default:
        seatColumn = 'available_economy_seats';
        pricePerSeat = flight.economy_price;
    }

    if (flight[seatColumn] < passengers.length) {
      return res.status(400).json({ error: 'Not enough seats available' });
    }

    const totalPrice = pricePerSeat * passengers.length;
    const bookingId = uuidv4();
    const bookingRef = generateBookingRef();

    // Create booking
    db.prepare(`
      INSERT INTO bookings (id, booking_reference, user_id, flight_id, passenger_count, cabin_class, total_price, payment_method, contact_email, contact_phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(bookingId, bookingRef, req.user.id, flightId, passengers.length, cabin, totalPrice, paymentMethod || 'credit_card', contactEmail, contactPhone);

    // Add passengers
    const insertPassenger = db.prepare('INSERT INTO passengers (id, booking_id, first_name, last_name, date_of_birth, passport_number, seat_number) VALUES (?, ?, ?, ?, ?, ?, ?)');

    const seatLetters = cabin === 'first' ? ['A', 'B'] : cabin === 'business' ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E', 'F'];
    let seatRow = Math.floor(Math.random() * 30) + 1;

    passengers.forEach((p, i) => {
      const seatNum = `${seatRow}${seatLetters[i % seatLetters.length]}`;
      insertPassenger.run(uuidv4(), bookingId, p.firstName, p.lastName, p.dateOfBirth || null, p.passportNumber || null, seatNum);
      if ((i + 1) % seatLetters.length === 0) seatRow++;
    });

    // Update available seats
    db.prepare(`UPDATE flights SET ${seatColumn} = ${seatColumn} - ? WHERE id = ?`)
      .run(passengers.length, flightId);

    // Fetch complete booking details
    const booking = getBookingDetails(bookingId);

    res.status(201).json({
      message: 'Booking confirmed successfully!',
      booking
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ error: 'Booking failed' });
  }
});

// Get user bookings
router.get('/', authenticateToken, (req, res) => {
  try {
    const bookings = db.prepare(`
      SELECT b.*, 
        f.flight_number, f.departure_time, f.arrival_time, f.duration_minutes, f.aircraft_type,
        a.name as airline_name, a.code as airline_code, a.logo_emoji,
        orig.city as origin_city, orig.code as origin_code,
        dest.city as dest_city, dest.code as dest_code
      FROM bookings b
      JOIN flights f ON b.flight_id = f.id
      JOIN airlines a ON f.airline_id = a.id
      JOIN airports orig ON f.origin_airport_id = orig.id
      JOIN airports dest ON f.destination_airport_id = dest.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `).all(req.user.id);

    const results = bookings.map(b => {
      const passengers = db.prepare('SELECT * FROM passengers WHERE booking_id = ?').all(b.id);
      return {
        id: b.id,
        bookingReference: b.booking_reference,
        flightNumber: b.flight_number,
        airline: { name: b.airline_name, code: b.airline_code, logo: b.logo_emoji },
        origin: { city: b.origin_city, code: b.origin_code },
        destination: { city: b.dest_city, code: b.dest_code },
        departureTime: b.departure_time,
        arrivalTime: b.arrival_time,
        duration: b.duration_minutes,
        cabinClass: b.cabin_class,
        totalPrice: b.total_price,
        passengerCount: b.passenger_count,
        passengers: passengers.map(p => ({
          firstName: p.first_name,
          lastName: p.last_name,
          seatNumber: p.seat_number
        })),
        status: b.status,
        paymentStatus: b.payment_status,
        createdAt: b.created_at
      };
    });

    res.json(results);
  } catch (error) {
    console.error('Fetch bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get booking by reference
router.get('/reference/:ref', (req, res) => {
  try {
    const booking = db.prepare(`
      SELECT b.*, 
        f.flight_number, f.departure_time, f.arrival_time, f.duration_minutes, f.aircraft_type,
        a.name as airline_name, a.code as airline_code, a.logo_emoji,
        orig.city as origin_city, orig.code as origin_code, orig.name as origin_name,
        dest.city as dest_city, dest.code as dest_code, dest.name as dest_name
      FROM bookings b
      JOIN flights f ON b.flight_id = f.id
      JOIN airlines a ON f.airline_id = a.id
      JOIN airports orig ON f.origin_airport_id = orig.id
      JOIN airports dest ON f.destination_airport_id = dest.id
      WHERE b.booking_reference = ?
    `).get(req.params.ref.toUpperCase());

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const passengers = db.prepare('SELECT * FROM passengers WHERE booking_id = ?').all(booking.id);

    res.json({
      id: booking.id,
      bookingReference: booking.booking_reference,
      flightNumber: booking.flight_number,
      airline: { name: booking.airline_name, code: booking.airline_code, logo: booking.logo_emoji },
      origin: { city: booking.origin_city, code: booking.origin_code, name: booking.origin_name },
      destination: { city: booking.dest_city, code: booking.dest_code, name: booking.dest_name },
      departureTime: booking.departure_time,
      arrivalTime: booking.arrival_time,
      duration: booking.duration_minutes,
      aircraftType: booking.aircraft_type,
      cabinClass: booking.cabin_class,
      totalPrice: booking.total_price,
      passengerCount: booking.passenger_count,
      passengers: passengers.map(p => ({
        firstName: p.first_name,
        lastName: p.last_name,
        seatNumber: p.seat_number,
        passportNumber: p.passport_number
      })),
      status: booking.status,
      paymentStatus: booking.payment_status,
      paymentMethod: booking.payment_method,
      contactEmail: booking.contact_email,
      contactPhone: booking.contact_phone,
      createdAt: booking.created_at
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// Cancel booking
router.put('/:id/cancel', authenticateToken, (req, res) => {
  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status === 'cancelled') return res.status(400).json({ error: 'Booking already cancelled' });

    db.prepare("UPDATE bookings SET status = 'cancelled', payment_status = 'refunded' WHERE id = ?").run(req.params.id);

    // Restore seats
    let seatColumn;
    switch (booking.cabin_class) {
      case 'business': seatColumn = 'available_business_seats'; break;
      case 'first': seatColumn = 'available_first_seats'; break;
      default: seatColumn = 'available_economy_seats';
    }
    db.prepare(`UPDATE flights SET ${seatColumn} = ${seatColumn} + ? WHERE id = ?`)
      .run(booking.passenger_count, booking.flight_id);

    res.json({ message: 'Booking cancelled and refund initiated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

function getBookingDetails(bookingId) {
  const b = db.prepare(`
    SELECT b.*, 
      f.flight_number, f.departure_time, f.arrival_time, f.duration_minutes, f.aircraft_type,
      a.name as airline_name, a.code as airline_code, a.logo_emoji,
      orig.city as origin_city, orig.code as origin_code, orig.name as origin_name,
      dest.city as dest_city, dest.code as dest_code, dest.name as dest_name
    FROM bookings b
    JOIN flights f ON b.flight_id = f.id
    JOIN airlines a ON f.airline_id = a.id
    JOIN airports orig ON f.origin_airport_id = orig.id
    JOIN airports dest ON f.destination_airport_id = dest.id
    WHERE b.id = ?
  `).get(bookingId);

  const passengers = db.prepare('SELECT * FROM passengers WHERE booking_id = ?').all(bookingId);

  return {
    id: b.id,
    bookingReference: b.booking_reference,
    flightNumber: b.flight_number,
    airline: { name: b.airline_name, code: b.airline_code, logo: b.logo_emoji },
    origin: { city: b.origin_city, code: b.origin_code, name: b.origin_name },
    destination: { city: b.dest_city, code: b.dest_code, name: b.dest_name },
    departureTime: b.departure_time,
    arrivalTime: b.arrival_time,
    duration: b.duration_minutes,
    aircraftType: b.aircraft_type,
    cabinClass: b.cabin_class,
    totalPrice: b.total_price,
    passengerCount: b.passenger_count,
    passengers: passengers.map(p => ({
      firstName: p.first_name,
      lastName: p.last_name,
      seatNumber: p.seat_number
    })),
    status: b.status,
    paymentStatus: b.payment_status,
    createdAt: b.created_at
  };
}

module.exports = router;
