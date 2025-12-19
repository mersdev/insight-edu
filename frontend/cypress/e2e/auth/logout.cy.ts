/// <reference types="cypress" />

describe('Authentication - Logout Flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('should successfully logout HQ user', () => {
    cy.fixture('users').then((users) => {
      // Login through UI
      cy.visit('/#/login');
      cy.get('input[type="email"]').type(users.hqUser.email);
      cy.get('input[type="password"]').type(users.hqUser.password);
      cy.get('button[type="submit"]').click();

      // Wait for token to be stored
      cy.window().its('localStorage').invoke('getItem', 'authToken').should('exist');

      // Wait for redirect to dashboard
      cy.hash({ timeout: 10000 }).should('eq', '#/dashboard');

      // Verify token exists
      cy.window().then((win) => {
        expect(win.localStorage.getItem('authToken')).to.exist;
      });

      // Click logout button - use title attribute or force click if hidden
      cy.get('button').contains(/log out/i).click({ force: true });

      // Should redirect to login page
      cy.hash({ timeout: 10000 }).should('eq', '#/login');

      // Token should be removed
      cy.window().then((win) => {
        expect(win.localStorage.getItem('authToken')).to.be.null;
      });
    });
  });

  it('should successfully logout Teacher user', () => {
    cy.fixture('users').then((users) => {
      // Login through UI
      cy.visit('/#/login');
      cy.get('input[type="email"]').type(users.teacherUser.email);
      cy.get('input[type="password"]').type(users.teacherUser.password);
      cy.get('button[type="submit"]').click();

      // Wait for redirect to teacher classes
      cy.hash({ timeout: 10000 }).should('eq', '#/teacher/classes');

      // Verify token exists
      cy.window().then((win) => {
        expect(win.localStorage.getItem('authToken')).to.exist;
      });

      // Click logout button - use title attribute or force click if hidden
      cy.get('button').contains(/log out/i).click({ force: true });

      // Should redirect to login page
      cy.hash({ timeout: 10000 }).should('eq', '#/login');

      // Token should be removed
      cy.window().then((win) => {
        expect(win.localStorage.getItem('authToken')).to.be.null;
      });
    });
  });

  it('should prevent access to protected routes after logout', () => {
    cy.fixture('users').then((users) => {
      // Login through UI
      cy.visit('/#/login');
      cy.get('input[type="email"]').type(users.hqUser.email);
      cy.get('input[type="password"]').type(users.hqUser.password);
      cy.get('button[type="submit"]').click();

      // Wait for redirect to dashboard
      cy.hash({ timeout: 10000 }).should('eq', '#/dashboard');

      // Logout
      cy.get('button').contains(/log out/i).click({ force: true });
      cy.hash({ timeout: 10000 }).should('eq', '#/login');

      // Clear localStorage to ensure clean state
      cy.clearLocalStorage();

      // Try to access protected routes - should redirect to login
      cy.visit('/#/dashboard');
      cy.hash({ timeout: 5000 }).should('eq', '#/login');

      cy.visit('/#/teachers');
      cy.hash({ timeout: 5000 }).should('eq', '#/login');

      cy.visit('/#/students');
      cy.hash({ timeout: 5000 }).should('eq', '#/login');
    });
  });

  it('should clear all session data on logout', () => {
    cy.fixture('users').then((users) => {
      // Login through UI
      cy.visit('/#/login');
      cy.get('input[type="email"]').type(users.hqUser.email);
      cy.get('input[type="password"]').type(users.hqUser.password);
      cy.get('button[type="submit"]').click();

      // Wait for redirect to dashboard
      cy.hash({ timeout: 10000 }).should('eq', '#/dashboard');

      // Verify token exists
      cy.window().then((win) => {
        expect(win.localStorage.getItem('authToken')).to.exist;
      });

      // Logout
      cy.get('button').contains(/log out/i).click({ force: true });

      // Wait for redirect to login
      cy.hash({ timeout: 10000 }).should('eq', '#/login');

      // Verify all auth-related data is cleared
      cy.window().then((win) => {
        expect(win.localStorage.getItem('authToken')).to.be.null;
      });
    });
  });
});

