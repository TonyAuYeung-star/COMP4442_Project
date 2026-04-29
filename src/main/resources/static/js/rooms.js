// ============ rooms.js ============
async function loadRooms() {
    const res = await apiCall('/rooms');
    allRooms = res.data.data || [];
    document.getElementById('roomsGrid').innerHTML = allRooms.length
        ? allRooms.map(r => renderRoomCard(r)).join('')
        : '<div class="empty-state"><i class="fas fa-bed"></i><h3>No rooms available</h3></div>';
}

async function filterRooms() {
    const minPriceVal = document.getElementById('filterMin').value;
    const maxPriceVal = document.getElementById('filterMax').value;
    if (minPriceVal !== '' && parseFloat(minPriceVal) < 0) return toast('error', 'Invalid Price', 'Min Price must be no less than 0.');
    if (maxPriceVal !== '' && parseFloat(maxPriceVal) < 0) return toast('error', 'Invalid Price', 'Max Price must be no less than 0.');
    if (minPriceVal !== '' && maxPriceVal !== '' && parseFloat(maxPriceVal) < parseFloat(minPriceVal)) return toast('error', 'Invalid Price Range', 'Max Price must be greater than or equal to Min Price.');
    const body = {
        type: document.getElementById('filterType').value || null,
        capacity: document.getElementById('filterCapacity').value ? parseInt(document.getElementById('filterCapacity').value, 10) : null,
        minPrice: minPriceVal !== '' ? parseFloat(minPriceVal) : null,
        maxPrice: maxPriceVal !== '' ? parseFloat(maxPriceVal) : null,
        checkIn: document.getElementById('filterCheckIn').value || null,
        checkOut: document.getElementById('filterCheckOut').value || null
    };
    const res = await apiCall('/rooms/search', { method: 'POST', body: JSON.stringify(body) });
    const rooms = res.data.data || [];
    document.getElementById('roomsGrid').innerHTML = rooms.length
        ? rooms.map(r => renderRoomCard(r)).join('')
        : '<div class="empty-state"><i class="fas fa-search"></i><h3>No rooms match your criteria</h3></div>';
}

function refreshRooms() { loadRooms(); }

function quickSearch() {
    showPage('rooms');
    setTimeout(() => {
        document.getElementById('filterType').value = document.getElementById('quickType').value;
        document.getElementById('filterCapacity').value = document.getElementById('quickCapacity').value;
        filterRooms();
    }, 100);
}

function openBookingModal(roomId) {
    if (!token || !currentUser) {
        toast('warning', 'Login Required', 'Please sign in to book a room.');
        showPage('auth');
        return;
    }
    selectedRoom = allRooms.find(r => r.id === roomId);
    if (!selectedRoom) return;
    document.getElementById('bookingRoomInfo').innerHTML = `
        <div style="font-weight:700; color:var(--gray-900); margin-bottom:4px;">${selectedRoom.name}</div>
        <div style="font-size:0.875rem; color:var(--gray-500);">${selectedRoom.type} · $${selectedRoom.pricePerNight}/night · ${selectedRoom.capacity} guests</div>
    `;
    updatePreview();
    openModal('bookingModal');
}

function openAvailModal(roomId) {
    selectedRoom = allRooms.find(r => r.id === roomId);
    if (!selectedRoom) return;
    document.getElementById('availRoomInfo').innerHTML = `
        <div style="font-weight:700; color:var(--gray-900); margin-bottom:4px;">${selectedRoom.name}</div>
        <div style="font-size:0.875rem; color:var(--gray-500);">${selectedRoom.type} · $${selectedRoom.pricePerNight}/night</div>
    `;
    document.getElementById('availResultBox').style.display = 'none';
    openModal('availabilityModal');
}

function updatePreview() {
    const checkIn = new Date(document.getElementById('modalCheckIn').value);
    const checkOut = new Date(document.getElementById('modalCheckOut').value);
    if (checkIn && checkOut && selectedRoom && checkOut > checkIn) {
        const nights = Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const total = nights * selectedRoom.pricePerNight;
        document.getElementById('previewPrice').textContent = '$' + total.toFixed(2);
        document.getElementById('previewNights').textContent = nights + ' night' + (nights > 1 ? 's' : '');
        document.getElementById('bookingPreview').style.display = 'block';
    } else {
        document.getElementById('bookingPreview').style.display = 'none';
    }
}

async function checkAvailAction() {
    const body = {
        roomId: selectedRoom.id,
        checkIn: document.getElementById('availModalCheckIn').value,
        checkOut: document.getElementById('availModalCheckOut').value
    };
    const res = await apiCall('/rooms/availability', { method: 'POST', body: JSON.stringify(body) });
    const data = res.data.data;
    const box = document.getElementById('availResultBox');
    box.style.display = 'block';
    if (data.available) {
        box.innerHTML = `
            <div style="padding:16px; background:var(--success-light); border-radius:8px; border-left:4px solid var(--success);">
                <div style="font-weight:700; color:var(--success); margin-bottom:4px;"><i class="fas fa-check-circle"></i> Available!</div>
                <div style="color:var(--gray-600);">Total Price: <strong>$${data.totalPrice}</strong></div>
                <button class="btn btn-success btn-sm" style="margin-top:12px;" onclick="closeModal('availabilityModal'); openBookingModal(${selectedRoom.id});">Book Now</button>
            </div>
        `;
    } else {
        box.innerHTML = `
            <div style="padding:16px; background:var(--danger-light); border-radius:8px; border-left:4px solid var(--danger);">
                <div style="font-weight:700; color:var(--danger);"><i class="fas fa-times-circle"></i> Not Available</div>
                <div style="color:var(--gray-600); font-size:0.875rem; margin-top:4px;">This room is already booked for the selected dates.</div>
            </div>
        `;
    }
}
