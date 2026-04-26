// ============ ui.js ============
function showPage(page) {
    if (page === 'auth') {
        document.getElementById('authPage').style.display = 'block';
        document.getElementById('authPage').classList.add('active');
        document.getElementById('appPages').style.display = 'none';
        document.getElementById('navbar').style.display = 'none';
        return;
    }
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(page + 'Page').classList.add('active');
    document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.page === page));

    if (page === 'home') loadHomeData();
    if (page === 'rooms') loadRooms();
    if (page === 'bookings') loadBookings();
    if (page === 'admin') loadAdminBookings();
    if (page === 'profile') loadProfile();
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function bindModalOverlayClose() {
    document.querySelectorAll('.modal-overlay').forEach(m => {
        m.addEventListener('click', e => { if (e.target === m) m.classList.remove('active'); });
    });
}

function toast(type, title, message) {
    const container = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = 'toast toast-' + type;
    const icons = { success: 'fa-check', error: 'fa-times', warning: 'fa-exclamation' };
    t.innerHTML = `
        <div class="toast-icon"><i class="fas ${icons[type]}"></i></div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 5000);
}
