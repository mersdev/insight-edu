import { Resend } from 'resend';

const DEFAULT_RESEND_API_KEY = '';
const DEFAULT_FROM = 'Insight EDU <onboarding@resend.dev>';
const LOGIN_URL = 'https://insight-edu-frontend.pages.dev';

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
  const apiKey = env?.RESEND_API_KEY || process?.env?.RESEND_API_KEY || DEFAULT_RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  return new Resend(apiKey);
};

const wrapEmailContent = ({ title, subtitle, body }) => `
  <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f6f8fb; padding: 24px; color: #0f172a;">
    <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);">
      <div style="background: #0f172a; color: #ffffff; padding: 20px 24px;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">${title}</h1>
        ${
          subtitle
            ? `<p style="margin: 6px 0 0; font-size: 14px; color: #e2e8f0;">${subtitle}</p>`
            : ''
        }
      </div>
      <div style="padding: 24px; line-height: 1.6; font-size: 15px;">${body}</div>
    </div>
  </div>
`;

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
  const loginEmail = escapeHtml(toEmail || recipient);
  const subject =
    role === 'TEACHER'
      ? 'Your Teacher Account for Insight EDU'
      : 'Your Parent Access for Insight EDU';

  const roleLabel = role === 'TEACHER' ? 'Teacher' : 'Parent';

  const html = wrapEmailContent({
    title: 'Welcome to Insight EDU',
    subtitle: `${roleLabel} access details`,
    body: `
      <p style="margin: 0 0 12px;">Hello ${escapeHtml(name || 'there')},</p>
      <p style="margin: 0 0 16px;">Your ${roleLabel.toLowerCase()} account is ready. Use the details below to sign in.</p>
      <div style="padding: 14px 16px; background: #f1f5f9; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
        <p style="margin: 0 0 6px;"><strong>Login email:</strong> ${loginEmail}</p>
        <p style="margin: 0;"><strong>Temporary password:</strong> 123</p>
      </div>
      <p style="margin: 0 0 8px; font-weight: 600;">How to sign in</p>
      <ol style="margin: 0 0 18px 20px; padding: 0; color: #0f172a;">
        <li style="margin: 0 0 8px;">Open Insight EDU at <a href="${LOGIN_URL}" style="color: #0f172a; text-decoration: underline;">${LOGIN_URL}</a>.</li>
        <li style="margin: 0 0 8px;">Enter your login email and temporary password.</li>
        <li style="margin: 0;">Create a new password when prompted to keep your account secure.</li>
      </ol>
      <div style="text-align: center; margin: 22px 0 16px;">
        <a href="${LOGIN_URL}" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 12px 18px; border-radius: 10px; text-decoration: none; font-weight: 600;">Go to Insight EDU</a>
      </div>
      <p style="margin: 0; color: #6b7280; font-size: 13px;">If you need assistance, reply to this email and we will help you get signed in.</p>
    `,
  });

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
  const safeParentName = escapeHtml(parentName || 'Parent');
  const safeStudentName = escapeHtml(studentName || 'your child');
  const loginEmail = escapeHtml(toEmail || recipientEmail);

  const html = wrapEmailContent({
    title: 'New Student Report Available',
    subtitle: `${safeStudentName} | Parent access`,
    body: `
      <p style="margin: 0 0 12px;">Hello ${safeParentName},</p>
      <p style="margin: 0 0 12px;">Here is the latest update for <strong>${safeStudentName}</strong>:</p>
      <p style="margin: 0 0 16px;">${safeMessage}</p>
      <div style="padding: 14px 16px; background: #f1f5f9; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
        <p style="margin: 0 0 6px;">Use these details to view the full report:</p>
        <p style="margin: 0 0 6px;"><strong>Login email:</strong> ${loginEmail}</p>
        <p style="margin: 0;"><strong>Password:</strong> 123</p>
      </div>
      <p style="margin: 0 0 8px; font-weight: 600;">View the report</p>
      <ol style="margin: 0 0 18px 20px; padding: 0; color: #0f172a;">
        <li style="margin: 0 0 8px;">Go to <a href="${LOGIN_URL}" style="color: #0f172a; text-decoration: underline;">${LOGIN_URL}</a>.</li>
        <li style="margin: 0 0 8px;">Sign in with your login email and password.</li>
        <li style="margin: 0;">Open the Student Reports section to read the update.</li>
      </ol>
      <div style="text-align: center; margin: 22px 0 16px;">
        <a href="${LOGIN_URL}" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 12px 18px; border-radius: 10px; text-decoration: none; font-weight: 600;">Open Insight EDU</a>
      </div>
      <p style="margin: 0; color: #6b7280; font-size: 13px;">If you have any trouble accessing the report, reply to this email and we will assist you.</p>
    `,
  });

  return sendEmail(env, {
    from: DEFAULT_FROM,
    to: [recipientEmail],
    subject: `Student Report for ${studentName || 'your child'}`,
    html,
  });
}

