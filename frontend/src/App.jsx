import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
const USER_KEY = 'comp4442_user'
const ROOM_TYPES = ['Standard', 'Deluxe', 'Suite', 'Presidential']
const ROOM_CAPACITIES = [1, 2, 3, 4, 5, 6]
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

function nextDay(dateStr) {
  if (!dateStr) return undefined
  const d = new Date(dateStr)
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function formatRemainingTime(expiresAt, nowMs) {
  if (!expiresAt) return null
  const remainingMs = new Date(expiresAt).getTime() - nowMs
  if (Number.isNaN(remainingMs) || remainingMs <= 0) return '00:00'
  const totalSeconds = Math.floor(remainingMs / 1000)
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

function validatePaymentForm({ expiryMonth, expiryYear, cvv }) {
  if (!/^\d{3}$/.test(cvv || '')) {
    return 'CVV must be exactly 3 digits.'
  }
  if (!/^\d{1,2}$/.test(expiryMonth || '')) {
    return 'Expiry month must be a number between 1 and 12.'
  }
  const month = Number(expiryMonth)
  if (month < 1 || month > 12) {
    return 'Expiry month must be a number between 1 and 12.'
  }
  if (!/^\d{4}$/.test(expiryYear || '')) {
    return 'Expiry year must be exactly 4 digits.'
  }
  if (Number(expiryYear) <= 2026) {
    return 'Expiry year must be greater than 2026.'
  }
  return null
}

function getRoomImageSrc(room) {
  const fallback = 'https://img.freepik.com/free-photo/small-hotel-room-interior-with-double-bed-bathroom_1262-12489.jpg?w=800'
  const imageUrl = room?.imageUrl?.trim()
  if (!imageUrl) return fallback
  const version = room?.updatedAt ? encodeURIComponent(room.updatedAt) : ''
  const separator = imageUrl.includes('?') ? '&' : '?'
  return version ? `${imageUrl}${separator}v=${version}` : imageUrl
}

function App() {
  const [view, setView] = useState('explore')
  const [rooms, setRooms] = useState([])
  const [bookings, setBookings] = useState([])
  const [adminBookings, setAdminBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [banner, setBanner] = useState({ type: 'ok', text: '' })
  const [nowMs, setNowMs] = useState(Date.now())
  const [paymentModalBooking, setPaymentModalBooking] = useState(null)
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '4111111111111111',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
  })
  const [processingPayment, setProcessingPayment] = useState(false)
  const [paymentErrorMessage, setPaymentErrorMessage] = useState('')

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
    minPrice: '0',
    maxPrice: '700',
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
  const expiryRefreshInFlightRef = useRef(false)

  const bookingStats = useMemo(() => {
    const total = bookings.length
    const active = bookings.filter((b) => b.status === 'CONFIRMED').length
    const cancelled = bookings.filter((b) => b.status === 'CANCELLED' || b.status === 'EXPIRED').length
    const pending = bookings.filter((b) => b.status === 'PENDING_PAYMENT').length
    const spent = bookings
      .filter((b) => b.status === 'CONFIRMED')
      .reduce((sum, b) => sum + Number(b.totalPrice || 0), 0)
    return { total, active, cancelled, pending, spent }
  }, [bookings])
  const visibleRooms = useMemo(
    () => (view === 'explore' ? rooms.filter((room) => room.isAvailable !== false) : rooms),
    [rooms, view],
  )

  // Calculate dynamic price range based on actual room prices
  const PRICE_MIN = useMemo(() => {
    if (!rooms.length) return 0
    return Math.floor(Math.min(...rooms.map(r => Number(r.pricePerNight || 0))) / PRICE_STEP) * PRICE_STEP
  }, [rooms])

  const PRICE_MAX = useMemo(() => {
    if (!rooms.length) return 700
    const maxRoomPrice = Math.max(...rooms.map(r => Number(r.pricePerNight || 0)))
    // Round up to nearest PRICE_STEP and add extra buffer so highest price is selectable
    return Math.ceil((maxRoomPrice + PRICE_STEP) / PRICE_STEP) * PRICE_STEP
  }, [rooms])

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

  const loadAdminRooms = useCallback(async () => {
    if (!user?.token || !isAdmin) return
    try {
      const data = await apiRequest('/v1/admin/rooms', { token: user.token })
      setRooms(data || [])
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
      loadAdminRooms()
      loadAdminBookings()
    }
  }, [view, isAdmin, loadAdminBookings, loadAdminRooms])

  useEffect(() => {
    if (view === 'explore') {
      loadRooms()
    }
  }, [view, loadRooms])

  useEffect(() => {
    if (view === 'bookings' && user?.token) {
      loadBookings()
    }
  }, [view, user?.token, loadBookings])

  useEffect(() => {
    const hasPendingPayments = bookings.some((booking) => booking.status === 'PENDING_PAYMENT' && booking.expiresAt)
    if (!hasPendingPayments) return

    const timer = window.setInterval(() => {
      const currentNow = Date.now()
      setNowMs(currentNow)

      const hasExpiredPending = bookings.some((booking) => {
        if (booking.status !== 'PENDING_PAYMENT' || !booking.expiresAt) return false
        const remainingMs = new Date(booking.expiresAt).getTime() - currentNow
        return !Number.isNaN(remainingMs) && remainingMs <= 0
      })

      if (hasExpiredPending && !expiryRefreshInFlightRef.current) {
        expiryRefreshInFlightRef.current = true
        loadBookings().finally(() => {
          expiryRefreshInFlightRef.current = false
        })
      }
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [bookings, loadBookings])

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

  // Auto update search price range when dynamic min/max changes (new rooms added)
  useEffect(() => {
    setRoomSearch(prev => {
      const currentMin = Number(prev.minPrice)
      const currentMax = Number(prev.maxPrice)
      
      // Only update if current values are outside new range
      let newMin = currentMin < PRICE_MIN ? String(PRICE_MIN) : prev.minPrice
      let newMax = currentMax > PRICE_MAX ? String(PRICE_MAX) : prev.maxPrice
      
      // If range was at default max, expand it automatically
      if (currentMax === 700 || currentMax === PRICE_MAX - PRICE_STEP) {
        newMax = String(PRICE_MAX)
      }
      
      if (newMin === prev.minPrice && newMax === prev.maxPrice) {
        return prev
      }
      
      return {
        ...prev,
        minPrice: newMin,
        maxPrice: newMax
      }
    })
  }, [PRICE_MIN, PRICE_MAX])

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
      const createdBooking = await apiRequest('/v1/bookings/create', {
        method: 'POST',
        token: user.token,
        body: bookingDraft,
      })
      showBanner('ok', 'Booking created successfully.')
      setAvailability(null)
      await loadBookings()
      if (createdBooking) {
        openPaymentModal(createdBooking)
      }
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

  function openPaymentModal(booking) {
    if (!booking) return
    if (booking.status !== 'PENDING_PAYMENT') {
      showBanner('error', 'Only pending bookings can be paid.')
      return
    }
    setPaymentModalBooking(booking)
    setPaymentForm({
      cardNumber: '4111111111111111',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
    })
  }

  function closePaymentModal() {
    setPaymentModalBooking(null)
    setProcessingPayment(false)
    setPaymentErrorMessage('')
  }

  async function submitPayment() {
    const booking = paymentModalBooking
    if (!user?.token || !booking) return
    setPaymentErrorMessage('')

    const { cardNumber, expiryMonth, expiryYear, cvv } = paymentForm
    if (!cardNumber || !expiryMonth || !expiryYear || !cvv) {
      setPaymentErrorMessage('Please fill in all payment fields.')
      return
    }

    // Card number format validation
    if (!/^\d{13,19}$/.test(cardNumber.replace(/\s/g, ''))) {
      setPaymentErrorMessage('Invalid card number format')
      return
    }

    // CVV format validation
    if (!/^\d{3,4}$/.test(cvv)) {
      setPaymentErrorMessage('Invalid CVV format')
      return
    }

    const paymentValidationError = validatePaymentForm({ expiryMonth, expiryYear, cvv })
    if (paymentValidationError) {
      setPaymentErrorMessage(paymentValidationError)
      return
    }

    try {
      setProcessingPayment(true)
      const payment = await apiRequest('/v1/payments/process', {
        method: 'POST',
        token: user.token,
        body: {
          bookingId: booking.id,
          cardNumber: cardNumber.trim(),
          expiryMonth: expiryMonth.trim(),
          expiryYear: expiryYear.trim(),
          cvv: cvv.trim(),
        },
      })
      if (payment?.status === 'SUCCESS') {
        // Generate unique reference number
        const uniqueId = Math.random().toString(36).substring(2, 14).toUpperCase()
        const paymentReference = `PAY-${uniqueId}`
        showBanner('ok', `Payment successful. Reference: ${paymentReference}`)
        closePaymentModal()
        setView('bookings')
      } else {
        setPaymentErrorMessage(payment?.message || `Payment ${payment?.status || 'failed'}.`)
      }
      await loadBookings()
    } catch (error) {
      setPaymentErrorMessage(error.message)
    } finally {
      setProcessingPayment(false)
    }
  }

  async function payLaterBooking(bookingId) {
    if (!user?.token) return
    const targetBooking = bookings.find((booking) => booking.id === bookingId)
    if (Number(targetBooking?.payLaterCount || 0) >= 3) {
      showBanner('error', 'Pay Later limit reached (maximum 3 times). Please complete payment now.')
      return
    }
    try {
      const updatedBooking = await apiRequest(`/v1/bookings/${bookingId}/pay-later`, {
        method: 'PUT',
        token: user.token,
      })
      showBanner('ok', 'Payment deadline refreshed for 1 minute.')
      if (updatedBooking) {
        setBookings((prev) => prev.map((booking) => (booking.id === updatedBooking.id ? updatedBooking : booking)))
      }
      await loadBookings()
    } catch (error) {
      showBanner('error', error.message)
      await loadBookings()
    }
  }

  async function updateAdminBooking(booking) {
    if (!user?.token || !isAdmin) return
    const checkIn = window.prompt('Check-in date (YYYY-MM-DD)', booking.checkIn || '')
    if (checkIn === null) return
    const checkOut = window.prompt('Check-out date (YYYY-MM-DD)', booking.checkOut || '')
    if (checkOut === null) return
    const totalPrice = window.prompt('Total price', String(booking.totalPrice ?? ''))
    if (totalPrice === null) return

    try {
      await apiRequest(`/v1/admin/bookings/${booking.id}`, {
        method: 'PUT',
        token: user.token,
        body: {
          checkIn,
          checkOut,
          totalPrice: Number(totalPrice),
        },
      })
      showBanner('ok', 'Booking updated.')
      await loadAdminBookings()
      await loadBookings()
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
      await loadAdminRooms()
    } catch (error) {
      showBanner('error', error.message)
    }
  }

  function editAdminRoom(room) {
    setAdminRoomForm({
      id: room.id,
      name: room.name,
      type: room.type,
      capacity: room.capacity,
      pricePerNight: room.pricePerNight,
      amenities: room.amenities || '',
      imageUrl: room.imageUrl || '',
      isAvailable: room.isAvailable !== false,
    })
  }

  function resetAdminRoomForm() {
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
  }

  async function updateRoomAvailability(room, isAvailable) {
    if (!user?.token || !isAdmin) return
    try {
      await apiRequest(`/v1/admin/rooms/${room.id}`, {
        method: 'PUT',
        token: user.token,
        body: {
          name: room.name,
          type: room.type,
          capacity: Number(room.capacity),
          pricePerNight: Number(room.pricePerNight),
          amenities: room.amenities || '',
          imageUrl: room.imageUrl || '',
          isAvailable,
        },
      })
      showBanner('ok', `Room marked as ${isAvailable ? 'available' : 'unavailable'}.`)
      await loadAdminRooms()
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
      await loadAdminRooms()
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
            <input type="date" min={new Date().toISOString().split('T')[0]} value={roomSearch.checkIn} onChange={(e) => setRoomSearch((prev) => ({ ...prev, checkIn: e.target.value }))} />
            <input type="date" min={nextDay(roomSearch.checkIn)} value={roomSearch.checkOut} onChange={(e) => setRoomSearch((prev) => ({ ...prev, checkOut: e.target.value }))} />
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
              {visibleRooms.map((room) => (
                <option key={room.id} value={room.id}>{room.name} ({toMoney(room.pricePerNight)})</option>
              ))}
            </select>
            <input type="date" min={new Date().toISOString().split('T')[0]} value={bookingDraft.checkIn} onChange={(e) => setBookingDraft((prev) => ({ ...prev, checkIn: e.target.value, checkOut: prev.checkOut && new Date(prev.checkOut) <= new Date(e.target.value) ? '' : prev.checkOut }))} required />
            <input type="date" min={nextDay(bookingDraft.checkIn)} value={bookingDraft.checkOut} onChange={(e) => setBookingDraft((prev) => ({ ...prev, checkOut: e.target.value }))} required />
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
                {visibleRooms.map((room, index) => (
                  <article className="room-card" style={{ animationDelay: `${index * 0.05}s` }} key={room.id}>
                    <img
                      src={getRoomImageSrc(room)}
                      alt={room.name}
                      onError={(event) => {
                        event.currentTarget.src = 'https://img.freepik.com/free-photo/small-hotel-room-interior-with-double-bed-bathroom_1262-12489.jpg?w=800'
                      }}
                    />
                    <div>
                      <span className="pill">{room.type}</span>
                      <h3>{room.name}</h3>
                      <p>Capacity: {room.capacity} guest(s)</p>
                      <p>{room.amenities}</p>
                      <strong>{toMoney(room.pricePerNight)} / night</strong>
                      {isAdmin && (
                        <div className="inline-actions">
                          <button type="button" className="ghost" onClick={() => {
                            setAdminRoomForm({
                              id: room.id,
                              name: room.name,
                              type: room.type,
                              capacity: room.capacity,
                              pricePerNight: room.pricePerNight,
                              amenities: room.amenities || '',
                              imageUrl: room.imageUrl || '',
                              isAvailable: room.isAvailable,
                            })
                            setView('admin')
                          }}>
                            Edit
                          </button>
                          <button type="button" className="danger" onClick={() => deleteRoom(room.id)}>Delete</button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
                {!visibleRooms.length && <p className="muted">No rooms found.</p>}
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
                    <div><span>{bookingStats.pending}</span>Pending</div>
                    <div><span>{bookingStats.cancelled}</span>Cancelled/Expired</div>
                    <div><span>{toMoney(bookingStats.spent)}</span>Spent</div>
                  </div>
                  <div className="cards">
                    {bookings.map((booking) => (
                      <article className="booking-card" key={booking.id}>
                        <div>
                          <h3>{booking.roomName}</h3>
                          <p>{booking.checkIn} to {booking.checkOut}</p>
                          <p>Status: <strong>{booking.status}</strong></p>
                          {booking.status === 'PENDING_PAYMENT' && booking.expiresAt && (
                            <p>Payment expires in: <strong>{formatRemainingTime(booking.expiresAt, nowMs)}</strong></p>
                          )}
                          {booking.status === 'CONFIRMED' && booking.paymentReferenceId && (
                            <p>Reference Number: <strong>{booking.paymentReferenceId}</strong></p>
                          )}
                          {booking.status === 'CANCELLED' && booking.cancellationSource && (
                            <p>Cancelled by: <strong>{booking.cancellationSource === 'USER' ? 'You' : 'Administrator'}</strong></p>
                          )}
                          <p>Total: <strong>{toMoney(booking.totalPrice)}</strong></p>
                        </div>
                        <div className="inline-actions">
                          {booking.status !== 'CANCELLED' && booking.status !== 'EXPIRED' && (
                            <button type="button" className="danger" onClick={() => cancelBooking(booking.id)}>
                              Cancel
                            </button>
                          )}
                          {booking.status === 'PENDING_PAYMENT' && (
                            <button type="button" className="secondary" onClick={() => openPaymentModal(booking)}>
                              Pay
                            </button>
                          )}
                          {booking.status === 'PENDING_PAYMENT' && (
                            <button type="button" className="ghost" onClick={() => payLaterBooking(booking.id)}>
                              Pay Later ({Math.max(0, 3 - Number(booking.payLaterCount || 0))} left)
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
                <select value={adminRoomForm.type} onChange={(e) => setAdminRoomForm((prev) => ({ ...prev, type: e.target.value }))} required>
                  <option value="">Select room type</option>
                  {ROOM_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <select value={adminRoomForm.capacity} onChange={(e) => setAdminRoomForm((prev) => ({ ...prev, capacity: Number(e.target.value) }))} required>
                  <option value="">Select capacity</option>
                  {ROOM_CAPACITIES.map((capacity) => (
                    <option key={capacity} value={capacity}>{capacity} guest{capacity > 1 ? 's' : ''}</option>
                  ))}
                </select>
                <input type="number" min="1" step="0.01" placeholder="Price" value={adminRoomForm.pricePerNight} onChange={(e) => setAdminRoomForm((prev) => ({ ...prev, pricePerNight: e.target.value }))} required />
                <input placeholder="Image URL" value={adminRoomForm.imageUrl} onChange={(e) => setAdminRoomForm((prev) => ({ ...prev, imageUrl: e.target.value }))} />
                <input placeholder="Amenities" value={adminRoomForm.amenities} onChange={(e) => setAdminRoomForm((prev) => ({ ...prev, amenities: e.target.value }))} />
                <label className="checkbox">
                  <input type="checkbox" checked={adminRoomForm.isAvailable} onChange={(e) => setAdminRoomForm((prev) => ({ ...prev, isAvailable: e.target.checked }))} />
                  Available
                </label>
                <div className="row-actions">
                  <button type="submit">{adminRoomForm.id ? 'Update Room' : 'Create Room'}</button>
                  <button type="button" className="ghost" onClick={resetAdminRoomForm}>
                    Clear
                  </button>
                </div>
              </form>

              <h3>All Rooms</h3>
              <div className="cards">
                {rooms.map((room) => (
                  <article className="room-admin-card" key={room.id}>
                    <div>
                      <h3>{room.name}</h3>
                      <p>Type: {room.type} | Capacity: {room.capacity}</p>
                      <p>Price: <strong>{toMoney(room.pricePerNight)}</strong></p>
                      <p className={`room-status ${room.isAvailable === false ? 'off' : 'on'}`}>
                        {room.isAvailable === false ? 'Unavailable' : 'Available'}
                      </p>
                    </div>
                    <div className="inline-actions">
                      <button type="button" className="ghost" onClick={() => editAdminRoom(room)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className={room.isAvailable === false ? 'secondary' : 'danger'}
                        onClick={() => updateRoomAvailability(room, room.isAvailable === false)}
                      >
                        {room.isAvailable === false ? 'Set Available' : 'Set Unavailable'}
                      </button>
                    </div>
                  </article>
                ))}
                {!rooms.length && <p className="muted">No rooms found.</p>}
              </div>

              <h3>All Bookings</h3>
              <div className="cards">
                {adminBookings.map((booking) => (
                  <article className="booking-card" key={booking.id}>
                    <div>
                      <h3>{booking.roomName}</h3>
                      <p>User: {booking.username}</p>
                      <p>{booking.checkIn} to {booking.checkOut}</p>
                          <p>Total: {toMoney(booking.totalPrice)} | Status: {booking.status}</p>
                          {booking.status === 'CONFIRMED' && booking.paymentReferenceId && (
                            <p>Reference Number: <strong>{booking.paymentReferenceId}</strong></p>
                          )}
                          {booking.status === 'CANCELLED' && booking.cancellationSource && (
                            <p>Cancelled by: <strong>{booking.cancellationSource === 'USER' ? 'User' : 'Administrator'}</strong></p>
                          )}
                    </div>
                    {booking.status !== 'CANCELLED' && booking.status !== 'EXPIRED' && (
                      <div className="inline-actions">
                        <button type="button" className="ghost" onClick={() => updateAdminBooking(booking)}>
                          Edit
                        </button>
                        <button type="button" className="danger" onClick={() => cancelBooking(booking.id, true)}>
                          Admin Cancel
                        </button>
                      </div>
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
                  <div className="tabs account-tabs">
                    <button className={`auth-toggle ${authMode === 'login' ? 'active' : ''}`} onClick={() => setAuthMode('login')}>Login</button>
                    <button className={`auth-toggle ${authMode === 'register' ? 'active' : ''}`} onClick={() => setAuthMode('register')}>Register</button>
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

      {paymentModalBooking && (
        <div className="payment-modal-backdrop" onClick={closePaymentModal} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="payment-modal-card" onClick={(event) => event.stopPropagation()} style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '28px',
            width: '100%',
            maxWidth: '460px',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.3)',
            animation: 'modalSlideIn 0.3s ease-out'
          }}>
            <h3>Payment</h3>
            <p><strong>{paymentModalBooking.roomName || 'Room Booking'}</strong></p>
            <p>{paymentModalBooking.checkIn} to {paymentModalBooking.checkOut} | {toMoney(paymentModalBooking.totalPrice)}</p>

            {paymentErrorMessage && (
              <div className="payment-error" style={{
                background: '#ffebee',
                border: '1px solid #ef5350',
                borderRadius: '6px',
                padding: '12px 16px',
                margin: '12px 0',
                color: '#c62828',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ⚠️ {paymentErrorMessage}
              </div>
            )}

            <label>Card Number</label>
            <input
              type="text"
              value={paymentForm.cardNumber}
              onChange={(event) => setPaymentForm((prev) => ({ ...prev, cardNumber: event.target.value }))}
              placeholder="4111111111111111"
              maxLength={19}
            />

            <div className="payment-grid">
              <div>
                <label>Expiry Month (MM)</label>
                <input
                  type="text"
                  value={paymentForm.expiryMonth}
                  onChange={(event) => setPaymentForm((prev) => ({ ...prev, expiryMonth: event.target.value }))}
                  placeholder="12"
                  maxLength={2}
                />
              </div>
              <div>
                <label>Expiry Year (YYYY)</label>
                <input
                  type="text"
                  value={paymentForm.expiryYear}
                  onChange={(event) => setPaymentForm((prev) => ({ ...prev, expiryYear: event.target.value }))}
                  placeholder="2030"
                  maxLength={4}
                />
              </div>
            </div>

            <label>CVV</label>
            <input
              type="password"
              value={paymentForm.cvv}
              onChange={(event) => setPaymentForm((prev) => ({ ...prev, cvv: event.target.value }))}
              placeholder="123"
              maxLength={4}
            />

            <p className="payment-hint">
              Demo cards: 4111111111111111 (success), 5500005555555559 (success),
              0000000000000000 (declined), 1234567890123456 (insufficient funds)
            </p>

            <div className="row-actions">
              <button type="button" className="ghost" onClick={closePaymentModal}>Cancel</button>
              <button
                type="button"
                className="secondary"
                onClick={submitPayment}
                disabled={processingPayment}
              >
                {processingPayment ? 'Processing...' : 'Pay'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (Number(paymentModalBooking.payLaterCount || 0) >= 3) {
                    showBanner('error', 'Pay Later limit reached (maximum 3 times). Please complete payment now.')
                    return
                  }
                  await payLaterBooking(paymentModalBooking.id)
                  closePaymentModal()
                  setView('bookings')
                }}
              >
                Pay Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
