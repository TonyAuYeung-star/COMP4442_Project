// ============ auth.js ============
function switchAuthTab(mode) {
    authMode = mode;
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.textContent.includes(mode === 'login' ? 'Sign In' : 'Sign Up')));
    document.getElementById('registerFields').style.display = mode === 'register' ? 'block' : 'none';
    document.getElementById('loginField').style.display = mode === 'login' ? 'block' : 'none';
    document.getElementById('loginUsername').required = (mode === 'login');
    document.getElementById('loginUsername').disabled = (mode !== 'login');
    document.getElementById('regUsername').required = (mode === 'register');
    document.getElementById('regEmail').required = (mode === 'register');
    document.getElementById('authTitle').textContent = mode === 'login' ? 'Welcome Back' : 'Create Account';
    document.getElementById('authSubtitle').textContent = mode === 'login' ? 'Please sign in to your account' : 'Start your journey with us';
    document.getElementById('authBtnText').textContent = mode === 'login' ? 'Sign In' : 'Sign Up';
}

async function handleAuth(e) {
    e.preventDefault();
    const btn = document.getElementById('authBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';
    try {
        let result;
        if (authMode === 'register') {
            result = await apiCall('/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    username: document.getElementById('regUsername').value,
                    email: document.getElementById('regEmail').value,
                    password: document.getElementById('authPassword').value
                })
            });
        } else {
            result = await apiCall('/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    username: document.getElementById('loginUsername').value,
                    password: document.getElementById('authPassword').value
                })
            });
        }
        if (result.ok && result.data && result.data.data) {
            token = result.data.data.token;
            currentUser = result.data.data;
            sessionStorage.setItem('jwt_token', token);
            sessionStorage.setItem('current_user', JSON.stringify(currentUser));
            showApp();
            loadHomeData();
            toast('success', 'Welcome!', 'You have successfully signed in.');
        } else {
            toast('error', 'Authentication Failed', result.data?.message || 'Please check your credentials.');
        }
    } catch (err) {
        toast('error', 'Error', err.message || 'An unexpected error occurred.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span id="authBtnText">' + (authMode === 'login' ? 'Sign In' : 'Sign Up') + '</span>';
    }
}

function logout() {
    token = '';
    currentUser = null;
    sessionStorage.removeItem('jwt_token');
    sessionStorage.removeItem('current_user');
    showPage('auth');
    toast('success', 'Signed Out', 'You have been logged out.');
}

function showApp() {
    isGuestMode = false;
    document.getElementById('authPage').classList.remove('active');
    document.getElementById('authPage').style.display = 'none';
    document.getElementById('appPages').style.display = 'block';
    document.getElementById('navbar').style.display = 'block';
    document.getElementById('userBadge').style.display = 'flex';
    document.getElementById('userName').textContent = currentUser?.username || 'User';
    document.getElementById('bookingsNav').style.display = 'inline-flex';
    document.getElementById('profileNav').style.display = 'inline-flex';
    document.getElementById('logoutBtn').style.display = 'inline-flex';
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('adminNav').style.display = currentUser?.role === 'ADMIN' ? 'inline-flex' : 'none';
    showPage('home');
}

function showGuestMode() {
    isGuestMode = true;
    document.getElementById('authPage').style.display = 'none';
    document.getElementById('appPages').style.display = 'block';
    document.getElementById('navbar').style.display = 'block';
    document.getElementById('bookingsNav').style.display = 'none';
    document.getElementById('profileNav').style.display = 'none';
    document.getElementById('adminNav').style.display = 'none';
    document.getElementById('userBadge').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'none';
    document.getElementById('loginBtn').style.display = 'inline-flex';
    showPage('home');
    loadRoomsForGuest();
}
