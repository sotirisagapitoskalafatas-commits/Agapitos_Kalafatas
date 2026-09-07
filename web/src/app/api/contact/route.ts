import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rate-limit";
import { escapeHtml, safeUrl } from "@/lib/html";
import type { Attribution } from "@/lib/spine/attribution";
import { buildConsentRecord } from "@/lib/spine/consent";
import { isValidIdempotencyKey, newIdempotencyKey } from "@/lib/spine/idempotency";
import { recordConsentRow, sendLeadAck, setLeadAttribution } from "@/lib/spine/server";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function clientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim().slice(0, 64) || null;
  return req.headers.get("x-real-ip");
}

function str(v: FormDataEntryValue | null, max = 512): string | null {
  if (!v || typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  return s.slice(0, max);
}

export async function POST(req: Request) {
  // Rate limit: 5 submissions / minute / IP.
  const limited = rateLimit(req, "contact", 5, 60_000);
  if (limited) return limited;

  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
    }

    const formData = await req.formData();

    const firstName = formData.get("first_name") as string;
    const lastName = formData.get("last_name") as string || "";
    const email = formData.get("email") as string || null;
    const phone = formData.get("phone") as string;
    const propertyType = formData.get("property_type") as string || null;
    const region = formData.get("region") as string || null;
    const serviceCategory = formData.get("service_category") as string;
    const comments = formData.get("comments") as string || null;
    const gdprConsent = formData.get("gdpr_consent") === "true";

    if (!firstName || !phone || !serviceCategory) {
      return NextResponse.json({ error: "Παρακαλώ συμπληρώστε τα υποχρεωτικά πεδία." }, { status: 400 });
    }

    const fullName = lastName ? `${firstName} ${lastName}` : firstName;

    // ── Foundation spine: idempotency, consent version, source/UTM attribution ──
    const idempotencyKey =
      (formData.get("idempotency_key") as string) || newIdempotencyKey();
    const consentVersion = str(formData.get("consent_version"), 32) || "v1";
    const consentSource = str(formData.get("consent_source"), 256) || "website_form";
    const locale = str(formData.get("locale"), 8) || "el";

    const attribution: Attribution = {
      utm_source: str(formData.get("utm_source")),
      utm_medium: str(formData.get("utm_medium")),
      utm_campaign: str(formData.get("utm_campaign")),
      utm_term: str(formData.get("utm_term")),
      utm_content: str(formData.get("utm_content")),
      referrer: str(formData.get("referrer"), 1024),
      landing_path: str(formData.get("landing_path")),
    };

    // Idempotent resubmissions: return the existing lead instead of inserting a duplicate.
    let existing: { id: string; client_name: string; created_at: string } | null = null;
    if (isValidIdempotencyKey(idempotencyKey)) {
      try {
        const { data } = await supabase
          .from("leads")
          .select("id, client_name, created_at")
          .eq("idempotency_key", idempotencyKey)
          .maybeSingle();
        if (data) existing = data;
      } catch {
        // idempotency_key column not migrated yet — fall through to insert.
      }
    }
    if (existing) {
      return NextResponse.json({ success: true, lead: existing, duplicate: true });
    }

    // Extract and upload files
    const files = formData.getAll("files") as File[];
    const uploadedFiles: { name: string; url: string; path: string }[] = [];

    for (const file of files) {
      if (file && file.size > 0) {
        if (file.size > 25 * 1024 * 1024) {
          return NextResponse.json(
            { error: `To αρχείο ${file.name} υπερβαίνει το όριο των 25MB.` },
            { status: 400 }
          );
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `leads/${fileName}`;

        const buffer = Buffer.from(await file.arrayBuffer());

        const { error: uploadError } = await supabase.storage
          .from("client_uploads")
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          continue;
        }

        const urlData = await supabase.storage
          .from("client_uploads")
          .createSignedUrl(filePath, 60 * 60 * 24 * 7);

        uploadedFiles.push({
          name: file.name,
          url: urlData.data?.signedUrl || "",
          path: filePath,
        });
      }
    }

    // Build notes from the extra fields
    const notesParts: string[] = [];
    if (serviceCategory) notesParts.push(`Υπηρεσία: ${serviceCategory}`);
    if (propertyType) notesParts.push(`Τύπος Ακινήτου: ${propertyType}`);
    if (region) notesParts.push(`Περιοχή: ${region}`);
    if (comments) notesParts.push(`Σχόλια: ${comments}`);
    if (gdprConsent) notesParts.push(`GDPR: Συναίνεση (έκδοση ${consentVersion})`);
    if (uploadedFiles.length > 0) notesParts.push(`Αρχεία: ${uploadedFiles.map(f => f.name).join(", ")}`);

    const notes = notesParts.join("\n") || null;

    // Insert lead record — base columns only so the form still works pre-migration.
    const { data: leadData, error: dbError } = await supabase
      .from("leads")
      .insert([
        {
          first_name: firstName,
          last_name: lastName,
          client_name: fullName,
          client_contact: phone,
          email: email || `${firstName.toLowerCase()}@placeholder.local`,
          phone,
          property_type: propertyType,
          region,
          service_category: serviceCategory,
          comments,
          company: null,
          status: "new_lead",
          source: "website",
          gdpr_consent: gdprConsent,
          notes,
          tags: [serviceCategory],
        },
      ])
      .select()
      .single();

    if (dbError) {
      // A concurrent duplicate hit the unique constraint first — return the existing row.
      if (isValidIdempotencyKey(idempotencyKey) && /idempotency_key/i.test(dbError.message || "")) {
        const { data: dup } = await supabase
          .from("leads")
          .select("id, client_name, created_at")
          .eq("idempotency_key", idempotencyKey)
          .maybeSingle();
        if (dup) return NextResponse.json({ success: true, lead: dup, duplicate: true });
      }
      console.error("Database error:", dbError);
      return NextResponse.json({ error: `Αποτυχία αποθήκευσης: ${dbError.message}` }, { status: 500 });
    }

    // Persist uploaded file metadata if any files were submitted
    if (leadData && uploadedFiles.length > 0) {
      await supabase
        .from("leads")
        .update({ attached_files: uploadedFiles })
        .eq("id", leadData.id);
    }

    // ── Foundation spine: persist attribution + consent columns (best-effort) ──
    const consentGrantedAt = gdprConsent ? new Date().toISOString() : null;
    await setLeadAttribution(supabase, leadData.id, {
      idempotency_key: idempotencyKey,
      consent_version: consentVersion,
      consent_granted_at: consentGrantedAt,
      consent_source: consentSource,
      ...attribution,
    });

    // ── Foundation spine: append-only consent audit trail ──
    await recordConsentRow(
      supabase,
      buildConsentRecord({
        entityId: leadData.id,
        email,
        granted: gdprConsent,
        consentVersion,
        source: consentSource,
        ip: clientIp(req),
        userAgent: req.headers.get("user-agent"),
        details: { service_category: serviceCategory, attribution },
      })
    );

    // ── Foundation spine: auto-acknowledgement email (idempotent) ──
    const ack = await sendLeadAck(
      supabase,
      { id: leadData.id, email, full_name: fullName, ack_sent_at: null },
      locale
    );
    if (!ack.ok && ack.reason !== "ineligible" && ack.reason !== "already-acked") {
      console.warn("auto-ack skipped:", ack.reason);
    }

    // Send email notification via Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL_TO || "kalafatasagapitos@gmail.com";
    if (RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "CRM <onboarding@resend.dev>",
            to: NOTIFY_EMAIL,
            subject: `Νέο Αίτημα (${serviceCategory}): ${fullName}`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                <h2 style="color:#3b82f6;">Νέο Αίτημα Επικοινωνίας</h2>
                <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0;">
                  <p><strong>Όνομα:</strong> ${escapeHtml(fullName)}</p>
                  <p><strong>Τηλέφωνο:</strong> ${escapeHtml(phone)}</p>
                  <p><strong>Email:</strong> ${escapeHtml(email || "Δεν δηλώθηκε")}</p>
                  <p><strong>Υπηρεσία:</strong> ${escapeHtml(serviceCategory)}</p>
                  <p><strong>Τύπος Ακινήτου:</strong> ${escapeHtml(propertyType || "N/A")}</p>
                  <p><strong>Περιοχή:</strong> ${escapeHtml(region || "N/A")}</p>
                  <p><strong>Σχόλια:</strong> ${escapeHtml(comments || "Κανένα")}</p>
                  <p><strong>Αρχεία (${uploadedFiles.length}):</strong></p>
                  <ul>
                    ${uploadedFiles.map((f) => `<li><a href="${safeUrl(f.url)}">${escapeHtml(f.name)}</a></li>`).join("")}
                  </ul>
                </div>
                <p style="color:#64748b;font-size:12px;">CRM System • Agapitos Kalafatas</p>
              </div>
            `,
          }),
        });
      } catch (e) {
        console.error("Email error:", e);
      }
    }

    return NextResponse.json({ success: true, lead: leadData });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json({ error: "Εσωτερικό σφάλμα διακομιστή." }, { status: 500 });
  }
}