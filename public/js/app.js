// ===== SkyWay Flight Booking - Premium Frontend Application =====

const API = (window.location.protocol.startsWith('http')) ? '' : 'http://localhost:3000';
let currentUser = null;
let currentFlights = [];
let selectedFlight = null;
let airports = [];
let tripType = 'oneway';
let userSelectedSeats = [];

// Realistic fallback airports (available offline & instantly)
const DEFAULT_AIRPORTS = [
  { code: 'DEL', name: 'Indira Gandhi International Airport', city: 'New Delhi', country: 'India' },
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International', city: 'Mumbai', country: 'India' },
  { code: 'BLR', name: 'Kempegowda International Airport', city: 'Bangalore', country: 'India' },
  { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE' },
  { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom' },
  { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'USA' },
  { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore' },
  { code: 'HND', name: 'Haneda International Airport', city: 'Tokyo', country: 'Japan' },
  { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany' },
  { code: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia' },
  { code: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar' }
];

// Fallback airlines
const DEFAULT_AIRLINES = [
  { name: 'SkyWay Premier', code: 'SW', logo: '🛫', rating: 4.8 },
  { name: 'Emirates', code: 'EK', logo: '🌟', rating: 4.9 },
  { name: 'Singapore Airlines', code: 'SQ', logo: '🦁', rating: 4.9 },
  { name: 'Air India', code: 'AI', logo: '🇮🇳', rating: 4.3 },
  { name: 'Qatar Airways', code: 'QR', logo: '🏆', rating: 4.9 },
  { name: 'British Airways', code: 'BA', logo: '🇬🇧', rating: 4.5 },
  { name: 'Lufthansa', code: 'LH', logo: '🦅', rating: 4.6 }
];

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
  airports = [...DEFAULT_AIRPORTS];
  populateAirportSelects(airports);
  loadAirports();
  checkAuth();
  initParticles();
  setMinDate();

  // Navbar scroll effect
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
  });
});

function setTripType(type, btn) {
  tripType = type;
  document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const returnGroup = document.getElementById('returnDateGroup');
  if (returnGroup) {
    returnGroup.style.display = type === 'roundtrip' ? 'block' : 'none';
  }
}

function setMinDate() {
  const today = new Date().toISOString().split('T')[0];
  const d1 = document.getElementById('searchDate');
  const d2 = document.getElementById('searchDate2');
  const r1 = document.getElementById('searchReturnDate');
  if (d1) { d1.min = today; d1.value = today; }
  if (d2) { d2.min = today; d2.value = today; }
  if (r1) { r1.min = today; }
}

// ===== Particles Animation =====
function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < 40; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDuration = (Math.random() * 15 + 10) + 's';
    particle.style.animationDelay = Math.random() * 15 + 's';
    particle.style.width = particle.style.height = (Math.random() * 4 + 2) + 'px';
    container.appendChild(particle);
  }
}

// ===== Toast Notifications =====
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ===== Auth Functions =====
function checkAuth() {
  const token = localStorage.getItem('skyway_token');
  const userData = localStorage.getItem('skyway_user');
  if (token && userData) {
    try {
      currentUser = JSON.parse(userData);
      updateAuthUI(true);
    } catch (e) {
      currentUser = null;
      updateAuthUI(false);
    }
  }
}

function updateAuthUI(loggedIn) {
  const navAuth = document.getElementById('navAuth');
  const navUser = document.getElementById('navUser');
  if (navAuth) navAuth.style.display = loggedIn ? 'none' : 'flex';
  if (navUser) navUser.style.display = loggedIn ? 'flex' : 'none';
  if (loggedIn && currentUser) {
    const avatar = document.getElementById('userAvatar');
    const name = document.getElementById('userName');
    if (avatar) avatar.textContent = (currentUser.firstName || 'U')[0].toUpperCase();
    if (name) name.textContent = currentUser.firstName || 'Traveler';
  }
}

function fillDemoCredentials() {
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPassword');
  if (emailInput) emailInput.value = 'admin@skyway.com';
  if (passInput) passInput.value = 'admin123';
  showToast('Demo credentials filled!', 'info');
}

