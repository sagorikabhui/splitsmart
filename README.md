# SplitSmart 💜
### AI Powered Expense Splitting Web Application
> Split bills smartly, settle up instantly!

---

## 🌟 About SplitSmart

SplitSmart is a full stack web application designed to simplify shared expense management among friends, roommates, and travel groups. It allows users to create groups, add expenses, split bills intelligently, and settle dues instantly through UPI payments.

The highlight of SplitSmart is its AI powered receipt scanner built using Google Gemini AI, which allows users to simply upload a photo of any bill and the AI automatically extracts the expense title, amount, and category — eliminating manual data entry completely.

---

## 🚀 Key Features

- 🤖 **AI Receipt Scanner** — Upload bill photo, AI extracts details automatically
- 👥 **Group Management** — Create groups for trips, home, office or friends
- 💰 **Smart Expense Splitting** — Split equally, by exact amount or percentage
- 📊 **Analytics Dashboard** — Interactive charts for spending insights
- 🔢 **Debt Simplification** — Algorithm to minimize number of transactions
- 💸 **UPI Integration** — One click UPI payment for Indian users
- 🔐 **Secure Authentication** — Register, login, forgot password via email
- 👤 **Profile Management** — Edit profile, change password, UPI settings
- 🎨 **Theme Customization** — Light, dark and purple themes
- 📱 **Responsive Design** — Works on desktop and mobile devices

---

## 🛠️ Technologies Used

| Category | Technology |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (ES6+) |
| Backend | Python, Django, Django REST Framework |
| Database | SQLite |
| AI | Google Gemini AI (gemini-2.5-flash) |
| Authentication | Token Based Authentication |
| Email Service | Gmail SMTP |
| Icons | Font Awesome 6.4 |
| Charts | Chart.js |
| API Architecture | RESTful API |
| Payment | UPI Deep Link Integration |
| Version Control | Git & GitHub |

---

## 📁 Project Structure

splitsmart/

│

├── config/              → Django project settings & URLs

├── users/               → User authentication & profiles

├── groups/              → Group management

├── expenses/            → Expense tracking & splitting

├── analytics/           → Analytics & insights

├── scanner/             → AI Receipt Scanner

│

├── frontend/            → HTML, CSS, JavaScript files

│   ├── home.html        → Landing page

│   ├── index.html       → Login & Register

│   ├── dashboard.html   → Main dashboard

│   ├── groups.html      → Groups management

│   ├── expenses.html    → Expense tracking

│   ├── analytics.html   → Analytics & charts

│   ├── profile.html     → User profile

│   ├── settings.html    → App settings

│   ├── forgot-password.html  → Forgot password

│   ├── reset-password.html   → Reset password

│   ├── css/             → Stylesheets

│   └── js/              → JavaScript files

│

├── requirements.txt     → Python dependencies

├── .env                 → Environment variables (not uploaded)

└── README.md            → Project documentation

---

## ⚙️ How to Run

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/splitsmart.git
cd splitsmart
```

### 2. Create virtual environment
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Create `.env` file
```env
SECRET_KEY=your-secret-key-here
GEMINI_API_KEY=your-gemini-api-key
EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### 5. Run migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Create superuser
```bash
python manage.py createsuperuser
```

### 7. Start server
```bash
python manage.py runserver
```

### 8. Open browser

http://127.0.0.1:8000

---

## 📱 Pages

| Page | Description |
|---|---|
| Landing Page | Beautiful home page with features overview |
| Login/Register | User authentication |
| Dashboard | Overview of balances and expenses |
| Groups | Create and manage expense groups |
| Expenses | Add, split and track expenses |
| Analytics | Charts and spending insights |
| Profile | Edit personal information |
| Settings | App preferences and theme |

---

## 🏗️ API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/users/register/ | Register new user |
| POST | /api/users/login/ | Login user |
| POST | /api/users/logout/ | Logout user |
| GET/PUT | /api/users/profile/ | Get/Update profile |
| POST | /api/users/forgot-password/ | Forgot password |
| POST | /api/users/reset-password/ | Reset password |
| GET/POST | /api/groups/ | List/Create groups |
| POST | /api/groups/:id/add-member/ | Add group member |
| GET/POST | /api/expenses/ | List/Create expenses |
| GET | /api/expenses/balances/ | Get balances |
| POST | /api/expenses/settle/ | Settle up |
| GET | /api/expenses/simplify/ | Simplify debts |
| POST | /api/expenses/upi-payment/ | Generate UPI link |
| POST | /api/scanner/scan/ | Scan receipt with AI |

---

## 👨‍💻 Developer

Built with 💜 as an Internship Project

---

## 📄 License

This project is for educational purposes only.