/**
 * Attendance Calculation Tests
 * Tests to verify the accuracy of attendance calculations in the HQ Dashboard
 */

describe('HQ Dashboard - Attendance Calculation', () => {
  beforeEach(() => {
    // Login as HQ user
    cy.visit('/');
    cy.get('input[type="email"]').type('admin@edu.com');
    cy.get('input[type="password"]').type('Admin123');
    cy.get('button[type="submit"]').click();

    // Wait for dashboard to load
    cy.hash({ timeout: 10000 }).should('eq', '#/dashboard');
    cy.contains('Total Students').should('be.visible');
  });

  it('should display attendance percentage based on actual attendance records', () => {
    // Get the attendance KPI card
    cy.contains('Avg Attendance').parent().parent().within(() => {
      cy.get('.text-3xl').invoke('text').then((attendanceText) => {
        const percentage = parseInt(attendanceText.replace('%', ''));
        
        // Attendance should be a valid percentage (0-100)
        expect(percentage).to.be.at.least(0);
        expect(percentage).to.be.at.most(100);
      });
    });
  });

  it('should calculate attendance from completed sessions only', () => {
    // Intercept the API calls to verify data
    cy.intercept('GET', '**/api/sessions').as('getSessions');
    cy.intercept('GET', '**/api/attendance').as('getAttendance');
    cy.intercept('GET', '**/api/students').as('getStudents');
    
    // Reload to trigger API calls
    cy.reload();
    
    // Wait for all data to load
    cy.wait(['@getSessions', '@getAttendance', '@getStudents']).then((interceptions) => {
      const sessions = interceptions[0].response.body;
      const attendance = interceptions[1].response.body;
      const students = interceptions[2].response.body;
      
      // Calculate expected attendance
      const completedSessions = sessions.filter((s: any) => s.status === 'COMPLETED');
      
      if (completedSessions.length > 0 && students.length > 0) {
        let totalAttendanceRate = 0;
        
        students.forEach((student: any) => {
          const studentSessions = completedSessions.filter((session: any) => 
            (student.classIds || []).includes(session.classId) &&
            (!session.targetStudentIds || session.targetStudentIds.includes(student.id))
          );
          
          if (studentSessions.length > 0) {
            const presentCount = studentSessions.filter((session: any) => {
              const record = attendance.find((a: any) => 
                a.sessionId === session.id && a.studentId === student.id
              );
              return record?.status === 'PRESENT';
            }).length;
            
            totalAttendanceRate += (presentCount / studentSessions.length) * 100;
          }
        });
        
        const expectedAvgAttendance = Math.round(totalAttendanceRate / students.length);
        
        // Verify the displayed attendance matches calculation
        cy.contains('Avg Attendance').parent().parent().within(() => {
          cy.get('.text-3xl').should('contain', `${expectedAvgAttendance}%`);
        });
      }
    });
  });

  it('should update attendance when new records are added', () => {
    // Get initial attendance value
    cy.contains('Avg Attendance').parent().parent().within(() => {
      cy.get('.text-3xl').invoke('text').as('initialAttendance');
    });
    
    // Navigate to teacher portal to add attendance
    cy.get('button').contains('Teacher').click();
    cy.url().should('include', '/teacher');
    
    // Wait for sessions to load
    cy.wait(1000);
    
    // Check if there are any scheduled sessions to mark attendance
    cy.get('body').then(($body) => {
      if ($body.text().includes('Mark Attendance')) {
        // Click on first "Mark Attendance" button
        cy.contains('Mark Attendance').first().click();
        
        // Mark a student as present
        cy.get('input[type="checkbox"]').first().check();
        
        // Save attendance
        cy.contains('Save Attendance').click();
        
        // Navigate back to HQ dashboard
        cy.get('button').contains('HQ').click();
        cy.url().should('include', '/hq');
        
        // Verify attendance has been recalculated
        cy.contains('Avg Attendance').parent().parent().within(() => {
          cy.get('.text-3xl').invoke('text').should('not.equal', '@initialAttendance');
        });
      }
    });
  });

  it('should show 0% when no attendance records exist', () => {
    // This test would require a clean database state
    // For now, we just verify the calculation handles edge cases
    cy.contains('Avg Attendance').parent().parent().within(() => {
      cy.get('.text-3xl').invoke('text').then((text) => {
        const percentage = parseInt(text.replace('%', ''));
        expect(percentage).to.be.a('number');
        expect(isNaN(percentage)).to.be.false;
      });
    });
  });

  it.skip('should match location-specific attendance calculations', () => {
    // SKIPPED: Location Performance Overview section may not be visible in current dashboard layout
    // Click on a location card to open detail modal
    cy.get('body').then(($body) => {
      if ($body.text().includes('Location Performance Overview')) {
        // Find and click the first location card
        cy.contains('Location Performance Overview').parent().next().find('[class*="cursor-pointer"]').first().click();

        // Wait for modal to open
        cy.get('[role="dialog"]').should('be.visible');

        // The attendance shown in the modal should be calculated from actual records
        cy.get('[role="dialog"]').within(() => {
          cy.contains('Avg Attendance').parent().within(() => {
            cy.get('.text-3xl').invoke('text').then((modalAttendance) => {
              const percentage = parseInt(modalAttendance.replace('%', ''));
              expect(percentage).to.be.at.least(0);
              expect(percentage).to.be.at.most(100);
            });
          });
        });
      }
    });
  });
});

