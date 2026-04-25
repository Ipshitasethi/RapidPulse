/**
 * Format a Firestore Timestamp or Date object to a readable string.
 */
export function formatDate(timestamp, options = {}) {
  if (!timestamp) return '—';
  const date = timestamp.seconds
    ? new Date(timestamp.seconds * 1000)
    : new Date(timestamp);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  });
}

/**
 * Format a number with compact notation (1.2K, 3.5M)
 */
export function formatCompact(num) {
  if (num == null) return '0';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(num);
}

/**
 * Format hours to a human-readable string
 */
export function formatHours(hours) {
  if (!hours) return '0h';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${Math.round(hours)}h`;
}

/**
 * Truncate text to maxLen characters
 */
export function truncate(str, maxLen = 60) {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen) + '…';
}

/**
 * Severity label map
 */
export function getSeverityLabel(score) {
  const labels = {
    5: 'Critical',
    4: 'High',
    3: 'Moderate',
    2: 'Low',
    1: 'Informational',
  };
  return labels[score] || 'Unknown';
}

/**
 * Severity color map
 */
export function getSeverityColor(score) {
  const map = { 5: '#FF3B3B', 4: '#FF8C00', 3: '#FFD700', 2: '#00C853', 1: '#7B61FF' };
  return map[score] || '#7B61FF';
}

/**
 * Relative time (e.g. "2 hours ago")
 */
export function timeAgo(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.seconds
    ? new Date(timestamp.seconds * 1000)
    : new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(timestamp);
}
