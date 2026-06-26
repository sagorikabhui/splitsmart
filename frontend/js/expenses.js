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

// Set today's date
document.getElementById('expenseDate').valueAsDate = new Date();

let selectedSettleUserId = null;

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

// Load balances
async function loadBalances() {
    try {
        const response = await apiCall('/expenses/balances/');
        const balances = await response.json();
        const balancesList = document.getElementById('balancesList');

        if (balances.length === 0) {
            balancesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-balance-scale"></i>
                    <p>No balances yet!</p>
                </div>`;
            return;
        }

        balancesList.innerHTML = balances.map(balance => {
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
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <div class="balance-amount ${isPositive ? 'positive' : 'negative'}">
                ${isPositive ? '+' : '-'}₹${Math.abs(balance.amount).toFixed(2)}
            </div>
            <div style="display:flex; gap:8px;">
                <button class="btn-secondary" onclick="openSettleModal(${balance.user_id}, '${balance.user_name}', ${Math.abs(balance.amount)})">
                    <i class="fas fa-handshake"></i> Settle Up
                </button>
                <button class="btn-secondary" onclick="openUpiModal(${balance.user_id}, '${balance.user_name}', ${Math.abs(balance.amount)})"
                    style="background:linear-gradient(135deg, #27AE60, #2ECC71); color:white; border:none;">
                    <i class="fas fa-mobile-alt"></i> UPI
                </button>
            </div>
        </div>
    </div>`;
        }).join('');

    } catch (error) {
        console.error('Error loading balances:', error);
    }
}

