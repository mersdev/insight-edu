/// <reference types="cypress" />

/**
 * API Integration Tests - Sessions and Attendance
 * Tests session and attendance-related API endpoints
 * - Single Responsibility: Tests sessions and attendance API
 * - Verifies data flow and state management
 */

describe('API Integration - Sessions and Attendance', () => {
  const apiUrl = Cypress.env('apiUrl');
  let authToken: string;

  beforeEach(() => {
    cy.fixture('users').then((users) => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/auth/login`,
        body: {
          email: users.hqUser.email,
          password: users.hqUser.password
        }
      }).then((response) => {
        authToken = response.body.token;
      });
    });
  });

  describe('GET /api/sessions', () => {
    it('should fetch all sessions', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/admin/sessions`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');
        
        if (response.body.length > 0) {
          const session = response.body[0];
          expect(session).to.have.property('id');
          expect(session).to.have.property('classId');
          expect(session).to.have.property('date');
          expect(session).to.have.property('status');
        }
      });
    });

    it('should generate sessions for a requested month', () => {
      const targetMonth = '2026-01';

      cy.request({
        method: 'GET',
        url: `${apiUrl}/admin/sessions?month=${targetMonth}`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        const janSessions = (response.body || []).filter((s: any) => (s.date || '').startsWith(targetMonth));
        expect(janSessions.length).to.be.greaterThan(0);
      });
    });
  });

  describe('POST /api/sessions', () => {
    it('should create a new session', () => {
      const timestamp = Date.now();

      // First create a location, teacher, and class
      cy.request({
        method: 'POST',
        url: `${apiUrl}/admin/locations`,
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: {
          id: `loc_test_${timestamp}`,
          name: `Test Location ${timestamp}`,
          address: '123 Test St'
        }
      }).then((locResponse) => {
        const locationId = locResponse.body.id;

        // Create a teacher
        cy.request({
          method: 'POST',
          url: `${apiUrl}/admin/teachers`,
          headers: { 'Authorization': `Bearer ${authToken}` },
          body: {
            id: `t_test_${timestamp}`,
            name: `Test Teacher ${timestamp}`,
            englishName: `Teacher ${timestamp}`,
            email: `teacher.${timestamp}@test.com`,
            phone: '012-345 6789',
              subject: 'Mathematics'
          }
        }).then((teacherResponse) => {
          const teacherId = teacherResponse.body.id;

          // Create a class
          cy.request({
            method: 'POST',
            url: `${apiUrl}/admin/classes`,
            headers: { 'Authorization': `Bearer ${authToken}` },
            body: {
              id: `c_test_${timestamp}`,
              name: `Test Class ${timestamp}`,
              grade: 'Standard 5',
              teacherId: teacherId,
              locationId: locationId
            }
          }).then((classResponse) => {
            const classId = classResponse.body.id;

            // Now create the session
            const newSession = {
              id: `sess_test_${timestamp}`,
              classId: classId,
              date: new Date().toISOString().split('T')[0],
              startTime: '10:00',
              type: 'REGULAR',
              status: 'SCHEDULED'
            };

            cy.request({
              method: 'POST',
              url: `${apiUrl}/admin/sessions`,
              headers: {
                'Authorization': `Bearer ${authToken}`
              },
              body: newSession
            }).then((response) => {
              expect(response.status).to.eq(201);
              expect(response.body).to.have.property('id');
              expect(response.body).to.have.property('classId', newSession.classId);
              expect(response.body).to.have.property('status', newSession.status);
            });
          });
        });
      });
    });
  });

  describe('PUT /api/sessions/:id/status', () => {
    let sessionId: string;

    beforeEach(() => {
      // Get a session ID
      cy.request({
        method: 'GET',
        url: `${apiUrl}/admin/sessions`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        if (response.body.length > 0) {
          sessionId = response.body[0].id;
        }
      });
    });

    it('should update session status to COMPLETED', () => {
      if (sessionId) {
        cy.request({
          method: 'PUT',
          url: `${apiUrl}/admin/sessions/${sessionId}/status`,
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: {
            status: 'COMPLETED'
          }
        }).then((response) => {
          expect(response.status).to.be.oneOf([200, 204]);
        });
      }
    });

    it('should update session status to CANCELLED', () => {
      if (sessionId) {
        cy.request({
          method: 'PUT',
          url: `${apiUrl}/admin/sessions/${sessionId}/status`,
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: {
            status: 'CANCELLED'
          }
        }).then((response) => {
          expect(response.status).to.be.oneOf([200, 204]);
        });
      }
    });
  });

  describe('GET /api/attendance', () => {
    it('should fetch all attendance records', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/teacher/attendance`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');
      });
    });
  });

  describe('POST /api/attendance', () => {
    it('should record attendance', () => {
      const timestamp = Date.now();

      // Create all required data: location -> teacher -> class -> session -> student
      cy.request({
        method: 'POST',
        url: `${apiUrl}/admin/locations`,
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: {
          id: `loc_att_${timestamp}`,
          name: `Attendance Test Location ${timestamp}`,
          address: '456 Test Ave'
        }
      }).then((locResponse) => {
        const locationId = locResponse.body.id;

        cy.request({
          method: 'POST',
          url: `${apiUrl}/admin/teachers`,
          headers: { 'Authorization': `Bearer ${authToken}` },
          body: {
            id: `t_att_${timestamp}`,
            name: `Attendance Teacher ${timestamp}`,
            englishName: `Teacher ${timestamp}`,
            email: `att.teacher.${timestamp}@test.com`,
            phone: '012-345 6789',
            subject: 'Science'
          }
        }).then((teacherResponse) => {
          const teacherId = teacherResponse.body.id;

          cy.request({
            method: 'POST',
            url: `${apiUrl}/admin/classes`,
            headers: { 'Authorization': `Bearer ${authToken}` },
            body: {
              id: `c_att_${timestamp}`,
              name: `Attendance Class ${timestamp}`,
              grade: 'Standard 6',
              teacherId: teacherId,
              locationId: locationId
            }
          }).then((classResponse) => {
            const classId = classResponse.body.id;

            cy.request({
              method: 'POST',
              url: `${apiUrl}/admin/sessions`,
              headers: { 'Authorization': `Bearer ${authToken}` },
              body: {
                id: `sess_att_${timestamp}`,
                classId: classId,
                date: new Date().toISOString().split('T')[0],
                startTime: '14:00',
                type: 'REGULAR',
                status: 'SCHEDULED'
              }
            }).then((sessionResponse) => {
              const sessionId = sessionResponse.body.id;

              // Create a parent user first
              cy.request({
                method: 'POST',
                url: `${apiUrl}/auth/register`,
                headers: { 'Authorization': `Bearer ${authToken}` },
                body: {
                  id: `p_att_${timestamp}`,
                  name: 'Test Parent',
                  email: `parent.${timestamp}@test.com`,
                  password: '123',
                  role: 'PARENT'
                },
                failOnStatusCode: false
              }).then((parentResponse) => {
                const parentId = parentResponse.body.id || `p_att_${timestamp}`;

                cy.request({
                  method: 'POST',
                  url: `${apiUrl}/admin/students`,
                  headers: { 'Authorization': `Bearer ${authToken}` },
                  body: {
                    id: `s_att_${timestamp}`,
                    name: `Attendance Student ${timestamp}`,
                    school: 'Test School',
                    classIds: [classId],
                    parentId: parentId,
                    parentName: 'Test Parent',
                    relationship: 'Father',
                    emergencyContact: '012-345 6789',
                    parentEmail: `parent.${timestamp}@test.com`
                  }
                }).then((studentResponse) => {
                  const studentId = studentResponse.body.id;

                const attendanceRecord = {
                  id: `att_test_${timestamp}`,
                  sessionId: sessionId,
                  studentId: studentId,
                  status: 'PRESENT'
                };

                cy.request({
                  method: 'POST',
                  url: `${apiUrl}/teacher/attendance`,
                  headers: {
                    'Authorization': `Bearer ${authToken}`
                  },
                  body: attendanceRecord
                }).then((response) => {
                  expect(response.status).to.eq(201);
                  expect(response.body).to.have.property('sessionId', sessionId);
                  expect(response.body).to.have.property('studentId', studentId);
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
