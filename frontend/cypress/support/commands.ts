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
Cypress.Commands.add('login', (email: string, password: string, options?: { redirectPath?: string }) => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:8787/api/v1';
  // Use API login to set token directly
  cy.request({
    method: 'POST',
    url: `${apiUrl}/auth/login`,
    body: {
      email,
      password
    }
  }).then((response) => {
    const redirectPath = options?.redirectPath || '/#/';
    // Ensure storage is set before app scripts load so session restore works.
    cy.visit(redirectPath, {
      onBeforeLoad(win) {
        win.localStorage.setItem('authToken', response.body.token);
        win.localStorage.setItem('userSession', JSON.stringify(response.body.user));
      }
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
    win.localStorage.removeItem('userSession');
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
