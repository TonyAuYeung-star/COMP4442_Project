// ============ profile.js ============
function loadProfile() {
    if (!currentUser) {
        showPage('auth');
        return;
    }
    document.getElementById('profileUsername').textContent = currentUser.username;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('profileRole').textContent = currentUser.role || 'USER';
    document.getElementById('profileId').textContent = currentUser.id || '-';
    document.getElementById('profileUsername2').textContent = currentUser.username;
    document.getElementById('profileEmail2').textContent = currentUser.email;
}
