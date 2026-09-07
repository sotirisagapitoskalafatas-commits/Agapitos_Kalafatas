const PLACEHOLDER_RE = /@placeholder\.local$/i;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

export function canAckLead(lead: {
  email?: string | null;
  ack_sent_at?: string | null;
}): boolean {
  if (!lead.email) return false;
  if (PLACEHOLDER_RE.test(lead.email)) return false;
  if (!EMAIL_RE.test(lead.email)) return false;
  if (lead.ack_sent_at) return false;
  return true;
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

export function normalizeLocale(locale: string): "el" | "en" | "fr" {
  const l = (locale || "").toLowerCase().slice(0, 2);
  if (l === "en" || l === "fr") return l;
  return "el";
}

export function ackSubject(locale: string): string {
  switch (normalizeLocale(locale)) {
    case "en":
      return "We received your request - Agapitos Kalafatas";
    case "fr":
      return "Nous avons bien reu votre demande - Agapitos Kalafatas";
    default:
      return "Λάβαμε το αίτημά σας - Agapitos Kalafatas";
  }
}

export function ackHtml(locale: string, name: string): string {
  const iso = normalizeLocale(locale);
  const cleanName = escapeHtml(name || "");
  let heading: string;
  let body: string;
  let signoff: string;
  switch (iso) {
    case "en":
      heading = "Thank you for getting in touch";
      body =
        "We received your request and one of our advisors will contact you shortly. " +
        "If you need anything in the meantime, simply reply to this email.";
      signoff = "Best regards,<br/>The Agapitos Kalafatas team";
      break;
    case "fr":
      heading = "Merci de nous avoir contactes";
      body =
        "Nous avons bien recu votre demande et l'un de nos conseillers vous recontactera bientot. " +
        "Si vous avez besoin de quoi que ce soit, repondez simplement a cet e-mail.";
      signoff = "Cordialement,<br/>L'equipe Agapitos Kalafatas";
      break;
    default:
      heading = "Ευχαριστούμε για το αίτημά σας";
      body =
        "Λάβαμε το αίτημά σας και ένας σύμβουλός μας θα επικοινωνήσει μαζί σας σύντομα. " +
        "Αν χρειαστείτε οτιδήποτε στο μεταξύ, απαντήστε σε αυτό το email.";
      signoff = "Με εκτίμηση,<br/>Η ομάδα της Agapitos Kalafatas";
      break;
  }
  const greeting = cleanName ? `${cleanName},` : "";
  return `<!doctype html>
<html lang="${iso}">
<body style="margin:0;background:#f4f6f8;padding:32px 0;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:32px;">
    <h2 style="margin:0 0 16px;color:#0f172a;font-family:Arial,sans-serif;">${heading}</h2>
    <p style="color:#334155;font-family:Arial,sans-serif;line-height:1.6;">${greeting}</p>
    <p style="color:#334155;font-family:Arial,sans-serif;line-height:1.6;">${body}</p>
    <p style="color:#334155;font-family:Arial,sans-serif;line-height:1.6;">${signoff}</p>
    <p style="color:#94a3b8;font-size:12px;margin-top:24px;font-family:Arial,sans-serif;">Agapitos Kalafatas · Energy · Insurance · Web &amp; Software</p>
  </div>
</body>
</html>`;
}