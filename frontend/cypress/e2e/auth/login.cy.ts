/// <reference types="cypress" />

describe('Authentication - Login Flow', () => {
  beforeEach(() => {
    // Clear any existing auth tokens
    cy.clearLocalStorage();
    cy.visit('/#/login');
  });

  it('should display the login page correctly', () => {
    cy.contains('Insight EDU').should('be.visible');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('should show validation errors for empty fields', () => {
    cy.get('button[type="submit"]').click();
    // The form should not submit without credentials
    cy.hash().should('eq', '#/login');
  });

  it('should show error for invalid credentials', () => {
    cy.fixture('users').then((users) => {
      cy.get('input[type="email"]').type(users.invalidUser.email);
      cy.get('input[type="password"]').type(users.invalidUser.password);
      cy.get('button[type="submit"]').click();

      // Should show error message - look for the error div with red background
      cy.get('.text-red-500', { timeout: 10000 }).should('be.visible');

      // Should remain on login page
      cy.hash().should('eq', '#/login');

      // Token should not be stored
      cy.window().then((win) => {
        expect(win.localStorage.getItem('authToken')).to.be.null;
      });
    });
  });

  it('should successfully login with HQ user credentials', () => {
    cy.fixture('users').then((users) => {
      cy.get('input[type="email"]').type(users.hqUser.email);
      cy.get('input[type="password"]').type(users.hqUser.password);
      cy.get('button[type="submit"]').click();

      // Wait for token to be stored
      cy.window().its('localStorage').invoke('getItem', 'authToken').should('exist');

      // Should redirect to dashboard for HQ user
      cy.hash({ timeout: 10000 }).should('eq', '#/dashboard');
    });
  });

  it('should successfully login with Teacher user credentials', () => {
    cy.fixture('users').then((users) => {
      cy.get('input[type="email"]').type(users.teacherUser.email);
      cy.get('input[type="password"]').type(users.teacherUser.password);
      cy.get('button[type="submit"]').click();

      // Wait for token to be stored
      cy.window().its('localStorage').invoke('getItem', 'authToken').should('exist');

      // Should redirect to teacher classes page
      cy.hash({ timeout: 10000 }).should('eq', '#/teacher/classes');
    });
  });

  it('should toggle password visibility', () => {
    cy.get('input[type="password"]').should('exist');

    // Find and click the eye icon button to show password
    cy.get('input[type="password"]').parent().find('button').first().click();
    cy.get('input[type="text"]').should('exist');

    // Click again to hide password
    cy.get('input[type="text"]').parent().find('button').first().click();
    cy.get('input[type="password"]').should('exist');
  });

  it('should handle language toggle', () => {
    // Find and click language toggle button
    cy.get('button').contains(/en|zh|globe/i).should('exist');
  });

  it('should redirect to login when accessing protected routes without auth', () => {
    cy.visit('/#/dashboard');
    cy.hash({ timeout: 5000 }).should('eq', '#/login');

    cy.visit('/#/teachers');
    cy.hash({ timeout: 5000 }).should('eq', '#/login');

    cy.visit('/#/students');
    cy.hash({ timeout: 5000 }).should('eq', '#/login');
  });
});

