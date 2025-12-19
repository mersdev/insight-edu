/**
 * HQ Dashboard Page Object - Implements SOLID principles
 * - Single Responsibility: Handles HQ dashboard interactions only
 */
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  protected readonly path = '/dashboard';

  /**
   * Verify dashboard is displayed with key metrics
   */
  verifyDashboardDisplayed(): void {
    this.verifyUrl();
    cy.contains(/dashboard|insight/i).should('be.visible');
  }

  /**
   * Navigate to teachers page via sidebar
   */
  navigateToTeachers(): void {
    cy.get('aside').contains(/teachers/i).click();
  }

  /**
   * Navigate to students page via sidebar
   */
  navigateToStudents(): void {
    cy.get('aside').contains(/students/i).click();
  }

  /**
   * Navigate to classes page via sidebar
   */
  navigateToClasses(): void {
    cy.get('aside').contains(/^class$/i).click();
  }

  /**
   * Navigate to locations page via sidebar
   */
  navigateToLocations(): void {
    cy.get('aside').contains(/locations/i).click();
  }

  /**
   * Verify KPI cards are displayed
   */
  verifyKPICards(): void {
    cy.contains(/total students|students/i).should('be.visible');
    cy.contains(/locations/i).should('be.visible');
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
    cy.wait(2000); // Wait for AI generation
    cy.get('body').should('contain.text', /insight|analysis/i);
  }
}

