/**
 * API Interceptor - Implements SOLID principles
 * - Single Responsibility: Handles API request/response interception
 * - Interface Segregation: Provides specific methods for different API endpoints
 * - Dependency Inversion: Depends on Cypress abstraction
 */

export class ApiInterceptor {
  private readonly baseUrl = 'http://localhost:3000/api';

  /**
   * Intercept login request
   */
  interceptLogin(alias: string = 'loginRequest'): void {
    cy.intercept('POST', `${this.baseUrl}/auth/login`).as(alias);
  }

  /**
   * Intercept change password request
   */
  interceptChangePassword(alias: string = 'changePasswordRequest'): void {
    cy.intercept('POST', `${this.baseUrl}/auth/change-password`).as(alias);
  }

  /**
   * Intercept fetch teachers request
   */
  interceptFetchTeachers(alias: string = 'fetchTeachers'): void {
    cy.intercept('GET', `${this.baseUrl}/teachers`).as(alias);
  }

  /**
   * Intercept create teacher request
   */
  interceptCreateTeacher(alias: string = 'createTeacher'): void {
    cy.intercept('POST', `${this.baseUrl}/teachers`).as(alias);
  }

  /**
   * Intercept delete teacher request
   */
  interceptDeleteTeacher(alias: string = 'deleteTeacher'): void {
    cy.intercept('DELETE', `${this.baseUrl}/teachers/*`).as(alias);
  }

  /**
   * Intercept fetch students request
   */
  interceptFetchStudents(alias: string = 'fetchStudents'): void {
    cy.intercept('GET', `${this.baseUrl}/students`).as(alias);
  }

  /**
   * Intercept create student request
   */
  interceptCreateStudent(alias: string = 'createStudent'): void {
    cy.intercept('POST', `${this.baseUrl}/students`).as(alias);
  }

  /**
   * Intercept update student request
   */
  interceptUpdateStudent(alias: string = 'updateStudent'): void {
    cy.intercept('PUT', `${this.baseUrl}/students/*`).as(alias);
  }

  /**
   * Intercept delete student request
   */
  interceptDeleteStudent(alias: string = 'deleteStudent'): void {
    cy.intercept('DELETE', `${this.baseUrl}/students/*`).as(alias);
  }

  /**
   * Intercept fetch classes request
   */
  interceptFetchClasses(alias: string = 'fetchClasses'): void {
    cy.intercept('GET', `${this.baseUrl}/classes`).as(alias);
  }

  /**
   * Intercept create class request
   */
  interceptCreateClass(alias: string = 'createClass'): void {
    cy.intercept('POST', `${this.baseUrl}/classes`).as(alias);
  }

  /**
   * Intercept delete class request
   */
  interceptDeleteClass(alias: string = 'deleteClass'): void {
    cy.intercept('DELETE', `${this.baseUrl}/classes/*`).as(alias);
  }

  /**
   * Intercept fetch locations request
   */
  interceptFetchLocations(alias: string = 'fetchLocations'): void {
    cy.intercept('GET', `${this.baseUrl}/locations`).as(alias);
  }

  /**
   * Intercept create location request
   */
  interceptCreateLocation(alias: string = 'createLocation'): void {
    cy.intercept('POST', `${this.baseUrl}/locations`).as(alias);
  }

  /**
   * Intercept delete location request
   */
  interceptDeleteLocation(alias: string = 'deleteLocation'): void {
    cy.intercept('DELETE', `${this.baseUrl}/locations/*`).as(alias);
  }

  /**
   * Intercept fetch sessions request
   */
  interceptFetchSessions(alias: string = 'fetchSessions'): void {
    cy.intercept('GET', `${this.baseUrl}/sessions`).as(alias);
  }

  /**
   * Intercept create session request
   */
  interceptCreateSession(alias: string = 'createSession'): void {
    cy.intercept('POST', `${this.baseUrl}/sessions`).as(alias);
  }

  /**
   * Intercept update session status request
   */
  interceptUpdateSessionStatus(alias: string = 'updateSessionStatus'): void {
    cy.intercept('PUT', `${this.baseUrl}/sessions/*/status`).as(alias);
  }

  /**
   * Intercept fetch attendance request
   */
  interceptFetchAttendance(alias: string = 'fetchAttendance'): void {
    cy.intercept('GET', `${this.baseUrl}/attendance`).as(alias);
  }

  /**
   * Intercept record attendance request
   */
  interceptRecordAttendance(alias: string = 'recordAttendance'): void {
    cy.intercept('POST', `${this.baseUrl}/attendance`).as(alias);
  }

  /**
   * Intercept fetch scores request
   */
  interceptFetchScores(alias: string = 'fetchScores'): void {
    cy.intercept('GET', `${this.baseUrl}/scores`).as(alias);
  }

  /**
   * Intercept fetch behaviors request
   */
  interceptFetchBehaviors(alias: string = 'fetchBehaviors'): void {
    cy.intercept('GET', `${this.baseUrl}/behaviors`).as(alias);
  }

  /**
   * Intercept record behavior request
   */
  interceptRecordBehavior(alias: string = 'recordBehavior'): void {
    cy.intercept('POST', `${this.baseUrl}/behaviors`).as(alias);
  }

  /**
   * Intercept fetch student insights request
   */
  interceptFetchStudentInsight(alias: string = 'fetchStudentInsight'): void {
    cy.intercept('GET', `${this.baseUrl}/student-insights/*`).as(alias);
  }

  /**
   * Intercept save student insights request
   */
  interceptSaveStudentInsight(alias: string = 'saveStudentInsight'): void {
    cy.intercept('POST', `${this.baseUrl}/student-insights`).as(alias);
  }

  /**
   * Intercept fetch settings request
   */
  interceptFetchSettings(alias: string = 'fetchSettings'): void {
    cy.intercept('GET', `${this.baseUrl}/settings`).as(alias);
  }

  /**
   * Intercept update settings request
   */
  interceptUpdateSettings(alias: string = 'updateSettings'): void {
    cy.intercept('PUT', `${this.baseUrl}/settings`).as(alias);
  }

  /**
   * Wait for API request to complete
   */
  waitForRequest(alias: string, timeout: number = 10000): void {
    cy.wait(`@${alias}`, { timeout });
  }

  /**
   * Verify API request was successful
   */
  verifyRequestSuccess(alias: string): void {
    cy.wait(`@${alias}`).its('response.statusCode').should('eq', 200);
  }

  /**
   * Verify API request failed
   */
  verifyRequestFailed(alias: string, statusCode: number = 400): void {
    cy.wait(`@${alias}`).its('response.statusCode').should('eq', statusCode);
  }
}

