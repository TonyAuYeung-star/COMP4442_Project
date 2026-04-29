// ============ globals.js ============
const API_BASE = '/api/v1';
let token = sessionStorage.getItem('jwt_token') || '';
let currentUser = JSON.parse(sessionStorage.getItem('current_user') || 'null');
let selectedRoom = null;
let allRooms = [];
let userBookingsCache = [];
let adminRoomsCache = [];
let editingRoom = null;
let adminBookingsCache = [];
let pendingPaymentBooking = null;
let paymentCountdownTimer = null;
let paymentCountdownTicking = false;
let authMode = 'login';
let isGuestMode = !token || !currentUser;
let currentEditBookingId = null;

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 8);

function setDefaultDates() {
    document.querySelectorAll('input[type="date"]').forEach(el => {
        if (el.id.includes('CheckIn') || el.id.includes('checkIn')) el.value = tomorrow.toISOString().split('T')[0];
        if (el.id.includes('CheckOut') || el.id.includes('checkOut')) el.value = nextWeek.toISOString().split('T')[0];
    });
}

async function apiCall(url, options = {}) {
    options.headers = options.headers || {};
    if (token) options.headers.Authorization = `Bearer ${token}`;
    if (options.body && typeof options.body === 'string') options.headers['Content-Type'] = 'application/json';
    const res = await fetch(API_BASE + url, options);
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 || (data && data.message && (data.message.includes('User not found') || data.message.includes('Unauthorized')))) {
        token = '';
        currentUser = null;
        sessionStorage.removeItem('jwt_token');
        sessionStorage.removeItem('current_user');
        if (document.getElementById('appPages').style.display !== 'none') {
            toast('warning', 'Session Expired', 'Please sign in again.');
            setTimeout(() => showPage('auth'), 1500);
        }
    }
    return { ok: res.ok, status: res.status, data };
}
