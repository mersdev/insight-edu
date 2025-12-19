/**
 * Student Attendance Synchronization Script
 * 
 * This script updates the static student.attendance field in the database
 * based on actual attendance records for backward compatibility.
 * 
 * Usage:
 *   node scripts/sync-student-attendance.js
 *   node scripts/sync-student-attendance.js --dry-run
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'insight_edu',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const isDryRun = process.argv.includes('--dry-run');

/**
 * Calculate attendance percentage for a student
 */
async function calculateStudentAttendance(studentId, classIds) {
  try {
    // Get all completed sessions for this student's classes
    const sessionsQuery = `
      SELECT id, class_id, target_student_ids
      FROM sessions
      WHERE class_id = ANY($1::varchar[])
        AND status = 'COMPLETED'
    `;
    const sessionsResult = await pool.query(sessionsQuery, [classIds]);
    
    // Filter sessions that apply to this student
    const applicableSessions = sessionsResult.rows.filter(session => {
      const targetIds = session.target_student_ids;
      // If no target IDs, session applies to all students in the class
      if (!targetIds || targetIds.length === 0) return true;
      // Otherwise, check if student is in target list
      return targetIds.includes(studentId);
    });
    
    if (applicableSessions.length === 0) {
      return 0;
    }
    
    // Get attendance records for these sessions
    const sessionIds = applicableSessions.map(s => s.id);
    const attendanceQuery = `
      SELECT status
      FROM attendance
      WHERE student_id = $1
        AND session_id = ANY($2::varchar[])
    `;
    const attendanceResult = await pool.query(attendanceQuery, [studentId, sessionIds]);
    
    // Count present records
    const presentCount = attendanceResult.rows.filter(r => r.status === 'PRESENT').length;
    
    // Calculate percentage
    const percentage = Math.round((presentCount / applicableSessions.length) * 100);
    
    return percentage;
  } catch (error) {
    console.error(`Error calculating attendance for student ${studentId}:`, error.message);
    return null;
  }
}

/**
 * Sync all student attendance records
 */
async function syncAllStudents() {
  try {
    console.log('🔄 Starting student attendance synchronization...\n');
    
    if (isDryRun) {
      console.log('📋 DRY RUN MODE - No changes will be made to the database\n');
    }
    
    // Get all students
    const studentsQuery = 'SELECT id, name, class_ids, attendance FROM students ORDER BY id';
    const studentsResult = await pool.query(studentsQuery);
    
    console.log(`Found ${studentsResult.rows.length} students\n`);
    
    let updatedCount = 0;
    let unchangedCount = 0;
    let errorCount = 0;
    
    for (const student of studentsResult.rows) {
      const calculatedAttendance = await calculateStudentAttendance(student.id, student.class_ids);
      
      if (calculatedAttendance === null) {
        errorCount++;
        continue;
      }
      
      const currentAttendance = student.attendance || 0;
      const difference = calculatedAttendance - currentAttendance;
      
      if (currentAttendance !== calculatedAttendance) {
        console.log(`📊 ${student.name} (${student.id})`);
        console.log(`   Current: ${currentAttendance}% → Calculated: ${calculatedAttendance}% (${difference > 0 ? '+' : ''}${difference}%)`);
        
        if (!isDryRun) {
          await pool.query(
            'UPDATE students SET attendance = $1 WHERE id = $2',
            [calculatedAttendance, student.id]
          );
          console.log(`   ✅ Updated\n`);
        } else {
          console.log(`   🔍 Would update (dry run)\n`);
        }
        
        updatedCount++;
      } else {
        unchangedCount++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📈 Synchronization Summary:');
    console.log('='.repeat(60));
    console.log(`Total students: ${studentsResult.rows.length}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Unchanged: ${unchangedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('='.repeat(60));
    
    if (isDryRun) {
      console.log('\n💡 Run without --dry-run to apply changes');
    } else {
      console.log('\n✅ Synchronization complete!');
    }
    
  } catch (error) {
    console.error('❌ Error during synchronization:', error);
    throw error;
  }
}

// Main execution
(async () => {
  try {
    await syncAllStudents();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();