// Load all expenses
async function loadExpenses() {
    try {
        const response = await apiCall('/expenses/');
        const expenses = await response.json();
        const expensesList = document.getElementById('expensesList');

        if (expenses.length === 0) {
            expensesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <p>No expenses yet!</p>
                </div>`;
            return;
        }

        expensesList.innerHTML = expenses.map(expense => `
            <div class="expense-item">
                <div class="expense-info">
                    <div class="expense-icon">
                        <i class="fas ${categoryIcons[expense.category] || 'fa-receipt'}"></i>
                    </div>
                    <div>
                        <h4>${expense.title}</h4>
                        <p>${expense.paid_by_name} • ${expense.date} • ${expense.split_type}</p>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <div class="expense-amount">₹${parseFloat(expense.amount).toFixed(2)}</div>
                    <button onclick="deleteExpense(${expense.id})" style="background:none; color:var(--danger); font-size:16px; cursor:pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
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
        const groupSelect = document.getElementById('expenseGroup');
        groups.forEach(group => {
            groupSelect.innerHTML += `<option value="${group.id}">${group.name}</option>`;
        });
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

// Open/Close Add Expense Modal
function openAddExpenseModal() {
    document.getElementById('addExpenseModal').classList.add('show');
}

function closeAddExpenseModal() {
    document.getElementById('addExpenseModal').classList.remove('show');
}

// Open/Close Settle Modal
function openSettleModal(userId, userName, amount) {
    selectedSettleUserId = userId;
    document.getElementById('settleUserName').value = userName;
    document.getElementById('settleAmount').value = amount;
    document.getElementById('settleModal').classList.add('show');
}

function closeSettleModal() {
    document.getElementById('settleModal').classList.remove('show');
    selectedSettleUserId = null;
}

let selectedMembers = [];

async function loadGroupMembers() {
    const groupId = document.getElementById('expenseGroup').value;
    const membersSection = document.getElementById('membersSection');
    const membersList = document.getElementById('membersList');
    selectedMembers = [];

    if (!groupId) {
        membersSection.style.display = 'none';
        return;
    }

    try {
        const response = await apiCall(`/groups/${groupId}/`);
        const group = await response.json();

        const otherMembers = group.members_detail.filter(m => m.user !== user.id);

        if (otherMembers.length === 0) {
            membersSection.style.display = 'none';
            return;
        }

        membersSection.style.display = 'block';
        membersList.innerHTML = otherMembers.map(member => `
            <div style="display:flex; align-items:center; gap:10px; padding:8px 0;
                border-bottom:1px solid var(--border);">
                <input type="checkbox" id="member_${member.user}"
                    value="${member.user}"
                    onchange="toggleMember(${member.user})"
                    style="width:16px; height:16px; accent-color:var(--primary);">
                <label for="member_${member.user}"
                    style="font-size:14px; color:var(--text-dark); cursor:pointer;">
                    ${member.user_name} (${member.user_email})
                </label>
            </div>`
        ).join('');

    } catch (error) {
        console.error('Error loading group members:', error);
    }
}

function toggleMember(userId) {
    if (selectedMembers.includes(userId)) {
        selectedMembers = selectedMembers.filter(id => id !== userId);
    } else {
        selectedMembers.push(userId);
    }
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
    title, amount, category, date,
    split_type: splitType,
    split_members: [user.id, ...selectedMembers]
};
        if (group) body.group = group;

        const response = await apiCall('/expenses/', 'POST', body);
        const data = await response.json();

        if (response.ok) {
            closeAddExpenseModal();
            showToast('Expense added successfully!', 'success');
            loadExpenses();
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

// Delete Expense
async function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
        const response = await apiCall(`/expenses/${id}/`, 'DELETE');
        if (response.ok) {
            showToast('Expense deleted successfully!', 'success');
            loadExpenses();
            loadBalances();
        }
    } catch (error) {
        showToast('Error deleting expense!', 'error');
    }
}

// Settle Up
async function settleUp() {
    const amount = document.getElementById('settleAmount').value;
    const upiId = document.getElementById('settleUpiId').value;
    const note = document.getElementById('settleNote').value;
    const errorEl = document.getElementById('settleError');

    if (!amount) {
        errorEl.textContent = 'Please enter an amount!';
        errorEl.style.display = 'block';
        return;
    }

    try {
        const response = await apiCall('/expenses/settle/', 'POST', {
            paid_to: selectedSettleUserId,
            amount,
            upi_transaction_id: upiId,
            note
        });
        const data = await response.json();

        if (response.ok) {
            closeSettleModal();
            showToast('Settled up successfully!', 'success');
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

// ===== DEBT SIMPLIFICATION =====
async function loadSimplifiedDebts() {
    try {
        const response = await apiCall('/expenses/simplify/');
        const data = await response.json();
        const simplifiedDebts = document.getElementById('simplifiedDebts');

        if (data.simplified_transactions.length === 0) {
            simplifiedDebts.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle" style="color:var(--success);"></i>
                    <p>All settled up! No transactions needed!</p>
                </div>`;
            return;
        }

        simplifiedDebts.innerHTML = `
            <p style="font-size:13px; color:var(--text-gray); margin-bottom:15px;">
                <i class="fas fa-info-circle"></i>
                Only <strong>${data.total_transactions}</strong> 
                transaction(s) needed to settle all debts!
            </p>
            ${data.simplified_transactions.map(transaction => `
                <div class="balance-item">
                    <div class="balance-user">
                        <div class="balance-avatar">
                            ${transaction.from_user.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h4>${transaction.from_user}</h4>
                            <p>pays <strong>${transaction.to_user}</strong></p>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div class="balance-amount negative">
                            ₹${transaction.amount.toFixed(2)}
                        </div>
                    </div>
                </div>`
        ).join('')}`;

    } catch (error) {
        console.error('Error loading simplified debts:', error);
    }
}

// ===== UPI PAYMENT =====
let currentUpiUserId = null;
let currentUpiAmount = null;

async function openUpiModal(userId, userName, amount) {
    currentUpiUserId = userId;
    currentUpiAmount = amount;

    try {
        const response = await apiCall('/expenses/upi-payment/', 'POST', {
            paid_to: userId,
            amount: amount,
            note: 'SplitSmart Settlement'
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('upiUserName').textContent = data.user_name;
            document.getElementById('upiId').textContent = `UPI ID: ${data.upi_id}`;
            document.getElementById('upiAmount').textContent = `₹${parseFloat(data.amount).toFixed(2)}`;
            document.getElementById('upiLink').href = data.upi_link;
            document.getElementById('upiModal').classList.add('show');
        } else {
            showToast(data.error || 'UPI ID not found!', 'error');
        }
    } catch (error) {
        showToast('Error generating UPI link!', 'error');
    }
}

function closeUpiModal() {
    document.getElementById('upiModal').classList.remove('show');
    currentUpiUserId = null;
    currentUpiAmount = null;
}

async function confirmUpiPayment() {
    const transactionId = document.getElementById('upiTransactionId').value;

    if (!transactionId) {
        showToast('Please enter UPI Transaction ID!', 'error');
        return;
    }

    try {
        const response = await apiCall('/expenses/settle/', 'POST', {
            paid_to: currentUpiUserId,
            amount: currentUpiAmount,
            upi_transaction_id: transactionId,
            note: 'UPI Payment via SplitSmart'
        });

        if (response.ok) {
            closeUpiModal();
            showToast('Payment confirmed successfully!', 'success');
            loadBalances();
            loadSimplifiedDebts();
        } else {
            showToast('Error confirming payment!', 'error');
        }
    } catch (error) {
        showToast('Server error!', 'error');
    }
}

// ===== AI RECEIPT SCANNER =====

let selectedFile = null;

// Open/Close Scanner Modal
function openScannerModal() {
    document.getElementById('scannerModal').classList.add('show');
    resetScanner();
}

function closeScannerModal() {
    document.getElementById('scannerModal').classList.remove('show');
    resetScanner();
}

function resetScanner() {
    selectedFile = null;
    document.getElementById('previewArea').style.display = 'none';
    document.getElementById('scanningLoader').style.display = 'none';
    document.getElementById('scannedResult').style.display = 'none';
    document.getElementById('uploadArea').style.display = 'block';
    document.getElementById('scannerError').style.display = 'none';
    document.getElementById('receiptInput').value = '';
}

// Handle file select
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        selectedFile = file;
        showPreview(file);
    }
}

// Handle drag over
function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.style.borderColor = 'var(--primary)';
    event.currentTarget.style.background = 'rgba(142, 68, 173, 0.05)';
}

// Handle drop
function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.style.borderColor = 'var(--border)';
    event.currentTarget.style.background = 'none';
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        selectedFile = file;
        showPreview(file);
    }
}

// Show image preview
function showPreview(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById('receiptPreview').src = e.target.result;
        document.getElementById('uploadArea').style.display = 'none';
        document.getElementById('previewArea').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Scan receipt with AI
async function scanReceipt() {
    if (!selectedFile) return;

    document.getElementById('previewArea').style.display = 'none';
    document.getElementById('scanningLoader').style.display = 'block';
    document.getElementById('scannerError').style.display = 'none';

    try {
        const formData = new FormData();
        formData.append('receipt', selectedFile);

        const response = await fetch(`${API_URL}/scanner/scan/`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${token}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Fill in scanned data
            document.getElementById('scannedTitle').value = data.data.title || '';
            document.getElementById('scannedAmount').value = data.data.amount || '';
            document.getElementById('scannedDate').value = data.data.date || new Date().toISOString().split('T')[0];

            // Set category
            const categorySelect = document.getElementById('scannedCategory');
            if (data.data.category) {
                categorySelect.value = data.data.category;
            }

            // Show items if available
            if (data.data.items && data.data.items.length > 0) {
                document.getElementById('scannedItems').innerHTML = `
                    <label style="font-size:14px; font-weight:600; color:var(--text-dark);
                        display:block; margin-bottom:8px;">Items Found</label>
                    <div style="background:var(--background); border-radius:10px; padding:12px;">
                        ${data.data.items.map(item => `
                            <div style="font-size:13px; color:var(--text-gray);
                                padding:4px 0; border-bottom:1px solid var(--border);">
                                <i class="fas fa-check" style="color:var(--success);"></i> ${item}
                            </div>`
                ).join('')}
                    </div>`;
            }

            document.getElementById('scanningLoader').style.display = 'none';
            document.getElementById('scannedResult').style.display = 'block';

        } else {
            throw new Error(data.error || 'Scanning failed!');
        }

    } catch (error) {
        document.getElementById('scanningLoader').style.display = 'none';
        document.getElementById('previewArea').style.display = 'block';
        const errorEl = document.getElementById('scannerError');
        errorEl.textContent = error.message || 'Error scanning receipt!';
        errorEl.style.display = 'block';
    }
}

// Add scanned expense
async function addScannedExpense() {
    const title = document.getElementById('scannedTitle').value;
    const amount = document.getElementById('scannedAmount').value;
    const category = document.getElementById('scannedCategory').value;
    const date = document.getElementById('scannedDate').value;

    if (!title || !amount) {
        showToast('Please fill in title and amount!', 'error');
        return;
    }

    try {
        const response = await apiCall('/expenses/', 'POST', {
            title, amount, category, date,
            split_type: 'equal',
            split_members: [user.id]
        });

        const data = await response.json();

        if (response.ok) {
            closeScannerModal();
            showToast('Expense added from receipt!', 'success');
            loadExpenses();
            loadBalances();
        } else {
            showToast('Error adding expense!', 'error');
        }
    } catch (error) {
        showToast('Server error!', 'error');
    }
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
// Load everything
loadBalances();
loadExpenses();
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