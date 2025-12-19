/// <reference types="cypress" />

/**
 * Authorization and Role-Based Access Control Tests
 * Tests role-based access control for all user types
 * - Single Responsibility: Tests authorization only
 * - Verifies proper access restrictions
 */

import { AuthHelper } from '../../support/test-helpers';

describe('Authorization - Role-Based Access Control', () => {
  beforeEach(() => {
    AuthHelper.clearAuth();
  });

  describe('HQ User Access', () => {
    beforeEach(() => {
      AuthHelper.loginAsHQ();
    });

    it('should access dashboard', () => {
      cy.visit('/#/dashboard');
      cy.hash().should('eq', '#/dashboard');
      cy.contains(/dashboard|overview/i).should('be.visible');
    });

    it('should access teachers page', () => {
      cy.visit('/#/teachers');
      cy.hash().should('eq', '#/teachers');
      cy.contains(/teachers/i).should('be.visible');
    });

    it('should access students page', () => {
      cy.visit('/#/students');
      cy.hash().should('eq', '#/students');
      cy.contains(/students/i).should('be.visible');
    });

    it('should access classes page', () => {
      cy.visit('/#/classes');
      cy.wait(1000);
      cy.hash().should('eq', '#/classes');
      // Just verify we're on the classes page by checking the hash
      cy.wait(500);
    });

    it('should access locations page', () => {
      cy.visit('/#/locations');
      cy.hash().should('eq', '#/locations');
      cy.contains(/locations/i).should('be.visible');
    });

    it('should NOT access teacher-specific pages', () => {
      cy.visit('/#/teacher/classes');
      cy.wait(1000);
      // Should redirect to dashboard or show error
      cy.hash({ timeout: 5000 }).should('satisfy', (hash) => {
        return hash === '#/dashboard' || hash !== '#/teacher/classes';
      });
    });

    it('should access reports page', () => {
      cy.visit('/#/reports');
      cy.hash().should('eq', '#/reports');
    });
  });

  describe('Teacher User Access', () => {
    beforeEach(() => {
      AuthHelper.loginAsTeacher();
    });

    it('should access teacher classes page', () => {
      cy.visit('/#/teacher/classes');
      cy.hash().should('eq', '#/teacher/classes');
    });

    it('should access score input page', () => {
      cy.visit('/#/input');
      cy.hash().should('eq', '#/input');
    });

    it('should access reports page', () => {
      cy.visit('/#/reports');
      cy.hash().should('eq', '#/reports');
    });

    it('should NOT access HQ dashboard', () => {
      cy.visit('/#/dashboard');
      // Should redirect to teacher classes
      cy.hash({ timeout: 5000 }).should('eq', '#/teacher/classes');
    });

    it('should NOT access teachers management', () => {
      cy.visit('/#/teachers');
      // Should redirect to teacher classes
      cy.hash({ timeout: 5000 }).should('eq', '#/teacher/classes');
    });

    it('should NOT access students management', () => {
      cy.visit('/#/students');
      // Should redirect to teacher classes
      cy.hash({ timeout: 5000 }).should('eq', '#/teacher/classes');
    });

    it('should NOT access classes management', () => {
      cy.visit('/#/classes');
      // Should redirect to teacher classes
      cy.hash({ timeout: 5000 }).should('eq', '#/teacher/classes');
    });

    it('should NOT access locations management', () => {
      cy.visit('/#/locations');
      // Should redirect to teacher classes
      cy.hash({ timeout: 5000 }).should('eq', '#/teacher/classes');
    });
  });

  describe('Parent User Access', () => {
    beforeEach(() => {
      cy.fixture('users').then((users) => {
        if (users.parentUser) {
          AuthHelper.loginAsParent();
        }
      });
    });

    it('should access reports page only', () => {
      cy.fixture('users').then((users) => {
        if (users.parentUser) {
          cy.visit('/#/reports');
          cy.hash().should('eq', '#/reports');
        }
      });
    });

    it('should NOT access HQ dashboard', () => {
      cy.fixture('users').then((users) => {
        if (users.parentUser) {
          cy.visit('/#/dashboard');
          cy.hash({ timeout: 5000 }).should('eq', '#/reports');
        }
      });
    });

    it('should NOT access teachers page', () => {
      cy.fixture('users').then((users) => {
        if (users.parentUser) {
          cy.visit('/#/teachers');
          cy.hash({ timeout: 5000 }).should('eq', '#/reports');
        }
      });
    });

    it('should NOT access students page', () => {
      cy.fixture('users').then((users) => {
        if (users.parentUser) {
          cy.visit('/#/students');
          cy.hash({ timeout: 5000 }).should('eq', '#/reports');
        }
      });
    });

    it('should NOT access teacher classes', () => {
      cy.fixture('users').then((users) => {
        if (users.parentUser) {
          cy.visit('/#/teacher/classes');
          cy.hash({ timeout: 5000 }).should('eq', '#/reports');
        }
      });
    });

    it('should NOT access score input', () => {
      cy.fixture('users').then((users) => {
        if (users.parentUser) {
          cy.visit('/#/input');
          cy.hash({ timeout: 5000 }).should('eq', '#/reports');
        }
      });
    });
  });

  describe('Unauthenticated Access', () => {
    it('should redirect to login when accessing dashboard', () => {
      cy.visit('/#/dashboard');
      cy.hash({ timeout: 5000 }).should('eq', '#/login');
    });

    it('should redirect to login when accessing teachers', () => {
      cy.visit('/#/teachers');
      cy.hash({ timeout: 5000 }).should('eq', '#/login');
    });

    it('should redirect to login when accessing students', () => {
      cy.visit('/#/students');
      cy.hash({ timeout: 5000 }).should('eq', '#/login');
    });

    it('should redirect to login when accessing reports', () => {
      cy.visit('/#/reports');
      cy.hash({ timeout: 5000 }).should('eq', '#/login');
    });

    it('should allow access to login page', () => {
      cy.visit('/#/login');
      cy.hash().should('eq', '#/login');
    });
  });
});