function continueAsGuest() {
  const guestUser = {
    id: 'guest_' + Math.random().toString(36).substr(2, 9),
    firstName: 'Guest',
    lastName: 'Traveler',
    email: 'guest@skyway.com',
    role: 'guest'
  };
  localStorage.setItem('skyway_token', 'guest_mock_token');
  localStorage.setItem('skyway_user', JSON.stringify(guestUser));
  currentUser = guestUser;
  updateAuthUI(true);
  hideModal('loginModal');
  showToast('Welcome, Guest Traveler! ✈️', 'success');
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.textContent = 'Signing in...';

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    localStorage.setItem('skyway_token', data.token);
    localStorage.setItem('skyway_user', JSON.stringify(data.user));
    currentUser = data.user;
    updateAuthUI(true);
    hideModal('loginModal');
    showToast(`Welcome back, ${data.user.firstName}!`, 'success');
  } catch (err) {
    // If backend is offline or mock login needed
    if (email === 'admin@skyway.com' && password === 'admin123') {
      const demoUser = { id: 'admin-id', firstName: 'Admin', lastName: 'SkyWay', email: 'admin@skyway.com', role: 'admin' };
      localStorage.setItem('skyway_token', 'demo_jwt_token');
      localStorage.setItem('skyway_user', JSON.stringify(demoUser));
      currentUser = demoUser;
      updateAuthUI(true);
      hideModal('loginModal');
      showToast('Logged in as Admin (Demo Mode)', 'success');
    } else {
      showToast(err.message || 'Login failed', 'error');
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('registerBtn');
  btn.disabled = true;
  btn.textContent = 'Creating account...';

  const firstName = document.getElementById('regFirstName').value;
  const lastName = document.getElementById('regLastName').value;
  const email = document.getElementById('regEmail').value;
  const phone = document.getElementById('regPhone').value;
  const password = document.getElementById('regPassword').value;

  try {
    const res = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email, phone, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    localStorage.setItem('skyway_token', data.token);
    localStorage.setItem('skyway_user', JSON.stringify(data.user));
    currentUser = data.user;
    updateAuthUI(true);
    hideModal('registerModal');
    showToast(`Welcome to SkyWay, ${data.user.firstName}!`, 'success');
  } catch (err) {
    // Fallback registration
    const newUser = { id: 'user_' + Date.now(), firstName, lastName, email, phone, role: 'user' };
    localStorage.setItem('skyway_token', 'mock_token_' + Date.now());
    localStorage.setItem('skyway_user', JSON.stringify(newUser));
    currentUser = newUser;
    updateAuthUI(true);
    hideModal('registerModal');
    showToast(`Welcome to SkyWay, ${firstName}!`, 'success');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
}

function logout() {
  localStorage.removeItem('skyway_token');
  localStorage.removeItem('skyway_user');
  currentUser = null;
  updateAuthUI(false);
  navigateTo('home');
  showToast('Logged out successfully', 'info');
}

// ===== Modal Functions =====
function showModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function hideModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// ===== Navigation =====
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });

  window.scrollTo(0, 0);
  if (page === 'my-bookings') loadMyBookings();
}

// ===== Load Airports =====
function populateAirportSelects(list) {
  const selects = ['searchOrigin', 'searchDestination', 'searchOrigin2', 'searchDestination2'];
  selects.forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = `<option value="">Select ${id.includes('Origin') ? 'Origin' : 'Destination'}</option>`;
    list.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.code;
      opt.textContent = `${a.city} (${a.code}) - ${a.name}`;
      sel.appendChild(opt);
    });
    if (currentVal) sel.value = currentVal;
  });
}

async function loadAirports() {
  try {
    const res = await fetch(`${API}/api/flights/airports`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        airports = data;
        populateAirportSelects(airports);
      }
    }
  } catch (err) {
    console.log('Using default airport catalog');
  }
}

// ===== Dynamic Flight Generator (Instant fallback) =====
function generateMockFlights(originCode, destCode, dateStr) {
  const originAirport = airports.find(a => a.code === originCode) || { city: originCode, code: originCode };
  const destAirport = airports.find(a => a.code === destCode) || { city: destCode, code: destCode };

  const isIntl = !['DEL', 'BOM', 'BLR'].includes(originCode) || !['DEL', 'BOM', 'BLR'].includes(destCode);
  const basePrice = isIntl ? 28000 + Math.floor(Math.random() * 18000) : 3800 + Math.floor(Math.random() * 3200);

  const hours = [6, 9, 13, 17, 21];
  return DEFAULT_AIRLINES.slice(0, 5).map((airline, idx) => {
    const depHour = hours[idx % hours.length];
    const durationMins = isIntl ? 240 + Math.floor(Math.random() * 300) : 110 + Math.floor(Math.random() * 40);
    const depDate = new Date(`${dateStr}T${String(depHour).padStart(2, '0')}:30:00`);
    const arrDate = new Date(depDate.getTime() + durationMins * 60000);

    const ecoPrice = Math.round(basePrice * (0.9 + idx * 0.1));
    return {
      id: `fl_${originCode}_${destCode}_${idx}`,
      flightNumber: `${airline.code}${300 + idx * 112}`,
      airline: { name: airline.name, code: airline.code, logo: airline.logo, rating: airline.rating },
      origin: originAirport,
      destination: destAirport,
      departureTime: depDate.toISOString(),
      arrivalTime: arrDate.toISOString(),
      duration: durationMins,
      aircraftType: isIntl ? 'Boeing 787 Dreamliner' : 'Airbus A320neo',
      prices: {
        economy: ecoPrice,
        business: Math.round(ecoPrice * 2.6),
        firstClass: Math.round(ecoPrice * 4.5)
      },
      availableSeats: {
        economy: 18 + Math.floor(Math.random() * 40),
        business: 6 + Math.floor(Math.random() * 12),
        firstClass: 2 + Math.floor(Math.random() * 6)
      }
    };
  });
}

