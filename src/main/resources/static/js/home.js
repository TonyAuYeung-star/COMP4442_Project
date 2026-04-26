// ============ home.js ============
async function loadRoomsForGuest() {
    const res = await apiCall('/rooms');
    allRooms = res.data.data || [];
    document.getElementById('statRooms').textContent = allRooms.length;
    renderFeaturedRooms(allRooms.slice(0, 3));
}

async function loadHomeData() {
    const roomsRes = await apiCall('/rooms');
    allRooms = roomsRes.data.data || [];
    document.getElementById('statRooms').textContent = allRooms.length;
    renderFeaturedRooms(allRooms.slice(0, 3));

    const overviewRes = await apiCall('/bookings/overview');
    const overview = overviewRes.data.data || {};
    document.getElementById('statBookings').textContent = overview.confirmedBookingCount ?? 0;
    document.getElementById('statPending').textContent = overview.pendingBookingCount ?? 0;
    document.getElementById('statSpent').textContent = '$' + Number(overview.confirmedRevenue || 0).toFixed(0);
}

function renderFeaturedRooms(rooms) {
    const container = document.getElementById('featuredRooms');
    if (!rooms.length) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-bed"></i><h3>No rooms available</h3></div>';
        return;
    }
    container.innerHTML = rooms.map(r => renderRoomCard(r)).join('');
}

function renderRoomCard(room) {
    const gradients = ['linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'];
    const grad = gradients[room.id % gradients.length];
    const safeImageUrl = (room.imageUrl || '').trim();
    const version = room.updatedAt ? encodeURIComponent(room.updatedAt) : '';
    const cacheBustedImage = safeImageUrl ? `${safeImageUrl}${safeImageUrl.includes('?') ? '&' : '?'}v=${version}` : '';
    const imageContent = safeImageUrl
        ? `<img src="${cacheBustedImage}" alt="${room.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" /><i class="fas fa-bed" style="display:none;"></i>`
        : '<i class="fas fa-bed"></i>';
    return `
        <div class="card room-card">
            <div class="room-image" style="background:${grad}">
                ${imageContent}
            </div>
            <div class="room-content">
                <span class="room-type">${room.type}</span>
                <div class="room-name">${room.name}</div>
                <div class="room-meta">
                    <span class="room-meta-item"><i class="fas fa-user-friends"></i> ${room.capacity} guests</span>
                    <span class="room-meta-item"><i class="fas fa-star"></i> ${room.amenities || 'Standard'}</span>
                </div>
                <div class="room-price">$${room.pricePerNight}<span>/night</span></div>
                <div class="room-actions">
                    <button class="btn btn-primary btn-sm" onclick="openBookingModal(${room.id})"><i class="fas fa-calendar-plus"></i>Book</button>
                    <button class="btn btn-secondary btn-sm" onclick="openAvailModal(${room.id})"><i class="fas fa-search"></i>Check</button>
                </div>
            </div>
        </div>
    `;
}
