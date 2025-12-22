export function toCamelCase(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (typeof obj !== 'object') return obj;

  const camelObj = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

    // Parse JSON stored columns so the API returns structured data
    const jsonColumns = {
      class_ids: [],
      default_schedule: null,
      target_student_ids: [],
      insights: [],
    };

    let parsedValue = value;
    if (typeof value === 'string' && Object.prototype.hasOwnProperty.call(jsonColumns, key)) {
      try {
        parsedValue = JSON.parse(value);
      } catch (e) {
        parsedValue = jsonColumns[key];
      }
    }

    camelObj[camelKey] =
      parsedValue !== null && typeof parsedValue === 'object'
        ? toCamelCase(parsedValue)
        : parsedValue;
  }
  return camelObj;
}

export function toCamelCaseArray(arr) {
  if (!Array.isArray(arr)) return arr;
  return arr.map(toCamelCase);
}
