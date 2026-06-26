const API_URL = 'http://127.0.0.1:8000/api';

// Check if user is logged in
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token) {
    window.location.href = 'index.html';
}

// Show user info in sidebar
if (user) {
    document.getElementById('userName').textContent = user.first_name + ' ' + user.last_name;
    document.getElementById('userAvatar').textContent = user.first_name.charAt(0).toUpperCase();
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('welcomeMsg').textContent = `Welcome back, ${user.first_name}!`;
}

// Set today's date in expense form
document.getElementById('expenseDate').valueAsDate = new Date();

// API helper function
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

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Category icons
const categoryIcons = {
    food: 'fa-utensils',
    transport: 'fa-car',
    accommodation: 'fa-hotel',
    entertainment: 'fa-film',
    shopping: 'fa-shopping-bag',
    utilities: 'fa-bolt',
    medical: 'fa-heartbeat',
    other: 'fa-receipt'
};

// Load balances
async function loadBalances() {
    try {
        const response = await apiCall('/expenses/balances/');
        const balances = await response.json();

        const balancesList = document.getElementById('balancesList');
        let owedToMe = 0;
        let iOwe = 0;

        if (balances.length === 0) {
            balancesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-balance-scale"></i>
                    <p>No balances yet!</p>
                </div>`;
            return;
        }

        balancesList.innerHTML = balances.map(balance => {
            if (balance.amount > 0) owedToMe += balance.amount;
            else iOwe += Math.abs(balance.amount);

            const isPositive = balance.amount > 0;
            const initials = balance.user_name.split(' ').map(n => n[0]).join('').toUpperCase();
            return `
                <div class="balance-item">
                    <div class="balance-user">
                        <div class="balance-avatar">${initials}</div>
                        <div>
                            <h4>${balance.user_name}</h4>
                            <p>${isPositive ? 'owes you' : 'you owe'}</p>
                        </div>
                    </div>
                    <div class="balance-amount ${isPositive ? 'positive' : 'negative'}">
                        ${isPositive ? '+' : '-'}₹${Math.abs(balance.amount).toFixed(2)}
                    </div>
                </div>`;
        }).join('');

        document.getElementById('totalOwedToMe').textContent = `₹${owedToMe.toFixed(2)}`;
        document.getElementById('totalIOwe').textContent = `₹${iOwe.toFixed(2)}`;

    } catch (error) {
        console.error('Error loading balances:', error);
    }
}

// Load recent expenses
async function loadRecentExpenses() {
    try {
        const response = await apiCall('/expenses/');
        const expenses = await response.json();

        const recentExpenses = document.getElementById('recentExpenses');
        document.getElementById('totalExpenses').textContent =
            `₹${expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0).toFixed(2)}`;

        if (expenses.length === 0) {
            recentExpenses.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <p>No expenses yet!</p>
                </div>`;
            return;
        }

        recentExpenses.innerHTML = expenses.slice(0, 5).map(expense => `
            <div class="expense-item">
                <div class="expense-info">
                    <div class="expense-icon">
                        <i class="fas ${categoryIcons[expense.category] || 'fa-receipt'}"></i>
                    </div>
                    <div>
                        <h4>${expense.title}</h4>
                        <p>${expense.paid_by_name} • ${expense.date}</p>
                    </div>
                </div>
                <div class="expense-amount">₹${parseFloat(expense.amount).toFixed(2)}</div>
            </div>`
        ).join('');

    } catch (error) {
        console.error('Error loading expenses:', error);
    }
}

// Load groups for dropdown
async function loadGroups() {
    try {
        const response = await apiCall('/groups/');
        const groups = await response.json();

        document.getElementById('totalGroups').textContent = groups.length;

        const groupSelect = document.getElementById('expenseGroup');
        groups.forEach(group => {
            groupSelect.innerHTML += `<option value="${group.id}">${group.name}</option>`;
        });
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

// Open/Close Modal
function openAddExpenseModal() {
    document.getElementById('addExpenseModal').classList.add('show');
}

function closeAddExpenseModal() {
    document.getElementById('addExpenseModal').classList.remove('show');
}

// Add Expense
async function addExpense() {
    const title = document.getElementById('expenseTitle').value;
    const amount = document.getElementById('expenseAmount').value;
    const category = document.getElementById('expenseCategory').value;
    const date = document.getElementById('expenseDate').value;
    const group = document.getElementById('expenseGroup').value;
    const splitType = document.getElementById('splitType').value;
    const errorEl = document.getElementById('expenseError');

    if (!title || !amount || !date) {
        errorEl.textContent = 'Please fill in all required fields!';
        errorEl.style.display = 'block';
        return;
    }

    try {
        const body = {
            title, amount, category, date, split_type: splitType,
            split_members: [user.id]
        };
        if (group) body.group = group;

        const response = await apiCall('/expenses/', 'POST', body);
        const data = await response.json();

        if (response.ok) {
            closeAddExpenseModal();
            showToast('Expense added successfully!', 'success');
            loadRecentExpenses();
            loadBalances();
        } else {
            errorEl.textContent = JSON.stringify(data);
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

// Load everything on page load
loadBalances();
loadRecentExpenses();
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