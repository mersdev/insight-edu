/// <reference types="cypress" />

/**
 * API Integration Tests - Classes and Locations
 * Tests class and location-related API endpoints
 * - Single Responsibility: Tests classes and locations API
 * - Verifies CRUD operations and relationships
 */

describe('API Integration - Classes and Locations', () => {
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

  describe('GET /api/locations', () => {
    it('should fetch all locations', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/admin/locations`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');
      });
    });
  });

  describe('POST /api/locations', () => {
    it('should create a new location', () => {
      const timestamp = Date.now();
      const newLocation = {
        id: `l_test_${timestamp}`,
        name: `Test Location ${timestamp}`,
        address: '123 Test Street'
      };

      cy.request({
        method: 'POST',
        url: `${apiUrl}/admin/locations`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: newLocation
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body).to.have.property('id');
        expect(response.body).to.have.property('name', newLocation.name);
        expect(response.body).to.have.property('address', newLocation.address);
      });
    });
  });

  describe('GET /api/classes', () => {
    it('should fetch all classes', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/admin/classes`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');

        response.body.forEach((classGroup) => {
          expect(classGroup).to.have.property('id');
          expect(classGroup).to.have.property('name');
          expect(classGroup).to.have.property('teacherId');
          expect(classGroup).to.have.property('locationId');
          expect(classGroup).to.have.nested.property('defaultSchedule.dayOfWeek');
          expect(classGroup).to.have.nested.property('defaultSchedule.time');
        });
      });
    });
  });

  describe('POST /api/classes', () => {
    let locationId: string;
    let teacherId: string;

    beforeEach(() => {
      // Create a location first
      const timestamp = Date.now();
      cy.request({
        method: 'POST',
        url: `${apiUrl}/admin/locations`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: {
          id: `l_class_test_${timestamp}`,
          name: `Class Test Location ${timestamp}`,
          address: 'Test Address'
        }
      }).then((response) => {
        locationId = response.body.id;
      });

      // Get a teacher
      cy.request({
        method: 'GET',
        url: `${apiUrl}/admin/teachers`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        if (response.body.length > 0) {
          teacherId = response.body[0].id;
        }
      });
    });

    it('should create a new class with valid data', () => {
      const timestamp = Date.now();
      const newClass = {
        id: `c_test_${timestamp}`,
        name: `Test Class ${timestamp}`,
        grade: 'Grade 5',
        teacherId: teacherId,
        locationId: locationId,
        defaultSchedule: {
          dayOfWeek: 'Monday',
          time: '10:00'
        }
      };

      cy.request({
        method: 'POST',
        url: `${apiUrl}/admin/classes`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: newClass
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body).to.have.property('id');
        expect(response.body).to.have.property('name', newClass.name);
        expect(response.body).to.have.property('grade', newClass.grade);
        expect(response.body).to.have.property('teacherId', newClass.teacherId);
        expect(response.body).to.have.property('locationId', newClass.locationId);
        expect(response.body).to.have.nested.property('defaultSchedule.dayOfWeek', newClass.defaultSchedule.dayOfWeek);
        expect(response.body).to.have.nested.property('defaultSchedule.time', newClass.defaultSchedule.time);

        cy.request({
          method: 'GET',
          url: `${apiUrl}/admin/classes/${response.body.id}`,
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }).then((getResponse) => {
          expect(getResponse.status).to.eq(200);
          expect(getResponse.body).to.have.nested.property('defaultSchedule.dayOfWeek', newClass.defaultSchedule.dayOfWeek);
          expect(getResponse.body).to.have.nested.property('defaultSchedule.time', newClass.defaultSchedule.time);
        });
      });
    });

    it('should normalize default schedule when omitted', () => {
      const timestamp = Date.now();
      const newClass = {
        id: `c_test_${timestamp}_nosched`,
        name: `Test Class Without Schedule ${timestamp}`,
        grade: 'Grade 5',
        teacherId: teacherId,
        locationId: locationId
      };

      cy.request({
        method: 'POST',
        url: `${apiUrl}/admin/classes`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: newClass
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body).to.have.property('id');
        expect(response.body).to.have.nested.property('defaultSchedule.dayOfWeek', null);
        expect(response.body).to.have.nested.property('defaultSchedule.time', null);

        cy.request({
          method: 'GET',
          url: `${apiUrl}/admin/classes/${response.body.id}`,
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }).then((getResponse) => {
          expect(getResponse.status).to.eq(200);
          expect(getResponse.body).to.have.nested.property('defaultSchedule.dayOfWeek', null);
          expect(getResponse.body).to.have.nested.property('defaultSchedule.time', null);
        });
      });
    });
  });

  describe('DELETE /api/classes/:id', () => {
    let classId: string;

    beforeEach(() => {
      // Create a class to delete
      cy.request({
        method: 'GET',
        url: `${apiUrl}/admin/classes`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        if (response.body.length > 0) {
          classId = response.body[0].id;
        }
      });
    });

    it('should delete a class', () => {
      if (classId) {
        cy.request({
          method: 'DELETE',
          url: `${apiUrl}/admin/classes/${classId}`,
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }).then((response) => {
          expect(response.status).to.be.oneOf([200, 204]);
        });
      }
    });
  });
});
