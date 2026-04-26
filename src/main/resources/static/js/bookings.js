// ============ bookings.js ============
async function confirmBooking() {
    const checkInValue = document.getElementById('modalCheckIn').value;
    const checkOutValue = document.getElementById('modalCheckOut').value;
    if (!checkInValue || !checkOutValue) return toast('error', 'Invalid Date', 'Please select check-in and check-out dates.');
    if (new Date(checkOutValue) <= new Date(checkInValue)) return toast('error', 'Invalid Date Range', 'Check-out must be later than check-in.');
    const btn = document.getElementById('confirmBookBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Processing...';
    const res = await apiCall('/bookings/create', {
        method: 'POST',
        body: JSON.stringify({ roomId: selectedRoom.id, checkIn: checkInValue, checkOut: checkOutValue })
    });
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check"></i>Confirm Booking';
    if (res.ok) {
        closeModal('bookingModal');
        openPaymentModal(res.data.data);
    } else {
        toast('error', 'Booking Failed', res.data.message || 'Room may not be available for selected dates.');
    }
}

async function loadBookings() {
    const res = await apiCall('/bookings/history');
    const bookings = res.data.data || [];
    userBookingsCache = bookings;
    const container = document.getElementById('bookingsList');
    if (!bookings.length) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-alt"></i><h3>No bookings yet</h3><p>Start by browsing our available rooms and make your first reservation.</p><button class="btn btn-primary" style="margin-top:16px;" onclick="showPage(\'rooms\')">Browse Rooms</button></div>';
        return;
    }
    container.innerHTML = bookings.map(b => `
        <div class="booking-card">
            <div class="booking-icon"><i class="fas fa-bed"></i></div>
            <div class="booking-info">
                <div class="booking-title">${b.roomName} <span class="status-badge status-${b.status.toLowerCase()}">${b.status}</span></div>
                <div class="booking-detail"><i class="fas fa-calendar"></i> ${b.checkIn} → ${b.checkOut} &nbsp;|&nbsp; <i class="fas fa-dollar-sign"></i> $${b.totalPrice}</div>
                ${b.cancellationSource && b.cancellationSource !== 'NONE' ? `<div class="booking-detail" style="margin-top:6px;"><i class="fas fa-user-shield"></i> Cancelled by: ${b.cancellationSource === 'ADMINISTRATOR' ? 'Administrator' : 'User'}</div>` : ''}
                ${b.status === 'PENDING_PAYMENT' && b.expiresAt ? `<div class="booking-detail" style="margin-top:6px;"><i class="fas fa-hourglass-half"></i> Payment expires in <span class="payment-countdown" data-expires-at="${b.expiresAt}">--:--</span></div>` : ''}
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
                <div class="booking-price">$${b.totalPrice}</div>
                ${b.status === 'PENDING_PAYMENT' ? `<button class="btn btn-primary btn-sm" onclick="payBooking(${b.id})"><i class="fas fa-credit-card"></i> Pay Now</button>` : ''}
                ${b.status !== 'CANCELLED' && b.status !== 'EXPIRED' ? `<button class="btn btn-danger btn-sm" onclick="cancelBooking(${b.id})"><i class="fas fa-times"></i> Cancel</button>` : ''}
            </div>
        </div>
    `).join('');
    startPaymentCountdown();
}

function payBooking(bookingId) {
    const booking = userBookingsCache.find(b => b.id === bookingId);
    if (!booking) return toast('error', 'Payment Error', 'Booking not found.');
    if (booking.status !== 'PENDING_PAYMENT') return toast('warning', 'Payment Not Required', 'Only pending bookings can be paid.');
    openPaymentModal(booking);
}

function startPaymentCountdown() {
    if (paymentCountdownTimer) {
        clearInterval(paymentCountdownTimer);
        paymentCountdownTimer = null;
    }
    const countdownNodes = document.querySelectorAll('.payment-countdown');
    if (!countdownNodes.length) return;
    const tick = async () => {
        if (paymentCountdownTicking) return;
        paymentCountdownTicking = true;
        let hasExpired = false;
        try {
            countdownNodes.forEach(node => {
                const remainingMs = new Date(node.dataset.expiresAt).getTime() - Date.now();
                if (remainingMs <= 0) {
                    node.textContent = '00:00';
                    hasExpired = true;
                    return;
                }
                const totalSeconds = Math.floor(remainingMs / 1000);
                node.textContent = `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
            });
            if (hasExpired) {
                clearInterval(paymentCountdownTimer);
                paymentCountdownTimer = null;
                toast('warning', 'Booking Expired', 'The payment deadline has passed, and the reservation has been automatically cancelled.');
                await loadBookings();
                await loadHomeData();
            }
        } finally {
            paymentCountdownTicking = false;
        }
    };
    tick();
    paymentCountdownTimer = setInterval(tick, 1000);
}

async function cancelBooking(id) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    const res = await apiCall('/bookings/' + id + '/cancel', { method: 'POST' });
    if (res.ok) {
        if (pendingPaymentBooking && pendingPaymentBooking.id === id) pendingPaymentBooking = null;
        toast('success', 'Cancelled', 'Your booking has been cancelled.');
        await loadBookings();
        await loadHomeData();
    } else {
        toast('error', 'Error', res.data.message || 'Failed to cancel booking.');
    }
}

async function cancelPendingPaymentBooking() {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    const bookingId = pendingPaymentBooking?.id;
    if (!bookingId) {
        closeModal('paymentModal');
        return;
    }
    closeModal('paymentModal');
    pendingPaymentBooking = null;
    const res = await apiCall('/bookings/' + bookingId + '/cancel', { method: 'POST' });
    if (res.ok) {
        toast('success', 'Cancelled', 'The reservation has been cancelled and the room has been released.');
        await loadBookings();
        await loadHomeData();
    } else {
        toast('error', 'Error', res.data.message || 'Failed to cancel booking.');
    }
}