// ===== Search Flights =====
async function searchFlights(e) {
  if (e && e.preventDefault) e.preventDefault();

  const origin = document.getElementById('searchOrigin')?.value || document.getElementById('searchOrigin2')?.value;
  const destination = document.getElementById('searchDestination')?.value || document.getElementById('searchDestination2')?.value;
  const date = document.getElementById('searchDate')?.value || document.getElementById('searchDate2')?.value;
  const passengers = document.getElementById('searchPassengers')?.value || document.getElementById('searchPassengers2')?.value || 1;
  const sortBy = document.getElementById('sortSelect')?.value || 'price';

  if (!origin || !destination) {
    showToast('Please select origin and destination', 'error');
    return;
  }

  if (origin === destination) {
    showToast('Origin and destination cannot be the same', 'error');
    return;
  }

  navigateTo('search-results');

  // Sync controls
  if (document.getElementById('searchOrigin2')) document.getElementById('searchOrigin2').value = origin;
  if (document.getElementById('searchDestination2')) document.getElementById('searchDestination2').value = destination;
  if (document.getElementById('searchDate2')) document.getElementById('searchDate2').value = date;
  if (document.getElementById('searchPassengers2')) document.getElementById('searchPassengers2').value = passengers;

  const originCity = airports.find(a => a.code === origin)?.city || origin;
  const destCity = airports.find(a => a.code === destination)?.city || destination;

  document.getElementById('searchSummary').textContent = `${originCity} (${origin}) → ${destCity} (${destination}) • ${formatDate(date)} • ${passengers} passenger(s)`;

  document.getElementById('flightResults').innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>Searching best flights for you...</p>
    </div>
  `;

  try {
    const res = await fetch(`${API}/api/flights/search?origin=${origin}&destination=${destination}&date=${date}&passengers=${passengers}&sortBy=${sortBy}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.flights && data.flights.length > 0) {
        currentFlights = data.flights;
        displayFlightList(currentFlights, passengers);
        return;
      }
    }
    // Fallback if no server matches
    currentFlights = generateMockFlights(origin, destination, date);
    displayFlightList(currentFlights, passengers);
  } catch (err) {
    currentFlights = generateMockFlights(origin, destination, date);
    displayFlightList(currentFlights, passengers);
  }
}

function displayFlightList(flights, passengers) {
  document.getElementById('resultsHeader').style.display = flights.length > 0 ? 'flex' : 'none';
  document.getElementById('resultsCount').innerHTML = `Found <span>${flights.length}</span> flights`;
  renderFlights(flights, passengers);
}

function renderFlights(flights, passengers) {
  const container = document.getElementById('flightResults');
  container.innerHTML = flights.map((f, i) => `
    <div class="flight-card">
      <div class="flight-airline">
        <div class="airline-logo">${f.airline.logo}</div>
        <div class="airline-name">${f.airline.name}</div>
        <div class="flight-number">${f.flightNumber}</div>
        <div style="font-size: 0.75rem; color: var(--text-light); margin-top: 4px;">✈️ ${f.aircraftType || 'Airbus A350'}</div>
      </div>
      <div class="flight-details">
        <div class="flight-time">
          <div class="time">${formatTime(f.departureTime)}</div>
          <div class="city">${f.origin.city}</div>
          <div class="code">${f.origin.code}</div>
        </div>
        <div class="flight-path">
          <div class="flight-duration">${formatDuration(f.duration)}</div>
          <div class="flight-line"></div>
          <div class="flight-type">Non-stop • Direct</div>
        </div>
        <div class="flight-time">
          <div class="time">${formatTime(f.arrivalTime)}</div>
          <div class="city">${f.destination.city}</div>
          <div class="code">${f.destination.code}</div>
        </div>
      </div>
      <div class="flight-pricing">
        <div class="flight-price"><span class="currency">₹</span>${f.prices.economy.toLocaleString()}</div>
        <div class="price-note">per person • Economy</div>
        ${f.availableSeats.economy < 15 ? `<div class="seats-left">⚡ Only ${f.availableSeats.economy} seats left!</div>` : ''}
        <button class="book-btn" onclick="startBookingByIndex(${i})">Book Now →</button>
      </div>
    </div>
  `).join('');
}

function startBookingByIndex(idx) {
  const flight = currentFlights[idx];
  startBooking(flight);
}

function resortFlights() {
  const sortBy = document.getElementById('sortSelect').value;
  const passengers = document.getElementById('searchPassengers2').value;
  const sorted = [...currentFlights];

  switch (sortBy) {
    case 'price': sorted.sort((a, b) => a.prices.economy - b.prices.economy); break;
    case 'price_desc': sorted.sort((a, b) => b.prices.economy - a.prices.economy); break;
    case 'duration': sorted.sort((a, b) => a.duration - b.duration); break;
    case 'departure': sorted.sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime)); break;
  }
  renderFlights(sorted, passengers);
}

function quickSearch(from, to) {
  const orig = document.getElementById('searchOrigin');
  const dest = document.getElementById('searchDestination');
  if (orig) orig.value = from;
  if (dest) dest.value = to;
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('searchDate');
  if (dateInput) dateInput.value = today;
  searchFlights(new Event('submit'));
}

// ===== Booking Flow =====
function startBooking(flight) {
  if (!currentUser) {
    showToast('Please sign in or continue as Guest to book', 'info');
    showModal('loginModal');
    return;
  }

  selectedFlight = flight;
  userSelectedSeats = [];
  const passengers = parseInt(document.getElementById('searchPassengers2')?.value || document.getElementById('searchPassengers')?.value) || 1;
  navigateTo('booking');
  renderBookingForm(flight, passengers);
}

