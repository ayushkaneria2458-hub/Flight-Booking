// ===== SkyWay Flight Booking - Frontend Application =====

const API = '';
let currentUser = null;
let currentFlights = [];
let selectedFlight = null;
let airports = [];

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
  loadAirports();
  checkAuth();
  initParticles();
  setMinDate();

  // Navbar scroll effect
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
  });
});

function setMinDate() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('searchDate').min = today;
  document.getElementById('searchDate').value = today;
  document.getElementById('searchDate2').min = today;
  document.getElementById('searchDate2').value = today;
}

// ===== Particles Animation =====
function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 50; i++) {
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
    currentUser = JSON.parse(userData);
    updateAuthUI(true);
  }
}

function updateAuthUI(loggedIn) {
  document.getElementById('navAuth').style.display = loggedIn ? 'none' : 'flex';
  document.getElementById('navUser').style.display = loggedIn ? 'flex' : 'none';
  if (loggedIn && currentUser) {
    document.getElementById('userAvatar').textContent = currentUser.firstName[0].toUpperCase();
    document.getElementById('userName').textContent = currentUser.firstName;
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.textContent = 'Signing in...';

  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    localStorage.setItem('skyway_token', data.token);
    localStorage.setItem('skyway_user', JSON.stringify(data.user));
    currentUser = data.user;
    updateAuthUI(true);
    hideModal('loginModal');
    showToast(`Welcome back, ${data.user.firstName}!`, 'success');
  } catch (err) {
    showToast(err.message || 'Login failed', 'error');
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

  try {
    const res = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: document.getElementById('regFirstName').value,
        lastName: document.getElementById('regLastName').value,
        email: document.getElementById('regEmail').value,
        phone: document.getElementById('regPhone').value,
        password: document.getElementById('regPassword').value
      })
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
    showToast(err.message || 'Registration failed', 'error');
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
  document.getElementById(id).classList.add('active');
  document.body.style.overflow = 'hidden';
}

function hideModal(id) {
  document.getElementById(id).classList.remove('active');
  document.body.style.overflow = '';
}

// ===== Navigation =====
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');

  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });

  window.scrollTo(0, 0);

  if (page === 'my-bookings') loadMyBookings();
}

// ===== Load Airports =====
async function loadAirports() {
  try {
    const res = await fetch(`${API}/api/flights/airports`);
    airports = await res.json();

    const selects = ['searchOrigin', 'searchDestination', 'searchOrigin2', 'searchDestination2'];
    selects.forEach(id => {
      const sel = document.getElementById(id);
      const firstOpt = sel.options[0];
      sel.innerHTML = '';
      sel.appendChild(firstOpt);
      airports.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.code;
        opt.textContent = `${a.city} (${a.code})`;
        sel.appendChild(opt);
      });
    });
  } catch (err) {
    console.error('Failed to load airports:', err);
  }
}

