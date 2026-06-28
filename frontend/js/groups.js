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

// Load groups
async function loadGroups() {
    try {
        const response = await apiCall('/groups/');
        const groups = await response.json();
        const groupsGrid = document.getElementById('groupsGrid');

        // Update stats
        document.getElementById('totalGroupsCount').textContent = groups.length;

        let totalMembers = 0;
        groups.forEach(g => totalMembers += g.total_members);
        document.getElementById('totalMembersCount').textContent = totalMembers;

        if (groups.length === 0) {
            groupsGrid.innerHTML = `
                <div class="groups-empty">
                    <div class="groups-empty-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <h3>No Groups Yet!</h3>
                    <p>Create your first group to start splitting expenses with friends!</p>
                    <button class="btn-primary" style="display:inline-flex; width:auto; padding:12px 25px;"
                        onclick="openCreateGroupModal()">
                        <i class="fas fa-plus"></i> Create First Group
                    </button>
                </div>`;
            return;
        }

        groupsGrid.innerHTML = groups.map(group => {
            const members = group.members_detail || [];
            const visibleMembers = members.slice(0, 3);
            const extraMembers = members.length - 3;

            const memberAvatars = visibleMembers.map(m => `
                <div class="member-avatar" title="${m.user_name}">
                    ${m.user_name ? m.user_name.charAt(0).toUpperCase() : 'U'}
                </div>`
            ).join('');

            return `
                <div class="group-card">
                    <div class="group-card-header">
                        <div class="group-type-icon ${group.group_type}">
                            <i class="fas ${groupIcons[group.group_type] || 'fa-users'}"></i>
                        </div>
                        <div class="group-card-title">
                            <h3>${group.name}</h3>
                            <p><i class="fas fa-tag"></i> ${group.group_type}</p>
                        </div>
                    </div>
                    <p class="group-description">
                        ${group.description || 'No description added yet.'}
                    </p>
                    <div class="group-members">
                        ${memberAvatars}
                        ${extraMembers > 0 ? `
                        <div class="member-count">+${extraMembers}</div>` : ''}
                    </div>
                    <div class="group-card-footer">
                        <span>
                            <i class="fas fa-users"></i>
                            ${group.total_members} member${group.total_members !== 1 ? 's' : ''}
                        </span>
                        <button class="btn-add-member" onclick="openAddMemberModal(${group.id})">
                            <i class="fas fa-user-plus"></i> Add Member
                        </button>
                    </div>
                </div>`;
        }).join('');

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

// ===== ANIMATED BACKGROUND =====
function initBackground() {
    const canvas = document.getElementById('bgCanvas');
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const count = 15;

    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 150 + 80,
            speedX: (Math.random() - 0.5) * 0.4,
            speedY: (Math.random() - 0.5) * 0.4,
            opacity: Math.random() * 0.15 + 0.05
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            ctx.beginPath();
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
            gradient.addColorStop(0, `rgba(106, 27, 154, ${p.opacity})`);
            gradient.addColorStop(1, 'rgba(106, 27, 154, 0)');
            ctx.fillStyle = gradient;
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();

            p.x += p.speedX;
            p.y += p.speedY;

            if (p.x < -p.radius) p.x = canvas.width + p.radius;
            if (p.x > canvas.width + p.radius) p.x = -p.radius;
            if (p.y < -p.radius) p.y = canvas.height + p.radius;
            if (p.y > canvas.height + p.radius) p.y = -p.radius;
        });

        requestAnimationFrame(animate);
    }

    animate();

    window.addEventListener('resize', () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    });
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'home.html';
}

// Page loader
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

// Initialize background immediately
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initBackground, 100);
});

// Load groups on page load
loadGroups();