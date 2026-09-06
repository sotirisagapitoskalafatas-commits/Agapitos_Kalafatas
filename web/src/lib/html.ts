/**
 * HTML-escaping for user-supplied values interpolated into email templates.
 *
 * Without this, a lead who submits `<img src=x onerror=...>` or
 * `"><script>` as their name/message injects markup into the notification
 * email rendered in the recipient's inbox. Escape every user value.
 */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Escape a value for safe use inside an href/src attribute.
 * Only allows http(s) and mailto; anything else becomes '#'.
 */
export function safeUrl(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (/^(https?:|mailto:)/i.test(raw)) {
    return escapeHtml(raw);
  }
  return "#";
}