// ===== Search Flights =====
async function searchFlights(e) {
  if (e && e.preventDefault) e.preventDefault();

  const origin = document.getElementById('searchOrigin').value || document.getElementById('searchOrigin2').value;
  const destination = document.getElementById('searchDestination').value || document.getElementById('searchDestination2').value;
  const date = document.getElementById('searchDate').value || document.getElementById('searchDate2').value;
  const passengers = document.getElementById('searchPassengers').value || document.getElementById('searchPassengers2').value;
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

  // Sync search forms
  document.getElementById('searchOrigin2').value = origin;
  document.getElementById('searchDestination2').value = destination;
  document.getElementById('searchDate2').value = date;
  document.getElementById('searchPassengers2').value = passengers;

  const originCity = airports.find(a => a.code === origin)?.city || origin;
  const destCity = airports.find(a => a.code === destination)?.city || destination;

  document.getElementById('searchSummary').textContent = `${originCity} → ${destCity} • ${formatDate(date)} • ${passengers} passenger(s)`;

  document.getElementById('flightResults').innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>Searching best flights for you...</p>
    </div>
  `;

  try {
    const res = await fetch(`${API}/api/flights/search?origin=${origin}&destination=${destination}&date=${date}&passengers=${passengers}&sortBy=${sortBy}`);
    const data = await res.json();

    currentFlights = data.flights;
    document.getElementById('resultsHeader').style.display = data.count > 0 ? 'flex' : 'none';
    document.getElementById('resultsCount').innerHTML = `Found <span>${data.count}</span> flights`;

    if (data.count === 0) {
      document.getElementById('flightResults').innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">😕</div>
          <h3>No Flights Found</h3>
          <p>Try different dates or routes. We add new flights daily!</p>
          <button class="btn btn-primary" onclick="navigateTo('home')">Search Again</button>
        </div>
      `;
      return;
    }

    renderFlights(data.flights, passengers);
  } catch (err) {
    document.getElementById('flightResults').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Search Failed</h3>
        <p>Something went wrong. Please try again.</p>
      </div>
    `;
  }
}

function renderFlights(flights, passengers) {
  const container = document.getElementById('flightResults');
  container.innerHTML = flights.map(f => `
    <div class="flight-card">
      <div class="flight-airline">
        <div class="airline-logo">${f.airline.logo}</div>
        <div class="airline-name">${f.airline.name}</div>
        <div class="flight-number">${f.flightNumber}</div>
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
          <div class="flight-type">Non-stop</div>
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
        ${f.availableSeats.economy < 10 ? `<div class="seats-left">⚡ Only ${f.availableSeats.economy} seats left!</div>` : ''}
        <button class="book-btn" onclick='startBooking(${JSON.stringify(f).replace(/'/g, "&#39;")})'>Book Now →</button>
      </div>
    </div>
  `).join('');
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
  document.getElementById('searchOrigin').value = from;
  document.getElementById('searchDestination').value = to;
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('searchDate').value = today;
  searchFlights(new Event('submit'));
}

// ===== Booking Flow =====
function startBooking(flight) {
  if (!currentUser) {
    showToast('Please sign in to book a flight', 'error');
    showModal('loginModal');
    return;
  }

  selectedFlight = flight;
  const passengers = parseInt(document.getElementById('searchPassengers2').value) || 1;
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
            <label>Passport Number</label>
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
          <div class="summary-route">${flight.origin.city} → ${flight.destination.city}</div>
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
          <input type="tel" class="form-control light" id="contactPhone" placeholder="+91 9876543210">
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
          <div class="payment-name">UPI</div>
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
        <span id="summaryTotal">₹${(flight.prices.economy * passengerCount).toLocaleString()}</span>
      </div>
      <button class="btn btn-primary btn-block btn-lg" onclick="confirmBooking(${passengerCount})" id="confirmBookingBtn">
        Confirm & Pay →
      </button>
      <p style="text-align: center; font-size: 0.75rem; color: var(--text-light); margin-top: 0.8rem;">
        🔒 Secure payment • Free cancellation within 24hrs
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
  const total = price * count;
  const tax = Math.round(price * 0.12);

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
      passportNumber: document.querySelector(`[name="passengerPassport_${i}"]`)?.value || null
    });
  }

  const btn = document.getElementById('confirmBookingBtn');
  btn.disabled = true;
  btn.textContent = 'Processing Payment...';

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
        contactEmail: document.getElementById('contactEmail').value,
        contactPhone: document.getElementById('contactPhone').value,
        paymentMethod: window.bookingState.paymentMethod
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast('Booking confirmed! 🎉', 'success');
    navigateTo('confirmation');
    renderConfirmation(data.booking);
  } catch (err) {
    showToast(err.message || 'Booking failed. Please try again.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Confirm & Pay →';
  }
}

function renderConfirmation(booking) {
  document.getElementById('confirmationContent').innerHTML = `
    <div class="confirmation-card">
      <div class="confirmation-icon">✓</div>
      <h2>Booking Confirmed!</h2>
      <p style="color: var(--text-secondary);">Your e-ticket has been sent to your email</p>
      <div class="booking-ref">${booking.bookingReference}</div>
      <p style="font-size: 0.85rem; color: var(--text-light);">Save this reference for future use</p>

      <div class="confirmation-details">
        <div class="detail-row">
          <span class="detail-label">Flight</span>
          <span class="detail-value">${booking.airline.logo} ${booking.flightNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Route</span>
          <span class="detail-value">${booking.origin.city} → ${booking.destination.city}</span>
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
          <span class="detail-label">Passengers</span>
          <span class="detail-value">${booking.passengers.map(p => `${p.firstName} ${p.lastName} (${p.seatNumber})`).join(', ')}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total Paid</span>
          <span class="detail-value" style="color: var(--success); font-size: 1.1rem;">₹${booking.totalPrice.toLocaleString()}</span>
        </div>
      </div>

      <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
        <button class="btn btn-primary" onclick="navigateTo('my-bookings')">📁 View My Bookings</button>
        <button class="btn btn-outline" onclick="navigateTo('home')">🏠 Back to Home</button>
      </div>
    </div>
  `;
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

  try {
    const res = await fetch(`${API}/api/bookings`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('skyway_token')}` }
    });
    const bookings = await res.json();

    if (bookings.length === 0) {
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
        ${bookings.map(b => `
          <div class="booking-item">
            <div class="booking-header">
              <div class="booking-ref-small">${b.bookingReference}</div>
              <span class="status-badge status-${b.status}">${b.status}</span>
            </div>
            <div class="booking-route">
              <span style="font-size: 1.5rem;">${b.airline.logo}</span>
              <div class="route-info">
                <span>${b.origin.city} (${b.origin.code})</span>
                <span class="route-arrow">✈️ →</span>
                <span>${b.destination.city} (${b.destination.code})</span>
              </div>
            </div>
            <div class="booking-meta">
              <span>📅 ${formatDate(b.departureTime)}</span>
              <span>🕐 ${formatTime(b.departureTime)} - ${formatTime(b.arrivalTime)}</span>
              <span>💺 ${b.cabinClass.charAt(0).toUpperCase() + b.cabinClass.slice(1)}</span>
              <span>👥 ${b.passengerCount} passenger(s)</span>
              <span>💰 ₹${b.totalPrice.toLocaleString()}</span>
            </div>
            <div style="margin-top: 0.8rem; font-size: 0.85rem; color: var(--text-secondary);">
              ${b.passengers.map(p => `🎫 ${p.firstName} ${p.lastName} - Seat ${p.seatNumber}`).join(' &nbsp;•&nbsp; ')}
            </div>
            ${b.status !== 'cancelled' ? `
              <div class="booking-actions">
                <button class="btn btn-danger btn-sm" onclick="cancelBooking('${b.id}')">Cancel Booking</button>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    showToast('Failed to load bookings', 'error');
  }
}

async function cancelBooking(bookingId) {
  if (!confirm('Are you sure you want to cancel this booking? A refund will be initiated.')) return;

  try {
    const res = await fetch(`${API}/api/bookings/${bookingId}/cancel`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('skyway_token')}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast('Booking cancelled. Refund initiated!', 'success');
    loadMyBookings();
  } catch (err) {
    showToast(err.message || 'Failed to cancel booking', 'error');
  }
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

  try {
    const res = await fetch(`${API}/api/bookings/reference/${ref}`);
    const booking = await res.json();

    if (!res.ok) throw new Error(booking.error);

    document.getElementById('checkBookingResult').innerHTML = `
      <div class="confirmation-card" style="margin-top: 2rem;">
        <h2>${booking.airline.logo} Booking Found</h2>
        <div class="booking-ref">${booking.bookingReference}</div>
        <span class="status-badge status-${booking.status}" style="font-size: 0.9rem; padding: 6px 20px;">${booking.status.toUpperCase()}</span>

        <div class="confirmation-details" style="margin-top: 1.5rem;">
          <div class="detail-row">
            <span class="detail-label">Flight</span>
            <span class="detail-value">${booking.flightNumber}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Route</span>
            <span class="detail-value">${booking.origin.city} (${booking.origin.code}) → ${booking.destination.city} (${booking.destination.code})</span>
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
            <span class="detail-label">Duration</span>
            <span class="detail-value">${formatDuration(booking.duration)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Aircraft</span>
            <span class="detail-value">${booking.aircraftType}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Cabin</span>
            <span class="detail-value">${booking.cabinClass.charAt(0).toUpperCase() + booking.cabinClass.slice(1)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Passengers</span>
            <span class="detail-value">${booking.passengers.map(p => `${p.firstName} ${p.lastName} (Seat ${p.seatNumber})`).join(', ')}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Total Price</span>
            <span class="detail-value" style="color: var(--success);">₹${booking.totalPrice.toLocaleString()}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Payment</span>
            <span class="detail-value">${booking.paymentStatus} (${booking.paymentMethod.replace('_', ' ')})</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Booked On</span>
            <span class="detail-value">${formatDate(booking.createdAt)}</span>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
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
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}