const getNameParts = (fullName = '') => {
  const tokens = fullName.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) {
    return { firstName: '', lastName: '' };
  }

  const [firstName, ...rest] = tokens;
  return { firstName, lastName: rest.join(' ') };
};

const isDuplicateContactError = (error) => {
  const message = typeof error === 'string' ? error : error?.message || '';
  return error?.statusCode === 409 || message.toLowerCase().includes('already');
};

const isMissingContactError = (error) => {
  const message = typeof error === 'string' ? error : error?.message || '';
  return error?.statusCode === 404 || message.toLowerCase().includes('not found');
};

export async function createResendContact({ env, email, name, unsubscribed = false }) {
  if (!email) return null;
  const resend = getResendClient(env);
  const audienceId =
    env?.RESEND_AUDIENCE_ID ||
    process?.env?.RESEND_AUDIENCE_ID ||
    env?.RESEND_CLIENT?.audienceId ||
    null;

  if (!resend?.contacts?.create) {
    throw new Error('Resend contacts client is not available');
  }

  const { firstName, lastName } = getNameParts(name || email);

  try {
    const response = await resend.contacts.create({
      ...(audienceId ? { audienceId } : {}),
      email,
      firstName,
      lastName,
      unsubscribed: Boolean(unsubscribed),
    });

    if (response?.error) {
      if (isDuplicateContactError(response.error)) return null;
      throw new Error(response.error?.message || 'Failed to create Resend contact');
    }

    return response?.data || null;
  } catch (error) {
    if (isDuplicateContactError(error)) return null;
    throw error instanceof Error ? error : new Error('Failed to create Resend contact');
  }
}

export async function removeResendContact({ env, email, contactId }) {
  const resend = getResendClient(env);
  const audienceId =
    env?.RESEND_AUDIENCE_ID ||
    process?.env?.RESEND_AUDIENCE_ID ||
    env?.RESEND_CLIENT?.audienceId ||
    null;

  if (!resend?.contacts?.remove) {
    throw new Error('Resend contacts client is not available');
  }

  let identifier = contactId || (email ? { email, ...(audienceId ? { audienceId } : {}) } : null);

  // If audience is unknown and we only have email, try to resolve contact first
  if (!contactId && email && !audienceId && resend?.contacts?.get) {
    try {
      const fetched = await resend.contacts.get({ email });
      if (fetched?.data?.id) {
        identifier = fetched.data.id;
      }
    } catch (err) {
      if (!isMissingContactError(err)) {
        console.error('Resend contact lookup failed:', err);
      }
      // continue with best-effort removal using email
    }
  }

  if (!identifier) return null;

  try {
    const response = await resend.contacts.remove(identifier);

    if (response?.error) {
      if (isMissingContactError(response.error)) return null;
      throw new Error(response.error?.message || 'Failed to remove Resend contact');
    }

    return response?.data || null;
  } catch (error) {
    if (isMissingContactError(error)) return null;
    throw error instanceof Error ? error : new Error('Failed to remove Resend contact');
  }
}
