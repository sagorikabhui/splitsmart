const API_URL = 'http://127.0.0.1:8000/api';

const token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user'));

if (!token) window.location.href = 'index.html';

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
document.addEventListener('click', function (e) {
    const dropdown = document.getElementById('profileDropdown');
    const userProfile = document.querySelector('.user-profile');
    if (userProfile && !userProfile.contains(e.target)) {
        dropdown.style.display = 'none';
        document.getElementById('dropdownArrow').style.transform = 'rotate(0deg)';
    }
});

// Load profile data
async function loadProfile() {
    try {
        const response = await apiCall('/users/profile/');
        const data = await response.json();

        // Update sidebar
        document.getElementById('userName').textContent = data.first_name + ' ' + data.last_name;
        document.getElementById('userAvatar').textContent = data.first_name.charAt(0).toUpperCase();
        document.getElementById('userEmail').textContent = data.email;

        // Update profile page
        document.getElementById('profileAvatarBig').textContent = data.first_name.charAt(0).toUpperCase();
        document.getElementById('profileFullName').textContent = data.first_name + ' ' + data.last_name;
        document.getElementById('profileEmailDisplay').textContent = data.email;

        // Fill edit forms
        document.getElementById('editFirstName').value = data.first_name || '';
        document.getElementById('editLastName').value = data.last_name || '';
        document.getElementById('editUsername').value = data.username || '';
        document.getElementById('editEmail').value = data.email || '';
        document.getElementById('editPhone').value = data.phone || '';
        document.getElementById('editUpiId').value = data.upi_id || '';

        // Update localStorage
        localStorage.setItem('user', JSON.stringify(data));

        // Set fields to readonly by default
        setFormReadOnly(true);

    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Load stats
async function loadStats() {
    try {
        // Load expenses count
        const expensesResponse = await apiCall('/expenses/');
        const expenses = await expensesResponse.json();
        document.getElementById('totalExpensesCount').textContent = expenses.length;

        // Load groups count
        const groupsResponse = await apiCall('/groups/');
        const groups = await groupsResponse.json();
        document.getElementById('totalGroupsCount').textContent = groups.length;

        // Settlements count (approximation)
        document.getElementById('totalSettlementsCount').textContent = '0';

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Update personal info
async function updatePersonalInfo() {
    const firstName = document.getElementById('editFirstName').value;
    const lastName = document.getElementById('editLastName').value;
    const username = document.getElementById('editUsername').value;
    const phone = document.getElementById('editPhone').value;
    const errorEl = document.getElementById('personalError');
    const successEl = document.getElementById('personalSuccess');

    if (!firstName || !lastName) {
        errorEl.textContent = 'First name and last name are required!';
        errorEl.style.display = 'block';
        return;
    }

    try {
        const response = await apiCall('/users/profile/', 'PUT', {
            first_name: firstName,
            last_name: lastName,
            username,
            phone
        });

        const data = await response.json();

        if (response.ok) {
            successEl.textContent = 'Profile updated successfully!';
            successEl.style.display = 'block';
            errorEl.style.display = 'none';
            showToast('Profile updated successfully!', 'success');

            // Update localStorage
            localStorage.setItem('user', JSON.stringify(data));
            loadProfile();
        } else {
            errorEl.textContent = JSON.stringify(data);
            errorEl.style.display = 'block';
        }
    } catch (error) {
        errorEl.textContent = 'Server error! Please try again.';
        errorEl.style.display = 'block';
    }
}

// Update UPI ID
async function updateUpiId() {
    const upiId = document.getElementById('editUpiId').value;
    const errorEl = document.getElementById('upiError');
    const successEl = document.getElementById('upiSuccess');

    try {
        const response = await apiCall('/users/profile/', 'PUT', {
            upi_id: upiId
        });

        const data = await response.json();

        if (response.ok) {
            successEl.textContent = 'UPI ID updated successfully!';
            successEl.style.display = 'block';
            errorEl.style.display = 'none';
            showToast('UPI ID updated!', 'success');
            localStorage.setItem('user', JSON.stringify(data));
        } else {
            errorEl.textContent = JSON.stringify(data);
            errorEl.style.display = 'block';
        }
    } catch (error) {
        errorEl.textContent = 'Server error! Please try again.';
        errorEl.style.display = 'block';
    }
}

// Change password
async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorEl = document.getElementById('passwordError');
    const successEl = document.getElementById('passwordSuccess');

    if (!currentPassword || !newPassword || !confirmPassword) {
        errorEl.textContent = 'Please fill in all password fields!';
        errorEl.style.display = 'block';
        return;
    }

    if (newPassword !== confirmPassword) {
        errorEl.textContent = 'New passwords do not match!';
        errorEl.style.display = 'block';
        return;
    }

    if (newPassword.length < 8) {
        errorEl.textContent = 'Password must be at least 8 characters!';
        errorEl.style.display = 'block';
        return;
    }

    try {
        const response = await apiCall('/users/change-password/', 'POST', {
            current_password: currentPassword,
            new_password: newPassword
        });

        const data = await response.json();

        if (response.ok) {
            successEl.textContent = 'Password changed successfully!';
            successEl.style.display = 'block';
            errorEl.style.display = 'none';
            showToast('Password changed successfully!', 'success');
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } else {
            errorEl.textContent = data.error || 'Failed to change password!';
            errorEl.style.display = 'block';
        }
    } catch (error) {
        errorEl.textContent = 'Server error! Please try again.';
        errorEl.style.display = 'block';
    }
}

// Logout

// Set form fields readonly or editable
function setFormReadOnly(isReadOnly) {
    const fields = [
        'editFirstName', 'editLastName',
        'editUsername', 'editPhone'
    ];

    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (isReadOnly) {
            field.setAttribute('readonly', true);
            field.style.background = 'var(--background)';
            field.style.cursor = 'not-allowed';
        } else {
            field.removeAttribute('readonly');
            field.style.background = 'var(--white)';
            field.style.cursor = 'text';
        }
    });

    // Show or hide save button
    const saveBtn = document.querySelector('#personalForm .btn-primary');
    if (saveBtn) {
        saveBtn.style.display = isReadOnly ? 'none' : 'block';
    }
}

// Toggle edit mode
function toggleEdit(formId) {
    const editBtn = document.querySelector(`#personal-info .btn-secondary`);
    const isCurrentlyReadOnly = document.getElementById('editFirstName').hasAttribute('readonly');

    if (isCurrentlyReadOnly) {
        // Switch to edit mode
        setFormReadOnly(false);
        editBtn.innerHTML = '<i class="fas fa-times"></i> Cancel';
        editBtn.style.background = 'rgba(231, 76, 60, 0.1)';
        editBtn.style.color = 'var(--danger)';
        editBtn.style.borderColor = 'var(--danger)';
    } else {
        // Switch back to read only mode
        setFormReadOnly(true);
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
        editBtn.style.background = '';
        editBtn.style.color = '';
        editBtn.style.borderColor = '';
        // Reload original data
        loadProfile();
    }
}

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

// Load everything
loadProfile();
loadStats();