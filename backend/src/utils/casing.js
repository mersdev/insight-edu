export function toCamelCase(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (typeof obj !== 'object') return obj;

  const camelObj = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

    if (key === 'class_ids' && typeof value === 'string') {
      try {
        camelObj[camelKey] = JSON.parse(value);
      } catch (e) {
        camelObj[camelKey] = [];
      }
    } else {
      camelObj[camelKey] = typeof value === 'object' && value !== null ? toCamelCase(value) : value;
    }
  }
  return camelObj;
}

export function toCamelCaseArray(arr) {
  if (!Array.isArray(arr)) return arr;
  return arr.map(toCamelCase);
}
