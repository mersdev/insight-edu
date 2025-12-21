/**
 * Login Page Object - Implements SOLID principles
 * - Single Responsibility: Handles login page interactions only
 * - Liskov Substitution: Can be used wherever BasePage is expected
 */
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  protected readonly path = '/login';

  // Selectors
  private readonly emailInput = 'input[type="email"]';
  private readonly passwordInput = 'input[type="password"]';
  private readonly submitButton = 'button[type="submit"]';
  private readonly errorMessage = '.text-red-500';
  private readonly passwordToggle = 'input[type="password"]';

  /**
   * Login with credentials
   */
  login(email: string, password: string): void {
    this.fillInput(this.emailInput, email);
    this.fillInput(this.passwordInput, password);
    cy.get(this.submitButton).click();
  }

  /**
   * Verify login page is displayed
   */
  verifyLoginPageDisplayed(): void {
    this.verifyUrl();
    cy.contains('Insight EDU').should('be.visible');
    cy.get(this.emailInput).should('be.visible');
    cy.get(this.passwordInput).should('be.visible');
    cy.get(this.submitButton).should('be.visible');
  }

  /**
   * Verify error message is shown
   */
  verifyErrorMessage(): void {
    cy.get(this.errorMessage, { timeout: 10000 }).should('be.visible');
  }

  /**
   * Verify auth token is stored
   */
  verifyTokenStored(): void {
    cy.window().its('localStorage').invoke('getItem', 'authToken').should('exist');
    cy.window().its('localStorage').invoke('getItem', 'userSession').should('exist');
  }

  /**
   * Verify auth token is not stored
   */
  verifyTokenNotStored(): void {
    cy.window().then((win) => {
      expect(win.localStorage.getItem('authToken')).to.be.null;
      expect(win.localStorage.getItem('userSession')).to.be.null;
    });
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    cy.get(this.passwordInput).parent().find('button').first().click();
  }

  /**
   * Verify password is visible
   */
  verifyPasswordVisible(): void {
    cy.get('input[type="text"]').should('exist');
  }

  /**
   * Verify password is hidden
   */
  verifyPasswordHidden(): void {
    cy.get(this.passwordInput).should('exist');
  }
}
