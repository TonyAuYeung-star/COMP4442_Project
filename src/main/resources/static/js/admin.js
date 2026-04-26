// ============ admin.js ============
function switchAdminTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('adminAllBookings').style.display = tab === 'allBookings' ? 'block' : 'none';
    document.getElementById('adminRooms').style.display = tab === 'rooms' ? 'block' : 'none';
    if (tab === 'rooms') loadAdminRooms();
}

async function loadAdminBookings() {
    const res = await apiCall('/admin/bookings/all');
    const bookings = res.data.data || [];
    adminBookingsCache = bookings;
    applyAdminBookingFilter();
}

function applyAdminBookingFilter() {
    const selectedStatus = (document.getElementById('adminBookingStatusFilter')?.value || '').trim();
    const filteredBookings = selectedStatus
        ? adminBookingsCache.filter(b => b.status === selectedStatus)
        : adminBookingsCache.slice();
    const container = document.getElementById('adminBookingsList');
    if (!filteredBookings.length) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><h3>No matching bookings found</h3></div>';
        return;
    }
    container.innerHTML = filteredBookings.map(b => `
        <div class="booking-card">
            <div class="booking-icon"><i class="fas fa-bed"></i></div>
            <div class="booking-info">
                <div class="booking-title">${b.roomName} <span class="status-badge status-${b.status.toLowerCase()}">${b.status}</span></div>
                <div class="booking-detail"><i class="fas fa-user"></i> ${b.username} &nbsp;|&nbsp; <i class="fas fa-calendar"></i> ${b.checkIn} → ${b.checkOut} &nbsp;|&nbsp; <i class="fas fa-dollar-sign"></i> $${b.totalPrice}</div>
                ${b.cancellationSource && b.cancellationSource !== 'NONE' ? `<div class="booking-detail" style="margin-top:6px;"><i class="fas fa-user-shield"></i> Cancelled by: ${b.cancellationSource === 'ADMINISTRATOR' ? 'Administrator' : 'User'}</div>` : ''}
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
                <div class="booking-price">$${b.totalPrice}</div>
                ${b.status !== 'CANCELLED' && b.status !== 'EXPIRED' ? `<button class="btn btn-secondary btn-sm" onclick="openAdminEditBookingModal(${b.id})"><i class="fas fa-edit"></i> Edit</button><button class="btn btn-danger btn-sm" onclick="adminCancelBooking(${b.id})"><i class="fas fa-times"></i> Cancel</button>` : ''}
            </div>
        </div>
    `).join('');
}

function clearAdminBookingFilter() {
    const filterNode = document.getElementById('adminBookingStatusFilter');
    if (filterNode) {
        filterNode.value = '';
    }
    applyAdminBookingFilter();
}

async function loadAdminRooms() {
    const res = await apiCall('/admin/rooms');
    const rooms = res.data.data || [];
    adminRoomsCache = rooms;
    const container = document.getElementById('adminRoomsList');
    if (!rooms.length) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-bed"></i><h3>No rooms found</h3></div>';
        return;
    }
    container.innerHTML = `
        <table style="width:100%; border-collapse:collapse;">
            <thead><tr style="background:var(--gray-50); text-align:left;"><th style="padding:12px 16px; border-bottom:1px solid var(--gray-200);">Room</th><th style="padding:12px 16px; border-bottom:1px solid var(--gray-200);">Type</th><th style="padding:12px 16px; border-bottom:1px solid var(--gray-200);">Capacity</th><th style="padding:12px 16px; border-bottom:1px solid var(--gray-200);">Price</th><th style="padding:12px 16px; border-bottom:1px solid var(--gray-200);">Status</th><th style="padding:12px 16px; border-bottom:1px solid var(--gray-200);">Actions</th></tr></thead>
            <tbody>${rooms.map(r => `<tr style="border-bottom:1px solid var(--gray-100);"><td style="padding:12px 16px;">${r.name}</td><td style="padding:12px 16px;">${r.type}</td><td style="padding:12px 16px;">${r.capacity}</td><td style="padding:12px 16px;">$${r.pricePerNight}</td><td style="padding:12px 16px;"><span class="status-badge status-${r.isAvailable ? 'confirmed' : 'cancelled'}">${r.isAvailable ? 'Available' : 'Unavailable'}</span></td><td style="padding:12px 16px;"><button class="btn btn-secondary btn-sm" onclick="openRoomModal(${r.id})" style="margin-right:4px;"><i class="fas fa-edit"></i></button><button class="btn btn-danger btn-sm" onclick="deleteRoom(${r.id})"><i class="fas fa-trash"></i></button></td></tr>`).join('')}</tbody>
        </table>
    `;
}

