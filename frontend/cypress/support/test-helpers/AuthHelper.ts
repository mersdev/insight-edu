/**
 * Authentication Helper - Implements SOLID principles
 * - Single Responsibility: Handles authentication-related test utilities
 * - Dependency Inversion: Depends on Cypress abstraction
 */

export class AuthHelper {
  /**
   * Login via UI
   */
  static loginViaUI(email: string, password: string): void {
    cy.visit('/#/login');
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type(password);
    cy.get('button[type="submit"]').click();
  }

  /**
   * Login via API (faster for setup)
   */
  static loginViaAPI(email: string, password: string): void {
    const apiUrl = Cypress.env('apiUrl') || 'http://localhost:8787/api/v1';
    cy.request({
      method: 'POST',
      url: `${apiUrl}/auth/login`,
      body: { email, password }
    }).then((response) => {
      cy.visit('/#/', {
        onBeforeLoad(win) {
          win.localStorage.setItem('authToken', response.body.token);
          win.localStorage.setItem('userSession', JSON.stringify(response.body.user));
        }
      });
    });
  }

  /**
   * Logout
   */
  static logout(): void {
    cy.window().then((win) => {
      win.localStorage.removeItem('authToken');
      win.localStorage.removeItem('userSession');
    });
    cy.visit('/#/login');
  }

  /**
   * Clear authentication
   */
  static clearAuth(): void {
    cy.clearLocalStorage();
  }

  /**
   * Verify user is authenticated
   */
  static verifyAuthenticated(): void {
    cy.window().its('localStorage').invoke('getItem', 'authToken').should('exist');
    cy.window().its('localStorage').invoke('getItem', 'userSession').should('exist');
  }

  /**
   * Verify user is not authenticated
   */
  static verifyNotAuthenticated(): void {
    cy.window().then((win) => {
      expect(win.localStorage.getItem('authToken')).to.be.null;
      expect(win.localStorage.getItem('userSession')).to.be.null;
    });
  }

  /**
   * Dismiss device warning dialog if present
   */
  static dismissDeviceWarning(): void {
    cy.get('body').then(($body) => {
      if ($body.text().includes('Recommendation') || $body.text().includes('建议')) {
        cy.contains('button', 'OK').click({ force: true });
        cy.wait(500);
      }
    });
  }

  /**
   * Login as HQ user
   */
  static loginAsHQ(): void {
    cy.fixture('users').then((users) => {
      this.loginViaUI(users.hqUser.email, users.hqUser.password);
      cy.hash({ timeout: 10000 }).should('eq', '#/dashboard');
    });
  }

  /**
   * Login as Teacher user
   */
  static loginAsTeacher(): void {
    cy.fixture('users').then((users) => {
      this.loginViaUI(users.teacherUser.email, users.teacherUser.password);
      cy.hash({ timeout: 10000 }).should('eq', '#/teacher/classes');
      this.dismissDeviceWarning();
    });
  }

  /**
   * Login as Parent user
   */
  static loginAsParent(): void {
    cy.fixture('users').then((users) => {
      if (users.parentUser) {
        this.loginViaUI(users.parentUser.email, users.parentUser.password);
        cy.hash({ timeout: 10000 }).should('eq', '#/reports');
        this.dismissDeviceWarning();
      }
    });
  }

  /**
   * Ensure any blocking dialogs are closed
   */
  static dismissOverlays(): void {
    this.dismissDeviceWarning();
  }
}
