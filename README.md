# Insight EDU

A comprehensive educational management system for tracking student performance, attendance, behavior, and generating AI-powered insights.

## 🚀 Features

- **Multi-Role Authentication**: Secure login for HQ Admin, Teachers, and Parents
- **Student Management**: Track student information, attendance, and performance
- **Class & Session Management**: Organize classes, teachers, and sessions
- **Behavior Tracking**: Monitor and record student behavior across multiple categories
- **AI-Powered Insights**: Generate personalized insights using Google's Gemini AI
- **Real-time Analytics**: Dashboard with attendance trends and performance metrics
- **Secure API**: JWT-based authentication with role-based access control

## 📋 Prerequisites

- **Node.js** >= 18.x
- **Wrangler** (Cloudflare Workers CLI)
- **Google Gemini API Key** (for AI insights)

## 🛠️ Tech Stack

### Backend
- **Cloudflare Workers** (Wrangler)
- **Cloudflare D1** database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Jest** for testing

### Frontend
- **React** 19.x with TypeScript
- **Vite** for build tooling
- **React Router** for navigation
- **Recharts** for data visualization
- **Tailwind CSS** for styling
- **Lucide React** for icons

## 📦 Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd insight-edu
```

### 2. Install dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Setup

Create separate `.env` files for backend and frontend using the provided examples. Avoid keeping a root-level `.env` to prevent confusion.

**Backend (`backend/.env`, see `backend/.env.example`):**
```
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...
D1_DATABASE_ID=...
D1_DATABASE_NAME=insight-edu
RESEND_API_KEY=...
RESEND_AUDIENCE_ID=
JWT_SECRET=...
JWT_EXPIRES_IN=24h
```

Run backend locally (script auto-sources `.env`):
```bash
cd backend
npm run dev
```

**Frontend (`frontend/.env`, see `frontend/.env.example`):**
```
VITE_API_URL=http://localhost:8787/api
VITE_GEMINI_API_KEY=...
```

**Sync secrets to GitHub (from repo root):**
```bash
./add-secrets.sh
# Or specify env paths
ENV_BACKEND=backend/.env ENV_FRONTEND=frontend/.env ./add-secrets.sh
```

**⚠️ IMPORTANT:** Never commit `.env` files. Use the `.env.example` templates to document required variables.

### Deployment Secrets (GitHub → Cloudflare)
- Store `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `JWT_SECRET`, `RESEND_API_KEY`, and (optionally) `RESEND_AUDIENCE_ID` as GitHub Secrets.
- The backend deploy workflow (`.github/workflows/deploy-backend.yml`) pushes those GitHub Secrets into Cloudflare Worker secrets before deploy.

### 4. Run the Application

**Start Backend:**
```bash
cd backend
npm run dev
```

**Start Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8787/api

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Run Specific Test Suites

```bash
# Authentication tests
npm test -- auth.test.js

# API tests
npm test -- api.test.js
```

### End-to-End (E2E) Tests

The project includes comprehensive E2E tests using Cypress for testing the full stack integration.

**Prerequisites:**
1. Start the backend server
2. Start the frontend development server

**Run E2E Tests:**

```bash
# From project root (automated setup)
./dev-tools/run-e2e-tests.sh

# Or manually from frontend directory
cd frontend
npm run test:e2e
```

**Interactive Testing:**

```bash
# Open Cypress Test Runner
./dev-tools/run-e2e-tests.sh --open

# Or from frontend directory
cd frontend
npm run cypress:open
```

**Test Coverage:**
- ✅ Authentication flows (login, logout, protected routes)
- ✅ HQ dashboard and navigation
- ✅ Student management workflows
- ✅ Teacher class management and score input
- ✅ Reports viewing for different user roles
- ✅ Role-based access control

For detailed E2E testing documentation, see [frontend/cypress/README.md](frontend/cypress/README.md)

## 📚 API Overview

Base: `/api/v1`

**Authentication**
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/change-password`

**HQ Admin**
- `GET|PUT /api/v1/admin/settings`
- `GET|POST /api/v1/admin/users`
- `GET|POST /api/v1/admin/locations`
- `GET|POST /api/v1/admin/teachers`
- `GET|POST /api/v1/admin/classes`
- `GET|POST /api/v1/admin/students`
- `GET|POST /api/v1/admin/sessions`

**Teacher**
- `GET|POST /api/v1/teacher/sessions`
- `GET|POST /api/v1/teacher/attendance`
- `GET|POST /api/v1/teacher/scores`
- `GET|POST /api/v1/teacher/behaviors`
- `POST /api/v1/teacher/student-insights`

## 👥 Default Users

After seeding the database, you can login with the following test accounts:

**HQ Admin:**
- Email: `admin@edu.com`
- Password: `Admin123`

**Teacher:**
- Email: `dehoulworker+sarahjenkins@gmail.com`
- Password: `123`

**Parent:**
- Email: `dehoulworker+ali@gmail.com`
- Password: `123`

**⚠️ SECURITY NOTE:** These are test credentials for development only. In production:
- Change all default passwords immediately
- Use strong, unique passwords for each user
- Implement password policies and expiration
- Enable multi-factor authentication (MFA)

## 🏗️ Project Structure

```
insight-edu/
├── backend/
│   ├── src/
│   │   ├── handlers/        # Route handlers
│   │   ├── utils/           # Shared utilities
│   │   ├── routes.js        # Route table
│   │   ├── router.js        # Request router
│   │   └── worker.js        # Worker entry point
│   ├── __tests__/           # Test files
│   ├── migrations/          # Database migrations
│   ├── init.sql             # Database schema
│   ├── seed.sql             # Seed data
│   ├── scripts/             # Local helper scripts
│   │   └── d1-reset.sql     # Local D1 reset helper
│   ├── wrangler.toml        # Worker config
│   └── package.json
├── frontend/
│   ├── components/          # Reusable React components
│   ├── views/               # Page components
│   │   ├── hq/             # HQ Admin views
│   │   ├── teacher/        # Teacher portal views
│   │   └── parent/         # Parent portal views
│   ├── services/           # API service layer
│   │   ├── backendApi.ts   # Backend API client
│   │   └── geminiService.ts # AI service
│   ├── App.tsx             # Main app component
│   └── package.json
└── README.md

## 🔒 Security Features

- **Password Hashing**: All passwords are hashed using bcrypt with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Different permissions for Admin, Teacher, and Parent roles
- **Environment Variables**: Sensitive data stored in .env files (not committed to git)
- **SQL Injection Protection**: Parameterized queries in D1
- **CORS Configuration**: Controlled cross-origin resource sharing

## 🚀 Deployment

### Backend (Cloudflare Workers)

```bash
cd backend
npx wrangler deploy --env production
```

### Frontend (Cloudflare Pages)

```bash
cd frontend
npx wrangler pages deploy dist --project-name=insight-edu-frontend --branch=main
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🐛 Troubleshooting

### Port Already in Use

If port 8787 or 5173 is already in use:

```bash
# Wrangler picks a new port, or set one explicitly:
wrangler dev --port 8788
```

### Test Failures

```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Run tests with verbose output
npm test -- --verbose
```

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ for educational excellence
