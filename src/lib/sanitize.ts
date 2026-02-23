import xss from 'xss';
import validator from 'validator';

/** Sanitize a string to prevent XSS */
export function sanitizeInput(input: unknown): unknown {
  if (typeof input !== 'string') return input;
  return xss(input.trim());
}

/** Recursively sanitize all string values in an object */
export function sanitizeObject<T>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeInput(obj) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as T;
  }

  const sanitized: Record<string, unknown> = {};
  for (const key in obj as Record<string, unknown>) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      sanitized[key] = sanitizeObject((obj as Record<string, unknown>)[key]);
    }
  }
  return sanitized as T;
}

export function isValidEmail(email: string): boolean {
  return validator.isEmail(email);
}

export function isValidPrice(price: string | number): boolean {
  const num = parseFloat(String(price));
  return !isNaN(num) && num >= 0 && num <= 100000;
}

export function isValidPhone(phone: string): boolean {
  return (
    validator.isMobilePhone(phone.replace(/[\s\-()]/g, ''), 'any', {
      strictMode: false,
    }) || /^[\d\s\-()\\+]{7,20}$/.test(phone)
  );
}
