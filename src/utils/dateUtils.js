/**
 * Date utility functions for formatting dates consistently across the application
 */

/**
 * Format date for display in tables
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date string or '-' if invalid
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch (error) {
    return dateString
  }
}

/**
 * Format date for display without time
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date string or '-' if invalid
 */
export const formatDateOnly = (dateString) => {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit'
    })
  } catch (error) {
    return dateString
  }
}

/**
 * Format time only
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted time string or '-' if invalid
 */
export const formatTimeOnly = (dateString) => {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch (error) {
    return dateString
  }
}

/**
 * Format event datetime for display (MultiMarket page)
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string or 'TBA' if invalid
 */
export const formatEventDateTime = (dateString) => {
  if (!dateString) return 'TBA';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return 'TBA';
  }
}

/**
 * Convert a date-picker value to `YYYY-MM-DD` using the local calendar day.
 * This avoids UTC timezone shifts (where `toISOString()` may move the day).
 *
 * @param {Date | string | null | undefined} value
 * @returns {string} YYYY-MM-DD or empty string when invalid/empty
 */
export const toYMDLocal = (value) => {
  if (!value) return ''

  if (value instanceof Date) {
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, '0')
    const d = String(value.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  if (typeof value === 'string') {
    // If it's an ISO string with time, keep only the date part.
    return value.length > 10 ? value.split('T')[0] : value
  }

  return ''
}