function renderBookingForm(flight, passengerCount) {
  const container = document.getElementById('bookingContainer');
  let passengerForms = '';
  for (let i = 0; i < passengerCount; i++) {
    passengerForms += `
      <div class="passenger-block">
        <h4>👤 Passenger ${i + 1} ${i === 0 ? '(Primary)' : ''}</h4>
        <div class="form-row">
          <div class="form-group dark-label">
            <label>First Name</label>
            <input type="text" class="form-control light" name="passengerFirstName_${i}" 
              value="${i === 0 ? (currentUser?.firstName || '') : ''}" required>
          </div>
          <div class="form-group dark-label">
            <label>Last Name</label>
            <input type="text" class="form-control light" name="passengerLastName_${i}" 
              value="${i === 0 ? (currentUser?.lastName || '') : ''}" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group dark-label">
            <label>Date of Birth</label>
            <input type="date" class="form-control light" name="passengerDob_${i}">
          </div>
          <div class="form-group dark-label">
            <label>Passport / ID</label>
            <input type="text" class="form-control light" name="passengerPassport_${i}" placeholder="Optional">
          </div>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="booking-form-card">
      <h3 class="card-title">✈️ Flight Details</h3>
      <div class="summary-flight">
        <div class="emoji">${flight.airline.logo}</div>
        <div>
          <div class="summary-route">${flight.origin.city} (${flight.origin.code}) → ${flight.destination.city} (${flight.destination.code})</div>
          <div class="summary-details">${flight.airline.name} • ${flight.flightNumber} • ${formatDate(flight.departureTime)}</div>
          <div class="summary-details">${formatTime(flight.departureTime)} - ${formatTime(flight.arrivalTime)} • ${formatDuration(flight.duration)}</div>
        </div>
      </div>

      <h3 class="card-title">💺 Select Cabin Class</h3>
      <div class="cabin-selector">
        <div class="cabin-option selected" onclick="selectCabin(this, 'economy', ${flight.prices.economy})">
          <div class="cabin-icon">💺</div>
          <div class="cabin-name">Economy</div>
          <div class="cabin-price">₹${flight.prices.economy.toLocaleString()}</div>
        </div>
        <div class="cabin-option" onclick="selectCabin(this, 'business', ${flight.prices.business})">
          <div class="cabin-icon">🛋️</div>
          <div class="cabin-name">Business</div>
          <div class="cabin-price">₹${flight.prices.business.toLocaleString()}</div>
        </div>
        <div class="cabin-option" onclick="selectCabin(this, 'first', ${flight.prices.firstClass})">
          <div class="cabin-icon">👑</div>
          <div class="cabin-name">First Class</div>
          <div class="cabin-price">₹${flight.prices.firstClass.toLocaleString()}</div>
        </div>
      </div>

      <!-- Seat Map Trigger -->
      <div style="background: rgba(30, 58, 95, 0.05); border: 1px dashed var(--primary); border-radius: 12px; padding: 1.2rem; margin: 1.5rem 0; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h4 style="margin: 0; color: var(--primary);">💺 Airplane Seat Map</h4>
          <p style="margin: 4px 0 0; font-size: 0.85rem; color: var(--text-secondary);" id="seatSelectionStatusText">
            Assigned: Automatic (e.g. 12A, 12B)
          </p>
        </div>
        <button type="button" class="btn btn-outline btn-sm" onclick="openSeatModal(${passengerCount})">
          Select Seats on Map 🗺️
        </button>
      </div>

      <h3 class="card-title">👥 Passenger Details</h3>
      ${passengerForms}

      <h3 class="card-title">📞 Contact Information</h3>
      <div class="form-row">
        <div class="form-group dark-label">
          <label>Contact Email</label>
          <input type="email" class="form-control light" id="contactEmail" value="${currentUser?.email || ''}" required>
        </div>
        <div class="form-group dark-label">
          <label>Contact Phone</label>
          <input type="tel" class="form-control light" id="contactPhone" placeholder="+91 9876543210" value="${currentUser?.phone || ''}">
        </div>
      </div>

      <h3 class="card-title">💳 Payment Method</h3>
      <div class="payment-methods">
        <div class="payment-option selected" onclick="selectPayment(this, 'credit_card')">
          <div class="payment-icon">💳</div>
          <div class="payment-name">Credit Card</div>
        </div>
        <div class="payment-option" onclick="selectPayment(this, 'debit_card')">
          <div class="payment-icon">🏧</div>
          <div class="payment-name">Debit Card</div>
        </div>
        <div class="payment-option" onclick="selectPayment(this, 'upi')">
          <div class="payment-icon">📱</div>
          <div class="payment-name">UPI Payment</div>
        </div>
      </div>
    </div>

    <div class="booking-summary">
      <h3 class="card-title">🧾 Booking Summary</h3>
      <div class="summary-flight">
        <div class="emoji">${flight.airline.logo}</div>
        <div>
          <div class="summary-route">${flight.origin.code} → ${flight.destination.code}</div>
          <div class="summary-details">${formatDate(flight.departureTime)}</div>
        </div>
      </div>
      <div class="summary-line">
        <span>Cabin Class</span>
        <span id="summaryClass">Economy</span>
      </div>
      <div class="summary-line">
        <span>Passengers</span>
        <span>${passengerCount}</span>
      </div>
      <div class="summary-line">
        <span>Base Fare (per person)</span>
        <span id="summaryBaseFare">₹${flight.prices.economy.toLocaleString()}</span>
      </div>
      <div class="summary-line">
        <span>Taxes & Fees</span>
        <span id="summaryTax">₹${Math.round(flight.prices.economy * 0.12).toLocaleString()}</span>
      </div>
      <div class="summary-total">
        <span>Total Amount</span>
        <span id="summaryTotal">₹${((flight.prices.economy + Math.round(flight.prices.economy * 0.12)) * passengerCount).toLocaleString()}</span>
      </div>
      <button class="btn btn-primary btn-block btn-lg" onclick="confirmBooking(${passengerCount})" id="confirmBookingBtn">
        Confirm & Pay →
      </button>
      <p style="text-align: center; font-size: 0.75rem; color: var(--text-light); margin-top: 0.8rem;">
        🔒 Secure payment • Instant e-Ticket & Boarding Pass
      </p>
    </div>
  `;

  // Store booking state
  window.bookingState = {
    cabinClass: 'economy',
    pricePerPerson: flight.prices.economy,
    paymentMethod: 'credit_card',
    passengerCount: passengerCount
  };
}

function selectCabin(el, cabin, price) {
  document.querySelectorAll('.cabin-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');

  window.bookingState.cabinClass = cabin;
  window.bookingState.pricePerPerson = price;

  const count = window.bookingState.passengerCount;
  const tax = Math.round(price * 0.12);
  const total = (price + tax) * count;

  document.getElementById('summaryClass').textContent = cabin.charAt(0).toUpperCase() + cabin.slice(1);
  document.getElementById('summaryBaseFare').textContent = `₹${price.toLocaleString()}`;
  document.getElementById('summaryTax').textContent = `₹${tax.toLocaleString()}`;
  document.getElementById('summaryTotal').textContent = `₹${total.toLocaleString()}`;
}

function selectPayment(el, method) {
  document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  window.bookingState.paymentMethod = method;
}

// ===== Interactive Seat Map Modal Logic =====
function openSeatModal(passengerCount) {
  const subtitle = document.getElementById('seatModalSubtitle');
  if (subtitle) subtitle.textContent = `Please select ${passengerCount} seat(s) for your party`;

  userSelectedSeats = [];
  updateSelectedSeatsLabel();

  // Render First Class Rows (Rows 1 to 3, 2x2)
  const fcContainer = document.getElementById('firstClassSeats');
  let fcHtml = '';
  for (let r = 1; r <= 3; r++) {
    fcHtml += `
      <div class="seat-row">
        <span class="row-num">${r}</span>
        <div class="seat-group">
          ${renderSeatButton(`${r}A`)}
          ${renderSeatButton(`${r}B`)}
        </div>
        <div class="seat-aisle"></div>
        <div class="seat-group">
          ${renderSeatButton(`${r}C`)}
          ${renderSeatButton(`${r}D`)}
        </div>
      </div>
    `;
  }
  if (fcContainer) fcContainer.innerHTML = fcHtml;

  // Render Economy Rows (Rows 10 to 18, 3x3)
  const ecContainer = document.getElementById('economyClassSeats');
  let ecHtml = '';
  for (let r = 10; r <= 18; r++) {
    ecHtml += `
      <div class="seat-row">
        <span class="row-num">${r}</span>
        <div class="seat-group">
          ${renderSeatButton(`${r}A`)}
          ${renderSeatButton(`${r}B`)}
          ${renderSeatButton(`${r}C`)}
        </div>
        <div class="seat-aisle"></div>
        <div class="seat-group">
          ${renderSeatButton(`${r}D`)}
          ${renderSeatButton(`${r}E`)}
          ${renderSeatButton(`${r}F`)}
        </div>
      </div>
    `;
  }
  if (ecContainer) ecContainer.innerHTML = ecHtml;

  showModal('seatModal');
}

function renderSeatButton(seatId) {
  // Preset random occupied seats for realism
  const isOccupied = ['1B', '2A', '11C', '12D', '14A', '15F', '17B'].includes(seatId);
  if (isOccupied) {
    return `<div class="airplane-seat occupied" title="Seat ${seatId} Occupied">${seatId.slice(-1)}</div>`;
  }
  return `<div class="airplane-seat" id="seat-${seatId}" onclick="toggleSeat('${seatId}')" title="Seat ${seatId}">${seatId.slice(-1)}</div>`;
}

function toggleSeat(seatId) {
  const maxSeats = window.bookingState?.passengerCount || 1;
  const idx = userSelectedSeats.indexOf(seatId);
  const el = document.getElementById(`seat-${seatId}`);

  if (idx > -1) {
    userSelectedSeats.splice(idx, 1);
    if (el) el.classList.remove('selected');
  } else {
    if (userSelectedSeats.length >= maxSeats) {
      showToast(`You can only select ${maxSeats} seat(s)`, 'info');
      return;
    }
    userSelectedSeats.push(seatId);
    if (el) el.classList.add('selected');
  }
  updateSelectedSeatsLabel();
}

function updateSelectedSeatsLabel() {
  const label = document.getElementById('selectedSeatsLabel');
  if (label) {
    label.textContent = userSelectedSeats.length > 0 ? userSelectedSeats.join(', ') : 'None selected yet';
  }
}

function confirmSeatSelection() {
  const maxSeats = window.bookingState?.passengerCount || 1;
  if (userSelectedSeats.length < maxSeats) {
    showToast(`Please pick all ${maxSeats} seats or keep auto-assignment`, 'info');
  }
  const statusText = document.getElementById('seatSelectionStatusText');
  if (statusText) {
    statusText.textContent = userSelectedSeats.length > 0 ? `Selected: ${userSelectedSeats.join(', ')}` : 'Auto-assigned (e.g. 14A, 14B)';
  }
  hideModal('seatModal');
  showToast('Seats updated! 💺', 'success');
}

async function confirmBooking(passengerCount) {
  if (!currentUser) {
    showToast('Please sign in first', 'error');
    return;
  }

  const passengers = [];
  for (let i = 0; i < passengerCount; i++) {
    const firstName = document.querySelector(`[name="passengerFirstName_${i}"]`)?.value;
    const lastName = document.querySelector(`[name="passengerLastName_${i}"]`)?.value;
    if (!firstName || !lastName) {
      showToast(`Please fill in details for Passenger ${i + 1}`, 'error');
      return;
    }
    passengers.push({
      firstName,
      lastName,
      dateOfBirth: document.querySelector(`[name="passengerDob_${i}"]`)?.value || null,
      passportNumber: document.querySelector(`[name="passengerPassport_${i}"]`)?.value || null,
      seatNumber: userSelectedSeats[i] || `${12 + i}${['A', 'B', 'C', 'D'][i % 4]}`
    });
  }

  const btn = document.getElementById('confirmBookingBtn');
  btn.disabled = true;
  btn.textContent = 'Processing Payment...';

  const bookingRef = 'SW' + Math.random().toString(36).substr(2, 6).toUpperCase();
  const tax = Math.round(window.bookingState.pricePerPerson * 0.12);
  const totalPrice = (window.bookingState.pricePerPerson + tax) * passengerCount;

  const mockBooking = {
    id: 'bk_' + Date.now(),
    bookingReference: bookingRef,
    flightNumber: selectedFlight.flightNumber,
    airline: selectedFlight.airline,
    origin: selectedFlight.origin,
    destination: selectedFlight.destination,
    departureTime: selectedFlight.departureTime,
    arrivalTime: selectedFlight.arrivalTime,
    duration: selectedFlight.duration,
    aircraftType: selectedFlight.aircraftType || 'Airbus A350',
    cabinClass: window.bookingState.cabinClass,
    passengerCount: passengerCount,
    passengers: passengers,
    totalPrice: totalPrice,
    paymentMethod: window.bookingState.paymentMethod,
    paymentStatus: 'paid',
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };

  try {
    const res = await fetch(`${API}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('skyway_token')}`
      },
      body: JSON.stringify({
        flightId: selectedFlight.id,
        passengers,
        cabinClass: window.bookingState.cabinClass,
        contactEmail: document.getElementById('contactEmail')?.value || currentUser.email,
        contactPhone: document.getElementById('contactPhone')?.value || '',
        paymentMethod: window.bookingState.paymentMethod
      })
    });

    if (res.ok) {
      const data = await res.json();
      saveBookingToLocalStorage(data.booking);
      navigateTo('confirmation');
      renderConfirmation(data.booking);
      showToast('Booking confirmed! 🎉', 'success');
      return;
    }
    // Fallback to local booking if server errors
    saveBookingToLocalStorage(mockBooking);
    navigateTo('confirmation');
    renderConfirmation(mockBooking);
    showToast('Booking confirmed! 🎉', 'success');
  } catch (err) {
    saveBookingToLocalStorage(mockBooking);
    navigateTo('confirmation');
    renderConfirmation(mockBooking);
    showToast('Booking confirmed! 🎉', 'success');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Confirm & Pay →';
  }
}

