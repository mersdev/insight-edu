/// <reference types="cypress" />

/**
 * API Integration Tests - Settings and Users
 * Covers latest admin settings and user management endpoints.
 */

describe('API Integration - Settings and Users', () => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:8787/api/v1';
  let authToken = '';

  beforeEach(() => {
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

  it('GET /admin/settings should return settings payload', () => {
    cy.request({
      method: 'GET',
      url: `${apiUrl}/admin/settings`,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('dashboard_insight');
      expect(response.body).to.have.property('last_analyzed');
    });
  });

  it('PUT /admin/settings should persist updates', () => {
    const newInsight = `Cypress Insight ${Date.now()}`;
    const newAnalyzed = new Date().toISOString();

    cy.request({
      method: 'GET',
      url: `${apiUrl}/admin/settings`,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }).then((currentResponse) => {
      const original = currentResponse.body;

      cy.request({
        method: 'PUT',
        url: `${apiUrl}/admin/settings`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: {
          dashboardInsight: newInsight,
          lastAnalyzed: newAnalyzed,
          insightAutoUpdateHours: 6,
        },
      }).then((updateResponse) => {
        expect(updateResponse.status).to.eq(200);
        expect(updateResponse.body.dashboard_insight).to.eq(newInsight);
        expect(updateResponse.body.last_analyzed).to.eq(newAnalyzed);
      }).then(() => {
        cy.request({
          method: 'PUT',
          url: `${apiUrl}/admin/settings`,
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          body: {
            dashboardInsight: original.dashboard_insight || '',
            lastAnalyzed: original.last_analyzed || '',
            insightAutoUpdateHours: original.insight_auto_update_hours || 12,
          },
        });
      });
    });
  });

  it('GET /admin/users and PUT /admin/users/:id should work', () => {
    cy.request({
      method: 'GET',
      url: `${apiUrl}/admin/users`,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.be.an('array');

      const target = response.body.find((user: { id: string; role: string }) => user.role === 'TEACHER');
      expect(target).to.exist;

      const updatedName = `${target.name} (Cypress)`;

      cy.request({
        method: 'PUT',
        url: `${apiUrl}/admin/users/${target.id}`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: {
          name: updatedName,
          email: target.email,
          role: target.role,
        },
      }).then((updateResponse) => {
        expect(updateResponse.status).to.eq(200);
        expect(updateResponse.body.name).to.eq(updatedName);
      }).then(() => {
        cy.request({
          method: 'PUT',
          url: `${apiUrl}/admin/users/${target.id}`,
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          body: {
            name: target.name,
            email: target.email,
            role: target.role,
          },
        });
      });
    });
  });
});
