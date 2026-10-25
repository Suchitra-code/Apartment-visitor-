# ApartmentHub – Visitor & Maintenance Manager (MERN)

A production‑grade SaaS web application for residential apartment complexes and gated communities. Built with the full **MERN** stack (MongoDB Atlas, Express.js, React 18, Node.js), Tailwind CSS, Framer Motion, and Role‑Based Access Control (RBAC).

---

## 📦 Features
- Role‑based dashboards for **Admin**, **Resident**, and **Security Guard**
- Visitor pass generation, QR‑code pre‑approval, and gate‑check‑in/out
- Maintenance ticket Kanban with timelines and comments
- Notices & announcements broadcast to residents
- Comprehensive CRUD for flats, staff, visitors, tickets, and more
- Secure authentication with email/password (hashed with bcrypt) and JWT
- MongoDB Atlas (or in‑memory fallback) persistence

---

## ⚙️ Prerequisites
- **Node.js** v18+ (tested on v22.14.0)
- **NPM** v9+ (or Yarn)
- A MongoDB Atlas cluster **or** rely on the built‑in `mongodb-memory-server` for local development.

---

## 🚀 Quick Start
### 1. Clone the repository (if you haven't already)
```bash
git clone https://github.com/Suchitra-code/Apartment-visitor-.git "apartment visitor"
cd "apartment visitor"
```
### 2. Backend (server)
```bash
cd server
npm install
# Copy the example environment file and fill in your values
cp .env.example .env
# Edit .env to set MONGODB_URI, JWT_SECRET, etc.
# (You can also leave it as‑is to use the in‑memory fallback.)
npm run dev   # Starts the Express server on http://localhost:5000
```
### 3. Frontend (client)
```bash
cd ../client
npm install
npm run dev   # Vite dev server (default http://localhost:5173; will auto‑switch if port is busy)
```
The app will be available at the URL shown by Vite (e.g., `http://localhost:5174`).

---

## 🔐 Authentication
- **Register** a new account via **/register** – provide a valid email and a password of your choice.
- **Login** with the registered credentials via **/login**.
- Passwords are **never stored in plain text**; they are hashed with bcrypt before saving to MongoDB.
- After registration you can immediately log in; no demo accounts are pre‑filled.

## 🛠️ Configuration
| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | Connection string for your MongoDB Atlas cluster. | `mongodb+srv://user:pass@cluster.mongodb.net/apartmenthub` |
| `JWT_SECRET` | Secret used to sign JWT tokens. | `supersecretkey` |
| `PORT` (optional) | Port for the Express server (default `5000`). | `5000` |

> **Note:** Do **not** commit `.env` or any credentials. They are excluded via `.gitignore`.

---

## 🧪 Testing
```bash
# From the server folder
npm test   # Runs Jest + Supertest suite
```

---

## 📚 Documentation & Architecture
- **Monorepo layout**
```
apartment visitor/
├── client/          # React + Vite front‑end
├── server/          # Express back‑end
├── .gitignore
└── README.md
```
- See the source folders for detailed module breakdown (components, routes, controllers, models, etc.).

---

## 🐛 Troubleshooting
- **Port conflicts** – If port `5000` (backend) or `5173` (frontend) is in use, Vite will automatically select the next free port and display it in the console.
- **Database connection errors** – Verify `MONGODB_URI` is correct and that your IP is allowed in the Atlas network whitelist.
- **Authentication failures** – Ensure the password meets the minimum length (8 characters) and that you are using the exact email you registered with.

---

## 📄 License
This project is licensed under the MIT License.
