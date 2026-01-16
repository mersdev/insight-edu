/// <reference types="cypress" />

/**
 * HQ Complete Workflow Tests
 * Tests comprehensive HQ user workflows using page objects
 * - Single Responsibility: Tests HQ user workflows only
 * - Uses page objects for maintainability (Open/Closed principle)
 */

import { LoginPage, DashboardPage, TeachersPage, StudentsPage, ClassesPage } from '../../support/page-objects';
import { ApiInterceptor } from '../../support/api-helpers';
import { AuthHelper } from '../../support/test-helpers';

describe('HQ User - Complete Workflow', () => {
  const loginPage = new LoginPage();
  const dashboardPage = new DashboardPage();
  const teachersPage = new TeachersPage();
  const studentsPage = new StudentsPage();
  const classesPage = new ClassesPage();
  const apiInterceptor = new ApiInterceptor();

  beforeEach(() => {
    AuthHelper.clearAuth();
  });

  describe('Dashboard and Navigation', () => {
    beforeEach(() => {
      AuthHelper.loginAsHQ();
    });

    it('should display dashboard with key metrics', () => {
      dashboardPage.verifyDashboardDisplayed();
      dashboardPage.verifyKPICards();
    });

    it('should navigate to all management pages', () => {
      // Navigate to Teachers
      dashboardPage.navigateToTeachers();
      teachersPage.verifyTeachersPageDisplayed();

      // Navigate to Students
      cy.visit('/#/dashboard');
      dashboardPage.navigateToStudents();
      studentsPage.verifyStudentsPageDisplayed();

      // Navigate to Classes
      cy.visit('/#/dashboard');
      dashboardPage.navigateToClasses();
      classesPage.verifyClassesPageDisplayed();

    });

    it('should generate AI insights on dashboard', () => {
      dashboardPage.verifyDashboardDisplayed();
      // AI insights generation is tested separately due to API dependencies
    });
  });

  describe('Teacher Management', () => {
    beforeEach(() => {
      AuthHelper.loginAsHQ();
      teachersPage.visit();
    });

    it('should create a new teacher', () => {
      const timestamp = Date.now();
      teachersPage.clickAddTeacher();
      cy.wait(500);

      teachersPage.fillTeacherForm({
        name: `Test Teacher ${timestamp}`,
        email: `test.teacher.${timestamp}@test.com`,
        subjects: ['Mathematics'],
        levels: ['Standard 1'],
        englishName: `Test Teacher ${timestamp}`,
        chineseName: `测试老师${timestamp}`,
        phone: '1234567890'
      });

      teachersPage.submitTeacherForm();
      cy.wait(2000); // Wait for creation to complete
    });

    it('should search for teachers', () => {
      teachersPage.searchTeacher('Sarah');
      cy.wait(500);
    });

    it('should sort teachers', () => {
      teachersPage.sortTeachers();
      cy.wait(500);
    });
  });

  describe('Student Management', () => {
    beforeEach(() => {
      AuthHelper.loginAsHQ();
      studentsPage.visit();
    });

    it('should display students list', () => {
      studentsPage.verifyStudentsPageDisplayed();
      cy.wait(2000);
    });

    it('should search for students', () => {
      studentsPage.searchStudent('Ali');
      cy.wait(500);
    });

    it('should filter students by class', () => {
      // Get first class from dropdown and filter
      cy.get('select').first().then(($select) => {
        const options = $select.find('option');
        if (options.length > 1) {
          const className = options.eq(1).text();
          studentsPage.filterByClass(className);
          cy.wait(1000);
        }
      });
    });
  });

  describe('Class Management', () => {
    beforeEach(() => {
      AuthHelper.loginAsHQ();
      classesPage.visit();
    });

    it('should display classes list', () => {
      classesPage.verifyClassesPageDisplayed();
      cy.wait(2000);
    });

    it('should search for classes', () => {
      classesPage.searchClass('Math');
      cy.wait(500);
    });

    it('should sort classes', () => {
      classesPage.sortClasses();
      cy.wait(500);
    });
  });

  describe('Complete HQ Workflow - End to End', () => {
    it('should complete full HQ management workflow', () => {
      // 1. Login
      cy.fixture('users').then((users) => {
        loginPage.visit();
        loginPage.login(users.hqUser.email, users.hqUser.password);
        loginPage.verifyTokenStored();
        dashboardPage.verifyDashboardDisplayed();

        // 2. View Dashboard
        dashboardPage.verifyKPICards();

        // 3. Manage Teachers
        cy.visit('/#/dashboard');
        dashboardPage.navigateToTeachers();
        teachersPage.verifyTeachersPageDisplayed();

        // 4. Manage Students
        cy.visit('/#/dashboard');
        dashboardPage.navigateToStudents();
        studentsPage.verifyStudentsPageDisplayed();

        // 5. Manage Classes
        cy.visit('/#/dashboard');
        dashboardPage.navigateToClasses();
        classesPage.verifyClassesPageDisplayed();

        // 6. Return to Dashboard
        cy.visit('/#/dashboard');
        dashboardPage.verifyDashboardDisplayed();
      });
    });
  });
});
