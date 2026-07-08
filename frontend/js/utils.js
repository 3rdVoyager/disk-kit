// Utility Functions for Disk Kit
// Common helper functions used across modules

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
export function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * API fetch wrapper with JSON handling
 * @param {string} path - API endpoint path
 * @param {Object} options - Fetch options
 * @returns {Promise<Object|Array>} - Parsed JSON response
 */
export async function apiFetch(path, options = {}) {
  const base = window.location.origin || 'http://localhost:5000';
  const url = `${base}${path}`;
  const defaults = {
      headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
      }
  };
  const config = Object.assign({}, defaults, options);
  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
  }
  const response = await fetch(url, config);
  if (!response.ok) {
      const errorText = await response.text();
      let message = `HTTP ${response.status}`;
      try {
          const err = JSON.parse(errorText);
          message = err.error || message;
      } catch {
          // ignore
      }
      throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
}

/**
 * Get nested value from object using dot notation
 * @param {Object} obj - Source object
 * @param {string} path - Dot-separated path
 * @returns {*} - Value at path or undefined
 */
export function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

/**
 * Set nested value in object using dot notation
 * @param {Object} obj - Target object
 * @param {string} path - Dot-separated path
 * @param {*} value - Value to set
 */
export function setNestedValue(obj, path, value) {
  const parts = path.split('.');
  const last = parts.pop();
  const target = parts.reduce((acc, part) => {
      if (!(part in acc)) acc[part] = {};
      return acc[part];
  }, obj);
  target[last] = value;
}
