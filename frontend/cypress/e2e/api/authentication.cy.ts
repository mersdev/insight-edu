/// <reference types="cypress" />

/**
 * API Integration Tests - Authentication
 * Tests all authentication-related API endpoints
 * - Single Responsibility: Tests authentication API only
 * - Verifies correct API integration and response handling
 */

describe('API Integration - Authentication', () => {
  const apiUrl = Cypress.env('apiUrl');

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  describe('POST /api/auth/login', () => {
    it('should successfully login with valid credentials', () => {
      cy.fixture('users').then((users) => {
        cy.request({
          method: 'POST',
          url: `${apiUrl}/auth/login`,
          body: {
            email: users.hqUser.email,
            password: users.hqUser.password
          }
        }).then((response) => {
          // Verify response structure
          expect(response.status).to.eq(200);
          expect(response.body).to.have.property('token');
          expect(response.body).to.have.property('user');
          
          // Verify user object
          expect(response.body.user).to.have.property('id');
          expect(response.body.user).to.have.property('name');
          expect(response.body.user).to.have.property('email', users.hqUser.email);
          expect(response.body.user).to.have.property('role', 'HQ');
          expect(response.body.user).to.have.property('mustChangePassword');
          
          // Verify token is a non-empty string
          expect(response.body.token).to.be.a('string');
          expect(response.body.token).to.not.be.empty;
        });
      });
    });

    it('should fail login with invalid credentials', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/auth/login`,
        body: {
          email: 'invalid@example.com',
          password: 'wrongpassword'
        },
        failOnStatusCode: false
      }).then((response) => {
        // Verify error response
        expect(response.status).to.be.oneOf([400, 401]);
        expect(response.body).to.have.property('message');
      });
    });

    it('should fail login with missing email', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/auth/login`,
        body: {
          password: 'password123'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 401]);
      });
    });

    it('should fail login with missing password', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/auth/login`,
        body: {
          email: 'test@example.com'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 401]);
      });
    });

    it('should return correct role for teacher user', () => {
      cy.fixture('users').then((users) => {
        cy.request({
          method: 'POST',
          url: `${apiUrl}/auth/login`,
          body: {
            email: users.teacherUser.email,
            password: users.teacherUser.password
          }
        }).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.user.role).to.eq('TEACHER');
        });
      });
    });

    it('should return correct role for parent user', () => {
      cy.fixture('users').then((users) => {
        if (users.parentUser) {
          cy.request({
            method: 'POST',
            url: `${apiUrl}/auth/login`,
            body: {
              email: users.parentUser.email,
              password: users.parentUser.password
            }
          }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.user.role).to.eq('PARENT');
          });
        }
      });
    });
  });

  describe('POST /api/auth/change-password', () => {
    let authToken: string;

    beforeEach(() => {
      // Login to get auth token
      cy.fixture('users').then((users) => {
        cy.request({
          method: 'POST',
          url: `${apiUrl}/auth/login`,
          body: {
            email: users.hqUser.email,
            password: users.hqUser.password
          }
        }).then((response) => {
          authToken = response.body.token;
        });
      });
    });

    it('should require authentication', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/auth/change-password`,
        body: {
          currentPassword: 'Admin123',
          newPassword: 'NewPassword123'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403]);
      });
    });
  });
});

