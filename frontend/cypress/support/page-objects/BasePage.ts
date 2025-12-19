/**
 * Base Page Object - Implements SOLID principles
 * - Single Responsibility: Provides common page interactions
 * - Open/Closed: Extendable by specific page objects
 * - Dependency Inversion: Depends on Cypress abstraction
 */
export abstract class BasePage {
  protected abstract readonly path: string;

  /**
   * Navigate to the page
   */
  visit(): void {
    cy.visit(`/#${this.path}`);
  }

  /**
   * Verify current page URL
   */
  verifyUrl(): void {
    cy.hash().should('eq', `#${this.path}`);
  }

  /**
   * Wait for page to be visible
   */
  waitForPageLoad(): void {
    cy.get('body').should('be.visible');
  }

  /**
   * Get element by test ID
   */
  getByTestId(testId: string): Cypress.Chainable {
    return cy.get(`[data-testid="${testId}"]`);
  }

  /**
   * Get element by text content
   */
  getByText(text: string | RegExp): Cypress.Chainable {
    return cy.contains(text);
  }

  /**
   * Click button by text
   */
  clickButton(text: string | RegExp): void {
    cy.contains('button', text).click();
  }

  /**
   * Fill input field
   */
  fillInput(selector: string, value: string): void {
    cy.get(selector).clear().type(value);
  }

  /**
   * Select dropdown option
   */
  selectOption(selector: string, value: string): void {
    cy.get(selector).select(value);
  }

  /**
   * Dismiss dialog if present
   */
  dismissDialogIfPresent(): void {
    cy.get('body').then(($body) => {
      if ($body.text().includes('Recommendation') || $body.text().includes('建议')) {
        cy.contains('button', 'OK').click({ force: true });
        cy.wait(500);
      }
    });
  }
}

