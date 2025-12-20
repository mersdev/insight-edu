// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/**
 * Custom command to login
 * @example cy.login('admin@example.com', 'password123')
 */
Cypress.Commands.add('login', (email: string, password: string) => {
  // Use API login to set token directly
  cy.request({
    method: 'POST',
    url: 'http://localhost:8787/api/auth/login',
    body: {
      email,
      password
    }
  }).then((response) => {
    // Visit the app first to have access to localStorage
    cy.visit('/#/');
    // Store the token in localStorage
    cy.window().then((win) => {
      win.localStorage.setItem('authToken', response.body.token);
    });
  });
});

/**
 * Custom command to logout
 * @example cy.logout()
 */
Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('authToken');
  });
  cy.visit('/#/login');
});

/**
 * Custom command to get element by data-testid
 * @example cy.getByTestId('submit-button')
 */
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

