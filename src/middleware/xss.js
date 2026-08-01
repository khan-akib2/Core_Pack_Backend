import xss from 'xss';

/**
 * Recursively sanitizes input to prevent XSS attacks.
 * Ponytail Note: We are using a robust string sanitizer here. 
 * Ceiling: If complex HTML inputs (e.g. rich text editors) are needed later, 
 * this strict sanitization will strip them. Upgrade path: Whitelist specific fields 
 * or use a configurable DOMPurify setup for rich text fields.
 */
const clean = (data) => {
  if (typeof data === 'string') {
    return xss(data);
  }
  if (Array.isArray(data)) {
    return data.map((item) => clean(item));
  }
  if (typeof data === 'object' && data !== null) {
    const cleaned = {};
    for (const key in data) {
      cleaned[key] = clean(data[key]);
    }
    return cleaned;
  }
  return data;
};

export const xssSanitizer = (req, res, next) => {
  if (req.body) req.body = clean(req.body);
  if (req.query) req.query = clean(req.query);
  if (req.params) req.params = clean(req.params);
  next();
};
