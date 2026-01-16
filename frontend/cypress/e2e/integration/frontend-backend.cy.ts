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

    ['Dashboard', 'Teachers', 'Students', 'Class'].forEach((label) => {
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
          url: `${apiUrl}/admin/classes`,
          headers: { Authorization: `Bearer ${token}` },
        }).then((classesResponse) => {
          expectKpiValue('Class', classesResponse.body.length);
        });
      });
  });

  it('saves a teacher score from the UI and verifies backend persistence', () => {
    const scoreValue = '91';
    const timestamp = Date.now();
    const className = `Cypress Teacher Class ${timestamp}`;
    let subjectLabel = 'Exam 1';

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
          url: `${apiUrl}/admin/teachers`,
          headers: { Authorization: `Bearer ${adminToken}` },
        }).then((teachersResponse) => {
          const teacher = teachersResponse.body.find((t: { email: string }) => t.email === 'sarahjenkins@edu.com');
          expect(teacher).to.exist;

          classId = `c_test_${timestamp}`;

          cy.request({
            method: 'POST',
            url: `${apiUrl}/admin/classes`,
            headers: { Authorization: `Bearer ${adminToken}` },
            body: {
              id: classId,
              name: className,
              grade: 'Form 4',
              teacherId: teacher.id,
              defaultSchedule: {
                days: ['Monday'],
                time: '09:00',
                durationMinutes: 60,
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
                at_risk: false,
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
              cy.get('[class*="md:hidden"]').contains(targetStudentName).should('be.visible');

              cy.contains('button', 'Edit Scores').click();
              cy.get('[class*="md:hidden"] label span')
                .first()
                .invoke('text')
                .then((text) => {
                  if (text && text.trim()) {
                    subjectLabel = text.trim();
                  }
                });

              cy.get('div')
                .filter('[class*="md:hidden"][class*="space-y-4"]')
                .find('.rounded-2xl')
                .contains('.text-lg', targetStudentName)
                .parents('.rounded-2xl')
                .first()
                .within(() => {
                  cy.get('input[type="number"]')
                    .first()
                    .scrollIntoView()
                    .clear({ force: true })
                    .type(scoreValue, { force: true });
                });

              cy.contains('button', 'Save Score').click();

              let createdScoreId: string | undefined;
              cy.wait('@createScore').then(({ response }) => {
                expect(response?.statusCode).to.be.oneOf([200, 201]);
                expect(response?.body).to.have.property('studentId', studentId);
                expect(response?.body).to.have.property('subject', subjectLabel);
                expect(response?.body).to.have.property('value', Number(scoreValue));
                createdScoreId = response?.body.id;
              });

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
                    expect(scoresResponse.status).to.eq(200);
                    expect(scoresResponse.body).to.be.an('array');
                    const match = scoresResponse.body.find((score: { id?: string; studentId: string; date: string; subject: string; value: number }) => {
                      if (createdScoreId && score.id === createdScoreId) return true;
                      return score.studentId === studentId && score.subject === subjectLabel && score.value === Number(scoreValue);
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
