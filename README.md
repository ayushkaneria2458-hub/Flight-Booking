# ✈️ SkyWay - Premium Flight Booking System (Node.js)

SkyWay is a modern, full-stack flight booking web application built using **Node.js**, **Express**, **SQLite (via node:sqlite)**, and clean vanilla JavaScript with modern CSS.

---

## 🌟 Key Features

1. **Modern Responsive UI**:
   - Particle effect hero banner, gradient themes, and responsive design.
   - Live flight search by Origin, Destination, Date, and Passenger count.
   - Quick one-click searches for popular routes (e.g. Delhi to Mumbai, London, Dubai, New York, Singapore).
   - Dynamic sorting by Price (Low to High / High to Low), Duration, and Departure Time.

2. **Flight Management & Real-Time Availability**:
   - 1,100+ seeded flights scheduled across top international and domestic airports.
   - Real-time seat tracking for **Economy**, **Business**, and **First Class**.
   - Aircraft information (Boeing 787 Dreamliner, Airbus A380, A350, Boeing 777, etc.).

3. **Booking & Checkout Flow**:
   - Multi-passenger detail entry (Full Name, Date of Birth, Passport info).
   - Seat assignment with automatic row and seat numbers (e.g., 14A, 14B).
   - Interactive cabin selection with real-time tax and price calculations.
   - Multiple payment simulation options (Credit Card, Debit Card, UPI).
   - Instant confirmation with an official booking reference code (e.g. `SWXXXXXX`).

4. **User Authentication & Profiles**:
   - Secure sign-up and sign-in using bcryptjs password hashing and JWT authentication.
   - Demo Admin Account:
     - **Email**: `admin@skyway.com`
     - **Password**: `admin123`

5. **Booking Management**:
   - **My Bookings**: View confirmed bookings, ticket details, seat numbers, and dates.
   - **Check Status**: Direct reference lookup for any booking without needing to log in.
   - **Cancellation & Refunds**: One-click booking cancellation with seat restoration.

---

## 🚀 How to Run

1. Open a terminal or PowerShell in the project directory:
   ```powershell
   cd "d:\Java Script\flight-booking-system"
   ```

2. Start the server:
   ```powershell
   node server.js
   ```

3. Open your browser and visit:
   ```
   http://localhost:3000
   ```

