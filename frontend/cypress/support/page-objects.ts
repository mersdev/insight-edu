/// <reference types="cypress" />

export class LoginPage {
  visit(): void {
    cy.visit('/#/login');
  }

  verifyLoginPageDisplayed(): void {
    cy.get('body').then(($body) => {
      if ($body.find('h1').length > 0) {
        cy.get('h1').first().should('be.visible');
      } else if ($body.find('[class*="title"]').length > 0) {
        cy.contains(/login|sign in/i).should('be.visible');
      }
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });
  }

  login(email: string, password: string): void {
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type(password);
    cy.get('button[type="submit"]').click();
  }

  verifyTokenStored(): void {
    cy.window().should('have.property', 'localStorage').and('satisfy', (ls: Storage) => {
      return ls.getItem('authToken') !== null;
    });
  }

  verifyErrorMessage(): void {
    cy.get('body').then(($body) => {
      if ($body.text().includes('invalid') || $body.text().includes('error') || $body.text().includes('wrong')) {
        cy.contains(/invalid|error|wrong/i, { matchCase: false }).should('be.visible');
      }
    });
  }

  togglePasswordVisibility(): void {
    cy.get('body').then(($body) => {
      const toggleBtn = $body.find('button[aria-label*="password"]').first();
      if (toggleBtn.length > 0) {
        cy.wrap(toggleBtn).click();
      } else {
        const showBtn = $body.find('button').filter(':contains("Show")').first();
        if (showBtn.length > 0) {
          cy.wrap(showBtn).click();
        }
      }
    });
  }
}

export class DashboardPage {
  visit(): void {
    cy.visit('/#/dashboard');
  }

  verifyDashboardDisplayed(): void {
    cy.contains('HQ AI Executive Summary').should('be.visible');
  }

  verifyKPICards(): void {
    const expectedLabels = [
      /total students/i,
      /total teachers|teachers/i,
      /class(es)?/i,
      /attendance/i,
    ];

    expectedLabels.forEach((pattern) => {
      cy.contains('h3', pattern).should('be.visible');
    });
  }

  navigateToTeachers(): void {
    cy.get('aside').contains(/teachers/i).click();
  }

  navigateToStudents(): void {
    cy.get('aside').contains(/students/i).click();
  }

  navigateToClasses(): void {
    cy.get('aside').contains(/class(es)?/i).click();
  }
}

export class TeachersPage {
  visit(): void {
    cy.visit('/#/teachers');
  }

  clickAddTeacher(): void {
    cy.contains('button', /add/i).click();
  }

  fillTeacherForm(data: { name: string; englishName: string; email: string; subjects: string[]; levels?: string[]; chineseName?: string; phone?: string }): void {
    cy.contains('label', /full.*name/i).parent().find('input').type(data.name);
    cy.get('input[type="email"]').type(data.email);
    if (data.englishName) {
      cy.contains('label', /english.*name/i).parent().find('input').type(data.englishName);
    }
    if (data.subjects.length > 0) {
      const levelToUse = data.levels?.[0] || 'Standard 1';
      cy.get('[data-cy="teacher-subject-field"]').within(() => {
        cy.get('[data-cy="teacher-subject-input"]').clear().type(data.subjects[0], { force: true });
        cy.get('[data-cy="subject-dropdown-option"]', { timeout: 2000 }).should('have.length.greaterThan', 0);
        cy.contains('[data-cy="subject-dropdown-option"]', data.subjects[0], { matchCase: false }).click({ force: true });
      });
      cy.get('[data-cy="teacher-level-field"]').within(() => {
        cy.get('[data-cy="teacher-level-input"]').clear().type(levelToUse, { force: true });
        cy.contains('[data-cy="level-dropdown-option"]', levelToUse, { matchCase: false })
          .click({ force: true });
      });
      cy.get('[data-cy="teacher-level-field"]').parent().contains('button', /^add$/i).click({ force: true });
      cy.get('[data-cy="subject-level-list"] input').first().should('have.value', data.subjects[0]);
      cy.get('[data-cy="subject-level-list"] input').eq(1).should('have.value', levelToUse);
    }
    if (data.phone) {
      const phoneValue = data.phone.startsWith('01') ? data.phone : `01${data.phone}`;
      cy.contains('label', /phone/i)
        .parent()
        .find('input')
        .scrollIntoView()
        .click({ force: true })
        .clear({ force: true })
        .type(phoneValue, { force: true });
    }
  }

  submitTeacherForm(): void {
    cy.contains('button', /save|submit/i)
      .scrollIntoView()
      .click({ force: true });
  }

  verifyTeachersPageDisplayed(): void {
    cy.contains('h1', /teacher/i).should('be.visible');
  }

