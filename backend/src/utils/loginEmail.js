const sanitizeName = (value = '') => {
  const cleaned = value.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return cleaned || 'user';
};

export const formatNotificationEmail = (name = '', role = '') => {
  const suffix = role ? `-${role.toLowerCase()}` : '';
  const localPart = `dehoulworker+${sanitizeName(`${name}${suffix}`)}`;
  return `${localPart}@gmail.com`;
};