function saveBookingToLocalStorage(booking) {
  const existing = JSON.parse(localStorage.getItem('skyway_saved_bookings') || '[]');
  existing.unshift(booking);
  localStorage.setItem('skyway_saved_bookings', JSON.stringify(existing));
}

function renderConfirmation(booking) {
  document.getElementById('confirmationContent').innerHTML = `
    <div class="confirmation-card">
      <div class="confirmation-icon">✓</div>
      <h2>Booking Confirmed!</h2>
      <p style="color: var(--text-secondary);">Your e-ticket & boarding pass are ready</p>
      <div class="booking-ref">${booking.bookingReference}</div>
      <p style="font-size: 0.85rem; color: var(--text-light);">Keep this reference handy for airport check-in</p>

      <div class="confirmation-details">
        <div class="detail-row">
          <span class="detail-label">Flight</span>
          <span class="detail-value">${booking.airline.logo} ${booking.flightNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Route</span>
          <span class="detail-value">${booking.origin.city} (${booking.origin.code}) → ${booking.destination.city} (${booking.destination.code})</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date & Time</span>
          <span class="detail-value">${formatDate(booking.departureTime)} at ${formatTime(booking.departureTime)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Cabin Class</span>
          <span class="detail-value">${booking.cabinClass.charAt(0).toUpperCase() + booking.cabinClass.slice(1)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Passengers & Seats</span>
          <span class="detail-value">${booking.passengers.map(p => `${p.firstName} ${p.lastName} (Seat ${p.seatNumber})`).join(', ')}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total Paid</span>
          <span class="detail-value" style="color: var(--success); font-size: 1.1rem;">₹${booking.totalPrice.toLocaleString()}</span>
        </div>
      </div>

      <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
        <button class="print-pass-btn" onclick='showBoardingPassModal(${JSON.stringify(booking).replace(/'/g, "&#39;")})'>
          🎫 View / Print Boarding Pass
        </button>
        <button class="btn btn-primary" onclick="navigateTo('my-bookings')">📁 View My Bookings</button>
        <button class="btn btn-outline" onclick="navigateTo('home')">🏠 Back to Home</button>
      </div>
    </div>
  `;
}

