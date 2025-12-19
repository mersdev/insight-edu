# Cypress E2E Testing Guide

This directory contains end-to-end tests for the Insight EDU application using Cypress.

## 📁 Directory Structure

```
cypress/
├── e2e/                    # E2E test specs
│   ├── auth/              # Authentication tests
│   │   ├── login.cy.ts
│   │   ├── logout.cy.ts
│   │   ├── protected-routes.cy.ts
│   │   └── password-change.cy.ts
│   └── user-journeys/     # User journey tests
│       ├── hq-dashboard.cy.ts
│       ├── student-management.cy.ts
│       ├── teacher-workflow.cy.ts
│       └── reports-viewing.cy.ts
├── fixtures/              # Test data
│   └── users.json
└── support/               # Support files and custom commands
    ├── commands.ts
    ├── e2e.ts
    └── component.ts
```

## 🚀 Running Tests

### Prerequisites

1. **Database**: Ensure PostgreSQL is running
   ```bash
   cd backend
   ./start-db.sh
   ```

2. **Backend**: Start the backend server
   ```bash
   cd backend
   npm run dev
   ```

3. **Frontend**: Start the frontend development server
   ```bash
   cd frontend
   npm run dev
   ```

### Run All Tests

From the project root:
```bash
./run-e2e-tests.sh
```

Or from the frontend directory:
```bash
cd frontend
npm run test:e2e
```

### Run Tests in Headed Mode

```bash
./run-e2e-tests.sh --headed
```

Or:
```bash
cd frontend
npm run test:e2e:headed
```

### Open Cypress Test Runner (Interactive)

```bash
./run-e2e-tests.sh --open
```

Or:
```bash
cd frontend
npm run cypress:open
```

### Run Specific Test File

```bash
cd frontend
npx cypress run --spec "cypress/e2e/auth/login.cy.ts"
```

### Run Tests in Different Browsers

```bash
cd frontend
npm run test:e2e:chrome    # Chrome
npm run test:e2e:firefox   # Firefox
```

## 🧪 Test Suites

### Authentication Tests (`cypress/e2e/auth/`)

- **login.cy.ts**: Tests login functionality, validation, and error handling
- **logout.cy.ts**: Tests logout flow and session cleanup
- **protected-routes.cy.ts**: Tests route protection and role-based access control
- **password-change.cy.ts**: Tests password change functionality

### User Journey Tests (`cypress/e2e/user-journeys/`)

- **hq-dashboard.cy.ts**: Tests HQ admin dashboard and navigation
- **student-management.cy.ts**: Tests student enrollment and management
- **teacher-workflow.cy.ts**: Tests teacher class management and score input
- **reports-viewing.cy.ts**: Tests report viewing for different user roles

## 🛠️ Custom Commands

Custom Cypress commands are defined in `cypress/support/commands.ts`:

### `cy.login(email, password)`
Logs in a user and maintains session.

```typescript
cy.login('admin@insightedu.com', 'Admin123');
```

### `cy.logout()`
Logs out the current user.

```typescript
cy.logout();
```

### `cy.getByTestId(testId)`
Gets an element by data-testid attribute.

```typescript
cy.getByTestId('submit-button').click();
```

## 📝 Test Data

Test user credentials are stored in `cypress/fixtures/users.json`:

- **HQ User**: `admin@insightedu.com` / `Admin123`
- **Teacher User**: `teacher@insightedu.com` / `Teacher123`
- **Parent User**: `parent@insightedu.com` / `Parent123`

## 🔧 Configuration

Cypress configuration is in `cypress.config.ts`:

- **Base URL**: `http://localhost:5173` (frontend)
- **API URL**: `http://localhost:3000/api` (backend)
- **Viewport**: 1280x720
- **Video**: Enabled
- **Screenshots**: Enabled on failure

## 🚦 CI/CD Integration

E2E tests run automatically in GitHub Actions on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

See `.github/workflows/e2e-tests.yml` for CI configuration.

## 📊 Test Results

- **Videos**: Saved to `cypress/videos/`
- **Screenshots**: Saved to `cypress/screenshots/` (on failure)
- **Reports**: Console output during test run

## 🐛 Debugging

### View Test Videos

After running tests, check `cypress/videos/` for recordings of test runs.

### View Screenshots

On test failure, screenshots are saved to `cypress/screenshots/`.

### Run in Headed Mode

To see tests running in a browser:
```bash
npm run test:e2e:headed
```

### Use Cypress Test Runner

For interactive debugging:
```bash
npm run cypress:open
```

## 📚 Best Practices

1. **Use Custom Commands**: Leverage custom commands for common actions
2. **Use Fixtures**: Store test data in fixtures for reusability
3. **Wait Appropriately**: Use `cy.wait()` sparingly; prefer implicit waits
4. **Clean State**: Clear localStorage and cookies before each test
5. **Descriptive Tests**: Write clear, descriptive test names
6. **Assertions**: Include meaningful assertions to verify behavior

## 🔗 Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Cypress API Reference](https://docs.cypress.io/api/table-of-contents)

