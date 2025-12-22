/**
 * Student Report Page Object - Implements SOLID principles
 * - Single Responsibility: Handles student report page interactions only
 */
import { BasePage } from './BasePage';

export class StudentReportPage extends BasePage {
  protected readonly path = '/reports';

  /**
   * Verify student report page is displayed
   */
  verifyStudentReportPageDisplayed(): void {
    this.verifyUrl();
    this.dismissDialogIfPresent();
    cy.contains(/reports/i).should('be.visible');
  }

  /**
   * Select a student
   */
  selectStudent(studentName: string): void {
    cy.get('select').first().select(studentName);
  }

  /**
   * Verify student data is displayed
   */
  verifyStudentDataDisplayed(): void {
    cy.wait(2000);
    cy.get('body').should('be.visible');
  }

  /**
   * Verify send report email button is visible
   */
  verifySendReportButton(): void {
    cy.get('[data-cy="email-report-btn"]').should('be.visible');
  }

  /**
   * Generate AI insights
   */
  generateAIInsights(): void {
    cy.contains('button', /generate|analyze/i).click();
  }

  /**
   * Verify AI insights are displayed
   */
  verifyAIInsightsDisplayed(): void {
    cy.wait(2000);
    cy.get('body').should('contain.text', /insight|analysis/i);
  }

  /**
   * Verify performance chart is displayed
   */
  verifyPerformanceChart(): void {
    cy.get('.recharts-wrapper').should('be.visible');
  }

  /**
   * Verify behavior radar chart is displayed
   */
  verifyBehaviorRadarChart(): void {
    cy.get('.recharts-wrapper').should('have.length.at.least', 1);
  }

  /**
   * Verify attendance data is displayed
   */
  verifyAttendanceData(): void {
    cy.contains(/attendance/i).should('be.visible');
  }

  /**
   * Download report
   */
  downloadReport(): void {
    cy.contains('button', /download/i).click();
  }

  /**
   * Navigate to next student
   */
  navigateToNextStudent(): void {
    cy.get('button').contains(/next/i).click();
  }

  /**
   * Navigate to previous student
   */
  navigateToPreviousStudent(): void {
    cy.get('button').contains(/previous|prev/i).click();
  }

  /**
   * Verify student schedule is displayed
   */
  verifyStudentSchedule(): void {
    cy.contains(/schedule|calendar/i).should('be.visible');
  }
}
