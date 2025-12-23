/**
 * Teacher Classes Page Object - Implements SOLID principles
 * - Single Responsibility: Handles teacher classes page interactions only
 */
import { BasePage } from './BasePage';

export class TeacherClassesPage extends BasePage {
  protected readonly path = '/teacher/classes';

  /**
   * Verify teacher classes page is displayed
   */
  verifyTeacherClassesPageDisplayed(): void {
    this.verifyUrl();
    this.waitForPageLoad();
  }

  /**
   * Select a class
   */
  selectClass(className: string): void {
    cy.get('select').first().select(className);
  }

  /**
   * Select month
   */
  selectMonth(month: string): void {
    cy.get('select').eq(1).select(month);
  }

  /**
   * Verify sessions are displayed
   */
  verifySessions(): void {
    cy.wait(2000);
    cy.get('table').should('be.visible');
  }

  /**
   * Mark session as completed
   */
  markSessionCompleted(sessionDate: string): void {
    cy.contains('tr', sessionDate).within(() => {
      cy.get('button').contains(/complete/i).click();
    });
  }

  /**
   * Cancel session
   */
  cancelSession(sessionDate: string): void {
    cy.contains('tr', sessionDate).within(() => {
      cy.get('button').contains(/cancel/i).click();
    });
  }

  /**
   * Record behavior ratings
   */
  recordBehaviorRatings(sessionDate: string): void {
    cy.contains('tr', sessionDate).within(() => {
      cy.get('button').contains(/behavior|rating/i).click();
    });
  }

  /**
   * Rate student behavior
   */
  rateStudentBehavior(studentName: string, category: string, rating: number): void {
    cy.get(`[data-student-name="${studentName}"]`).within(() => {
      cy.get(`[data-category="${category}"]`).contains(`${rating}`).click();
    });
  }

  /**
   * Submit behavior ratings
   */
  submitBehaviorRatings(): void {
    cy.contains('button', /save|submit/i).click();
  }

  /**
   * Navigate to score input
   */
  navigateToScoreInput(): void {
    cy.get('aside').contains(/input/i).click({ force: true });
  }

  /**
   * Navigate to reports
   */
  navigateToReports(): void {
    cy.get('aside').contains(/reports/i).click({ force: true });
  }
}