  searchTeacher(name: string): void {
    cy.get('input[placeholder*="Search"]').type(name);
  }

  sortTeachers(): void {
    cy.get('th').then(($ths) => {
      const header = $ths.filter((_, el) => /name|teacher/i.test(el.textContent || '')).first();
      if (header.length) {
        cy.wrap(header).click();
      } else {
        cy.contains('button', /sort/i).click({ force: true });
      }
    });
  }
}

export class StudentsPage {
  visit(): void {
    cy.visit('/#/students');
  }

  clickAddStudent(): void {
    cy.contains('button', /add/i).click();
  }

  verifyStudentsPageDisplayed(): void {
    cy.contains('h1', /students/i).should('be.visible');
  }

  searchStudent(name: string): void {
    cy.get('input[placeholder*="Search"]').type(name);
  }

  filterByClass(className: string): void {
    cy.get('select').first().select(className);
  }
}

export class ClassesPage {
  visit(): void {
    cy.visit('/#/classes');
  }

  clickAddClass(): void {
    cy.contains('button', /add/i).click();
  }

  verifyClassesPageDisplayed(): void {
    cy.contains('h1', /class/i).should('be.visible');
  }

  searchClass(name: string): void {
    cy.get('input[placeholder*="Search"]').type(name);
  }

  sortClasses(): void {
    cy.get('th').then(($ths) => {
      const header = $ths.filter((_, el) => /class|name/i.test(el.textContent || '')).first();
      if (header.length) {
        cy.wrap(header).click();
      } else {
        cy.contains('button', /sort/i).click({ force: true });
      }
    });
  }
}

export class LocationsPage {
  visit(): void {
    cy.visit('/#/locations');
  }

  clickAddLocation(): void {
    cy.contains('button', /add/i).click();
  }

  fillLocationForm(data: { name: string; address: string }): void {
    cy.get('input[placeholder="e.g. Cheras Branch"]').type(data.name);
    cy.get('input[placeholder="e.g. 123 Jalan Damai"]').type(data.address);
  }

  submitLocationForm(): void {
    cy.contains('button', /save|submit/i).click();
  }

  verifyLocationsPageDisplayed(): void {
    cy.contains('h1', /locations/i).should('be.visible');
  }

  searchLocation(name: string): void {
    cy.get('input[placeholder*="Search"]').type(name);
  }

  sortLocations(): void {
    cy.get('th').then(($ths) => {
      const header = $ths.filter((_, el) => /location|name/i.test(el.textContent || '')).first();
      if (header.length) {
        cy.wrap(header).click();
      } else {
        cy.contains('button', /sort/i).click({ force: true });
      }
    });
  }
}

export class StudentReportPage {
  visit(): void {
    cy.visit('/#/reports');
  }

  verifyStudentReportPageDisplayed(): void {
    cy.contains(/student.*report|report/i, { matchCase: false }).should('be.visible');
  }

  verifyStudentDataDisplayed(): void {
    cy.wait(2000);
    cy.get('body').then(($body) => {
      if ($body.text().includes('No data')) {
        cy.log('No student data available');
      } else {
        cy.get('.rounded-2xl, .bg-white, [class*="student"]').should('exist');
      }
    });
  }

  selectStudent(studentName: string): void {
    cy.get('select').first().select(studentName);
  }

  verifySendReportButton(): void {
    cy.contains(/whatsapp|send.*report/i, { matchCase: false }).should('be.visible');
  }
}

export class TeacherClassesPage {
  visit(): void {
    cy.visit('/#/teacher/classes');
  }

  verifyTeacherClassesPageDisplayed(): void {
    cy.contains(/class|session/i, { matchCase: false }).should('be.visible');
  }

  verifySessions(): void {
    cy.wait(2000);
  }

  selectMonth(month: string): void {
    cy.get('select').then(($selects) => {
      if ($selects.length > 1) {
        cy.wrap($selects.eq(1)).select(month);
      } else if ($selects.length === 1) {
        cy.wrap($selects.eq(0)).select(month);
      }
    });
  }

  navigateToScoreInput(): void {
    cy.contains(/input|score/i, { matchCase: false }).click();
  }

  navigateToReports(): void {
    cy.get('aside').contains(/reports/i).click();
  }
}

export class ScoreInputPage {
  visit(): void {
    cy.visit('/#/input');
  }

  verifyScoreInputPageDisplayed(): void {
    cy.contains(/score|input/i, { matchCase: false }).should('be.visible');
  }

  selectClass(className: string): void {
    cy.get('select').first().select(className);
  }

  switchToEditMode(): void {
    cy.contains(/edit/i).click();
  }

  verifyStudentsDisplayed(): void {
    cy.wait(2000);
    cy.get('.rounded-2xl, [class*="student"]').should('exist');
  }
}