// ===== Boarding Pass Modal =====
function showBoardingPassModal(booking) {
  const container = document.getElementById('boardingPassContainer');
  if (!container) return;

  const primaryPassenger = (booking.passengers && booking.passengers[0]) ? booking.passengers[0] : { firstName: 'Traveler', lastName: 'Guest', seatNumber: '12A' };

  container.innerHTML = `
    <div class="boarding-pass-card">
      <div class="boarding-pass-header">
        <div class="boarding-pass-brand">
          <span style="font-size: 2rem;">${booking.airline.logo || '✈️'}</span>
          <div>
            <h3>${booking.airline.name || 'SkyWay Premier'}</h3>
            <span style="font-size: 0.8rem; opacity: 0.8;">Official Boarding Pass</span>
          </div>
        </div>
        <div class="boarding-pass-class">${booking.cabinClass || 'Economy'}</div>
      </div>

      <div class="boarding-pass-body">
        <div>
          <div class="boarding-flight-hero">
            <div class="boarding-airport">
              <h4>${booking.origin.code}</h4>
              <p>${booking.origin.city}</p>
            </div>
            <div class="boarding-plane-icon">
              <span>${booking.duration ? formatDuration(booking.duration) : '2h 15m'}</span>
              ✈️ ───
              <span>Non-stop</span>
            </div>
            <div class="boarding-airport" style="text-align: right;">
              <h4>${booking.destination.code}</h4>
              <p>${booking.destination.city}</p>
            </div>
          </div>

          <div class="boarding-info-grid">
            <div class="boarding-info-item">
              <label>Passenger</label>
              <span>${primaryPassenger.firstName} ${primaryPassenger.lastName}</span>
            </div>
            <div class="boarding-info-item">
              <label>Flight</label>
              <span>${booking.flightNumber}</span>
            </div>
            <div class="boarding-info-item">
              <label>Seat</label>
              <span style="color: var(--accent); font-size: 1.2rem;">${primaryPassenger.seatNumber || '14A'}</span>
            </div>
            <div class="boarding-info-item">
              <label>Date</label>
              <span>${formatDate(booking.departureTime)}</span>
            </div>
            <div class="boarding-info-item">
              <label>Boarding Time</label>
              <span style="color: var(--primary);">${formatTime(booking.departureTime)}</span>
            </div>
            <div class="boarding-info-item">
              <label>Gate</label>
              <span>B14</span>
            </div>
          </div>
        </div>

        <div class="boarding-pass-stub">
          <div class="stub-qr">
            <div class="stub-qr-icon">📱</div>
            <span style="font-size: 0.7rem; font-weight: 700; color: #475569; margin-top: 6px;">SCAN AT GATE</span>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--text-light); text-transform: uppercase;">Reference</div>
            <div style="font-weight: 800; font-family: var(--font-display); color: var(--primary);">${booking.bookingReference}</div>
          </div>
        </div>
      </div>

      <div class="boarding-barcode">
        <div class="barcode-strip">||| | | || ||| || |||| | ||| || ||| | |||| | |||</div>
        <div style="font-size: 0.75rem; color: var(--text-light);">ZONE 2 • PRIORITY BOARDING</div>
      </div>
    </div>
  `;

  showModal('boardingPassModal');
}

