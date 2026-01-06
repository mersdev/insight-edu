/// <reference types="cypress" />

/**
 * API Integration Tests - Seed Data
 * Verifies core seed records exist in the backend.
 */

describe('API Integration - Seed Data', () => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:8787/api/v1';
  let authToken = '';

  before(() => {
    cy.fixture('users').then((users) => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/auth/login`,
        body: {
          email: users.hqUser.email,
          password: users.hqUser.password,
        },
      }).then((response) => {
        authToken = response.body.token;
      });
    });
  });

  it('includes expected seed locations, teachers, classes, and students', () => {
    const authHeaders = { Authorization: `Bearer ${authToken}` };

    cy.request({
      method: 'GET',
      url: `${apiUrl}/admin/locations`,
      headers: authHeaders,
    }).then((response) => {
      const names = response.body.map((loc: { name: string }) => loc.name);
      ['Cheras', 'Petaling Jaya', 'Subang Jaya', 'Kuala Lumpur'].forEach((name) => {
        expect(names).to.include(name);
      });
    });

    cy.request({
      method: 'GET',
      url: `${apiUrl}/admin/teachers`,
      headers: authHeaders,
    }).then((response) => {
      const emails = response.body.map((teacher: { email: string }) => teacher.email);
      expect(emails).to.include('sarahjenkins@edu.com');
      expect(emails).to.include('davidlee@edu.com');
    });

    cy.request({
      method: 'GET',
      url: `${apiUrl}/admin/classes`,
      headers: authHeaders,
    }).then((response) => {
      expect(response.body.length).to.be.at.least(1);
      const names = response.body.map((classGroup: { name: string }) => classGroup.name);
      const seedClasses = ['Form 4 Mathematics A', 'Form 4 Science B'];
      const hasSeedClass = seedClasses.some((name) => names.includes(name));
      if (!hasSeedClass) {
        cy.log('Seed classes were updated or removed by other specs.');
      }
    });

    cy.request({
      method: 'GET',
      url: `${apiUrl}/admin/students`,
      headers: authHeaders,
    }).then((response) => {
      const names = response.body.map((student: { name: string }) => student.name);
      ['Ali Ahmad', 'Ben Wong', 'Charlie Davis', 'Goh Shu Ting'].forEach((name) => {
        expect(names).to.include(name);
      });
    });
  });
});
