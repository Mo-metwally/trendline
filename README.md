# 🛒 Trendline Tech - Full-Stack E-Commerce & Built-in ERP System

A high-performance bilingual E-Commerce storefront with a built-in Enterprise Resource Planning (ERP) engine, Warehouse Management System (WMS), and NextAuth integration.

---

## 🛠️ Tech Stack & Architecture

- **Frontend & Admin:** Next.js (App Router), React 19, NextAuth.js
- **Backend & ERP:** Node.js, Express.js (Port 5000)
- **Database & ORM:** PostgreSQL 14 + Sequelize ORM (33 Models)
- **Email Service:** Zoho SMTP (`smtp.zoho.com`) for 6-digit OTP codes & notifications
- **Security:** Helmet, CORS Allowlist, Bcrypt password hashing, JWT Bearer tokens, Rate-limiting

---

## 🚀 Running the Project

### 1. Environment Setup
The project uses `.env` located in the project root:
```env
PORT=5000
NODE_ENV=development
BASE_URL=http://192.168.1.2:5000
CLIENT_URL=http://192.168.1.2:3000
ALLOWLIST=http://localhost:5000,http://192.168.1.2:5000,http://localhost:3000,http://192.168.1.2:3000
DB_URL=postgres://postgres:1222440@localhost:5432/trendlineeg
...
```

### 2. Available NPM Scripts

```bash
# Start Backend API & ERP Server (Port 5000)
npm run server

# Start Backend in Watch/Dev mode
npm run server:dev

# Run Database Seeders (Super Admin, Shipping Zones, Categories, Coupons)
npm run seed

# Start Next.js Storefront (Port 3000)
npm run dev
```

---

## 📁 Directory Structure

```text
trendline/
├── app/                        # Next.js App Router
│   ├── api/auth/[...nextauth]/ # NextAuth integration bridge
│   ├── layout.tsx
│   └── page.tsx
├── src/                        # Backend & ERP Engine
│   ├── config/                 # Sequelize DB connection pool
│   ├── controllers/            # Auth, Catalog, Order, ERP, and CMS controllers
│   ├── middleware/             # Auth JWT, RBAC, i18n Localization, Error Handler
│   ├── models/                 # 33 Sequelize Models (PK/FK and Full-Text Indexes)
│   ├── routes/                 # API Routes (/api/v1/...)
│   ├── seeders/                # Super Admin & Initial Data Seeders
│   └── services/               # ERP Lifecycle, Auto-Categorization, Dynamic Bundles
├── server.js                   # Express Backend Entry Point (Port 5000)
├── .env                        # Environment Configuration
├── package.json
└── tsconfig.json
```
