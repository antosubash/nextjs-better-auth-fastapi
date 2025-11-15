/**
 * Input sanitization utilities for client-side validation and sanitization.
 */

/**
 * Sanitize a string by stripping whitespace and validating length.
 *
 * @param value - String to sanitize
 * @param maxLength - Maximum allowed length (undefined for no limit)
 * @param minLength - Minimum required length
 * @returns Sanitized string
 * @throws Error if string is empty after stripping or doesn't meet length requirements
 */
export function sanitizeString(value: string, maxLength?: number, minLength: number = 0): string {
  if (typeof value !== "string") {
    throw new Error("Value must be a string");
  }

  const sanitized = value.trim();

  if (sanitized.length < minLength) {
    throw new Error(`String must be at least ${minLength} characters long`);
  }

  if (maxLength !== undefined && sanitized.length > maxLength) {
    throw new Error(`String must be at most ${maxLength} characters long`);
  }

  return sanitized;
}

/**
 * Validate and sanitize an email address.
 *
 * @param email - Email address to validate
 * @returns Sanitized email address
 * @throws Error if email is invalid
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== "string") {
    throw new Error("Email must be a string");
  }

  const sanitized = email.trim().toLowerCase();

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    throw new Error("Invalid email format");
  }

  return sanitized;
}

/**
 * Validate and sanitize a URL.
 *
 * @param url - URL to validate
 * @param allowedSchemes - Array of allowed URL schemes (default: ['http', 'https'])
 * @returns Sanitized URL
 * @throws Error if URL is invalid or uses a disallowed scheme
 */
export function sanitizeUrl(url: string, allowedSchemes: string[] = ["http", "https"]): string {
  if (typeof url !== "string") {
    throw new Error("URL must be a string");
  }

  const sanitized = url.trim();

  if (!sanitized) {
    throw new Error("URL cannot be empty");
  }

  try {
    const parsed = new URL(sanitized);

    if (!parsed.protocol) {
      throw new Error("URL must include a scheme (e.g., http:// or https://)");
    }

    const scheme = parsed.protocol.replace(":", "").toLowerCase();
    if (!allowedSchemes.map((s) => s.toLowerCase()).includes(scheme)) {
      throw new Error(`URL scheme must be one of: ${allowedSchemes.join(", ")}`);
    }

    return sanitized;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Invalid URL format");
    }
    throw error;
  }
}

/**
 * Sanitize a slug by removing invalid characters and ensuring proper format.
 *
 * @param slug - Slug to sanitize
 * @returns Sanitized slug
 */
export function sanitizeSlug(slug: string): string {
  if (typeof slug !== "string") {
    throw new Error("Slug must be a string");
  }

  // Convert to lowercase and replace spaces with hyphens
  let sanitized = slug.trim().toLowerCase().replace(/\s+/g, "-");

  // Remove invalid characters (only allow alphanumeric and hyphens)
  sanitized = sanitized.replace(/[^a-z0-9-]/g, "");

  // Remove consecutive hyphens
  sanitized = sanitized.replace(/-+/g, "-");

  // Remove leading and trailing hyphens
  sanitized = sanitized.replace(/^-+|-+$/g, "");

  return sanitized;
}
