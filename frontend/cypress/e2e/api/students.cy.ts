/// <reference types="cypress" />

/**
 * API Integration Tests - Students
 * Tests all student-related API endpoints
 * - Single Responsibility: Tests students API only
 * - Verifies CRUD operations and data integrity
 */

describe('API Integration - Students', () => {
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

  describe('GET /api/students', () => {
    it('should fetch all students with valid auth token', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/admin/students`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');
        
        // Verify student object structure
        if (response.body.length > 0) {
          const student = response.body[0];
          expect(student).to.have.property('id');
          expect(student).to.have.property('name');
          expect(student).to.have.property('classIds');
          expect(student.classIds).to.be.an('array');
        }
      });
    });

    it('should fail without auth token', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/admin/students`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403]);
      });
    });
  });

  describe('POST /api/students', () => {
    it('should create a new student with valid data and allow parent login', () => {
      const timestamp = Date.now();
      const newStudent = {
        id: `s_test_${timestamp}`,
        name: 'Test Student',
        parent_id: `p_test_${timestamp}`,
        class_ids: [],
        attendance: 100,
        at_risk: false,
        school: 'Test School',
        parent_name: 'Test Parent',
        relationship: 'Father',
        emergency_contact: '1234567890',
        parent_email: `dehoulworker+testparent${timestamp}@gmail.com`
      };

      cy.request({
        method: 'POST',
        url: `${apiUrl}/admin/students`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: newStudent
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body).to.have.property('id');
        expect(response.body).to.have.property('name', newStudent.name);
        const expectedParentEmail = newStudent.parent_email;
        expect(response.body).to.have.property('parentEmail', expectedParentEmail);

        cy.request({
          method: 'POST',
          url: `${apiUrl}/auth/login`,
          body: {
            email: expectedParentEmail,
            password: '123'
          }
        }).then((loginResponse) => {
          expect(loginResponse.status).to.eq(200);
          expect(loginResponse.body.user).to.have.property('role', 'PARENT');
        });
      });
    });

    it('should fail without auth token', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/admin/students`,
        body: {
          id: 's_test',
          name: 'Test',
          classIds: []
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403]);
      });
    });
  });

  describe('PUT /api/students/:id', () => {
    let studentId: string;
    let parentId: string;

    beforeEach(() => {
      // Create a student to update
      parentId = `p_update_${Date.now()}`;
      const newStudent = {
        id: `s_update_${Date.now()}`,
        name: 'Student To Update',
        parentId,
        classIds: [],
        attendance: 100,
        atRisk: false
      };

      cy.request({
        method: 'POST',
        url: `${apiUrl}/admin/students`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: newStudent
      }).then((response) => {
        studentId = response.body.id;
      });
    });

    it('should update a student with valid data', () => {
      const updatedStudent = {
        id: studentId,
        name: 'Updated Student Name',
        parent_id: parentId,
        class_ids: [],
        attendance: 95,
        at_risk: false
      };

      cy.request({
        method: 'PUT',
        url: `${apiUrl}/admin/students/${studentId}`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: updatedStudent
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('name', updatedStudent.name);
        expect(response.body).to.have.property('attendance', updatedStudent.attendance);
      });
    });
  });

  describe('DELETE /api/students/:id', () => {
    let studentId: string;

    beforeEach(() => {
      // Create a student to delete
      const newStudent = {
        id: `s_delete_${Date.now()}`,
        name: 'Student To Delete',
        parentId: 'p_test',
        classIds: [],
        attendance: 100,
        atRisk: false
      };

      cy.request({
        method: 'POST',
        url: `${apiUrl}/admin/students`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: newStudent
      }).then((response) => {
        studentId = response.body.id;
      });
    });

    it('should delete a student with valid auth token', () => {
      cy.request({
        method: 'DELETE',
        url: `${apiUrl}/admin/students/${studentId}`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 204]);
      });
    });
  });
});
