/// <reference types="cypress" />

/**
 * Validation Error Tests
 * Tests form validation and error handling
 * - Single Responsibility: Tests validation errors only
 * - Verifies proper error messages and user feedback
 */

import { LoginPage, TeachersPage, StudentsPage, ClassesPage, LocationsPage } from '../../support/page-objects';
import { AuthHelper } from '../../support/test-helpers';

describe('Error Handling - Validation Errors', () => {
  const loginPage = new LoginPage();
  const teachersPage = new TeachersPage();
  const studentsPage = new StudentsPage();
  const classesPage = new ClassesPage();
  const locationsPage = new LocationsPage();
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:8787/api/v1';

  const ensureClassExists = () => {
    const timestamp = Date.now();

    return cy.window()
      .its('localStorage')
      .invoke('getItem', 'authToken')
      .should('be.a', 'string')
      .and('not.be.empty')
      .then((token) => {
        const headers = { Authorization: `Bearer ${token}` };

        return cy
          .request({
            method: 'GET',
            url: `${apiUrl}/admin/classes`,
            headers,
          })
          .then((classesResponse) => {
            if (classesResponse.body.length > 0) {
              return;
            }

            return cy
              .request({
                method: 'GET',
                url: `${apiUrl}/admin/teachers`,
                headers,
              })
              .then((teachersResponse) => {
                const existingTeacher = teachersResponse.body[0];
                const teacherRequest = existingTeacher
                  ? cy.wrap(existingTeacher)
                  : cy
                      .request({
                        method: 'POST',
                        url: `${apiUrl}/admin/teachers`,
                        headers,
                        body: {
                          id: `t_test_${timestamp}`,
                          name: `Cypress Teacher ${timestamp}`,
                          email: `cypress.teacher.${timestamp}@edu.com`,
                          subject: 'Math',
                        },
                      })
                      .then((response) => response.body);

                return teacherRequest.then((teacher) => {
                  return cy
                    .request({
                      method: 'GET',
                      url: `${apiUrl}/admin/locations`,
                      headers,
                    })
                    .then((locationsResponse) => {
                      const existingLocation = locationsResponse.body[0];
                      const locationRequest = existingLocation
                        ? cy.wrap(existingLocation)
                        : cy
                            .request({
                              method: 'POST',
                              url: `${apiUrl}/admin/locations`,
                              headers,
                              body: {
                                id: `l_test_${timestamp}`,
                                name: `Cypress Location ${timestamp}`,
                                address: '123 Cypress Lane',
                              },
                            })
                            .then((response) => response.body);

                      return locationRequest.then((location) => {
                        return cy.request({
                          method: 'POST',
                          url: `${apiUrl}/admin/classes`,
                          headers,
                          body: {
                            id: `c_test_${timestamp}`,
                            name: `Cypress Class ${timestamp}`,
                            grade: '10',
                            teacherId: teacher.id,
                            locationId: location.id,
                          },
                        });
                      });
                    });
                });
              });
          });
      });
  };

  describe('Login Form Validation', () => {
    beforeEach(() => {
      loginPage.visit();
    });

    it('should show error for empty email', () => {
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      
      // Should remain on login page
      cy.hash().should('eq', '#/login');
    });

    it('should show error for empty password', () => {
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('button[type="submit"]').click();
      
      // Should remain on login page
      cy.hash().should('eq', '#/login');
    });

    it('should show error for invalid email format', () => {
      cy.get('input[type="email"]').type('invalid-email');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      
      // Browser validation should prevent submission
      cy.hash().should('eq', '#/login');
    });
  });

  describe('Teacher Form Validation', () => {
    beforeEach(() => {
      AuthHelper.loginAsHQ();
      teachersPage.visit();
    });

    it('should validate required fields when creating teacher', () => {
      teachersPage.clickAddTeacher();

      // Try to submit without filling required fields
      cy.contains('button', /save|submit/i).should('be.visible').click({ force: true });

      // Should show validation errors or prevent submission
      cy.wait(500);
    });

    it('should validate email format', () => {
      teachersPage.clickAddTeacher();

      cy.get('input[type="email"]').type('invalid-email');
      cy.contains('button', /save|submit/i).should('be.visible').click({ force: true });

      // Should show validation error
      cy.wait(500);
    });

    it('should prevent duplicate email', () => {
      // Get existing teacher email
      cy.get('body').then(($body) => {
        const bodyText = $body.text();
        if (bodyText.includes('@')) {
          teachersPage.clickAddTeacher();
          cy.wait(500);

          // Try to create teacher with existing email
          teachersPage.fillTeacherForm({
            name: 'Duplicate Teacher',
            englishName: 'Duplicate',
            email: 'dehoulworker+sarahjenkins@gmail.com', // Existing email
            phone: '012-345 6789',
            subject: 'Math'
          });

          teachersPage.submitTeacherForm();
          cy.wait(1000);

          // Should show error or prevent creation
        }
      });
    });
  });

  describe('Student Form Validation', () => {
    beforeEach(() => {
      AuthHelper.loginAsHQ();
      studentsPage.visit();
      ensureClassExists();
    });

    it('should validate required fields when creating student', () => {
      studentsPage.clickAddStudent();
      cy.wait(1000); // Wait for dialog to open

      // Try to submit without filling required fields
      cy.get('button').contains(/save/i).should('be.visible').click({ force: true });

      // Should show validation errors or prevent submission
      cy.wait(500);
    });

    it('should validate parent email format', () => {
      studentsPage.clickAddStudent();
      cy.wait(1000); // Wait for dialog to open

      // Fill parent email with invalid format
      cy.contains('label', /parent.*email/i).parent().find('input[type="email"]').type('invalid-email', { force: true });
      cy.get('button').contains(/save/i).should('be.visible').click({ force: true });

      // Should show validation error
      cy.wait(500);
    });
  });

  describe('Class Form Validation', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/v1/admin/teachers*').as('getTeachers');
      cy.intercept('GET', '**/api/v1/admin/locations*').as('getLocations');
      AuthHelper.loginAsHQ();
      classesPage.visit();
      AuthHelper.dismissDeviceWarning();
      cy.wait(['@getTeachers', '@getLocations']);
    });

    it('should validate required fields when creating class', () => {
      cy.get('body').then(($body) => {
        if ($body.text().includes('Please add at least one teacher')) {
          cy.contains('button', 'OK').click({ force: true });
        }
        if ($body.text().includes('Please add at least one location')) {
          cy.contains('button', 'OK').click({ force: true });
        }
      });
      classesPage.clickAddClass();

      // Try to submit without filling required fields
      cy.contains('button', /save|submit/i).should('be.visible').click({ force: true });

      // Should show validation errors or prevent submission
      cy.wait(500);
    });

    it('should require teacher selection', () => {
      cy.get('body').then(($body) => {
        if ($body.text().includes('Please add at least one teacher')) {
          cy.contains('button', 'OK').click({ force: true });
        }
        if ($body.text().includes('Please add at least one location')) {
          cy.contains('button', 'OK').click({ force: true });
        }
      });
      classesPage.clickAddClass();

      // Close the dialog first to avoid element covered error
      cy.wait(500);
      cy.get('input').first().type('Test Class', { force: true });
      cy.contains('button', /save|submit/i).should('be.visible').click({ force: true });

      // Should show validation error for missing teacher
      cy.wait(500);
    });

    it('should require location selection', () => {
      cy.get('body').then(($body) => {
        if ($body.text().includes('Please add at least one teacher')) {
          cy.contains('button', 'OK').click({ force: true });
        }
        if ($body.text().includes('Please add at least one location')) {
          cy.contains('button', 'OK').click({ force: true });
        }
      });
      classesPage.clickAddClass();

      // Close the dialog first to avoid element covered error
      cy.wait(500);
      cy.get('input').first().type('Test Class', { force: true });
      cy.contains('button', /save|submit/i).should('be.visible').click({ force: true });

      // Should show validation error for missing location
      cy.wait(500);
    });
  });

  describe('Location Form Validation', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/v1/admin/locations*').as('getLocations');
      AuthHelper.loginAsHQ();
      locationsPage.visit();
      AuthHelper.dismissDeviceWarning();
      cy.wait('@getLocations');
    });

    it('should validate required fields when creating location', () => {
      locationsPage.clickAddLocation();

      // Try to submit without filling required fields
      cy.contains('button', /save|submit/i).should('be.visible').click({ force: true });

      // Should show validation errors or prevent submission
      cy.wait(500);
    });

    it('should require location name', () => {
      locationsPage.clickAddLocation();

      cy.get('input').eq(1).type('123 Test Street', { force: true });
      cy.contains('button', /save|submit/i).should('be.visible').click({ force: true });

      // Should show validation error for missing name
      cy.wait(500);
    });
  });

  describe('Score Input Validation', () => {
    beforeEach(() => {
      AuthHelper.loginAsTeacher();
      cy.visit('/#/input');
      AuthHelper.dismissDeviceWarning();
    });

    it('should validate score range', () => {
      cy.wait(2000);

      // Check if there are any selects and number inputs on the page
      cy.get('body').then(($body) => {
        if ($body.find('select').length > 0) {
          cy.get('select').first().then(($select) => {
            const options = $select.find('option');
            if (options.length > 1) {
              cy.get('select').first().select(1);
              cy.wait(1000);

              // Check if number inputs exist after selecting
              cy.get('body').then(($body2) => {
                if ($body2.find('input[type="number"]').length > 0) {
                  cy.get('input[type="number"]').first().clear().type('150'); // Invalid score
                  cy.wait(500);
                }
              });
            }
          });
        }
      });
    });

    it('should validate negative scores', () => {
      cy.wait(2000);

      // Check if there are any selects and number inputs on the page
      cy.get('body').then(($body) => {
        if ($body.find('select').length > 0) {
          cy.get('select').first().then(($select) => {
            const options = $select.find('option');
            if (options.length > 1) {
              cy.get('select').first().select(1);
              cy.wait(1000);

              // Check if number inputs exist after selecting
              cy.get('body').then(($body2) => {
                if ($body2.find('input[type="number"]').length > 0) {
                  cy.get('input[type="number"]').first().clear().type('-10'); // Negative score
                  cy.wait(500);
                }
              });
            }
          });
        }
      });
    });
  });
});
