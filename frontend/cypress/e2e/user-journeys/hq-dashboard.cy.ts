/// <reference types="cypress" />

describe('User Journey - HQ Dashboard', () => {
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

  it('should display dashboard with key metrics', () => {
    // Already on dashboard from beforeEach
    // Check for dashboard elements (adjust selectors based on actual implementation)
    cy.contains(/dashboard|insight/i).should('be.visible');
  });

  it('should navigate to teachers management', () => {
    // Navigate to teachers page via sidebar
    cy.get('aside').contains(/teachers/i).click();
    cy.hash().should('eq', '#/teachers');

    // Verify teachers page loads
    cy.contains(/teachers/i).should('be.visible');
  });

  it('should navigate to students management', () => {
    // Navigate to students page via sidebar
    cy.get('aside').contains(/students/i).click();
    cy.hash().should('eq', '#/students');

    // Verify students page loads
    cy.contains(/students/i).should('be.visible');
  });

  it('should navigate to classes management', () => {
    // Navigate to classes page via sidebar (the label is "Class" not "Classes")
    cy.get('aside').contains(/^class$/i).click();
    cy.hash().should('eq', '#/classes');

    // Verify classes page loads
    cy.contains(/class/i).should('be.visible');
  });

  it('should navigate to locations management', () => {
    // Navigate to locations page via sidebar
    cy.get('aside').contains(/locations/i).click();
    cy.hash().should('eq', '#/locations');

    // Verify locations page loads
    cy.contains(/locations/i).should('be.visible');
  });

  it('should display navigation sidebar', () => {
    // Check for sidebar navigation items
    cy.contains('Insight EDU').should('be.visible');
  });

  it('should allow sidebar collapse/expand', () => {
    // Find and click the collapse button
    cy.get('button').contains(/collapse sidebar/i).click();

    // Verify sidebar is collapsed (button text changes)
    cy.get('button[title*="Expand"]').should('exist');
  });
});

