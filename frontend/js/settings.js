const API_URL = 'http://127.0.0.1:8000/api';

const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token) window.location.href = 'index.html';

// Show user info in sidebar
if (user) {
    document.getElementById('userName').textContent = user.first_name + ' ' + user.last_name;
    document.getElementById('userAvatar').textContent = user.first_name.charAt(0).toUpperCase();
    document.getElementById('userEmail').textContent = user.email;
}

// API helper
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
        }
    };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(`${API_URL}${endpoint}`, options);
    return response;
}

// Show toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Toggle dropdown
function toggleDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    const arrow = document.getElementById('dropdownArrow');
    if (dropdown.style.display === 'none') {
        dropdown.style.display = 'block';
        arrow.style.transform = 'rotate(180deg)';
    } else {
        dropdown.style.display = 'none';
        arrow.style.transform = 'rotate(0deg)';
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('profileDropdown');
    const userProfile = document.querySelector('.user-profile');
    if (userProfile && !userProfile.contains(e.target)) {
        dropdown.style.display = 'none';
        document.getElementById('dropdownArrow').style.transform = 'rotate(0deg)';
    }
});

// Show settings section
function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.settings-section').forEach(s => {
        s.classList.remove('active');
    });

    // Remove active from all menu items
    document.querySelectorAll('.settings-menu-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected section
    document.getElementById(`section-${section}`).classList.add('active');

    // Set active menu item
    event.currentTarget.classList.add('active');
}

// Load current settings
async function loadSettings() {
    try {
        const response = await apiCall('/users/profile/');
        const data = await response.json();

        // Set UPI ID
        if (data.upi_id) {
            document.getElementById('upiId').value = data.upi_id;
        }

        // Load saved settings from localStorage
        const savedSettings = JSON.parse(localStorage.getItem('appSettings') || '{}');

        // Notifications
        if (savedSettings.notifications) {
            document.getElementById('notifExpense').checked = savedSettings.notifications.expense !== false;
            document.getElementById('notifGroup').checked = savedSettings.notifications.group !== false;
            document.getElementById('notifPayment').checked = savedSettings.notifications.payment !== false;
            document.getElementById('notifReminder').checked = savedSettings.notifications.reminder === true;
        }

        // Appearance
        if (savedSettings.currency) {
            document.getElementById('currencySelect').value = savedSettings.currency;
        }

        if (savedSettings.theme) {
            setTheme(savedSettings.theme, false);
        }

        // Privacy
        if (savedSettings.privacy) {
            document.getElementById('privacyUpi').checked = savedSettings.privacy.upi !== false;
            document.getElementById('privacyEmail').checked = savedSettings.privacy.email !== false;
        }

    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Save UPI ID
async function saveUpiId() {
    const upiId = document.getElementById('upiId').value;
    const errorEl = document.getElementById('upiError');
    const successEl = document.getElementById('upiSuccess');

    try {
        const response = await apiCall('/users/profile/', 'PUT', { upi_id: upiId });
        const data = await response.json();

        if (response.ok) {
            successEl.textContent = 'UPI ID saved successfully!';
            successEl.style.display = 'block';
            errorEl.style.display = 'none';
            showToast('UPI ID saved!', 'success');
            localStorage.setItem('user', JSON.stringify(data));
        } else {
            errorEl.textContent = JSON.stringify(data);
            errorEl.style.display = 'block';
        }
    } catch (error) {
        errorEl.textContent = 'Server error!';
        errorEl.style.display = 'block';
    }
}

// Save notifications
function saveNotifications() {
    const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
    settings.notifications = {
        expense: document.getElementById('notifExpense').checked,
        group: document.getElementById('notifGroup').checked,
        payment: document.getElementById('notifPayment').checked,
        reminder: document.getElementById('notifReminder').checked
    };
    localStorage.setItem('appSettings', JSON.stringify(settings));
    showToast('Notification preferences saved!', 'success');
}

// Set theme
let selectedTheme = null;

function setTheme(theme, save = true) {
    // Remove active from all theme options
    document.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.remove('active');
    });

    // Set active theme option visually
    const themeIndex = ['light', 'dark', 'purple'].indexOf(theme);
    if (themeIndex !== -1) {
        document.querySelectorAll('.theme-option')[themeIndex].classList.add('active');
    }

    // Just store selected theme, don't apply yet
    selectedTheme = theme;
}

// Save appearance
function saveAppearance() {
    const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
    settings.currency = document.getElementById('currencySelect').value;

    // Only save theme if user selected one
    if (selectedTheme) {
        settings.theme = selectedTheme;
    }

    localStorage.setItem('appSettings', JSON.stringify(settings));

    // Apply theme after saving
    applyTheme();

    showToast('Appearance settings saved!', 'success');
}

// Save privacy
function savePrivacy() {
    const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
    settings.privacy = {
        upi: document.getElementById('privacyUpi').checked,
        email: document.getElementById('privacyEmail').checked
    };
    localStorage.setItem('appSettings', JSON.stringify(settings));
    showToast('Privacy settings saved!', 'success');
}

// Confirm dangerous actions
function confirmAction(action) {
    if (action === 'clear-expenses') {
        if (confirm('Are you sure you want to delete ALL your expenses? This cannot be undone!')) {
            clearAllExpenses();
        }
    } else if (action === 'delete-account') {
        if (confirm('Are you sure you want to delete your account? This cannot be undone!')) {
            if (confirm('This will permanently delete all your data. Are you absolutely sure?')) {
                showToast('Account deletion requested!', 'error');
            }
        }
    }
}

// Clear all expenses
async function clearAllExpenses() {
    try {
        const response = await apiCall('/expenses/');
        const expenses = await response.json();

        for (const expense of expenses) {
            await apiCall(`/expenses/${expense.id}/`, 'DELETE');
        }

        showToast('All expenses cleared!', 'success');
    } catch (error) {
        showToast('Error clearing expenses!', 'error');
    }
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
   window.location.href = 'home.html';
}

// Page loader
window.addEventListener('load', () => {
    setTimeout(() => {
        const loader = document.getElementById('pageLoader');
        if (loader) {
            loader.style.opacity = '0';
            loader.style.transition = 'opacity 0.5s ease';
            setTimeout(() => loader.style.display = 'none', 500);
        }
    }, 500);
});

// Load settings on page load
loadSettings();