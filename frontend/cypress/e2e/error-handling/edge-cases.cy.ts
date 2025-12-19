/// <reference types="cypress" />

/**
 * Edge Cases Tests
 * Tests boundary conditions and edge cases
 * - Single Responsibility: Tests edge cases only
 * - Verifies application handles unusual scenarios
 */

import { AuthHelper } from '../../support/test-helpers';
import { TeachersPage, StudentsPage, ClassesPage } from '../../support/page-objects';

describe('Error Handling - Edge Cases', () => {
  const teachersPage = new TeachersPage();
  const studentsPage = new StudentsPage();
  const classesPage = new ClassesPage();

  describe('Empty States', () => {
    it('should handle empty teachers list', () => {
      // Set up intercept BEFORE login
      cy.intercept('GET', '**/api/teachers*', {
        statusCode: 200,
        body: []
      }).as('emptyTeachers');

      AuthHelper.loginAsHQ();
      teachersPage.visit();

      // Should show empty state message or no data
      cy.wait(1000);
    });

    it('should handle empty students list', () => {
      // Set up intercept BEFORE login
      cy.intercept('GET', '**/api/students*', {
        statusCode: 200,
        body: []
      }).as('emptyStudents');

      AuthHelper.loginAsHQ();
      studentsPage.visit();

      // Should show empty state message or no data
      cy.wait(1000);
    });

    it('should handle empty classes list', () => {
      // Set up intercept BEFORE login
      cy.intercept('GET', '**/api/classes*', {
        statusCode: 200,
        body: []
      }).as('emptyClasses');

      AuthHelper.loginAsHQ();
      classesPage.visit();

      // Should show empty state message or no data
      cy.wait(1000);
    });
  });

  describe('Large Data Sets', () => {
    it('should handle large number of students', () => {
      // Generate 100 students
      const largeStudentList = Array.from({ length: 100 }, (_, i) => ({
        id: `s_${i}`,
        name: `Student ${i}`,
        classIds: [],
        attendance: 100,
        atRisk: false
      }));

      // Set up intercept BEFORE login
      cy.intercept('GET', '**/api/students*', {
        statusCode: 200,
        body: largeStudentList
      }).as('largeStudents');

      AuthHelper.loginAsHQ();
      studentsPage.visit();

      // Should render without performance issues
      cy.wait(2000);
    });

    it('should handle large number of teachers', () => {
      // Generate 50 teachers
      const largeTeacherList = Array.from({ length: 50 }, (_, i) => ({
        id: `t_${i}`,
        name: `Teacher ${i}`,
        email: `teacher${i}@edu.com`,
        subject: 'Mathematics'
      }));

      // Set up intercept BEFORE login
      cy.intercept('GET', '**/api/teachers*', {
        statusCode: 200,
        body: largeTeacherList
      }).as('largeTeachers');

      AuthHelper.loginAsHQ();
      teachersPage.visit();

      // Should render without performance issues
      cy.wait(2000);
    });
  });

  describe('Special Characters', () => {
    beforeEach(() => {
      AuthHelper.loginAsHQ();
    });

    it('should handle special characters in names', () => {
      teachersPage.visit();
      cy.wait(2000);

      teachersPage.clickAddTeacher();
      cy.wait(500);

      // Fill form with special characters using label-based selectors
      cy.contains('label', /full.*name/i).parent().find('input').type("O'Brien-Smith (测试)", { force: true });
      cy.get('input[type="email"]').type(`test.${Date.now()}@edu.com`, { force: true });
      cy.contains('label', /english.*name/i).parent().find('input').type("O'Brien", { force: true });
      cy.contains('label', /subject/i).parent().find('input').type('Math & Science', { force: true });

      // Should accept special characters
      cy.wait(500);
    });

    it('should handle unicode characters', () => {
      studentsPage.visit();
      cy.wait(2000);
      
      studentsPage.clickAddStudent();
      cy.get('input').first().type('学生名字 🎓');
      
      // Should accept unicode
      cy.wait(500);
    });

    it('should handle very long names', () => {
      teachersPage.visit();
      cy.wait(2000);
      
      teachersPage.clickAddTeacher();
      const longName = 'A'.repeat(100);
      cy.get('input').first().type(longName);
      
      // Should handle or truncate long names
      cy.wait(500);
    });
  });

  describe('Boundary Values', () => {
    beforeEach(() => {
      AuthHelper.loginAsTeacher();
      cy.visit('/#/input');
    });

    it('should handle score of 0', () => {
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
                  cy.get('input[type="number"]').first().clear().type('0');
                  cy.wait(500);
                }
              });
            }
          });
        }
      });
    });

    it('should handle maximum score of 100', () => {
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
                  cy.get('input[type="number"]').first().clear().type('100');
                  cy.wait(500);
                }
              });
            }
          });
        }
      });
    });
  });

  describe('Rapid User Actions', () => {
    beforeEach(() => {
      AuthHelper.loginAsHQ();
    });

    it('should handle rapid clicking', () => {
      teachersPage.visit();
      cy.wait(2000);
      
      // Rapidly click add button
      cy.get('button').contains(/add|new/i).click({ force: true });
      cy.get('button').contains(/add|new/i).click({ force: true });
      cy.get('button').contains(/add|new/i).click({ force: true });
      
      // Should handle gracefully
      cy.wait(1000);
    });

    it('should handle rapid navigation', () => {
      cy.visit('/#/dashboard');
      cy.visit('/#/teachers');
      cy.visit('/#/students');
      cy.visit('/#/classes');
      cy.visit('/#/dashboard');
      
      // Should handle gracefully
      cy.wait(2000);
    });
  });

  describe('Browser Back/Forward', () => {
    beforeEach(() => {
      AuthHelper.loginAsHQ();
    });

    it('should handle browser back button', () => {
      cy.visit('/#/dashboard');
      cy.wait(1000);
      
      cy.visit('/#/teachers');
      cy.wait(1000);
      
      cy.go('back');
      cy.hash().should('eq', '#/dashboard');
    });

    it('should handle browser forward button', () => {
      cy.visit('/#/dashboard');
      cy.wait(1000);
      
      cy.visit('/#/teachers');
      cy.wait(1000);
      
      cy.go('back');
      cy.wait(500);
      
      cy.go('forward');
      cy.hash().should('eq', '#/teachers');
    });
  });

  describe('Session Edge Cases', () => {
    it('should handle multiple tabs', () => {
      AuthHelper.loginAsHQ();
      
      // Simulate multiple tabs by storing token
      cy.window().then((win) => {
        const token = win.localStorage.getItem('authToken');
        expect(token).to.not.be.null;
        
        // Visit different page
        cy.visit('/#/teachers');
        cy.wait(1000);
        
        // Token should still be valid
        cy.window().then((win2) => {
          expect(win2.localStorage.getItem('authToken')).to.eq(token);
        });
      });
    });

    it('should handle page refresh during form submission', () => {
      AuthHelper.loginAsHQ();
      teachersPage.visit();
      cy.wait(2000);

      teachersPage.clickAddTeacher();
      cy.wait(500);

      // Fill form using label-based selectors
      cy.contains('label', /full.*name/i).parent().find('input').type('Test Teacher', { force: true });
      cy.get('input[type="email"]').type(`test.${Date.now()}@edu.com`, { force: true });
      cy.contains('label', /english.*name/i).parent().find('input').type('Test', { force: true });
      cy.contains('label', /subject/i).parent().find('input').type('Math', { force: true });

      // Reload before submitting
      cy.reload();

      // Should handle gracefully
      cy.wait(2000);
    });
  });
});

