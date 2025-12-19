/**
 * Locations Management Page Object - Implements SOLID principles
 * - Single Responsibility: Handles locations page interactions only
 */
import { BasePage } from './BasePage';

export class LocationsPage extends BasePage {
  protected readonly path = '/locations';

  /**
   * Verify locations page is displayed
   */
  verifyLocationsPageDisplayed(): void {
    this.verifyUrl();
    cy.contains(/locations/i).should('be.visible');
  }

  /**
   * Click add location button
   */
  clickAddLocation(): void {
    cy.contains('button', /add/i).click();
    // Wait for dialog to open
    cy.wait(500);
  }

  /**
   * Fill location form
   */
  fillLocationForm(location: {
    name: string;
    address?: string;
  }): void {
    // Use label-based selectors
    cy.contains('label', /location.*name/i).parent().find('input').clear({ force: true }).type(location.name, { force: true });

    if (location.address) {
      cy.contains('label', /address/i).parent().find('input').clear({ force: true }).type(location.address, { force: true });
    }
  }

  /**
   * Submit location form
   */
  submitLocationForm(): void {
    // Wait for submit button to be visible and enabled
    cy.contains('button', /save|submit/i).should('be.visible').should('not.be.disabled').click();
  }

  /**
   * Search for location
   */
  searchLocation(searchTerm: string): void {
    cy.get('input[type="search"], input[placeholder*="Search"]').clear().type(searchTerm);
  }

  /**
   * Verify location exists in list
   */
  verifyLocationExists(name: string): void {
    cy.contains(name).should('be.visible');
  }

  /**
   * Delete location by name
   */
  deleteLocation(name: string): void {
    cy.contains('tr', name).within(() => {
      cy.get('button').last().click();
    });
  }

  /**
   * Verify location count
   */
  verifyLocationCount(count: number): void {
    cy.get('tbody tr').should('have.length', count);
  }

  /**
   * Sort locations
   */
  sortLocations(): void {
    cy.contains('th', /name|location/i).click();
  }
}