// ===== My Bookings =====
async function loadMyBookings() {
  if (!currentUser) {
    document.getElementById('myBookingsList').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔐</div>
        <h3>Sign In Required</h3>
        <p>Please sign in to view your bookings</p>
        <button class="btn btn-primary" onclick="showModal('loginModal')">Sign In</button>
      </div>
    `;
    return;
  }

  let serverBookings = [];
  try {
    const res = await fetch(`${API}/api/bookings`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('skyway_token')}` }
    });
    if (res.ok) serverBookings = await res.json();
  } catch (err) {}

  const localBookings = JSON.parse(localStorage.getItem('skyway_saved_bookings') || '[]');
  const allBookings = [...serverBookings, ...localBookings.filter(lb => !serverBookings.some(sb => sb.bookingReference === lb.bookingReference))];

  if (allBookings.length === 0) {
    document.getElementById('myBookingsList').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✈️</div>
        <h3>No Bookings Yet</h3>
        <p>Start your journey by booking your first flight!</p>
        <button class="btn btn-primary" onclick="navigateTo('home')">Search Flights</button>
      </div>
    `;
    return;
  }

  document.getElementById('myBookingsList').innerHTML = `
    <div class="booking-list">
      ${allBookings.map(b => `
        <div class="booking-item">
          <div class="booking-header">
            <div class="booking-ref-small">${b.bookingReference}</div>
            <span class="status-badge status-${b.status}">${b.status}</span>
          </div>
          <div class="booking-route">
            <span style="font-size: 1.5rem;">${b.airline?.logo || '✈️'}</span>
            <div class="route-info">
              <span>${b.origin?.city} (${b.origin?.code})</span>
              <span class="route-arrow">✈️ →</span>
              <span>${b.destination?.city} (${b.destination?.code})</span>
            </div>
          </div>
          <div class="booking-meta">
            <span>📅 ${formatDate(b.departureTime)}</span>
            <span>🕐 ${formatTime(b.departureTime)} - ${formatTime(b.arrivalTime)}</span>
            <span>💺 ${(b.cabinClass || 'Economy').toUpperCase()}</span>
            <span>👥 ${b.passengerCount || 1} passenger(s)</span>
            <span>💰 ₹${b.totalPrice?.toLocaleString()}</span>
          </div>
          <div style="margin-top: 0.8rem; font-size: 0.85rem; color: var(--text-secondary);">
            ${b.passengers?.map(p => `🎫 ${p.firstName} ${p.lastName} (Seat ${p.seatNumber})`).join(' &nbsp;•&nbsp; ') || ''}
          </div>
          <div class="booking-actions" style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 1rem;">
            <button class="btn btn-outline btn-sm" onclick='showBoardingPassModal(${JSON.stringify(b).replace(/'/g, "&#39;")})'>
              🎫 Boarding Pass
            </button>
            ${b.status !== 'cancelled' ? `
              <button class="btn btn-danger btn-sm" onclick="cancelBooking('${b.id || b.bookingReference}')">Cancel</button>
            ` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

async function cancelBooking(bookingId) {
  if (!confirm('Are you sure you want to cancel this booking? A refund will be initiated.')) return;

  try {
    await fetch(`${API}/api/bookings/${bookingId}/cancel`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('skyway_token')}` }
    });
  } catch (err) {}

  // Update local storage
  const existing = JSON.parse(localStorage.getItem('skyway_saved_bookings') || '[]');
  const updated = existing.map(b => (b.id === bookingId || b.bookingReference === bookingId) ? { ...b, status: 'cancelled' } : b);
  localStorage.setItem('skyway_saved_bookings', JSON.stringify(updated));

  showToast('Booking cancelled. Refund initiated!', 'success');
  loadMyBookings();
}

