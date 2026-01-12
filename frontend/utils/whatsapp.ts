const DEFAULT_LOGIN_URL = 'https://insight-edu-frontend.pages.dev';
const DEFAULT_TEMP_PASSWORD = '123';

type LoginWhatsAppMessageParams = {
  name: string;
  role: 'TEACHER' | 'PARENT';
  email: string;
  password?: string;
  loginUrl?: string;
};

type LoginWhatsAppMessageBuilder = (params: LoginWhatsAppMessageParams) => string;

const sanitizePhoneForWhatsApp = (phone?: string | null): string | null => {
  if (!phone) return null;
  let digits = phone.replace(/\D+/g, '');
  if (!digits) return null;
  if (digits.startsWith('60')) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
};

export const buildWhatsAppLink = (phone: string | null | undefined, message?: string) => {
  const digits = sanitizePhoneForWhatsApp(phone);
  if (!digits) return null;
  const base = `https://wa.me/+60${digits}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
};

const defaultLoginWhatsAppMessage: LoginWhatsAppMessageBuilder = ({
  name,
  role,
  email,
  password = DEFAULT_TEMP_PASSWORD,
  loginUrl = DEFAULT_LOGIN_URL,
}) => {
  const roleLabel = role === 'TEACHER' ? 'Teacher' : 'Parent';
  return `Hello ${name || roleLabel},\n\nYour ${roleLabel} account for Insight EDU is ready.\nLogin email: ${email}\nTemporary password: ${password}\nVisit ${loginUrl} to sign in and reset your password.\n\nPlease keep this message for your records.`;
};

const stubLoginWhatsAppMessage: LoginWhatsAppMessageBuilder = ({ name, role, email }) => {
  const roleLabel = role === 'TEACHER' ? 'Teacher' : 'Parent';
  return `[Stub] ${roleLabel} login for ${name}. Email: ${email}`;
};

interface WindowWithCypress extends Window {
  Cypress?: any;
}

const isCypressDetected = typeof window !== 'undefined' && (window as WindowWithCypress).Cypress;

let loginWhatsAppMessageBuilder: LoginWhatsAppMessageBuilder = isCypressDetected
  ? stubLoginWhatsAppMessage
  : defaultLoginWhatsAppMessage;

export const buildLoginWhatsAppMessage = (params: LoginWhatsAppMessageParams) => loginWhatsAppMessageBuilder(params);

export const buildLoginWhatsAppMessageStub = stubLoginWhatsAppMessage;

export const setLoginWhatsAppMessageBuilder = (builder: LoginWhatsAppMessageBuilder) => {
  loginWhatsAppMessageBuilder = builder;
};

export const resetLoginWhatsAppMessageBuilder = () => {
  loginWhatsAppMessageBuilder = defaultLoginWhatsAppMessage;
};

export const openWhatsAppLink = (link: string | null | undefined) => {
  if (!link) return;
  if (typeof window === 'undefined') return;
  const win = window as WindowWithCypress;
  if (win.Cypress) {
    console.debug('[WhatsApp Mock] Navigation suppressed:', link);
    return;
  }
  const newWindow = window.open(link, '_blank', 'noopener,noreferrer');
  if (!newWindow) {
    window.location.href = link;
  }
};

export const buildReportWhatsAppMessage = ({
  studentName,
  summary,
  loginUrl = DEFAULT_LOGIN_URL,
}: {
  studentName: string;
  summary: string;
  loginUrl?: string;
}) => {
  const safeSummary = summary?.trim() || `${studentName}'s latest insights are ready.`;
  return `AI Insight Summary for ${studentName}:\n${safeSummary}\n\nPlease open ${loginUrl} to review the full report and attach the screenshot before sending it to the parent.`;
};
