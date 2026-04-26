import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
const USER_KEY = 'comp4442_user'
const ROOM_TYPES = ['Standard', 'Deluxe', 'Suite', 'Presidential']
const ROOM_CAPACITIES = [1, 2, 3, 4, 5, 6]
const PRICE_MIN = 0
const PRICE_MAX = 700
const PRICE_STEP = 10

async function apiRequest(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  let payload
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok || (payload?.code && payload.code >= 400)) {
    const message = payload?.message || `Request failed with ${response.status}`
    throw new Error(message)
  }

  return payload?.data
}

function toMoney(value) {
  const numeric = Number(value || 0)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(numeric)
}

function getAuthErrorMessage(error, mode) {
  const message = error?.message || ''

  if (mode === 'login') {
    if (
      message.includes('User not found') ||
      message.includes('Invalid password') ||
      message.includes('Login') ||
      message.includes('Unauthorized')
    ) {
      return 'Invalid username or password'
    }
  }

  return message || 'Request failed'
}

function isValidDateRange(checkIn, checkOut) {
  if (!checkIn || !checkOut) return false
  return new Date(checkOut) > new Date(checkIn)
}

function App() {
  const [view, setView] = useState('explore')
  const [rooms, setRooms] = useState([])
  const [bookings, setBookings] = useState([])
  const [adminBookings, setAdminBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [banner, setBanner] = useState({ type: 'ok', text: '' })

  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'USER',
  })
  const [roomSearch, setRoomSearch] = useState({
    type: '',
    capacity: '',
    minPrice: String(PRICE_MIN),
    maxPrice: String(PRICE_MAX),
    checkIn: '',
    checkOut: '',
  })
  const [bookingDraft, setBookingDraft] = useState({ roomId: null, checkIn: '', checkOut: '' })
  const [availability, setAvailability] = useState(null)
  const [adminRoomForm, setAdminRoomForm] = useState({
    id: '',
    name: '',
    type: 'Standard',
    capacity: 2,
    pricePerNight: 100,
    amenities: '',
    imageUrl: '',
    isAvailable: true,
  })

  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  })

  const isAdmin = user?.role === 'ADMIN'
  const bannerTimerRef = useRef(null)

  const bookingStats = useMemo(() => {
    const total = bookings.length
    const active = bookings.filter((b) => b.status !== 'CANCELLED').length
    const cancelled = bookings.filter((b) => b.status === 'CANCELLED').length
    const spent = bookings
      .filter((b) => b.status !== 'CANCELLED')
      .reduce((sum, b) => sum + Number(b.totalPrice || 0), 0)
    return { total, active, cancelled, spent }
  }, [bookings])

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(USER_KEY)
    }
  }, [user])

  const showBanner = useCallback((type, text) => {
    setBanner({ type, text })
    window.clearTimeout(bannerTimerRef.current)
    bannerTimerRef.current = window.setTimeout(() => {
      setBanner((prev) => ({ ...prev, text: '' }))
    }, 3500)
  }, [])

  const loadRooms = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiRequest('/v1/rooms')
      setRooms(data || [])
    } catch (error) {
      showBanner('error', error.message)
    } finally {
      setLoading(false)
    }
  }, [showBanner])

  const loadBookings = useCallback(async () => {
    if (!user?.token) return
    try {
      const data = await apiRequest('/v1/bookings/history', { token: user.token })
      setBookings(data || [])
    } catch (error) {
      showBanner('error', error.message)
    }
  }, [showBanner, user?.token])

  const loadAdminBookings = useCallback(async () => {
    if (!user?.token || !isAdmin) return
    try {
      const data = await apiRequest('/v1/admin/bookings/all', { token: user.token })
      setAdminBookings(data || [])
    } catch (error) {
      showBanner('error', error.message)
    }
  }, [isAdmin, showBanner, user?.token])

  useEffect(() => {
    loadRooms()
  }, [loadRooms])

  useEffect(() => {
    if (user?.token) {
      loadBookings()
    }
  }, [user?.token, loadBookings])

  useEffect(() => {
    if (view === 'admin' && isAdmin) {
      loadAdminBookings()
    }
  }, [view, isAdmin, loadAdminBookings])

  useEffect(
    () => () => {
      window.clearTimeout(bannerTimerRef.current)
    },
    [],
  )

  async function searchRooms(event) {
    event.preventDefault()

    if (
      roomSearch.checkIn &&
      roomSearch.checkOut &&
      !isValidDateRange(roomSearch.checkIn, roomSearch.checkOut)
    ) {
      showBanner('error', 'Check-out date must be after check-in date.')
      return
    }

    setLoading(true)
    const minPrice = Number(roomSearch.minPrice)
    const maxPrice = Number(roomSearch.maxPrice)
    const body = {
      type: roomSearch.type || null,
      capacity: roomSearch.capacity ? Number(roomSearch.capacity) : null,
      minPrice: minPrice > PRICE_MIN ? minPrice : null,
      maxPrice: maxPrice < PRICE_MAX ? maxPrice : null,
      checkIn: roomSearch.checkIn || null,
      checkOut: roomSearch.checkOut || null,
    }
    try {
      const data = await apiRequest('/v1/rooms/search', { method: 'POST', body })
      setRooms(data || [])
      showBanner('ok', `Found ${data?.length || 0} room(s).`)
    } catch (error) {
      showBanner('error', error.message)
    } finally {
      setLoading(false)
    }
  }

  function updatePriceRange(boundary, nextValue) {
    const value = Number(nextValue)

    setRoomSearch((prev) => {
      const currentMin = Number(prev.minPrice)
      const currentMax = Number(prev.maxPrice)

      if (boundary === 'min') {
        return {
          ...prev,
          minPrice: String(Math.min(value, currentMax - PRICE_STEP)),
        }
      }

      return {
        ...prev,
        maxPrice: String(Math.max(value, currentMin + PRICE_STEP)),
      }
    })
  }

  function resetSearchFilters() {
    setRoomSearch({
      type: '',
      capacity: '',
      minPrice: String(PRICE_MIN),
      maxPrice: String(PRICE_MAX),
      checkIn: '',
      checkOut: '',
    })
    loadRooms()
  }

  async function checkAvailability() {
    if (!bookingDraft.roomId || !bookingDraft.checkIn || !bookingDraft.checkOut) {
      showBanner('error', 'Pick room and valid dates first.')
      return
    }

    if (!isValidDateRange(bookingDraft.checkIn, bookingDraft.checkOut)) {
      showBanner('error', 'Check-out date must be after check-in date.')
      return
    }

    try {
      const data = await apiRequest('/v1/rooms/availability', {
        method: 'POST',
        body: bookingDraft,
      })
      setAvailability(data)
      showBanner('ok', data.available ? 'Room is available.' : 'Room is not available.')
    } catch (error) {
      showBanner('error', error.message)
    }
  }

  async function submitAuth(event) {
    event.preventDefault()
    try {
      const isLogin = authMode === 'login'
      const path = isLogin ? '/v1/auth/login' : '/v1/auth/register'
      const body = isLogin ? loginForm : registerForm
      const data = await apiRequest(path, { method: 'POST', body })
      setUser(data)
      setView('explore')
      setLoginForm({ username: '', password: '' })
      setRegisterForm({ username: '', email: '', password: '', role: 'USER' })
      showBanner('ok', `${isLogin ? 'Logged in' : 'Registered'} as ${data.username}.`)
    } catch (error) {
      showBanner('error', getAuthErrorMessage(error, authMode))
    }
  }

  function logout() {
    setUser(null)
    setBookings([])
    setAdminBookings([])
    localStorage.removeItem(USER_KEY)
    setView('explore')
    showBanner('ok', 'Logged out.')
  }

  async function createBooking(event) {
    event.preventDefault()
    if (!user?.token) {
      showBanner('error', 'Login first to create a booking.')
      return
    }

    if (!isValidDateRange(bookingDraft.checkIn, bookingDraft.checkOut)) {
      showBanner('error', 'Check-out date must be after check-in date.')
      return
    }

    try {
      await apiRequest('/v1/bookings/create', {
        method: 'POST',
        token: user.token,
        body: bookingDraft,
      })
      showBanner('ok', 'Booking created successfully.')
      setAvailability(null)
      await loadBookings()
    } catch (error) {
      showBanner('error', error.message)
    }
  }

  async function cancelBooking(id, adminMode = false) {
    if (!user?.token) return
    try {
      await apiRequest(adminMode ? `/v1/admin/bookings/${id}/cancel` : `/v1/bookings/${id}/cancel`, {
        method: adminMode ? 'PUT' : 'POST',
        token: user.token,
      })
      showBanner('ok', 'Booking cancelled.')
      if (adminMode) {
        await loadAdminBookings()
      } else {
        await loadBookings()
      }
    } catch (error) {
      showBanner('error', error.message)
    }
  }

  async function payBooking(bookingId) {
    if (!user?.token) return
    try {
      const intent = await apiRequest('/v1/payments/stripe/intent', {
        method: 'POST',
        token: user.token,
        body: { bookingId },
      })
      const payment = await apiRequest('/v1/payments/stripe/confirm', {
        method: 'POST',
        token: user.token,
        body: { paymentIntentId: intent.paymentIntentId },
      })
      showBanner('ok', `Payment ${payment.status}.`)
    } catch (error) {
      showBanner('error', error.message)
    }
  }


  async function submitAdminRoom(event) {
    event.preventDefault()
    if (!user?.token || !isAdmin) return

    const body = {
      name: adminRoomForm.name,
      type: adminRoomForm.type,
      capacity: Number(adminRoomForm.capacity),
      pricePerNight: Number(adminRoomForm.pricePerNight),
      amenities: adminRoomForm.amenities,
      imageUrl: adminRoomForm.imageUrl,
      isAvailable: Boolean(adminRoomForm.isAvailable),
    }

    try {
      if (adminRoomForm.id) {
        await apiRequest(`/v1/admin/rooms/${adminRoomForm.id}`, {
          method: 'PUT',
          token: user.token,
          body,
        })
        showBanner('ok', 'Room updated.')
      } else {
        await apiRequest('/v1/admin/rooms', {
          method: 'POST',
          token: user.token,
          body,
        })
        showBanner('ok', 'Room created.')
      }
      setAdminRoomForm({
        id: '',
        name: '',
        type: 'Standard',
        capacity: 2,
        pricePerNight: 100,
        amenities: '',
        imageUrl: '',
        isAvailable: true,
      })
      await loadRooms()
    } catch (error) {
      showBanner('error', error.message)
    }
  }

  async function deleteRoom(id) {
    if (!user?.token || !isAdmin) return
    try {
      await apiRequest(`/v1/admin/rooms/${id}`, {
        method: 'DELETE',
        token: user.token,
      })
      showBanner('ok', 'Room deleted.')
      await loadRooms()
    } catch (error) {
      showBanner('error', error.message)
    }
  }

  const minPricePercent = ((Number(roomSearch.minPrice) - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100
  const maxPricePercent = ((Number(roomSearch.maxPrice) - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100

  return (
    <div className="app-shell">
      <div className="bg-layer" aria-hidden="true" />
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">HB</span>
          <div>
            <h1>Hotel Booking System</h1>
          </div>
        </div>
        <nav>
          <button className={view === 'explore' ? 'active' : ''} onClick={() => setView('explore')}>Explore</button>
          <button className={view === 'bookings' ? 'active' : ''} onClick={() => setView('bookings')}>Bookings</button>
          {isAdmin && (
            <button className={view === 'admin' ? 'active' : ''} onClick={() => setView('admin')}>Admin</button>
          )}
          <button className={view === 'account' ? 'active' : ''} onClick={() => setView('account')}>Account</button>
        </nav>
      </header>

      {banner.text && <div className={`banner ${banner.type}`}>{banner.text}</div>}

      <main className="main-grid">
        <section className="left-col panel">
          <h2>Find Rooms</h2>
          <form className="form-grid" onSubmit={searchRooms}>
            <select value={roomSearch.type} onChange={(e) => setRoomSearch((prev) => ({ ...prev, type: e.target.value }))}>
              <option value="">All room types</option>
              {ROOM_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select value={roomSearch.capacity} onChange={(e) => setRoomSearch((prev) => ({ ...prev, capacity: e.target.value }))}>
              <option value="">Any capacity</option>
              {ROOM_CAPACITIES.map((capacity) => (
                <option key={capacity} value={capacity}>{capacity} guest{capacity > 1 ? 's' : ''}</option>
              ))}
            </select>
            <div className="price-range-block">
              <div className="price-range-header">
                <span>Price range</span>
                <strong>{toMoney(roomSearch.minPrice)} - {toMoney(roomSearch.maxPrice)}</strong>
              </div>
              <div className="price-range-slider">
                <div className="price-range-track" />
                <div
                  className="price-range-fill"
                  style={{ left: `${minPricePercent}%`, width: `${maxPricePercent - minPricePercent}%` }}
                />
                <input
                  type="range"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={PRICE_STEP}
                  value={roomSearch.minPrice}
                  onChange={(e) => updatePriceRange('min', e.target.value)}
                  aria-label="Minimum price"
                />
                <input
                  type="range"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={PRICE_STEP}
                  value={roomSearch.maxPrice}
                  onChange={(e) => updatePriceRange('max', e.target.value)}
                  aria-label="Maximum price"
                />
              </div>
              <div className="price-range-scale">
                <span>{toMoney(PRICE_MIN)}</span>
                <span>{toMoney(PRICE_MAX)}</span>
              </div>
            </div>
            <input type="date" value={roomSearch.checkIn} onChange={(e) => setRoomSearch((prev) => ({ ...prev, checkIn: e.target.value }))} />
            <input type="date" min={roomSearch.checkIn || undefined} value={roomSearch.checkOut} onChange={(e) => setRoomSearch((prev) => ({ ...prev, checkOut: e.target.value }))} />
            <div className="row-actions">
              <button type="submit" disabled={loading}>Search</button>
              <button type="button" className="ghost" onClick={resetSearchFilters}>Reset</button>
            </div>
          </form>

          <h3>Draft Booking</h3>
          <form className="form-grid" onSubmit={createBooking}>
            <select
              value={bookingDraft.roomId || ''}
              onChange={(e) => setBookingDraft((prev) => ({ ...prev, roomId: Number(e.target.value) || null }))}
              required
            >
              <option value="">Choose room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>{room.name} ({toMoney(room.pricePerNight)})</option>
              ))}
            </select>
            <input type="date" value={bookingDraft.checkIn} onChange={(e) => setBookingDraft((prev) => ({ ...prev, checkIn: e.target.value, checkOut: prev.checkOut && new Date(prev.checkOut) <= new Date(e.target.value) ? '' : prev.checkOut }))} required />
            <input type="date" min={bookingDraft.checkIn || undefined} value={bookingDraft.checkOut} onChange={(e) => setBookingDraft((prev) => ({ ...prev, checkOut: e.target.value }))} required />
            <div className="row-actions">
              <button type="button" className="secondary" onClick={checkAvailability}>Check</button>
              <button type="submit">Book</button>
            </div>
          </form>

          {availability && (
            <div className={`chip ${availability.available ? 'ok' : 'error'}`}>
              {availability.available
                ? `Available. Estimated total: ${toMoney(availability.totalPrice)}`
                : 'This room is unavailable for selected dates.'}
            </div>
          )}
        </section>

        <section className="right-col panel">
          {view === 'explore' && (
            <>
              <h2>Available Rooms</h2>
              <div className="cards">
                {rooms.map((room, index) => (
                  <article className="room-card" style={{ animationDelay: `${index * 0.05}s` }} key={room.id}>
                    <img src={room.imageUrl || 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800'} alt={room.name} />
                    <div>
                      <span className="pill">{room.type}</span>
                      <h3>{room.name}</h3>
                      <p>Capacity: {room.capacity} guest(s)</p>
                      <p>{room.amenities}</p>
                      <strong>{toMoney(room.pricePerNight)} / night</strong>
                      {isAdmin && (
                        <div className="inline-actions">
                          <button type="button" className="ghost" onClick={() => setAdminRoomForm({
                            id: room.id,
                            name: room.name,
                            type: room.type,
                            capacity: room.capacity,
                            pricePerNight: room.pricePerNight,
                            amenities: room.amenities || '',
                            imageUrl: room.imageUrl || '',
                            isAvailable: room.isAvailable,
                          })}>
                            Edit
                          </button>
                          <button type="button" className="danger" onClick={() => deleteRoom(room.id)}>Delete</button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
                {!rooms.length && <p className="muted">No rooms found.</p>}
              </div>
            </>
          )}

          {view === 'bookings' && (
            <>
              <h2>My Bookings</h2>
              {!user && <p className="muted">Please login to view booking history.</p>}
              {!!user && (
                <>
                  <div className="stats">
                    <div><span>{bookingStats.total}</span>Total</div>
                    <div><span>{bookingStats.active}</span>Active</div>
                    <div><span>{bookingStats.cancelled}</span>Cancelled</div>
                    <div><span>{toMoney(bookingStats.spent)}</span>Spent</div>
                  </div>
                  <div className="cards">
                    {bookings.map((booking) => (
                      <article className="booking-card" key={booking.id}>
                        <div>
                          <h3>{booking.roomName}</h3>
                          <p>{booking.checkIn} to {booking.checkOut}</p>
                          <p>Status: <strong>{booking.status}</strong></p>
                          <p>Total: <strong>{toMoney(booking.totalPrice)}</strong></p>
                        </div>
                        <div className="inline-actions">
                          {booking.status !== 'CANCELLED' && (
                            <button type="button" className="danger" onClick={() => cancelBooking(booking.id)}>
                              Cancel
                            </button>
                          )}
                          {booking.status !== 'CANCELLED' && (
                            <button type="button" className="secondary" onClick={() => payBooking(booking.id)}>
                              Pay
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                    {!bookings.length && <p className="muted">No bookings yet.</p>}
                  </div>
                </>
              )}
            </>
          )}

          {view === 'admin' && isAdmin && (
            <>
              <h2>Admin Room Editor</h2>
              <form className="form-grid" onSubmit={submitAdminRoom}>
                <input placeholder="Room Name" value={adminRoomForm.name} onChange={(e) => setAdminRoomForm((prev) => ({ ...prev, name: e.target.value }))} required />
                <input placeholder="Type" value={adminRoomForm.type} onChange={(e) => setAdminRoomForm((prev) => ({ ...prev, type: e.target.value }))} required />
                <input type="number" min="1" placeholder="Capacity" value={adminRoomForm.capacity} onChange={(e) => setAdminRoomForm((prev) => ({ ...prev, capacity: e.target.value }))} required />
                <input type="number" min="1" step="0.01" placeholder="Price" value={adminRoomForm.pricePerNight} onChange={(e) => setAdminRoomForm((prev) => ({ ...prev, pricePerNight: e.target.value }))} required />
                <input placeholder="Image URL" value={adminRoomForm.imageUrl} onChange={(e) => setAdminRoomForm((prev) => ({ ...prev, imageUrl: e.target.value }))} />
                <input placeholder="Amenities" value={adminRoomForm.amenities} onChange={(e) => setAdminRoomForm((prev) => ({ ...prev, amenities: e.target.value }))} />
                <label className="checkbox">
                  <input type="checkbox" checked={adminRoomForm.isAvailable} onChange={(e) => setAdminRoomForm((prev) => ({ ...prev, isAvailable: e.target.checked }))} />
                  Available
                </label>
                <div className="row-actions">
                  <button type="submit">{adminRoomForm.id ? 'Update Room' : 'Create Room'}</button>
                  <button type="button" className="ghost" onClick={() => setAdminRoomForm({
                    id: '',
                    name: '',
                    type: 'Standard',
                    capacity: 2,
                    pricePerNight: 100,
                    amenities: '',
                    imageUrl: '',
                    isAvailable: true,
                  })}>
                    Clear
                  </button>
                </div>
              </form>

              <h3>All Bookings</h3>
              <div className="cards">
                {adminBookings.map((booking) => (
                  <article className="booking-card" key={booking.id}>
                    <div>
                      <h3>{booking.roomName}</h3>
                      <p>User: {booking.username}</p>
                      <p>{booking.checkIn} to {booking.checkOut}</p>
                      <p>Total: {toMoney(booking.totalPrice)} | Status: {booking.status}</p>
                    </div>
                    {booking.status !== 'CANCELLED' && (
                      <button type="button" className="danger" onClick={() => cancelBooking(booking.id, true)}>
                        Admin Cancel
                      </button>
                    )}
                  </article>
                ))}
                {!adminBookings.length && <p className="muted">No admin booking data.</p>}
              </div>
            </>
          )}

          {view === 'account' && (
            <>
              <h2>{user ? 'Session' : 'Authenticate'}</h2>
              {!user && (
                <>
                  <div className="tabs">
                    <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Login</button>
                    <button className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>Register</button>
                  </div>
                  <form className="form-grid" onSubmit={submitAuth}>
                    {authMode === 'login' && (
                      <>
                        <input placeholder="Username or Email" value={loginForm.username} onChange={(e) => setLoginForm((prev) => ({ ...prev, username: e.target.value }))} required />
                        <input type="password" placeholder="Password" value={loginForm.password} onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))} required />
                      </>
                    )}
                    {authMode === 'register' && (
                      <>
                        <input placeholder="Username" value={registerForm.username} onChange={(e) => setRegisterForm((prev) => ({ ...prev, username: e.target.value }))} required />
                        <input type="email" placeholder="Email" value={registerForm.email} onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))} required />
                        <input type="password" placeholder="Password" value={registerForm.password} onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))} required />
                      </>
                    )}
                    <button type="submit">{authMode === 'login' ? 'Login' : 'Create account'}</button>
                  </form>
                  <p className="muted">Default users from seed data: testuser/password123 and admin/admin123</p>
                </>
              )}
              {user && (
                <div className="session-card">
                  <p><strong>User:</strong> {user.username}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Role:</strong> {user.role}</p>
                  <div className="row-actions">
                    <button type="button" onClick={logout}>Logout</button>
                    <button type="button" className="secondary" onClick={() => setView('bookings')}>Open Bookings</button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
