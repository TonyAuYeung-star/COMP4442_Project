// ============ payment.js ============
function openPaymentModal(booking) {
    pendingPaymentBooking = booking;
    document.getElementById('paymentInfo').innerHTML = `
        <div style="font-weight:700; color:var(--gray-900); margin-bottom:4px;">${booking.roomName || selectedRoom?.name || 'Room Booking'}</div>
        <div style="font-size:0.875rem; color:var(--gray-500);">
            <i class="fas fa-calendar"></i> ${booking.checkIn} → ${booking.checkOut} &nbsp;|&nbsp;
            <i class="fas fa-dollar-sign"></i> $${booking.totalPrice}
        </div>
    `;
    document.getElementById('paymentCardNumber').value = '4111111111111111';
    document.getElementById('paymentExpiryMonth').value = '';
    document.getElementById('paymentExpiryYear').value = '';
    document.getElementById('paymentCvv').value = '';
    openModal('paymentModal');
}

async function payLater() {
    if (!pendingPaymentBooking) {
        closeModal('paymentModal');
        return;
    }
    const currentPayLaterCount = Number(pendingPaymentBooking.payLaterCount || 0);
    if (currentPayLaterCount >= 3) {
        toast('warning', 'Pay Later Limit Reached', 'You can only use Pay Later up to 3 times. Please complete payment now.');
        return;
    }
    const bookingId = pendingPaymentBooking.id;
    const res = await apiCall(`/bookings/${bookingId}/pay-later`, { method: 'PUT' });
    closeModal('paymentModal');
    pendingPaymentBooking = null;
    if (res.ok) {
        toast('warning', 'Payment Pending', 'Please complete the payment within 1 minute.');
        await loadBookings();
        await loadHomeData();
        showPage('bookings');
    } else {
        toast('error', 'Error', res.data.message || 'Failed to set pay later.');
    }
}

function closePaymentModal() {
    if (pendingPaymentBooking) {
        payLater();
    } else {
        closeModal('paymentModal');
    }
}

async function processPayment() {
    if (!pendingPaymentBooking) {
        toast('error', 'Payment Error', 'No pending payment booking found.');
        return;
    }
    const cardNumber = document.getElementById('paymentCardNumber').value.trim();
    const expiryMonth = document.getElementById('paymentExpiryMonth').value.trim();
    const expiryYear = document.getElementById('paymentExpiryYear').value.trim();
    const cvv = document.getElementById('paymentCvv').value.trim();
    if (!/^\d{3}$/.test(cvv)) {
        return toast('error', 'Invalid CVV', 'CVV must be exactly 3 digits.');
    }
    if (!/^\d{1,2}$/.test(expiryMonth) || Number(expiryMonth) < 1 || Number(expiryMonth) > 12) {
        return toast('error', 'Invalid Expiry Month', 'Expiry month must be a number between 1 and 12.');
    }
    if (!/^\d{4}$/.test(expiryYear) || Number(expiryYear) <= 2026) {
        return toast('error', 'Invalid Expiry Year', 'Expiry year must be 4 digits and greater than 2026.');
    }
    const payBtn = document.getElementById('payNowBtn');
    payBtn.disabled = true;
    payBtn.innerHTML = '<span class="spinner"></span> Processing...';
    const res = await apiCall('/payments/process', {
        method: 'POST',
        body: JSON.stringify({ bookingId: pendingPaymentBooking.id, cardNumber, expiryMonth, expiryYear, cvv })
    });
    payBtn.disabled = false;
    payBtn.innerHTML = '<i class="fas fa-check"></i>Pay Now';
    if (res.ok) {
        closeModal('paymentModal');
        const payment = res.data.data;
        if (payment.status === 'SUCCESS') {
            toast('success', 'Payment Successful', `${payment.message}. Reference: ${payment.paymentReferenceId}`);
        } else {
            toast('error', 'Payment Failed', payment.message || 'Payment was not successful.');
        }
        pendingPaymentBooking = null;
        await loadBookings();
        await loadHomeData();
        showPage('bookings');
    } else {
        toast('error', 'Payment Error', res.data.message || 'Failed to process payment.');
    }
}
