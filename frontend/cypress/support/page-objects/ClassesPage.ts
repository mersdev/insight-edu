/**
 * Classes Management Page Object - Implements SOLID principles
 * - Single Responsibility: Handles classes page interactions only
 */
import { BasePage } from './BasePage';

export class ClassesPage extends BasePage {
  protected readonly path = '/classes';

  /**
   * Verify classes page is displayed
   */
  verifyClassesPageDisplayed(): void {
    this.verifyUrl();
    cy.contains(/class/i).should('be.visible');
  }

  /**
   * Click add class button
   */
  clickAddClass(): void {
    cy.contains('button', /add/i).click();
    // Wait for dialog to open
    cy.wait(500);
  }

  /**
   * Fill class form
   */
  fillClassForm(classData: {
    name: string;
    grade: string;
    teacherId: string;
    days: string[];
    time: string;
    durationHours?: string;
  }): void {
    cy.get('input[placeholder*="Name"], input[name="name"]').first().clear().type(classData.name);
    cy.get('input[placeholder*="Grade"], input[name="grade"]').clear().type(classData.grade);
    
    // Select teacher
    cy.get('select').eq(0).select(classData.teacherId);

    // Adjust weekly days
    cy.contains('label', /weekly days/i).parent().within(() => {
      cy.get('button').each(($button) => {
        const buttonText = $button.text().trim();
        const shouldBeSelected = classData.days.some(
          (targetDay) => targetDay.toLowerCase() === buttonText.toLowerCase()
        );
        const isSelected = $button.hasClass('bg-primary');
        if (shouldBeSelected && !isSelected) {
          cy.wrap($button).click({ force: true });
        }
        if (!shouldBeSelected && isSelected) {
          cy.wrap($button).click({ force: true });
        }
      });
    });
    
    // Set time
    cy.get('input[type="time"], input[name="time"]').clear().type(classData.time);

    if (classData.durationHours) {
      cy.contains('label', /session duration/i).parent().within(() => {
        cy.get('input').clear().type(classData.durationHours);
      });
    }
  }

  /**
   * Submit class form
   */
  submitClassForm(): void {
    // Wait for submit button to be visible and enabled
    cy.contains('button', /save|submit/i).should('be.visible').should('not.be.disabled').click();
  }

  /**
   * Search for class
   */
  searchClass(searchTerm: string): void {
    cy.get('input[type="search"], input[placeholder*="Search"]').clear().type(searchTerm);
  }

  /**
   * Verify class exists in list
   */
  verifyClassExists(name: string): void {
    cy.contains(name).should('be.visible');
  }

  /**
   * Delete class by name
   */
  deleteClass(name: string): void {
    cy.contains('tr', name).within(() => {
      cy.get('button').last().click();
    });
  }

  /**
   * View class sessions
   */
  viewClassSessions(className: string): void {
    cy.contains('tr', className).within(() => {
      cy.get('button').contains(/session|view/i).click();
    });
  }

  /**
   * Verify class count
   */
  verifyClassCount(count: number): void {
    cy.get('tbody tr').should('have.length.at.least', count);
  }

  /**
   * Sort classes
   */
  sortClasses(): void {
    cy.contains('th', /name|class/i).click();
  }
}