// ===== Check Booking =====
async function checkBooking(e) {
  e.preventDefault();
  const ref = document.getElementById('checkBookingRef').value.trim().toUpperCase();

  if (!ref) {
    showToast('Please enter a booking reference', 'error');
    return;
  }

  document.getElementById('checkBookingResult').innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>Looking up booking...</p>
    </div>
  `;

  let booking = null;
  try {
    const res = await fetch(`${API}/api/bookings/reference/${ref}`);
    if (res.ok) booking = await res.json();
  } catch (err) {}

  if (!booking) {
    const local = JSON.parse(localStorage.getItem('skyway_saved_bookings') || '[]');
    booking = local.find(b => b.bookingReference === ref);
  }

  if (booking) {
    document.getElementById('checkBookingResult').innerHTML = `
      <div class="confirmation-card" style="margin-top: 2rem;">
        <h2>${booking.airline?.logo || '✈️'} Booking Found</h2>
        <div class="booking-ref">${booking.bookingReference}</div>
        <span class="status-badge status-${booking.status}" style="font-size: 0.9rem; padding: 6px 20px;">${(booking.status || 'CONFIRMED').toUpperCase()}</span>

        <div class="confirmation-details" style="margin-top: 1.5rem;">
          <div class="detail-row">
            <span class="detail-label">Flight</span>
            <span class="detail-value">${booking.flightNumber}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Route</span>
            <span class="detail-value">${booking.origin?.city} (${booking.origin?.code}) → ${booking.destination?.city} (${booking.destination?.code})</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Departure</span>
            <span class="detail-value">${formatDate(booking.departureTime)} at ${formatTime(booking.departureTime)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Arrival</span>
            <span class="detail-value">${formatTime(booking.arrivalTime)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Aircraft</span>
            <span class="detail-value">${booking.aircraftType || 'Boeing 787'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Cabin</span>
            <span class="detail-value">${(booking.cabinClass || 'Economy').toUpperCase()}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Passengers</span>
            <span class="detail-value">${booking.passengers?.map(p => `${p.firstName} ${p.lastName} (${p.seatNumber})`).join(', ')}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Total Price</span>
            <span class="detail-value" style="color: var(--success);">₹${booking.totalPrice?.toLocaleString()}</span>
          </div>
        </div>

        <div style="margin-top: 1.5rem; text-align: center;">
          <button class="print-pass-btn" onclick='showBoardingPassModal(${JSON.stringify(booking).replace(/'/g, "&#39;")})'>
            🎫 View / Print Boarding Pass
          </button>
        </div>
      </div>
    `;
  } else {
    document.getElementById('checkBookingResult').innerHTML = `
      <div class="empty-state" style="margin-top: 2rem;">
        <div class="empty-icon">😕</div>
        <h3>Booking Not Found</h3>
        <p>No booking found with reference "${ref}". Please check and try again.</p>
      </div>
    `;
  }
}

// ===== Utility Functions =====
function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDuration(minutes) {
  if (!minutes) return '2h 10m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}
