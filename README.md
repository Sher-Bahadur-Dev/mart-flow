# 🚀 MartFlow

### Modern Retail ERP & Mart Management System

MartFlow is a modern web-based **Retail ERP / Mart Management System** designed for physical retail businesses.

The goal is to bring core mart operations into one centralized platform — including **suppliers, purchases, inventory, products, POS, sales, customers, cash, expenses, reports, and profit & loss management**.

🔴 **Live Demo:** https://mart-flow-sand.vercel.app/

🐙 **GitHub:** https://github.com/Sher-Bahadur-417/mart-flow

---

## 🛠️ Tech Stack

* **Next.js 16** — App Router
* **TypeScript** — Type-safe development
* **Tailwind CSS v4** — Modern responsive UI
* **Firebase Authentication** — Authentication
* **Cloud Firestore** — Application database
* **Firebase Storage** — File/storage management
* **Vercel** — Deployment
* **GitHub** — Source control

---

## 📦 Planned Modules

MartFlow is being designed as a complete retail management platform.

### 📊 Dashboard

Centralized overview of important business operations and activity.

### 📦 Inventory

* Product management
* Stock management
* Stock movements
* Inventory tracking
* Product information

### 🛒 Purchases

* Purchase orders
* Supplier orders
* Receiving
* Purchase history
* Receiving status

### 🚚 Suppliers

* Supplier management
* Supplier information
* Supplier purchase history
* Supplier-related workflows

### 🏪 Products

* Product catalog
* Product details
* Pricing
* Stock information
* Product organization

### 💳 POS & Sales

* Point of Sale
* Sales transactions
* Customer purchases
* Sales history
* Transaction management

### 👥 Customers

* Customer records
* Customer information
* Purchase history
* Customer management

### 💰 Cash & Expenses

* Cash management
* Expense tracking
* Business transactions
* Financial records

### 📈 Reports

* Sales reports
* Purchase reports
* Inventory reports
* Expense reports
* Business performance

### 📊 Profit & Loss

Designed to provide a centralized view of business financial performance.

---

# 👤 Role-Based Access

MartFlow is being designed around role-based access and permissions.

### 👑 Owner

Full business-level control.

Potential access includes:

* Dashboard
* Employees
* Roles & permissions
* Inventory
* Purchases
* Suppliers
* Products
* POS
* Sales
* Customers
* Cash
* Expenses
* Reports
* Settings

### 🧑‍💼 Manager

Management-level access based on assigned permissions.

### 👨‍💻 Employee

Operational access based on the permissions assigned to the employee.

> Permissions are intended to be enforced through application and backend/database rules rather than relying only on UI visibility.

---

# 🚧 Current Development Status

## Phase 1 — Foundation

**Current status: 🚧 In Development**

The current repository contains the foundational application architecture, including:

* Next.js App Router structure
* TypeScript setup
* Tailwind CSS styling
* Staff application shell
* Sidebar navigation
* Topbar
* Theme support
* UI primitives
* Firebase client configuration
* Firebase admin configuration
* Role/permission constants
* Module route structure
* Firestore configuration
* Firebase Storage configuration

The project is intentionally being developed incrementally rather than using fake business metrics or placeholder data.

---

# 🗺️ Roadmap

### Phase 1 — Foundation

* [x] Next.js application setup
* [x] TypeScript
* [x] Tailwind CSS
* [x] Application shell
* [x] Sidebar
* [x] Topbar
* [x] Theme system
* [x] UI primitives
* [x] Firebase configuration
* [x] Role/permission architecture
* [x] Initial module routes

### Phase 2 — Authentication & Users

* [ ] Firebase Authentication
* [ ] Login
* [ ] Logout
* [ ] User profiles
* [ ] Employee management
* [ ] Role management
* [ ] Permission enforcement

### Phase 3 — Products & Inventory

* [ ] Product CRUD
* [ ] Categories
* [ ] Stock management
* [ ] Stock movements
* [ ] Inventory adjustments
* [ ] Low-stock tracking

### Phase 4 — Suppliers & Purchases

* [ ] Supplier CRUD
* [ ] Purchase orders
* [ ] Receiving
* [ ] Purchase history
* [ ] Supplier history

### Phase 5 — POS & Sales

* [ ] POS interface
* [ ] Cart
* [ ] Checkout
* [ ] Sales transactions
* [ ] Sales history
* [ ] Customer management

