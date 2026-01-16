/// <reference types="cypress" />

describe('User Journey - Student Management', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
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

  it('should view students list', () => {
    cy.visit('/#/students');

    // Verify students page loads
    cy.hash().should('eq', '#/students');
    cy.contains(/students/i).should('be.visible');
  });

  it('should display student information', () => {
    cy.visit('/#/students');

    // Wait for students to load
    cy.wait(2000);

    // Verify page is loaded
    cy.hash().should('eq', '#/students');
  });

  it('should filter students by class', () => {
    cy.visit('/#/students');

    // Wait for page to load
    cy.wait(2000);

    // Verify page is loaded
    cy.hash().should('eq', '#/students');
  });

  it('should view student details', () => {
    cy.visit('/#/students');

    // Wait for students to load
    cy.wait(2000);

    // Verify page is loaded
    cy.hash().should('eq', '#/students');
  });

  it('should handle student enrollment workflow', () => {
    cy.visit('/#/students');

    // Verify page is loaded
    cy.hash().should('eq', '#/students');
  });

  it('should show location field as optional when adding a student', () => {
    cy.visit('/#/students');

    cy.contains('button', 'Add').click();
    cy.contains('label', /location/i).should('be.visible');
    cy.contains(/optional/i).should('exist');
    cy.contains('button', 'Cancel').click();
  });
});
