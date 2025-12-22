/// <reference types="cypress" />

/**
 * Frontend <-> Backend Integration Tests
 * Focused smoke coverage for updated UI components and live API integration.
 */

describe('Frontend <-> Backend Integration', () => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:8787/api/v1';

  const expectKpiValue = (label: string, value: number) => {
    cy.contains('h3', label)
      .closest('.rounded-xl')
      .within(() => {
        cy.get('.text-3xl').should('contain', `${value}`);
      });
  };

  it('renders HQ dashboard components and matches KPI counts from API', () => {
    cy.fixture('users').then((users) => {
      cy.login(users.hqUser.email, users.hqUser.password, { redirectPath: '/#/dashboard' });
    });

    cy.hash({ timeout: 10000 }).should('eq', '#/dashboard');
    cy.contains('HQ AI Executive Summary').should('be.visible');
    cy.contains('Last updated:').should('be.visible');

    ['Dashboard', 'Teachers', 'Students', 'Class', 'Locations'].forEach((label) => {
      cy.contains('button', label).should('be.visible');
    });

    cy.window()
      .then((win) => {
        const token = win.localStorage.getItem('authToken');
        expect(token).to.be.a('string');
        return token as string;
      })
      .then((token) => {
        cy.request({
          method: 'GET',
          url: `${apiUrl}/admin/students`,
          headers: { Authorization: `Bearer ${token}` },
        }).then((studentsResponse) => {
          expectKpiValue('Total Students', studentsResponse.body.length);
        });

        cy.request({
          method: 'GET',
          url: `${apiUrl}/admin/locations`,
          headers: { Authorization: `Bearer ${token}` },
        }).then((locationsResponse) => {
          expectKpiValue('Locations', locationsResponse.body.length);
        });

        cy.request({
          method: 'GET',
          url: `${apiUrl}/admin/classes`,
          headers: { Authorization: `Bearer ${token}` },
        }).then((classesResponse) => {
          expectKpiValue('Class', classesResponse.body.length);
        });
      });
  });

  it('creates a location in the UI and confirms it exists via API', () => {
    const locationName = `Cypress Branch ${Date.now()}`;
    const address = '123 Cypress Lane';

    cy.intercept('POST', '**/admin/locations').as('createLocation');

    cy.fixture('users').then((users) => {
      cy.login(users.hqUser.email, users.hqUser.password, { redirectPath: '/#/dashboard' });
    });

    cy.contains('button', 'Locations').click();
    cy.contains('h1', 'Locations').should('be.visible');
    cy.contains('button', 'Add').click();
    cy.contains('Add New Location').should('be.visible');
    cy.get('input[placeholder="e.g. Cheras Branch"]').type(locationName);
    cy.get('input[placeholder="e.g. 123 Jalan Damai"]').type(address);
    cy.contains('button', 'Save').click();

    cy.wait('@createLocation').then(({ response }) => {
      expect(response?.statusCode).to.be.oneOf([200, 201]);
      expect(response?.body?.name).to.eq(locationName);
      const createdId = response?.body?.id;

      cy.contains(locationName).should('be.visible');

      cy.window()
        .then((win) => win.localStorage.getItem('authToken') as string)
        .then((token) => {
          cy.request({
            method: 'GET',
            url: `${apiUrl}/admin/locations`,
            headers: { Authorization: `Bearer ${token}` },
          }).then((listResponse) => {
            const match = listResponse.body.find((loc: { id: string }) => loc.id === createdId);
            expect(match).to.exist;
          });

          if (createdId) {
            cy.request({
              method: 'DELETE',
              url: `${apiUrl}/admin/locations/${createdId}`,
              headers: { Authorization: `Bearer ${token}` },
              failOnStatusCode: false,
            });
          }
        });
    });
  });

  it('saves a teacher score from the UI and verifies backend persistence', () => {
    const scoreValue = '91';
    const today = new Date().toISOString().split('T')[0];
    const timestamp = Date.now();
    const className = `Cypress Teacher Class ${timestamp}`;

    cy.viewport(390, 844);
    cy.intercept('POST', '**/teacher/scores').as('createScore');

    let targetStudentName = '';
    let teacherToken = '';
    let adminToken = '';
    let classId = '';
    let studentId = '';

    cy.fixture('users').then((users) => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/auth/login`,
        body: {
          email: users.hqUser.email,
          password: users.hqUser.password,
        },
      }).then((response) => {
        adminToken = response.body.token;

        cy.request({
          method: 'GET',
          url: `${apiUrl}/admin/locations`,
          headers: { Authorization: `Bearer ${adminToken}` },
        }).then((locationsResponse) => {
          expect(locationsResponse.body.length).to.be.greaterThan(0);
          const locationId = locationsResponse.body[0].id;

          cy.request({
            method: 'GET',
            url: `${apiUrl}/admin/teachers`,
            headers: { Authorization: `Bearer ${adminToken}` },
          }).then((teachersResponse) => {
            const teacher = teachersResponse.body.find((t: { email: string }) => t.email === 'dehoulworker+sarahjenkins@gmail.com');
            expect(teacher).to.exist;

            classId = `c_test_${timestamp}`;

            cy.request({
              method: 'POST',
              url: `${apiUrl}/admin/classes`,
              headers: { Authorization: `Bearer ${adminToken}` },
              body: {
                id: classId,
                name: className,
                grade: '10',
                teacherId: teacher.id,
                locationId,
                defaultSchedule: {
                  dayOfWeek: 'Monday',
                  time: '09:00',
                },
              },
            }).then(() => {
              targetStudentName = `Cypress Student ${timestamp}`;
              studentId = `s_test_${timestamp}`;

              cy.request({
                method: 'POST',
                url: `${apiUrl}/admin/students`,
                headers: { Authorization: `Bearer ${adminToken}` },
                body: {
                  id: studentId,
                  name: targetStudentName,
                  classIds: [classId],
                  attendance: 100,
                  atRisk: false,
                },
              }).then(() => {
                cy.login(users.teacherUser.email, users.teacherUser.password, { redirectPath: '/#/input' });

                cy.hash({ timeout: 10000 }).should('eq', '#/input');
                cy.contains('h1', 'Score Input').should('be.visible');
                cy.get('select').should('be.visible');

                cy.window()
                  .its('localStorage')
                  .invoke('getItem', 'authToken')
                  .should('be.a', 'string')
                  .and('not.be.empty')
                  .then((token) => {
                    teacherToken = token as string;
                  });

                cy.get('select')
                  .first()
                  .find(`option[value="${classId}"]`)
                  .should('exist');
                cy.get('select').first().select(classId);
                cy.get('.md\\:hidden').contains(targetStudentName).should('be.visible');

                cy.contains('button', 'Edit Scores').click();
                cy.get('div')
                  .filter('[class*="md:hidden"][class*="space-y-4"]')
                  .find('.rounded-2xl')
                  .contains('.text-lg', targetStudentName)
                  .parents('.rounded-2xl')
                  .first()
                  .within(() => {
                    cy.get('input[type="number"]').first().clear().type(scoreValue);
                  });

                cy.contains('button', 'Save Score').click();
                cy.wait('@createScore').its('response.statusCode').should('be.oneOf', [200, 201]);

                cy.window()
                  .its('localStorage')
                  .invoke('getItem', 'authToken')
                  .should('be.a', 'string')
                  .and('not.be.empty')
                  .then((token) => {
                    cy.request({
                      method: 'GET',
                      url: `${apiUrl}/teacher/scores`,
                      headers: { Authorization: `Bearer ${token}` },
                    }).then((scoresResponse) => {
                      const match = scoresResponse.body.find((score: { studentId: string; date: string; subject: string; value: number }) => {
                        return score.studentId === studentId && score.date === today && score.subject === 'Exam 1' && score.value === Number(scoreValue);
                      });
                      expect(match).to.exist;
                    });
                  });
              });
            });
          });
        });
      });
    });
  });
});
