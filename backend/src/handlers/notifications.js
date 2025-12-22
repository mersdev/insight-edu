import { jsonResponse } from '../utils/response.js';
import { sendStudentReportEmail, formatNotificationEmail } from '../utils/email.js';

export async function handleSendStudentReportEmail({ params, body, db, env, corsHeaders }) {
  const studentId = params.id;

  try {
    const student = await db
      .prepare('SELECT * FROM students WHERE id = ?')
      .bind(studentId)
      .first();

    if (!student) {
      return jsonResponse(
        { error: 'Not Found', message: 'Student not found' },
        404,
        corsHeaders
      );
    }

    const parentName = student.parent_name || body?.parentName || 'Parent';
    const parentEmail = student.parent_email || formatNotificationEmail(parentName, 'PARENT');
    const message = (body?.message || '').toString().trim();

    try {
      await sendStudentReportEmail({
        env,
        studentName: student.name,
        parentName,
        message: message || `A fresh report is available for ${student.name}.`,
        toEmail: parentEmail,
      });
    } catch (emailError) {
      console.error('Send student report email error:', emailError);
      return jsonResponse(
        { error: 'Email Error', message: 'Failed to send student report email' },
        500,
        corsHeaders
      );
    }

    return jsonResponse({ status: 'sent', to: parentEmail }, 200, corsHeaders);
  } catch (error) {
    console.error('Send student report error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}
