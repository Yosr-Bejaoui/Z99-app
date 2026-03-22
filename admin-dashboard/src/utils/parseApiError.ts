/**
 * Parse API error responses from the backend.
 *
 * The backend custom exception handler wraps errors in:
 * { success: false, error: { code, message, details? } }
 *
 * This helper extracts a human-readable message from that format,
 * and also handles flat DRF field-level errors like { field: ["error"] }.
 */
export function parseApiError(error: unknown, fallback = 'Something went wrong'): string {
  const err = error as { response?: { data?: Record<string, unknown> } };
  const data = err?.response?.data;
  if (!data) return fallback;

  // Custom backend error format: { success: false, error: { code, message, details } }
  if (data.error && typeof data.error === 'object') {
    const apiErr = data.error as { message?: string; details?: Record<string, unknown> };
    if (apiErr.details && typeof apiErr.details === 'object') {
      const detailMsgs = Object.entries(apiErr.details)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
        .join('; ');
      if (detailMsgs) return detailMsgs;
    }
    if (apiErr.message) return String(apiErr.message);
  }

  // Flat DRF field errors: { field: ["error msg"] }
  const fieldEntries = Object.entries(data).filter(
    ([k]) => k !== 'success' && k !== 'error'
  );
  if (fieldEntries.length > 0) {
    const msgs = fieldEntries
      .map(([k, v]) => {
        if (Array.isArray(v)) return `${k}: ${v.join(', ')}`;
        if (typeof v === 'string') return `${k}: ${v}`;
        return null;
      })
      .filter(Boolean)
      .join('; ');
    if (msgs) return msgs;
  }

  return fallback;
}