function openRoomModal(roomId) {
    const room = roomId ? adminRoomsCache.find(r => r.id === roomId) : null;
    editingRoom = room;
    const modalBody = document.getElementById('roomModalBody');
    document.getElementById('roomModalTitle').textContent = room ? 'Edit Room' : 'Add New Room';
    modalBody.innerHTML = `
        <div class="form-group"><label class="form-label">Room Name</label><input type="text" class="form-input" id="roomName" value="${room ? room.name : ''}" required></div>
        <div class="grid grid-2"><div class="form-group"><label class="form-label">Type</label><select class="form-select" id="roomType"><option value="Standard" ${room && room.type === 'Standard' ? 'selected' : ''}>Standard</option><option value="Deluxe" ${room && room.type === 'Deluxe' ? 'selected' : ''}>Deluxe</option><option value="Suite" ${room && room.type === 'Suite' ? 'selected' : ''}>Suite</option><option value="Presidential" ${room && room.type === 'Presidential' ? 'selected' : ''}>Presidential</option></select></div><div class="form-group"><label class="form-label">Capacity</label><input type="number" class="form-input" id="roomCapacity" value="${room ? room.capacity : 2}" min="1" required></div></div>
        <div class="grid grid-2"><div class="form-group"><label class="form-label">Price per Night ($)</label><input type="number" class="form-input" id="roomPrice" value="${room ? room.pricePerNight : 100}" min="0" step="0.01" required></div><div class="form-group"><label class="form-label">Status</label><select class="form-select" id="roomStatus"><option value="true" ${!room || room.isAvailable ? 'selected' : ''}>Available</option><option value="false" ${room && !room.isAvailable ? 'selected' : ''}>Unavailable</option></select></div></div>
        <div class="form-group"><label class="form-label">Amenities</label><input type="text" class="form-input" id="roomAmenities" value="${room ? room.amenities : ''}" placeholder="Wi-Fi, TV, Air Conditioning"></div>
        <div class="form-group"><label class="form-label">Image URL</label><input type="text" class="form-input" id="roomImageUrl" value="${room ? room.imageUrl : ''}" placeholder="https://example.com/image.jpg"></div>
    `;
    openModal('roomModal');
}

async function saveRoom() {
    const btn = document.getElementById('saveRoomBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';
    const roomData = {
        name: document.getElementById('roomName').value,
        type: document.getElementById('roomType').value,
        capacity: parseInt(document.getElementById('roomCapacity').value, 10),
        pricePerNight: parseFloat(document.getElementById('roomPrice').value),
        amenities: document.getElementById('roomAmenities').value,
        imageUrl: document.getElementById('roomImageUrl').value,
        isAvailable: document.getElementById('roomStatus').value === 'true'
    };
    const method = editingRoom ? 'PUT' : 'POST';
    const url = editingRoom ? `/admin/rooms/${editingRoom.id}` : '/admin/rooms';
    const res = await apiCall(url, { method, body: JSON.stringify(roomData) });
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Save';
    if (res.ok) {
        closeModal('roomModal');
        toast('success', 'Success', editingRoom ? 'Room updated successfully' : 'Room created successfully');
        editingRoom = null;
        await loadRooms();
        await loadAdminRooms();
    } else {
        toast('error', 'Error', res.data?.message || 'Failed to save room');
    }
}

async function deleteRoom(roomId) {
    if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) return;
    const res = await apiCall(`/admin/rooms/${roomId}`, { method: 'DELETE' });
    if (res.ok) {
        toast('success', 'Deleted', 'Room has been deleted successfully.');
        await loadRooms();
        await loadAdminRooms();
    } else {
        toast('error', 'Error', res.data?.message || 'Failed to delete room');
    }
}

async function adminCancelBooking(id) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    const res = await apiCall('/admin/bookings/' + id + '/cancel', { method: 'PUT' });
    if (res.ok) {
        toast('success', 'Cancelled', 'Booking has been cancelled.');
        loadAdminBookings();
    } else {
        toast('error', 'Error', res.data.message || 'Failed to cancel booking.');
    }
}

function openAdminEditBookingModal(id) {
    const booking = adminBookingsCache.find(item => item.id === id);
    if (!booking) return toast('error', 'Error', 'Booking details not found.');
    currentEditBookingId = id;
    document.getElementById('adminEditBookingInfo').innerHTML = `<div style="font-weight:700; color:var(--gray-900); margin-bottom:4px;">${booking.roomName}</div><div style="font-size:0.875rem; color:var(--gray-500);">User: ${booking.username}</div>`;
    document.getElementById('adminEditCheckIn').value = booking.checkIn;
    document.getElementById('adminEditCheckOut').value = booking.checkOut;
    document.getElementById('adminEditTotalPrice').value = booking.totalPrice;
    openModal('adminEditBookingModal');
}

async function saveAdminEditBooking() {
    const checkIn = document.getElementById('adminEditCheckIn').value;
    const checkOut = document.getElementById('adminEditCheckOut').value;
    const totalPrice = parseFloat(document.getElementById('adminEditTotalPrice').value);
    if (!checkIn || !checkOut) return toast('error', 'Invalid Date', 'Check-in and check-out dates are required.');
    if (new Date(checkOut) <= new Date(checkIn)) return toast('error', 'Invalid Date Range', 'Check-out must be later than check-in.');
    if (!Number.isFinite(totalPrice) || totalPrice < 0) return toast('error', 'Invalid Price', 'Total price must be a non-negative number.');
    const res = await apiCall('/admin/bookings/' + currentEditBookingId, { method: 'PUT', body: JSON.stringify({ checkIn, checkOut, totalPrice }) });
    if (res.ok) {
        closeModal('adminEditBookingModal');
        toast('success', 'Updated', 'Booking has been updated successfully.');
        loadAdminBookings();
    } else {
        toast('error', 'Error', res.data.message || 'Failed to update booking.');
    }
}
