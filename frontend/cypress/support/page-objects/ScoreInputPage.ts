/**
 * Score Input Page Object - Implements SOLID principles
 * - Single Responsibility: Handles score input page interactions only
 */
import { BasePage } from './BasePage';

export class ScoreInputPage extends BasePage {
  protected readonly path = '/input';

  /**
   * Verify score input page is displayed
   */
  verifyScoreInputPageDisplayed(): void {
    this.verifyUrl();
    cy.contains(/score input/i).should('be.visible');
  }

  /**
   * Select a class
   */
  selectClass(className: string): void {
    cy.get('select').first().select(className);
  }

  /**
   * Switch to edit mode
   */
  switchToEditMode(): void {
    cy.contains('button', /edit/i).click();
  }

  /**
   * Switch to read mode
   */
  switchToReadMode(): void {
    cy.contains('button', /read|view/i).click();
  }

  /**
   * Add score column
   */
  addScoreColumn(columnName: string): void {
    cy.contains('button', /add column/i).click();
    cy.get('input[placeholder*="Column"], input[name="columnName"]').type(columnName);
    cy.contains('button', /save|add/i).click();
  }

  /**
   * Input score for student
   */
  inputScore(studentName: string, columnName: string, score: string): void {
    cy.contains('tr', studentName).within(() => {
      cy.contains('th', columnName).parent().parent().within(() => {
        cy.get('input[type="number"]').clear().type(score);
      });
    });
  }

  /**
   * Save scores
   */
  saveScores(): void {
    cy.contains('button', /save/i).click();
  }

  /**
   * Verify score is displayed
   */
  verifyScore(studentName: string, columnName: string, score: string): void {
    cy.contains('tr', studentName).within(() => {
      cy.contains(score).should('be.visible');
    });
  }

  /**
   * Verify students are displayed
   */
  verifyStudentsDisplayed(): void {
    cy.get('table tbody tr').should('have.length.at.least', 1);
  }
}

