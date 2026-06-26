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

let selectedGroupId = null;

// Group type icons
const groupIcons = {
    trip: 'fa-plane',
    home: 'fa-home',
    office: 'fa-briefcase',
    friends: 'fa-user-friends',
    other: 'fa-users'
};

// Group type colors
const groupColors = {
    trip: '#8E44AD',
    home: '#27AE60',
    office: '#2980B9',
    friends: '#F39C12',
    other: '#7F8C8D'
};

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

// Load groups
async function loadGroups() {
    try {
        const response = await apiCall('/groups/');
        const groups = await response.json();
        const groupsGrid = document.getElementById('groupsGrid');

        if (groups.length === 0) {
            groupsGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <i class="fas fa-users"></i>
                    <p>No groups yet! Create your first group.</p>
                </div>`;
            return;
        }

        groupsGrid.innerHTML = groups.map(group => `
            <div class="card" style="cursor:pointer;">
                <div style="display:flex; align-items:center; gap:15px; margin-bottom:15px;">
                    <div style="width:50px; height:50px; background:${groupColors[group.group_type]}20;
                        border-radius:12px; display:flex; align-items:center; justify-content:center;
                        color:${groupColors[group.group_type]}; font-size:22px;">
                        <i class="fas ${groupIcons[group.group_type]}"></i>
                    </div>
                    <div>
                        <h3 style="font-size:16px; font-weight:700; color:var(--text-dark);">${group.name}</h3>
                        <p style="font-size:12px; color:var(--text-gray);">${group.group_type}</p>
                    </div>
                </div>
                <p style="font-size:13px; color:var(--text-gray); margin-bottom:15px;">
                    ${group.description || 'No description'}
                </p>
                <div style="display:flex; align-items:center; justify-content:space-between;">
                    <span style="font-size:13px; color:var(--text-gray);">
                        <i class="fas fa-users"></i> ${group.total_members} members
                    </span>
                    <button class="btn-secondary" onclick="openAddMemberModal(${group.id})">
                        <i class="fas fa-user-plus"></i> Add Member
                    </button>
                </div>
            </div>`
        ).join('');

    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

// Open/Close Create Group Modal
function openCreateGroupModal() {
    document.getElementById('createGroupModal').classList.add('show');
}

function closeCreateGroupModal() {
    document.getElementById('createGroupModal').classList.remove('show');
}

// Open/Close Add Member Modal
function openAddMemberModal(groupId) {
    selectedGroupId = groupId;
    document.getElementById('addMemberModal').classList.add('show');
}

function closeAddMemberModal() {
    document.getElementById('addMemberModal').classList.remove('show');
    selectedGroupId = null;
}

// Create Group
async function createGroup() {
    const name = document.getElementById('groupName').value;
    const description = document.getElementById('groupDescription').value;
    const group_type = document.getElementById('groupType').value;
    const errorEl = document.getElementById('groupError');

    if (!name) {
        errorEl.textContent = 'Please enter a group name!';
        errorEl.style.display = 'block';
        return;
    }

    try {
        const response = await apiCall('/groups/', 'POST', { name, description, group_type });
        const data = await response.json();

        if (response.ok) {
            closeCreateGroupModal();
            showToast('Group created successfully!', 'success');
            loadGroups();
        } else {
            errorEl.textContent = JSON.stringify(data);
            errorEl.style.display = 'block';
        }
    } catch (error) {
        errorEl.textContent = 'Server error! Please try again.';
        errorEl.style.display = 'block';
    }
}

// Add Member
async function addMember() {
    const email = document.getElementById('memberEmail').value;
    const errorEl = document.getElementById('memberError');
    const successEl = document.getElementById('memberSuccess');

    if (!email) {
        errorEl.textContent = 'Please enter an email!';
        errorEl.style.display = 'block';
        return;
    }

    try {
        const response = await apiCall(`/groups/${selectedGroupId}/add-member/`, 'POST', { email });
        const data = await response.json();

        if (response.ok) {
            successEl.textContent = data.message;
            successEl.style.display = 'block';
            errorEl.style.display = 'none';
            showToast('Member added successfully!', 'success');
            loadGroups();
        } else {
            errorEl.textContent = data.error || 'Failed to add member!';
            errorEl.style.display = 'block';
        }
    } catch (error) {
        errorEl.textContent = 'Server error! Please try again.';
        errorEl.style.display = 'block';
    }
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'home.html';
}


// Toggle dropdown menu
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
    if (!userProfile.contains(e.target)) {
        dropdown.style.display = 'none';
        document.getElementById('dropdownArrow').style.transform = 'rotate(0deg)';
    }
});
// Load groups on page load
loadGroups();

// Hide page loader when everything is loaded
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