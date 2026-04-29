// ============ main.js ============
document.addEventListener('DOMContentLoaded', () => {
    setDefaultDates();
    bindModalOverlayClose();
    switchAuthTab('login');
    document.getElementById('modalCheckIn')?.addEventListener('change', updatePreview);
    document.getElementById('modalCheckOut')?.addEventListener('change', updatePreview);

    if (token && currentUser) {
        showApp();
        loadHomeData();
    } else {
        showGuestMode();
    }
});
