/**
 * Teachers Management Page Object - Implements SOLID principles
 * - Single Responsibility: Handles teachers page interactions only
 */
import { BasePage } from './BasePage';

export class TeachersPage extends BasePage {
  protected readonly path = '/teachers';

  /**
   * Verify teachers page is displayed
   */
  verifyTeachersPageDisplayed(): void {
    this.verifyUrl();
    this.dismissDialogIfPresent();
    cy.get('body').then(() => {
      // Aggressively remove any lingering overlay dialogs that may block buttons
      Cypress.$('.fixed.inset-0').remove();
    });
    cy.get('.fixed.inset-0', { timeout: 1000 }).should('not.exist');
    cy.contains(/teachers/i).should('be.visible');
  }

  /**
   * Click add teacher button
   */
  clickAddTeacher(): void {
    cy.contains('button', /add/i).click();
    // Wait for dialog to open
    cy.wait(500);
  }

  /**
   * Fill teacher form
   */
  fillTeacherForm(teacher: {
    name: string;
    email: string;
    subject?: string;
    englishName?: string;
    chineseName?: string;
    phone?: string;
  }): void {
    // Use label-based selectors by finding inputs near their labels
    cy.contains('label', /full.*name/i).parent().find('input').clear({ force: true }).type(teacher.name, { force: true });
    cy.get('input[type="email"]').clear({ force: true }).type(teacher.email, { force: true });

    if (teacher.englishName) {
      cy.contains('label', /english.*name/i).parent().find('input').clear({ force: true }).type(teacher.englishName, { force: true });
    }

    if (teacher.chineseName) {
      cy.contains('label', /chinese.*name/i).parent().find('input').clear({ force: true }).type(teacher.chineseName, { force: true });
    }

    if (teacher.phone) {
      cy.contains('label', /phone/i).parent().find('input').clear({ force: true }).type(teacher.phone, { force: true });
    }

    if (teacher.subject) {
      cy.contains('label', /subject/i).parent().find('input').clear({ force: true }).type(teacher.subject, { force: true });
    }
  }

  /**
   * Submit teacher form
   */
  submitTeacherForm(): void {
    // Wait for submit button to be visible and enabled
    cy.contains('button', /save|submit/i).should('be.visible').should('not.be.disabled').click();
  }

  /**
   * Search for teacher
   */
  searchTeacher(searchTerm: string): void {
    cy.get('input[type="search"], input[placeholder*="Search"]').clear().type(searchTerm);
  }

  /**
   * Verify teacher exists in list
   */
  verifyTeacherExists(name: string): void {
    cy.contains(name).should('be.visible');
  }

  /**
   * Delete teacher by name
   */
  deleteTeacher(name: string): void {
    cy.contains('tr', name).within(() => {
      cy.get('button').last().click();
    });
  }

  /**
   * Verify teacher count
   */
  verifyTeacherCount(count: number): void {
    cy.get('tbody tr').should('have.length', count);
  }

  /**
   * Sort teachers
   */
  sortTeachers(): void {
    cy.contains('th', /name/i).click();
  }
}
