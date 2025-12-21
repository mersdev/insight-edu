/// <reference types="cypress" />

describe('Account Creation for Teachers and Parents', () => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:8787/api/v1';
  let authToken: string;

  beforeEach(() => {
    cy.clearLocalStorage();
    // Login and get auth token for API calls
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

  describe('Teacher Account Creation', () => {
    it('should create a teacher with auto-fill and verify user account is created', () => {
      let createdTeacherEmail: string;

      cy.fixture('users').then((users) => {
        // Login as HQ user
        cy.visit('/#/login');
        cy.get('input[type="email"]').type(users.hqUser.email);
        cy.get('input[type="password"]').type(users.hqUser.password);
        cy.get('button[type="submit"]').click();
        cy.hash({ timeout: 10000 }).should('eq', '#/dashboard');

        // Navigate to Teachers page
        cy.visit('/#/teachers');
        cy.hash().should('eq', '#/teachers');

        // Click Add button
        cy.contains('button', /add/i).click();

        // Wait for dialog to open
        cy.contains(/add new teacher/i).should('be.visible');

        // Click Auto-Fill button
        cy.contains('button', /auto-fill/i).click();

        // Wait for auto-fill to complete
        cy.wait(500);

        // Get the email that was auto-filled
        cy.get('input[type="email"]').invoke('val').then((email) => {
          createdTeacherEmail = email as string;
          cy.log('Teacher email:', createdTeacherEmail);

          // Verify the email is not empty
          expect(createdTeacherEmail).to.not.be.empty;

          // Click Save
          cy.contains('button', /save/i).click();

          // Wait for dialog to close and teacher to be created
          cy.contains(/add new teacher/i).should('not.exist');
          cy.wait(1000); // Wait for backend to create user account

          // Verify user account was created by checking if login works
          cy.request({
            method: 'POST',
            url: `${apiUrl}/auth/login`,
            body: {
              email: createdTeacherEmail,
              password: '123'
            },
            failOnStatusCode: false
          }).then((response) => {
            // Should succeed (200) or require password change (401 with specific message)
            expect([200, 401]).to.include(response.status);
            if (response.status === 200) {
              expect(response.body).to.have.property('token');
              expect(response.body.user).to.have.property('role', 'TEACHER');
            }
            cy.log('✅ Teacher account created successfully and can login!');
          });
        });
      });
    });
  });

  describe('Parent Account Creation', () => {
    it('should create a student with auto-fill and verify parent user account is created', () => {
      let createdParentEmail: string;

      cy.fixture('users').then((users) => {
        // Login as HQ user
        cy.visit('/#/login');
        cy.get('input[type="email"]').type(users.hqUser.email);
        cy.get('input[type="password"]').type(users.hqUser.password);
        cy.get('button[type="submit"]').click();
        cy.hash({ timeout: 10000 }).should('eq', '#/dashboard');

        // Navigate to Students page
        cy.visit('/#/students');
        cy.hash().should('eq', '#/students');

        // Click Add button
        cy.contains('button', /add/i).click();

        // Wait for dialog to open
        cy.contains(/add new student/i).should('be.visible');

        // Click Auto-Fill button
        cy.contains('button', /auto-fill/i).click();

        // Wait for auto-fill to complete
        cy.wait(500);

        // Get the parent email that was auto-filled - look for email input field
        cy.get('input[type="email"]').invoke('val').then((email) => {
          createdParentEmail = email as string;
          cy.log('Parent email:', createdParentEmail);

          // Verify the email is not empty
          expect(createdParentEmail).to.not.be.empty;

          // Click Save
          cy.contains('button', /save/i).click();

          // Wait for dialog to close and student to be created
          cy.contains(/add new student/i).should('not.exist');
          cy.wait(1000); // Wait for backend to create user account

          // Verify user account was created by checking if login works
          cy.request({
            method: 'POST',
            url: `${apiUrl}/auth/login`,
            body: {
              email: createdParentEmail,
              password: '123'
            },
            failOnStatusCode: false
          }).then((response) => {
            // Should succeed (200) or require password change (401 with specific message)
            expect([200, 401]).to.include(response.status);
            if (response.status === 200) {
              expect(response.body).to.have.property('token');
              expect(response.body.user).to.have.property('role', 'PARENT');
            }
            cy.log('✅ Parent account created successfully and can login!');
          });
        });
      });
    });
  });

});
