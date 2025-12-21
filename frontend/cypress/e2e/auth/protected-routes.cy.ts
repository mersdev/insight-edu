/// <reference types="cypress" />

describe('Authentication - Protected Routes', () => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:8787/api/v1';
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  describe('HQ User Access Control', () => {
    beforeEach(() => {
      cy.fixture('users').then((users) => {
        // Perform UI login
        cy.visit('/#/login');
        cy.get('input[type="email"]').type(users.hqUser.email);
        cy.get('input[type="password"]').type(users.hqUser.password);
        cy.get('button[type="submit"]').click();
        // Wait for redirect to dashboard
        cy.hash({ timeout: 10000 }).should('eq', '#/dashboard');
      });
    });

    it('should allow HQ user to access dashboard', () => {
      cy.visit('/#/dashboard');
      cy.hash().should('eq', '#/dashboard');
      cy.contains(/dashboard|insight/i).should('be.visible');
    });

    it('should allow HQ user to access teachers page', () => {
      cy.visit('/#/teachers');
      cy.hash().should('eq', '#/teachers');
    });

    it('should allow HQ user to access students page', () => {
      cy.visit('/#/students');
      cy.hash().should('eq', '#/students');
    });

    it('should allow HQ user to access classes page', () => {
      cy.visit('/#/classes');
      cy.hash().should('eq', '#/classes');
    });

    it('should allow HQ user to access locations page', () => {
      cy.visit('/#/locations');
      cy.hash().should('eq', '#/locations');
    });

    it('should redirect HQ user from teacher-specific routes', () => {
      cy.visit('/#/teacher/classes');
      // Should redirect to home or dashboard
      cy.hash().should('not.eq', '#/teacher/classes');
    });
  });

  describe('Teacher User Access Control', () => {
    beforeEach(() => {
      cy.fixture('users').then((users) => {
        // Perform UI login
        cy.visit('/#/login');
        cy.get('input[type="email"]').type(users.teacherUser.email);
        cy.get('input[type="password"]').type(users.teacherUser.password);
        cy.get('button[type="submit"]').click();
        // Wait for redirect to teacher classes page
        cy.hash({ timeout: 10000 }).should('eq', '#/teacher/classes');
      });
    });

    it('should allow Teacher user to access teacher classes page', () => {
      cy.visit('/#/teacher/classes');
      cy.hash().should('eq', '#/teacher/classes');
    });

    it('should allow Teacher user to access input page', () => {
      cy.visit('/#/input');
      cy.hash().should('eq', '#/input');
    });

    it('should allow Teacher user to access reports page', () => {
      cy.visit('/#/reports');
      cy.hash().should('eq', '#/reports');
    });

    it('should redirect Teacher user from HQ-specific routes', () => {
      cy.visit('/#/dashboard');
      // Should redirect away from dashboard
      cy.hash().should('not.eq', '#/dashboard');
    });

    it('should redirect Teacher user from teachers management page', () => {
      cy.visit('/#/teachers');
      cy.hash().should('not.eq', '#/teachers');
    });

    it('should redirect Teacher user from students management page', () => {
      cy.visit('/#/students');
      cy.hash().should('not.eq', '#/students');
    });
  });

  describe('Token Persistence', () => {
    it('should maintain authentication across page refreshes', () => {
      cy.fixture('users').then((users) => {
        // Perform UI login
        cy.visit('/#/login');
        cy.get('input[type="email"]').type(users.hqUser.email);
        cy.get('input[type="password"]').type(users.hqUser.password);
        cy.get('button[type="submit"]').click();

        // Wait for redirect to dashboard
        cy.hash({ timeout: 10000 }).should('eq', '#/dashboard');

        // Verify token exists before refresh
        cy.window().then((win) => {
          expect(win.localStorage.getItem('authToken')).to.exist;
        });

        // Refresh the page
        cy.reload();

        // Token should still exist in localStorage after refresh
        cy.window().then((win) => {
          expect(win.localStorage.getItem('authToken')).to.exist;
        });

        // The app should restore the session and redirect to dashboard
        cy.hash({ timeout: 10000 }).should('eq', '#/dashboard');
      });
    });

    it('should maintain authentication across navigation', () => {
      cy.fixture('users').then((users) => {
        // Perform UI login
        cy.visit('/#/login');
        cy.get('input[type="email"]').type(users.hqUser.email);
        cy.get('input[type="password"]').type(users.hqUser.password);
        cy.get('button[type="submit"]').click();

        // Wait for redirect to dashboard
        cy.hash({ timeout: 10000 }).should('eq', '#/dashboard');

        cy.visit('/#/teachers');
        cy.hash().should('eq', '#/teachers');

        cy.visit('/#/students');
        cy.hash().should('eq', '#/students');

        // Token should still exist after navigation
        cy.window().then((win) => {
          expect(win.localStorage.getItem('authToken')).to.exist;
        });
      });
    });
  });

  describe('Unauthorized Access', () => {
    it('should redirect to login when accessing protected routes without token', () => {
      const protectedRoutes = [
        '/#/dashboard',
        '/#/teachers',
        '/#/students',
        '/#/classes',
        '/#/locations',
        '/#/teacher/classes',
        '/#/input',
        '/#/reports'
      ];

      protectedRoutes.forEach((route) => {
        cy.visit(route);
        cy.hash({ timeout: 5000 }).should('eq', '#/login');
      });
    });

    it('should not allow API calls without authentication', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/admin/users`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403]);
      });
    });
  });
});
