/**
 * Students Management Page Object - Implements SOLID principles
 * - Single Responsibility: Handles students page interactions only
 */
import { BasePage } from './BasePage';

export class StudentsPage extends BasePage {
  protected readonly path = '/students';

  /**
   * Verify students page is displayed
   */
  verifyStudentsPageDisplayed(): void {
    this.verifyUrl();
    cy.contains(/students/i).should('be.visible');
  }

  /**
   * Click add student button
   */
  clickAddStudent(): void {
    cy.contains('button', /add/i).click();
    // Wait for dialog to open
    cy.wait(500);
  }

  /**
   * Fill student form
   */
  fillStudentForm(student: {
    name: string;
    classIds: string[];
    school?: string;
    parentName?: string;
    parentEmail?: string;
    emergencyContact?: string;
  }): void {
    cy.get('input[placeholder*="Name"], input[name="name"]').first().clear().type(student.name);
    
    // Select classes
    student.classIds.forEach((classId) => {
      cy.get(`input[type="checkbox"][value="${classId}"]`).check();
    });
    
    if (student.school) {
      cy.get('input[placeholder*="School"], input[name="school"]').clear().type(student.school);
    }
    
    if (student.parentName) {
      cy.get('input[placeholder*="Parent"], input[name="parentName"]').clear().type(student.parentName);
    }
    
    if (student.parentEmail) {
      cy.get('input[type="email"], input[placeholder*="Email"]').clear().type(student.parentEmail);
    }
    
    if (student.emergencyContact) {
      cy.get('input[placeholder*="Emergency"], input[name="emergencyContact"]').clear().type(student.emergencyContact);
    }
  }

  /**
   * Submit student form
   */
  submitStudentForm(): void {
    // Wait for submit button to be visible and enabled
    cy.contains('button', /save|submit/i).should('be.visible').should('not.be.disabled').click();
  }

  /**
   * Search for student
   */
  searchStudent(searchTerm: string): void {
    cy.get('input[type="search"], input[placeholder*="Search"]').clear().type(searchTerm);
  }

  /**
   * Verify student exists in list
   */
  verifyStudentExists(name: string): void {
    cy.contains(name).should('be.visible');
  }

  /**
   * Click on student to view details
   */
  viewStudentDetails(name: string): void {
    cy.contains('tr', name).within(() => {
      cy.get('button').contains(/view|details/i).click();
    });
  }

  /**
   * Delete student by name
   */
  deleteStudent(name: string): void {
    cy.contains('tr', name).within(() => {
      cy.get('button').last().click();
    });
  }

  /**
   * Filter students by class
   */
  filterByClass(className: string): void {
    cy.get('select').first().select(className);
  }

  /**
   * Verify student count
   */
  verifyStudentCount(count: number): void {
    cy.get('tbody tr').should('have.length.at.least', count);
  }

  /**
   * Generate AI insights for student
   */
  generateStudentInsights(studentName: string): void {
    cy.contains('tr', studentName).within(() => {
      cy.get('button').contains(/insight|ai/i).click();
    });
  }
}

