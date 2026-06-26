const API_URL = 'http://127.0.0.1:8000/api';

// Switch between login and register tabs
function switchTab(tab) {
    if (tab === 'login') {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('loginTab').classList.add('active');
        document.getElementById('registerTab').classList.remove('active');
    } else {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
        document.getElementById('loginTab').classList.remove('active');
        document.getElementById('registerTab').classList.add('active');
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Login function
async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');

    if (!email || !password) {
        errorEl.textContent = 'Please fill in all fields!';
        errorEl.style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/users/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Save token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            showToast('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            errorEl.textContent = data.error || 'Invalid email or password!';
            errorEl.style.display = 'block';
        }
    } catch (error) {
        errorEl.textContent = 'Server error! Please try again.';
        errorEl.style.display = 'block';
    }
}

// Register function
async function register() {
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const username = document.getElementById('username').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const phone = document.getElementById('phone').value;
    const upiId = document.getElementById('upiId').value;
    const errorEl = document.getElementById('registerError');
    const successEl = document.getElementById('registerSuccess');

    if (!firstName || !lastName || !username || !email || !password) {
        errorEl.textContent = 'Please fill in all required fields!';
        errorEl.style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/users/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
                username,
                email,
                password,
                phone,
                upi_id: upiId
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Save token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            successEl.textContent = 'Account created successfully! Redirecting...';
            successEl.style.display = 'block';
            errorEl.style.display = 'none';
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            const errors = Object.values(data).flat().join(' ');
            errorEl.textContent = errors || 'Registration failed!';
            errorEl.style.display = 'block';
        }
    } catch (error) {
        errorEl.textContent = 'Server error! Please try again.';
        errorEl.style.display = 'block';
    }
}

// If already logged in, redirect to dashboard
if (localStorage.getItem('token')) {
    window.location.href = 'dashboard.html';
}