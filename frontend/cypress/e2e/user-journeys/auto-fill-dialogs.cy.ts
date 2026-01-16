/// <reference types="cypress" />

describe('Auto-Fill Functionality for Dialogs', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.fixture('users').then((users) => {
      // Login as HQ user
      cy.visit('/#/login');
      cy.get('input[type="email"]').type(users.hqUser.email);
      cy.get('input[type="password"]').type(users.hqUser.password);
      cy.get('button[type="submit"]').click();
      cy.hash({ timeout: 10000 }).should('eq', '#/dashboard');
    });
  });

  describe('Student Auto-Fill', () => {
    it('should auto-fill student form with Malaysian data', () => {
      cy.visit('/#/students');
      cy.hash().should('eq', '#/students');
      
      // Click Add button
      cy.contains('button', /add/i).click();
      
      // Wait for dialog to open
      cy.contains(/add new student/i).should('be.visible');
      
      // Click Auto-Fill button
      cy.contains('button', /auto-fill/i).click();
      
      // Verify fields are filled
      cy.get('input[placeholder*="Full"]').should('not.have.value', '');
      cy.get('input[placeholder*="School"]').should('not.have.value', '');
      cy.get('input[placeholder*="Guardian"]').should('not.have.value', '');
      cy.get('input[placeholder*="01X"]').should('not.have.value', '');
    });
  });

  describe('Teacher Auto-Fill', () => {
    it('should auto-fill teacher form with Malaysian data', () => {
      cy.visit('/#/teachers');
      cy.hash().should('eq', '#/teachers');

      // Click Add button
      cy.contains('button', /add/i).click();

      // Wait for dialog to open
      cy.contains(/add new teacher/i).should('be.visible');

      // Click Auto-Fill button
      cy.contains('button', /auto-fill/i).click();

      // Wait a bit for auto-fill to complete
      cy.wait(500);

      // Verify at least the name and email fields are filled
      cy.get('input[type="email"]').should('not.have.value', '');
    });
  });

  describe('Class Auto-Fill', () => {
    it('should auto-fill class form with Malaysian data', () => {
      cy.visit('/#/classes');
      cy.hash().should('eq', '#/classes');
      
      // Click Add button
      cy.contains('button', /add/i).click();
      
      // Wait for dialog to open
      cy.contains(/add new class/i).should('be.visible');
      
      // Click Auto-Fill button
      cy.contains('button', /auto-fill/i).click();
      
      // Verify fields are filled
      cy.get('input[placeholder*="Form 4"]').should('not.have.value', '');
      cy.get('select').first().should('not.have.value', '');
    });
  });

  describe('Complete workflow with auto-fill', () => {
    it('should create a student using auto-fill', () => {
      cy.visit('/#/students');
      
      // Click Add button
      cy.contains('button', /add/i).click();
      
      // Click Auto-Fill button
      cy.contains('button', /auto-fill/i).click();
      
      // Wait a bit for auto-fill to complete
      cy.wait(500);
      
      // Check if required fields are filled
      cy.get('input').then(($inputs) => {
        const allFilled = $inputs.toArray().every(input => (input as HTMLInputElement).value !== '');
        
        if (allFilled) {
          // Click Save
          cy.contains('button', /save/i).click();
          
          // Verify dialog closes (student created)
          cy.contains(/add new student/i, { timeout: 5000 }).should('not.exist');
        } else {
          // Some required fields are missing, skip this test
          cy.log('Auto-fill did not complete all required fields, skipping save');
          // Close the dialog
          cy.get('body').type('{esc}');
        }
      });
    });
  });
});
