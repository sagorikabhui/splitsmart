const CHAT_API_URL = 'http://127.0.0.1:8000/api';
const chatToken = localStorage.getItem('token');
const chatUser = JSON.parse(localStorage.getItem('user'));

// Quick suggestions
const suggestions = [
    'How much did I spend?',
    'Show my balances',
    'How many groups?',
    'Top spending category?'
];

// Initialize chatbot
function initChatbot() {
    // Add chatbot button
    const chatBtn = document.createElement('button');
    chatBtn.className = 'chatbot-btn';
    chatBtn.innerHTML = '<i class="fas fa-robot"></i>';
    chatBtn.onclick = toggleChatbot;
    document.body.appendChild(chatBtn);

    // Add chatbot window
    const chatWindow = document.createElement('div');
    chatWindow.className = 'chatbot-window';
    chatWindow.id = 'chatbotWindow';
    chatWindow.innerHTML = `
        <div class="chatbot-header">
            <div class="chatbot-header-left">
                <div class="chatbot-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="chatbot-header-info">
                    <h4>SplitSmart AI</h4>
                    <p>
                        <span class="chatbot-online-dot"></span>
                        Always here to help!
                    </p>
                </div>
            </div>
            <button class="chatbot-close" onclick="toggleChatbot()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="chatbot-messages" id="chatMessages">
            <div class="message bot">
                <div class="message-avatar"><i class="fas fa-robot"></i></div>
                <div class="message-bubble">
                    Hi ${chatUser ? chatUser.first_name : 'there'}! 👋 I'm your SplitSmart AI assistant!
                    I can help you understand your expenses, balances, and spending patterns.
                    What would you like to know?
                </div>
            </div>
        </div>
        <div class="chatbot-suggestions" id="chatSuggestions">
            ${suggestions.map(s => `
                <div class="suggestion-chip" onclick="sendSuggestion('${s}')">${s}</div>
            `).join('')}
        </div>
        <div class="chatbot-input">
            <input type="text" id="chatInput" placeholder="Ask me anything..."
                onkeypress="handleChatKeyPress(event)">
            <button class="chatbot-send" onclick="sendMessage()">
                <i class="fas fa-paper-plane"></i>
            </button>
        </div>
    `;
    document.body.appendChild(chatWindow);
}

// Toggle chatbot
function toggleChatbot() {
    const window = document.getElementById('chatbotWindow');
    window.classList.toggle('open');
    if (window.classList.contains('open')) {
        document.getElementById('chatInput').focus();
    }
}

// Handle key press
function handleChatKeyPress(e) {
    if (e.key === 'Enter') sendMessage();
}

// Send suggestion
function sendSuggestion(text) {
    document.getElementById('chatInput').value = text;
    sendMessage();
}

// Add message to chat
function addMessage(text, ischatUser = false) {
    const messages = document.getElementById('chatMessages');
    const message = document.createElement('div');
    message.className = `message ${ischatUser ? 'chatUser' : 'bot'}`;
    message.innerHTML = `
        <div class="message-avatar">
            <i class="fas ${ischatUser ? 'fa-chatUser' : 'fa-robot'}"></i>
        </div>
        <div class="message-bubble">${text}</div>
    `;
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
}

// Show typing indicator
function showTyping() {
    const messages = document.getElementById('chatMessages');
    const typing = document.createElement('div');
    typing.className = 'message bot';
    typing.id = 'typingIndicator';
    typing.innerHTML = `
        <div class="message-avatar"><i class="fas fa-robot"></i></div>
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;
}

// Hide typing indicator
function hideTyping() {
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
}

// Send message
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

    // Add user message
    addMessage(message, true);
    input.value = '';

    // Hide suggestions after first message
    document.getElementById('chatSuggestions').style.display = 'none';

    // Show typing
    showTyping();

    try {
        // Get user's expenses and balances for context
        const [expensesRes, balancesRes, groupsRes] = await Promise.all([
            fetch(`${CHAT_API_URL}/expenses/`, {
                headers: { 'Authorization': `Token ${chatToken}` }
            }),
            fetch(`${CHAT_API_URL}/expenses/balances/`, {
                headers: { 'Authorization': `Token ${chatToken}` }
            }),
            fetch(`${CHAT_API_URL}/groups/`, {
                headers: { 'Authorization': `Token ${chatToken}` }
            })
        ]);

        const expenses = await expensesRes.json();
        const balances = await balancesRes.json();
        const groups = await groupsRes.json();

        // Calculate summary
        const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const totalOwed = balances.filter(b => b.amount > 0).reduce((sum, b) => sum + b.amount, 0);
        const totalOwe = balances.filter(b => b.amount < 0).reduce((sum, b) => sum + Math.abs(b.amount), 0);

        // Category breakdown
        const categories = {};
        expenses.forEach(e => {
            categories[e.category] = (categories[e.category] || 0) + parseFloat(e.amount);
        });

        const topCategory = Object.keys(categories).length > 0
            ? Object.keys(categories).reduce((a, b) => categories[a] > categories[b] ? a : b)
            : 'None';

        // Build context for AI
        const context = `
You are SplitSmart AI assistant. You help users understand their expense data.
Be friendly, concise and use Indian Rupee (₹) for amounts.
Use emojis to make responses more engaging.

User's financial data:
- Name: ${chatUser ? chatUser.first_name + ' ' + chatUser.last_name : 'chatUser'}
- Total Expenses: ₹${totalExpenses.toFixed(2)}
- Number of Expenses: ${expenses.length}
- Total Groups: ${groups.length}
- You are owed: ₹${totalOwed.toFixed(2)}
- You owe: ₹${totalOwe.toFixed(2)}
- Top spending category: ${topCategory}
- Category breakdown: ${JSON.stringify(categories)}
- Recent expenses: ${JSON.stringify(expenses.slice(0, 5).map(e => ({
            title: e.title,
            amount: e.amount,
            category: e.category,
            date: e.date
        })))}
- Balances: ${JSON.stringify(balances)}
- Groups: ${JSON.stringify(groups.map(g => ({ name: g.name, members: g.total_members })))}

Answer the user's question based on this data. Keep response under 100 words.
        `;

        // Call Django Chatbot API
        const response = await fetch(`${CHAT_API_URL}/chatbot/message/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${chatToken}`
            },
            body: JSON.stringify({
                message: message,
                context: {
                    name: chatUser ? chatUser.first_name + ' ' + chatUser.last_name : 'User',
                    total_expenses: totalExpenses.toFixed(2),
                    expense_count: expenses.length,
                    group_count: groups.length,
                    total_owed: totalOwed.toFixed(2),
                    total_owe: totalOwe.toFixed(2),
                    top_category: topCategory,
                    categories: categories,
                    recent_expenses: expenses.slice(0, 5).map(e => ({
                        title: e.title,
                        amount: e.amount,
                        category: e.category,
                        date: e.date
                    })),
                    balances: balances,
                    groups: groups.map(g => ({
                        name: g.name,
                        members: g.total_members
                    }))
                }
            })
        });

        const data = await response.json();
        hideTyping();

        if (data.reply) {
            addMessage(data.reply);
        } else {
            addMessage('Sorry, I could not process your request. Please try again! 😊');
        }

    } catch (error) {
        hideTyping();
        addMessage('Sorry, something went wrong! Please try again. 😊');
        console.error('Chatbot error:', error);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initChatbot);