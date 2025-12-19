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
- **Podman** (or Docker) for PostgreSQL database
- **PostgreSQL** 15+
- **Google Gemini API Key** (for AI insights)

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **JWT** for authentication
- **bcrypt** for password hashing
- **Jest** & **Supertest** for testing

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

Create a `.env` file in the `backend` directory (use `.env.example` as a template):

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=insight_edu
DB_USER=postgres
DB_PASSWORD=<your-secure-password>

# JWT Configuration (Generate a strong secret key)
JWT_SECRET=<your-super-secret-jwt-key-change-in-production>
JWT_EXPIRES_IN=24h
```

Create a `.env` file in the `frontend` directory (use `.env.example` as a template):

```env
VITE_API_URL=http://localhost:3000
VITE_GEMINI_API_KEY=<your-gemini-api-key>
```

**⚠️ IMPORTANT:** Never commit `.env` files to version control. Use `.env.example` files to document required variables.

### 4. Database Setup

Start PostgreSQL using Podman:

```bash
cd backend
chmod +x start-db.sh
./start-db.sh
```

This script will:
- Start a PostgreSQL container
- Initialize the database schema
- Seed initial data

### 5. Run the Application

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
- Backend API: http://localhost:3000

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
1. Ensure PostgreSQL database is running
2. Start the backend server
3. Start the frontend development server

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

## 📚 API Documentation

The project includes comprehensive API documentation using Swagger/OpenAPI.

### Access API Documentation

Once the backend server is running, you can access the interactive API documentation at:

**Swagger UI:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

**OpenAPI JSON:** [http://localhost:3000/api-docs.json](http://localhost:3000/api-docs.json)

The Swagger UI provides:
- ✅ Complete API endpoint documentation
- ✅ Request/response schemas with examples
- ✅ Authentication requirements for each endpoint
- ✅ Interactive API testing (Try it out feature)
- ✅ Error response documentation

### API Endpoint Categories

**Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/change-password` - Change user password (requires authentication)

**Users**
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create a new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

**Settings**
- `GET /api/settings` - Get system settings
- `PUT /api/settings` - Update system settings

**Students, Teachers, Classes, Sessions, Attendance, Scores, Behaviors, and more...**

For complete endpoint documentation with request/response schemas, visit the Swagger UI at `/api-docs`.

## 👥 Default Users

After seeding the database, you can login with the following test accounts:

**HQ Admin:**
- Email: `admin@edu.com`
- Password: Check the seed.sql file for the hashed password

**Teacher:**
- Email: `sarah@edu.com`
- Password: Check the seed.sql file for the hashed password

**Parent:**
- Email: `parent.ali@edu.com`
- Password: Check the seed.sql file for the hashed password

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
│   │   ├── config/          # Configuration files
│   │   │   └── database.js  # Database connection
│   │   ├── middleware/      # Express middleware
│   │   │   └── auth.js      # Authentication & authorization
│   │   ├── routes/          # API route handlers
│   │   │   ├── auth.js
│   │   │   ├── students.js
│   │   │   ├── teachers.js
│   │   │   ├── classes.js
│   │   │   ├── sessions.js
│   │   │   ├── attendance.js
│   │   │   ├── behaviors.js
│   │   │   └── ...
│   │   └── server.js        # Express app entry point
│   ├── __tests__/           # Test files
│   ├── migrations/          # Database migrations
│   ├── init.sql             # Database schema
│   ├── seed.sql             # Seed data
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
- **SQL Injection Protection**: Parameterized queries using pg library
- **CORS Configuration**: Controlled cross-origin resource sharing

## 🚀 Deployment

### Production Checklist

1. **Update Environment Variables**:
   - Generate a strong JWT_SECRET
   - Use production database credentials
   - Set NODE_ENV=production

2. **Database**:
   - Run migrations on production database
   - Set up regular backups
   - Configure connection pooling

3. **Security**:
   - Enable HTTPS
   - Configure CORS for production domain
   - Set up rate limiting
   - Enable security headers (helmet)

4. **Monitoring**:
   - Set up logging
   - Configure error tracking
   - Monitor database performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🐛 Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

```bash
# Check if PostgreSQL container is running
podman ps

# Restart the database
cd backend
./start-db.sh
```

### Port Already in Use

If port 3000 or 5173 is already in use:

```bash
# Change PORT in backend/.env
PORT=3001

# Vite will automatically use next available port
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

