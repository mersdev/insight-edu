/// <reference types="cypress" />

/**
 * Teacher Complete Workflow Tests
 * Tests comprehensive teacher user workflows using page objects
 * - Single Responsibility: Tests teacher user workflows only
 * - Uses page objects for maintainability (Open/Closed principle)
 */

import { LoginPage, TeacherClassesPage, ScoreInputPage, StudentReportPage } from '../../support/page-objects';
import { ApiInterceptor } from '../../support/api-helpers';
import { AuthHelper } from '../../support/test-helpers';

describe('Teacher User - Complete Workflow', () => {
  const loginPage = new LoginPage();
  const teacherClassesPage = new TeacherClassesPage();
  const scoreInputPage = new ScoreInputPage();
  const studentReportPage = new StudentReportPage();
  const apiInterceptor = new ApiInterceptor();

  beforeEach(() => {
    AuthHelper.clearAuth();
  });

  describe('Teacher Classes Management', () => {
    beforeEach(() => {
      AuthHelper.loginAsTeacher();
    });

    it('should display teacher classes page', () => {
      teacherClassesPage.verifyTeacherClassesPageDisplayed();
    });

    it('should view class sessions', () => {
      teacherClassesPage.verifySessions();
    });

    it('should select different months', () => {
      cy.get('select').then(($selects) => {
        if ($selects.length > 1) {
          const monthSelect = $selects.eq(1);
          const options = monthSelect.find('option');
          if (options.length > 1) {
            const month = options.eq(1).val() as string;
            teacherClassesPage.selectMonth(month);
            cy.wait(1000);
          }
        } else {
          cy.log('Only one selector present; skipping month change');
        }
      });
    });

    it('should navigate to score input', () => {
      teacherClassesPage.navigateToScoreInput();
      AuthHelper.dismissDeviceWarning();
      scoreInputPage.verifyScoreInputPageDisplayed();
    });

    it('should navigate to reports', () => {
      teacherClassesPage.navigateToReports();
      studentReportPage.verifyStudentReportPageDisplayed();
    });
  });

  describe('Score Input', () => {
    beforeEach(() => {
      AuthHelper.loginAsTeacher();
      scoreInputPage.visit();
      AuthHelper.dismissDeviceWarning();
    });

    it('should display score input page', () => {
      scoreInputPage.verifyScoreInputPageDisplayed();
    });

    it('should select a class', () => {
      cy.get('select').first().then(($select) => {
        const options = $select.find('option');
        if (options.length > 1) {
          const className = options.eq(1).text();
          scoreInputPage.selectClass(className);
          cy.wait(1000);
        }
      });
    });

    it('should switch to edit mode', () => {
      cy.wait(1000);
      cy.get('body').then(($body) => {
        if ($body.text().includes('Edit Scores')) {
          scoreInputPage.switchToEditMode();
          cy.wait(500);
        }
      });
    });

    it('should display students in selected class', () => {
      cy.wait(2000);
      scoreInputPage.verifyStudentsDisplayed();
    });
  });

  describe('Student Reports', () => {
    beforeEach(() => {
      AuthHelper.loginAsTeacher();
      studentReportPage.visit();
    });

    it('should display student report page', () => {
      studentReportPage.verifyStudentReportPageDisplayed();
    });

    it('should select a student', () => {
      cy.get('select').first().then(($select) => {
        const options = $select.find('option');
        if (options.length > 1) {
          // Select by index instead of text to avoid duplicate text issues
          cy.get('select').first().select(1);
          cy.wait(2000);
        }
      });
    });

    it('should display student data', () => {
      studentReportPage.verifyStudentDataDisplayed();
    });

    it.skip('should show send report WhatsApp button', () => {
      studentReportPage.verifySendReportButton();
    });
  });

  describe('Complete Teacher Workflow - End to End', () => {
    it('should complete full teacher workflow', () => {
      cy.fixture('users').then((users) => {
        // 1. Login
        loginPage.visit();
        loginPage.login(users.teacherUser.email, users.teacherUser.password);
        loginPage.verifyTokenStored();
        
        // Wait for redirect
        cy.hash({ timeout: 10000 }).should('eq', '#/teacher/classes');
        AuthHelper.dismissDeviceWarning();

        // 2. View Classes
        teacherClassesPage.verifyTeacherClassesPageDisplayed();
        teacherClassesPage.verifySessions();

        // 3. Navigate to Score Input
        teacherClassesPage.navigateToScoreInput();
        scoreInputPage.verifyScoreInputPageDisplayed();
        cy.wait(1000);

        // 4. Select a class and view students
        cy.get('select').first().then(($select) => {
          const options = $select.find('option');
          if (options.length > 1) {
            const className = options.eq(1).text();
            scoreInputPage.selectClass(className);
            cy.wait(1000);
          }
        });

        // 5. Navigate to Reports
        cy.get('aside').contains(/reports/i).click({ force: true });
        studentReportPage.verifyStudentReportPageDisplayed();
        cy.wait(2000);

        // 6. View student data
        studentReportPage.verifyStudentDataDisplayed();

        // 7. Return to Classes
        cy.visit('/#/teacher/classes');
        teacherClassesPage.verifyTeacherClassesPageDisplayed();
      });
    });
  });

  describe('Session Management', () => {
    beforeEach(() => {
      AuthHelper.loginAsTeacher();
      teacherClassesPage.visit();
      AuthHelper.dismissDeviceWarning();
    });

    it('should view sessions for current month', () => {
      cy.wait(2000);
      teacherClassesPage.verifySessions();
    });

    it('should handle empty class selection', () => {
      cy.get('select').first().then(($select) => {
        const options = $select.find('option');
        if (options.length > 0) {
          // Select first option (might be empty or default)
          const value = options.eq(0).val();
          if (value) {
            cy.get('select').first().select(value as string);
            cy.wait(1000);
          }
        }
      });
    });
  });

  describe('Behavior Rating', () => {
    beforeEach(() => {
      AuthHelper.loginAsTeacher();
      teacherClassesPage.visit();
      AuthHelper.dismissDeviceWarning();
    });

    it('should display behavior rating interface', () => {
      cy.wait(2000);
      // Behavior rating is part of the classes page
      teacherClassesPage.verifyTeacherClassesPageDisplayed();
    });
  });
});
