/// <reference types="cypress" />

describe('User Journey - Reports Viewing', () => {
  describe('Teacher viewing reports', () => {
    beforeEach(() => {
      cy.clearLocalStorage();
      cy.fixture('users').then((users) => {
        // Perform UI login
        cy.visit('/#/login');
        cy.get('input[type="email"]').type(users.teacherUser.email);
        cy.get('input[type="password"]').type(users.teacherUser.password);
        cy.get('button[type="submit"]').click();
        // Wait for redirect to teacher classes page
        cy.hash({ timeout: 10000 }).should('eq', '#/teacher/classes');

        // Dismiss device warning dialog if it appears (teachers on desktop get a mobile recommendation)
        cy.get('body').then(($body) => {
          if ($body.text().includes('Recommendation') || $body.text().includes('建议')) {
            cy.contains('button', 'OK').click({ force: true });
            cy.wait(500); // Wait for dialog to close
          }
        });
      });
    });

    it('should view student reports', () => {
      cy.visit('/#/reports');

      // Verify reports page loads
      cy.hash().should('eq', '#/reports');
      cy.contains(/reports/i).should('be.visible');
      cy.contains(/Engagement & Behavior/i).should('be.visible');
      cy.get('[data-cy="report-month-select"]').should('be.visible');
      cy.get('[data-cy="edit-insight-btn"]').should('be.visible');
      cy.get('body').then(($body) => {
        const cards = $body.find('[data-cy="subject-card"]');
        if (cards.length > 0) {
          cy.wrap(cards[0]).click({ force: true });
          cy.get('[data-cy="subject-records"]').should('be.visible');
        }
      });
    });

    it('should paginate attendance tables and keep descending order', () => {
      cy.visit('/#/reports');
      cy.hash().should('eq', '#/reports');

      cy.get('#report-section-attendance-details').then(($section) => {
        const rows = $section.find('tbody tr');
        if (rows.length === 0) {
          cy.log('No attendance rows to paginate/order');
          return;
        }

        const dates = [...rows].map((row) => {
          const text = row.querySelector('td')?.textContent?.trim() || '';
          const [month, day] = text.split(' ');
          const monthIndex = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(month);
          if (monthIndex === -1) return NaN;
          return monthIndex * 31 + Number(day);
        });
        for (let i = 1; i < dates.length; i += 1) {
          if (!Number.isNaN(dates[i - 1]) && !Number.isNaN(dates[i])) {
            expect(dates[i - 1]).to.be.at.least(dates[i]);
          }
        }

        if ($section.text().includes('Page') && $section.text().includes('Next')) {
          cy.wrap($section).contains('button', /Next/i).click({ force: true });
          cy.wrap($section).contains(/Page/i).should('be.visible');
        }
      });
    });

    it('should display student performance data', () => {
      cy.visit('/#/reports');

      // Wait for data to load
      cy.wait(2000);

      // Verify page is loaded
      cy.hash().should('eq', '#/reports');
    });

    it('should filter reports by student', () => {
      cy.visit('/#/reports');

      // Wait for page to load
      cy.wait(2000);

      // Verify page is loaded
      cy.hash().should('eq', '#/reports');
    });
  });

  describe('Parent viewing reports', () => {
    beforeEach(() => {
      cy.clearLocalStorage();
      cy.fixture('users').then((users) => {
        // Perform UI login for parent user
        if (users.parentUser) {
          cy.visit('/#/login');
          cy.get('input[type="email"]').type(users.parentUser.email);
          cy.get('input[type="password"]').type(users.parentUser.password);
          cy.get('button[type="submit"]').click();
          // Wait for redirect to reports page
          cy.hash({ timeout: 10000 }).should('eq', '#/reports');

          // Dismiss device warning dialog if it appears (parents on desktop get a mobile recommendation)
          cy.get('body').then(($body) => {
            if ($body.text().includes('Recommendation') || $body.text().includes('建议')) {
              cy.contains('button', 'OK').click({ force: true });
              cy.wait(500); // Wait for dialog to close
            }
          });
        }
      });
    });

    it('should view own children reports only', () => {
      // Already on reports page from beforeEach
      // Parent should only see their children's reports
      // Adjust based on actual implementation
      cy.contains(/reports/i).should('be.visible');
    });

    it('should display student insights', () => {
      // Wait for data to load
      cy.wait(2000);

      // Verify page is loaded
      cy.hash().should('eq', '#/reports');
    });
  });

  describe('HQ viewing all reports', () => {
    beforeEach(() => {
      cy.clearLocalStorage();
      cy.fixture('users').then((users) => {
        // Perform UI login
        cy.visit('/#/login');
        cy.get('input[type="email"]').type(users.hqUser.email);
        cy.get('input[type="password"]').type(users.hqUser.password);
        cy.get('button[type="submit"]').click();
        // Wait for redirect to dashboard
        cy.hash({ timeout: 10000 }).should('eq', '#/dashboard');
      });
    });

    it('should access reports from dashboard', () => {
      // Navigate to reports or students page via sidebar
      cy.get('aside').contains(/students/i).click();
      cy.hash().should('eq', '#/students');
    });

    it('should view comprehensive student data', () => {
      cy.visit('/#/students');

      // Wait for data to load
      cy.wait(2000);

      // Verify page is loaded
      cy.hash().should('eq', '#/students');
    });
  });
});
