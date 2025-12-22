/// <reference types="cypress" />

/**
 * Parent Complete Workflow Tests
 * Tests comprehensive parent user workflows using page objects
 * - Single Responsibility: Tests parent user workflows only
 * - Uses page objects for maintainability (Open/Closed principle)
 */

import { LoginPage, StudentReportPage } from '../../support/page-objects';
import { AuthHelper } from '../../support/test-helpers';

describe('Parent User - Complete Workflow', () => {
  const loginPage = new LoginPage();
  const studentReportPage = new StudentReportPage();

  beforeEach(() => {
    AuthHelper.clearAuth();
  });

  describe('Parent Access to Reports', () => {
    beforeEach(() => {
      cy.fixture('users').then((users) => {
        if (users.parentUser) {
          AuthHelper.loginAsParent();
          AuthHelper.dismissDeviceWarning();
        }
      });
    });

    it('should display student reports page', () => {
      cy.fixture('users').then((users) => {
        if (users.parentUser) {
          studentReportPage.verifyStudentReportPageDisplayed();
        }
      });
    });

    it('should view own children reports only', () => {
      cy.fixture('users').then((users) => {
        if (users.parentUser) {
          cy.wait(2000);
          studentReportPage.verifyStudentDataDisplayed();
        }
      });
    });

    it('should select different children', () => {
      cy.fixture('users').then((users) => {
        if (users.parentUser) {
          cy.get('select').first().then(($select) => {
            const options = $select.find('option');
            if (options.length > 1) {
              const studentName = options.eq(1).text();
              studentReportPage.selectStudent(studentName);
              cy.wait(2000);
              studentReportPage.verifyStudentDataDisplayed();
            }
          });
        }
      });
    });

    it('should view student performance data', () => {
      cy.fixture('users').then((users) => {
        if (users.parentUser) {
          cy.wait(2000);
          studentReportPage.verifyStudentDataDisplayed();
        }
      });
    });

    it('should view student attendance', () => {
      cy.fixture('users').then((users) => {
        if (users.parentUser) {
          cy.wait(2000);
          cy.contains(/attendance|schedule/i).should('be.visible');
        }
      });
    });

    it('should see option to email report', () => {
      cy.fixture('users').then((users) => {
        if (users.parentUser) {
          studentReportPage.verifySendReportButton();
        }
      });
    });
  });

  describe('Parent Cannot Access Other Pages', () => {
    beforeEach(() => {
      cy.fixture('users').then((users) => {
        if (users.parentUser) {
          AuthHelper.loginAsParent();
        }
      });
    });

    it('should not access dashboard', () => {
      cy.fixture('users').then((users) => {
        if (users.parentUser) {
          cy.visit('/#/dashboard');
          // Should redirect to reports
          cy.hash({ timeout: 5000 }).should('eq', '#/reports');
        }
      });
    });

    it('should not access teachers page', () => {
      cy.fixture('users').then((users) => {
        if (users.parentUser) {
          cy.visit('/#/teachers');
          // Should redirect to reports
          cy.hash({ timeout: 5000 }).should('eq', '#/reports');
        }
      });
    });

    it('should not access students page', () => {
      cy.fixture('users').then((users) => {
        if (users.parentUser) {
          cy.visit('/#/students');
          // Should redirect to reports
          cy.hash({ timeout: 5000 }).should('eq', '#/reports');
        }
      });
    });

    it('should not access classes page', () => {
      cy.fixture('users').then((users) => {
        if (users.parentUser) {
          cy.visit('/#/classes');
          // Should redirect to reports
          cy.hash({ timeout: 5000 }).should('eq', '#/reports');
        }
      });
    });

    it('should not access teacher input page', () => {
      cy.fixture('users').then((users) => {
        if (users.parentUser) {
          cy.visit('/#/input');
          // Should redirect to reports
          cy.hash({ timeout: 5000 }).should('eq', '#/reports');
        }
      });
    });
  });

  describe('Complete Parent Workflow - End to End', () => {
    it('should complete full parent workflow', () => {
      cy.fixture('users').then((users) => {
        if (users.parentUser) {
          // 1. Login
          loginPage.visit();
          loginPage.login(users.parentUser.email, users.parentUser.password);
          loginPage.verifyTokenStored();
          
          // Wait for redirect to reports
          cy.hash({ timeout: 10000 }).should('eq', '#/reports');
          AuthHelper.dismissDeviceWarning();

          // 2. View Reports
          studentReportPage.verifyStudentReportPageDisplayed();
          cy.wait(2000);

          // 3. View student data
          studentReportPage.verifyStudentDataDisplayed();

          // 4. Select different student if available
          cy.get('select').first().then(($select) => {
            const options = $select.find('option');
            if (options.length > 1) {
              const studentName = options.eq(1).text();
              studentReportPage.selectStudent(studentName);
              cy.wait(2000);
              studentReportPage.verifyStudentDataDisplayed();
            }
          });

          // 5. Verify cannot access other pages
          cy.visit('/#/dashboard');
          cy.hash({ timeout: 5000 }).should('eq', '#/reports');
        }
      });
    });
  });
});
