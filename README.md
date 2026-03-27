# 💰 Personal Finance Dashboard

A modern, full-stack Personal Finance Dashboard offering robust insights into your financial health. Built to demonstrate production-ready architecture, clean code practices, and a hyper-premium User Interface.

## 🌟 Features
- **Authentication**: JWT-based login and registration.
- **Transactions Management**: Complete CRUD operations to register income and expenses.
- **Budgeting**: Set intelligent monthly limits per category. Visual progress bars track spending thresholds dynamically.
- **Aesthetic UI/UX**: Custom-designed, ultra-premium interface featuring CSS glassmorphism effects, dynamic meshes, and fluid micro-animations. 
- **Analytics & Insights**: Recharts visualizations for breaking down spending behaviors. Integrated heuristics engine alerting users when limits are nearly crossed.

## 🚀 Tech Stack
**Frontend:**
- React (Vite)
- React Router DOM
- Vanilla CSS (Tailwind-free for granular control)
- Recharts
- Axios (API Integration)

**Backend:**
- Node.js & Express.js
- Prisma ORM
- SQLite (Local Database)
- JSON Web Tokens (JWT) & bcryptjs

## 🛠 Setup & Installation

**1. Clone the repository**
```bash
git clone <repository-url>
cd FinanceTracker
```

**2. Setup Backend Server**
```bash
cd backend
npm install
npm install -D prisma
npx prisma generate
npx prisma migrate dev --name init
npm run start
```
*Note: Make sure `.env` contains your `JWT_SECRET` and SQLite `DATABASE_URL` setup!*

**3. Setup Frontend Application**
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

**4. Enjoy!**
Navigate to `http://localhost:5173` to explore the dashboard.

## 💡 System Architecture Highlights
- Uses Prisma ORM with SQLite for frictionless portfolio evaluation (requires 0 external Docker/Postgres setup).
- Completely decoupled frontend/backend structure to demonstrate microservices compatibility.
- Context API handles sensitive application state and interceptor handling.
