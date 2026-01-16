/// <reference types="cypress" />

export class AuthHelper {
  static clearAuth(): void {
    cy.window().then((win) => {
      win.localStorage.removeItem('authToken');
      win.localStorage.removeItem('userSession');
    });
  }

  static loginAsHQ(): void {
    const apiUrl = Cypress.env('apiUrl') || 'http://localhost:8787/api/v1';
    cy.fixture('users').then((users) => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/auth/login`,
        body: {
          email: users.hqUser.email,
          password: users.hqUser.password
        }
      }).then((response) => {
        cy.visit('/#/dashboard', {
          onBeforeLoad(win) {
            win.localStorage.setItem('authToken', response.body.token);
            win.localStorage.setItem('userSession', JSON.stringify(response.body.user));
          }
        });
      });
    });
  }

  static loginAsTeacher(): void {
    const apiUrl = Cypress.env('apiUrl') || 'http://localhost:8787/api/v1';
    cy.fixture('users').then((users) => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/auth/login`,
        body: {
          email: users.teacherUser.email,
          password: users.teacherUser.password
        }
      }).then((response) => {
        cy.visit('/#/input', {
          onBeforeLoad(win) {
            win.localStorage.setItem('authToken', response.body.token);
            win.localStorage.setItem('userSession', JSON.stringify(response.body.user));
          }
        });
      });
    });
  }

  static loginAsParent(): void {
    const apiUrl = Cypress.env('apiUrl') || 'http://localhost:8787/api/v1';
    cy.fixture('users').then((users) => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/auth/login`,
        body: {
          email: users.parentUser.email,
          password: users.parentUser.password
        }
      }).then((response) => {
        cy.visit('/#/parent', {
          onBeforeLoad(win) {
            win.localStorage.setItem('authToken', response.body.token);
            win.localStorage.setItem('userSession', JSON.stringify(response.body.user));
          }
        });
      });
    });
  }

  static dismissDeviceWarning(): void {
    cy.get('body').then(($body) => {
      if ($body.text().includes('desktop device') || $body.text().includes('mobile view')) {
        cy.contains('button', /ok|i understand|close|dismiss/i).click({ force: true });
      }
    });
  }

  static verifyAuthenticated(): void {
    cy.window().should((win) => {
      const token = win.localStorage.getItem('authToken');
      expect(token).to.not.be.null;
      expect(token).to.be.a('string');
      expect(token).to.not.be.empty;
    });
  }

  static verifyNotAuthenticated(): void {
    cy.window().should((win) => {
      const token = win.localStorage.getItem('authToken');
      expect(token).to.be.null;
    });
  }
}
