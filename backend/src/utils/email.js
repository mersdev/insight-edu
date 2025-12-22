import { Resend } from 'resend';

const DEFAULT_RESEND_API_KEY = 're_j38joQny_59VXh8QCwRTz3Pv6HJoV27df';
const DEFAULT_FROM = 'Insight EDU <onboarding@resend.dev>';

const sanitizeName = (value = '') => {
  const cleaned = value.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return cleaned || 'user';
};

export const formatNotificationEmail = (name = '', role = '') => {
  const localPart = `dehoulworker+${sanitizeName(name)}`;
  return `${localPart}@gmail.com`;
};

const escapeHtml = (value = '') =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const getResendClient = (env) => {
  if (env?.RESEND_CLIENT) return env.RESEND_CLIENT;
  const apiKey = env?.RESEND_API_KEY || DEFAULT_RESEND_API_KEY;
  return new Resend(apiKey);
};

const sendEmail = async (env, payload) => {
  const resend = getResendClient(env);
  const { data, error } = await resend.emails.send(payload);

  if (error) {
    const message = typeof error === 'string' ? error : error?.message || 'Unknown error';
    throw new Error(message);
  }

  return data;
};

export async function sendLoginEmail({ env, name, role, toEmail }) {
  const recipient = toEmail || formatNotificationEmail(name, role);
  const subject =
    role === 'TEACHER'
      ? 'Your Teacher Account for Insight EDU'
      : 'Your Parent Access for Insight EDU';

  const html = `
    <div>
      <p>Hello ${escapeHtml(name || 'there')},</p>
      <p>Your Insight EDU account has been created.</p>
      <p><strong>Login Email:</strong> ${toEmail}<br />
         <strong>Password:</strong> 123</p>
      <p>Please sign in and change your password after the first login.</p>
    </div>
  `;

  return sendEmail(env, {
    from: DEFAULT_FROM,
    to: [recipient],
    subject,
    html,
  });
}

export async function sendStudentReportEmail({ env, studentName, parentName, message, toEmail }) {
  const recipientEmail = toEmail || formatNotificationEmail(parentName || studentName || 'parent', 'PARENT');
  const safeMessage = escapeHtml(message || `A new report is available for ${studentName}.`);

  const html = `
    <div>
      <p>Hello ${escapeHtml(parentName || 'Parent')},</p>
      <p>Here is the latest update for <strong>${escapeHtml(studentName || 'your child')}</strong>:</p>
      <p>${safeMessage}</p>
      <p>You can view the full report in Insight EDU using the login email <strong>${toEmail}</strong> and password <strong>123</strong>.</p>
    </div>
  `;

  return sendEmail(env, {
    from: DEFAULT_FROM,
    to: [recipientEmail],
    subject: `Student Report for ${studentName || 'your child'}`,
    html,
  });
}
