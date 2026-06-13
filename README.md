# Raj Dental & Implant Hospital - Digital Ecosystem

A complete, production-grade practice management system (PMS) and patient acquisition website built for **Raj Dental & Implant Hospital**, led by **Dr. Manoj Kumar**.

---

## 🏗️ Project Architecture & Structure

This ecosystem uses a monorepo workspace configuration:

```
raj-dental/
 ├── apps/
 │    ├── website/          # Next.js 15 Patient Web (conversion-focused brand site)
 │    └── pms/              # Next.js 15 Dentist PMS Dashboard (invoicing, odontogram, schedules)
 ├── backend/               # Node.js + Express.js API (JWT auth, MongoDB controllers)
 ├── shared/                # Shared typescript types and definitions
 ├── package.json           # Root workspace configuration
 └── README.md              # System documentation
```

---

## 🗄️ Database Design (MongoDB Atlas)

The system is designed with 10 Mongoose schemas, featuring proper indexing and relational references:

```
                  +-------------------+
                  |      patients     |
                  +---------+---------+
                            |
         +------------------+------------------+
         | 1                | 1                | 1
+--------v--------+ +-------v-------+ +--------v--------+
|   appointments  | |  treatments   | |medical_histories|
+--------+--------+ +-------+-------+ +-----------------+
         |                  |
         | 1..*             | 1..*
+--------v------------------v--------+
|              invoices              |
+----------------+-------------------+
                 |
                 | 1
        +--------v--------+
        |     payments    |
        +-----------------+
```

- **`users`**: Manages Dr. Manoj's doctor credential hashes and JWT refresh tokens.
- **`patients`**: Stores general patient cards, medical profiles, and demographic records.
- **`appointments`**: Tracks schedules, date slots, and pending web requests.
- **`medical_histories`**: Anatomical map representing the condition of the 32 adult teeth (Odontogram).
- **`treatments`**: Log of completed clinical procedures (e.g. implant placement, canal cleaning).
- **`invoices`**: Bills generated against completed treatments.
- **`payments`**: Payment receipts recorded for invoicing.
- **`notifications`**: Real-time alerts for online bookings.
- **`audit_logs`**: Security logs for clinical modifications.

---

## 🔌 API Specifications

All endpoints prefix with `/api/v1` and require header `Authorization: Bearer <access_token>` except public routes.

### 🔐 Authentication Module
- `POST /auth/login` - Authenticate Dr. Manoj and return tokens.
- `POST /auth/refresh` - Refresh access token.
- `POST /auth/logout` - Invalidate session.
- `PUT /auth/update-password` - Change doctor password.

### 👥 Patients Module
- `GET /patients?search=<query>` - List/Search patients.
- `POST /patients` - Register a patient.
- `GET /patients/:id` - Detailed profile with histories.
- `PUT /patients/:id` - Update patient details.
- `DELETE /patients/:id` - Remove patient record.
- `GET /patients/:id/dental-chart` - Load 32-teeth odontogram map.
- `PUT /patients/:id/dental-chart` - Save 32-teeth odontogram updates.

### 📅 Appointments Module
- `GET /appointments?startDate=<date>&endDate=<date>` - Calendar listing.
- `POST /appointments` - Book appointment slot.
- `PUT /appointments/:id/status` - Complete, cancel, or approve booking.
- `PUT /appointments/:id/reschedule` - Shift time slot.

### 💳 Billing & Reports Module
- `POST /billing/treatments` - Record completed clinical treatment.
- `POST /billing/invoices` - Generate invoice against completed treatments.
- `GET /billing/invoices` - List invoices.
- `POST /billing/invoices/:id/payments` - Record payment against bill.
- `GET /reports/dashboard-stats` - Fetch widgets aggregates.
- `GET /reports/analytics-data` - Get charts data coordinates.

### 🌐 Public Endpoints
- `POST /public/book-appointment` - Public patient website booking request.

---

## 💻 Tech Stack & Dependencies

- **Frontend Core**: Next.js 15, React 19, TypeScript
- **UI Engine**: Tailwind CSS v4, Lucide Icons, Framer Motion
- **Backend API**: Node.js, Express.js, JWT, Mongoose, Bcryptjs, Helmet
- **Database**: MongoDB Atlas

---

## 🚀 Setup & Installation Guide

### Prerequisites
- Node.js 18+ and npm installed
- Local MongoDB running or a MongoDB Atlas URI

### Step 1: Install Workspace Dependencies
Install all packages from the root directory:
```bash
npm install
```

### Step 2: Configure Environment Variables
Create `.env` files in `backend/`, `apps/website/`, and `apps/pms/` directories following the `.env.example` templates.
- **Backend (`backend/.env`)**:
  ```env
  PORT=5000
  MONGO_URI=mongodb://localhost:27017/raj_dental
  JWT_SECRET=your_jwt_access_secret_key
  REFRESH_SECRET=your_jwt_refresh_secret_key
  NODE_ENV=development
  ```
- **Apps Website (`apps/website/.env.local`)**:
  ```env
  NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
  ```
- **Apps PMS (`apps/pms/.env.local`)**:
  ```env
  NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
  ```

### Step 3: Seed the Database
Populate the database with Dr. Manoj's admin account (`manoj@rajdental.com` / `password123`) and sample patient records:
```bash
npm run seed
```

### Step 4: Run the Ecosystem
Start the backend server and frontend applications concurrently:
- Run backend: `npm run dev:backend`
- Run website: `npm run dev:website`
- Run PMS dashboard: `npm run dev:pms`

---

## 🏗️ Deployment Configurations

### Shared Backend API (Railway)
1. Link your GitHub repository to Railway.
2. Select the `backend/` directory as root.
3. Configure the start command as `npm run build && npm start`.
4. Inject all backend `.env` keys.

### Frontends (Vercel)
Deploy `apps/website` and `apps/pms` independently to Vercel:
1. Connect repo to Vercel dashboard.
2. Select Root Directory as `apps/website` (for public web) or `apps/pms` (for PMS dashboard).
3. Set Framework Preset as `Next.js`.
4. Set Build Command as `next build`.
5. Set `NEXT_PUBLIC_API_URL` pointing to your deployed Railway backend URL.

---

## 🔄 CI/CD Setup

We supply a GitHub actions workflow to automate validation checks on push:
Place this workflow in `.github/workflows/ci.yml` to compile and check code quality:

```yaml
name: Continuous Integration

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
      - name: Install Dependencies
        run: npm install
      - name: Build Backend
        run: npm run build:backend
      - name: Build Patient Website
        run: npm run build:website
      - name: Build PMS Dashboard
        run: npm run build:pms
```