### Phase 6 — Finance

* [ ] Cash management
* [ ] Expenses
* [ ] Financial transactions
* [ ] Profit & Loss
* [ ] Financial reporting

### Phase 7 — Reports & Analytics

* [ ] Sales reports
* [ ] Purchase reports
* [ ] Inventory reports
* [ ] Expense reports
* [ ] Business analytics
* [ ] Dashboard metrics

### Phase 8 — Production Hardening

* [ ] Security rules
* [ ] Permission auditing
* [ ] Error handling
* [ ] Performance optimization
* [ ] Production testing
* [ ] Backup/recovery strategy
* [ ] Audit logs

---

# 🚀 Getting Started

## Requirements

Make sure you have:

* Node.js
* npm
* Git
* A Firebase project

Check your installation:

```bash
node -v
npm -v
git --version
```

---

## 📥 Installation

Clone the repository:

```bash
git clone https://github.com/Sher-Bahadur-417/mart-flow.git
```

Enter the project:

```bash
cd mart-flow
```

Install dependencies:

```bash
npm install
```

---

# 🔐 Environment Configuration

Create a local environment file:

```bash
copy .env.example .env.local
```

Then configure the Firebase environment variables.

Example:

```env
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
```

> ⚠️ Never commit private credentials or secrets to GitHub.

> ⚠️ Firebase Admin credentials must **not** be placed inside `NEXT_PUBLIC_*` variables.

---

# 💻 Run the Development Server

Start the application:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The home route redirects to:

```text
/dashboard
```

---

# 🧪 Quality Checks

Run linting:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

---

# 🔥 Firebase

MartFlow uses Firebase as its backend infrastructure.

Current Firebase components include:

* Firebase Authentication
* Cloud Firestore
* Firebase Storage
* Firestore Security Rules
* Storage Security Rules
* Firestore indexes

Firebase configuration files are included in the repository for the project's backend structure.

---

# 📁 Project Structure

The project follows a modular Next.js architecture.

```text
mart-flow/
│
├── .agents/
│   └── skills/
│
├── public/
│
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── ...
│
├── .env.example
├── .gitignore
├── AGENTS.md
├── CLAUDE.md
├── components.json
├── eslint.config.mjs
├── firebase.json
├── firestore.indexes.json
├── firestore.rules
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── storage.rules
├── tsconfig.json
└── README.md
```

The architecture may evolve as new business modules are implemented.

---

# 🔒 Security

Security is an important part of MartFlow's architecture.

The project includes:

* Firebase security rules
* Firestore rules
* Storage rules
* Role/permission definitions
* Environment-based configuration

Important principles:

* Never commit secrets.
* Never expose Firebase Admin credentials.
* Do not rely only on frontend permission checks.
* Validate sensitive operations through appropriate backend/database rules.
* Review Firebase security rules before production use.

---

# 🌐 Deployment

MartFlow is deployed using Vercel.

### Production Demo

🔴 **https://mart-flow-sand.vercel.app/**

### GitHub Repository

🐙 **https://github.com/Sher-Bahadur-417/mart-flow**

---

# 📸 Screenshots

Screenshots will be added as the application modules become fully implemented.

Recommended structure:

```text
docs/
└── screenshots/
    ├── dashboard.png
    ├── inventory.png
    ├── purchases.png
    ├── suppliers.png
    ├── employees.png
    └── pos.png
```

---

# 🎯 Project Vision

MartFlow is being built with one main goal:

> **Create a practical, modern, and scalable management system for real-world retail businesses.**

Instead of building only a visual dashboard, the project is being developed toward complete business workflows and reliable data management.

---

# 👨‍💻 Developer

### Sher Bahadur

Web Developer focused on building modern, responsive, and practical web applications.

**Interests:**

* Full-Stack Development
* Next.js
* TypeScript
* React
* Firebase
* UI/UX
* Business Applications
* Modern Web Technologies

---

# ⭐ Support the Project

If you find MartFlow interesting, consider giving the repository a ⭐ on GitHub.

Every star, issue, suggestion, and contribution helps the project grow.

---

## 📄 License

No open-source license has currently been specified for this repository.

A license should be added if the project is intended to be officially distributed as open source.

---

### 🚀 Built with Next.js, TypeScript, Firebase & a lot of learning.

**MartFlow — Building a smarter way to manage retail.**
