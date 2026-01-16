/// <reference types="cypress" />

export class ApiInterceptor {
  interceptGet(urlPattern: string, response: any): void {
    cy.intercept('GET', urlPattern, response).as('interceptedGet');
  }

  interceptPost(urlPattern: string, response: any): void {
    cy.intercept('POST', urlPattern, response).as('interceptedPost');
  }

  interceptPut(urlPattern: string, response: any): void {
    cy.intercept('PUT', urlPattern, response).as('interceptedPut');
  }

  interceptDelete(urlPattern: string, response: any): void {
    cy.intercept('DELETE', urlPattern, response).as('interceptedDelete');
  }

  waitForGet(alias: string, timeout = 10000): void {
    cy.wait(`@${alias}`, { timeout });
  }

  waitForPost(alias: string, timeout = 10000): void {
    cy.wait(`@${alias}`, { timeout });
  }
}
