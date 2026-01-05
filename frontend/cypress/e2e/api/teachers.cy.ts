/// <reference types="cypress" />

/**
 * API Integration Tests - Teachers
 * Tests all teacher-related API endpoints
 * - Single Responsibility: Tests teachers API only
 * - Verifies CRUD operations and data integrity
 */

describe('API Integration - Teachers', () => {
  const apiUrl = Cypress.env('apiUrl');
  let authToken: string;

  beforeEach(() => {
    // Login as HQ user to get auth token
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

  describe('GET /api/teachers', () => {
    it('should fetch all teachers with valid auth token', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/admin/teachers`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');
        
        // Verify teacher object structure
        if (response.body.length > 0) {
          const teacher = response.body[0];
          expect(teacher).to.have.property('id');
          expect(teacher).to.have.property('name');
          expect(teacher).to.have.property('email');
        }
      });
    });

    it('should fail without auth token', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/admin/teachers`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403]);
      });
    });
  });

  describe('POST /api/teachers', () => {
    it('should create a new teacher with valid data and allow login', () => {
      const timestamp = Date.now();
      const newTeacher = {
        id: `t_test_${timestamp}`,
        name: 'Test Teacher',
        email: `testteacher${timestamp}@test.com`,
        subject: 'Mathematics',
        englishName: 'Test Teacher',
        chineseName: '测试老师',
        phone: '1234567890'
      };

      cy.request({
        method: 'POST',
        url: `${apiUrl}/admin/teachers`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: newTeacher
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body).to.have.property('id');
        expect(response.body).to.have.property('name', newTeacher.name);
        const expectedEmail = newTeacher.email;
        expect(response.body).to.have.property('email', expectedEmail);
        expect(response.body).to.have.property('subject', newTeacher.subject);

        cy.request({
          method: 'POST',
          url: `${apiUrl}/auth/login`,
          body: {
            email: expectedEmail,
            password: '123'
          }
        }).then((loginResponse) => {
          expect(loginResponse.status).to.eq(200);
          expect(loginResponse.body.user).to.have.property('role', 'TEACHER');
        });
      });
    });

    it('should fail without auth token', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/admin/teachers`,
        body: {
          id: 't_test',
          name: 'Test',
          email: 'test@test.com'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403]);
      });
    });
  });

  describe('DELETE /api/teachers/:id', () => {
    let teacherId: string;

    beforeEach(() => {
      // Create a teacher to delete
      const newTeacher = {
        id: `t_delete_${Date.now()}`,
        name: 'Teacher To Delete',
        email: `delete.${Date.now()}@test.com`,
        subject: 'Science'
      };

      cy.request({
        method: 'POST',
        url: `${apiUrl}/admin/teachers`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: newTeacher
      }).then((response) => {
        teacherId = response.body.id;
      });
    });

    it('should delete a teacher with valid auth token', () => {
      cy.request({
        method: 'DELETE',
        url: `${apiUrl}/admin/teachers/${teacherId}`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 204]);
      });

      // Verify teacher is deleted
      cy.request({
        method: 'GET',
        url: `${apiUrl}/admin/teachers`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        const deletedTeacher = response.body.find((t: any) => t.id === teacherId);
        expect(deletedTeacher).to.be.undefined;
      });
    });

    it('should fail without auth token', () => {
      cy.request({
        method: 'DELETE',
        url: `${apiUrl}/admin/teachers/${teacherId}`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403]);
      });
    });
  });
});
