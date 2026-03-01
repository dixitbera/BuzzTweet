
export function isEmailValid(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
export function isPasswordStrong(password) {
  // Keep backward compatibility: return boolean
  return validatePassword(password).isValid;
}

/**
 * Validate a password and return detailed errors.
 * @param {string} password
 * @returns {{isValid: boolean, errors: string[]}}
 */
export function validatePassword(password) {
  const errors = [];
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter.');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter.');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number.');
  }
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (e.g. @$!%*?&).');
  }
  return { isValid: errors.length === 0, errors };
}

export function isUsernameValid(username) {
  // Alphanumeric usernames between 3 to 16 characters
  const usernameRegex = /^[a-zA-Z0-9]{3,16}$/;
  return usernameRegex.test(username);
}
