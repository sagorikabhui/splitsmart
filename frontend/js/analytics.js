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
async function apiCall(endpoint) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
        }
    });
    return response;
}

// Category colors
const categoryColors = {
    food: '#8E44AD',
    transport: '#2980B9',
    accommodation: '#27AE60',
    entertainment: '#F39C12',
    shopping: '#E74C3C',
    utilities: '#1ABC9C',
    medical: '#E67E22',
    other: '#95A5A6'
};

// Category labels
const categoryLabels = {
    food: 'Food & Drinks',
    transport: 'Transport',
    accommodation: 'Accommodation',
    entertainment: 'Entertainment',
    shopping: 'Shopping',
    utilities: 'Utilities',
    medical: 'Medical',
    other: 'Other'
};

// Load analytics
async function loadAnalytics() {
    try {
        const response = await apiCall('/expenses/');
        const expenses = await response.json();

        if (expenses.length === 0) {
            document.getElementById('totalSpent').textContent = '₹0';
            document.getElementById('totalTransactions').textContent = '0';
            document.getElementById('avgExpense').textContent = '₹0';
            document.getElementById('topCategory').textContent = '-';
            renderEmptyCharts();
            return;
        }

        // Calculate stats
        const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const avgExpense = totalSpent / expenses.length;

        // Category breakdown
        const categoryData = {};
        expenses.forEach(expense => {
            const cat = expense.category;
            categoryData[cat] = (categoryData[cat] || 0) + parseFloat(expense.amount);
        });

        // Top category
        const topCategory = Object.keys(categoryData).reduce((a, b) =>
            categoryData[a] > categoryData[b] ? a : b
        );

        // Update stats
        document.getElementById('totalSpent').textContent = `₹${totalSpent.toFixed(2)}`;
        document.getElementById('totalTransactions').textContent = expenses.length;
        document.getElementById('avgExpense').textContent = `₹${avgExpense.toFixed(2)}`;
        document.getElementById('topCategory').textContent = categoryLabels[topCategory] || topCategory;

        // Monthly breakdown
        const monthlyData = {};
        expenses.forEach(expense => {
            const month = expense.date.substring(0, 7);
            monthlyData[month] = (monthlyData[month] || 0) + parseFloat(expense.amount);
        });

        // Render charts
        renderCategoryChart(categoryData);
        renderMonthlyChart(monthlyData);

    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Render Category Pie Chart
function renderCategoryChart(categoryData) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    const labels = Object.keys(categoryData).map(k => categoryLabels[k] || k);
    const data = Object.values(categoryData);
    const colors = Object.keys(categoryData).map(k => categoryColors[k] || '#95A5A6');

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

// Render Monthly Bar Chart
function renderMonthlyChart(monthlyData) {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    const sortedMonths = Object.keys(monthlyData).sort();
    const labels = sortedMonths.map(m => {
        const date = new Date(m + '-01');
        return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    });
    const data = sortedMonths.map(m => monthlyData[m]);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Total Spending (₹)',
                data,
                backgroundColor: 'rgba(142, 68, 173, 0.7)',
                borderColor: '#8E44AD',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    ticks: {
                        callback: value => `₹${value}`
                    }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

// Render empty charts when no data
function renderEmptyCharts() {
    const ctxCat = document.getElementById('categoryChart').getContext('2d');
    const ctxMonth = document.getElementById('monthlyChart').getContext('2d');

    new Chart(ctxCat, {
        type: 'doughnut',
        data: {
            labels: ['No Data'],
            datasets: [{ data: [1], backgroundColor: ['#E8D5F5'], borderWidth: 0 }]
        },
        options: { plugins: { legend: { display: false } } }
    });

    new Chart(ctxMonth, {
        type: 'bar',
        data: {
            labels: ['No Data'],
            datasets: [{ data: [0], backgroundColor: ['#E8D5F5'] }]
        },
        options: { plugins: { legend: { display: false } } }
    });
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

// Load analytics on page load
loadAnalytics();

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