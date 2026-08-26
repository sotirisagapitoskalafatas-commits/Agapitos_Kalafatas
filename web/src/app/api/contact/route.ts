import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: Request) {
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

        const { data: urlData } = supabase.storage
          .from("client_uploads")
          .getPublicUrl(filePath);

        uploadedFiles.push({
          name: file.name,
          url: urlData.publicUrl,
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
    if (gdprConsent) notesParts.push(`GDPR: Συναίνεση`);
    if (uploadedFiles.length > 0) notesParts.push(`Αρχεία: ${uploadedFiles.map(f => f.name).join(", ")}`);

    const notes = notesParts.join("\n") || null;

    // Insert lead record — map to the existing leads table schema
    const { data: leadData, error: dbError } = await supabase
      .from("leads")
      .insert([
        {
          full_name: fullName,
          email: email || `${firstName.toLowerCase()}@placeholder.local`,
          phone,
          company: null,
          status: "NEW",
          source: "website",
          notes,
          tags: [serviceCategory],
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ error: `Αποτυχία αποθήκευσης: ${dbError.message}` }, { status: 500 });
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
                  <p><strong>Όνομα:</strong> ${fullName}</p>
                  <p><strong>Τηλέφωνο:</strong> ${phone}</p>
                  <p><strong>Email:</strong> ${email || "Δεν δηλώθηκε"}</p>
                  <p><strong>Υπηρεσία:</strong> ${serviceCategory}</p>
                  <p><strong>Τύπος Ακινήτου:</strong> ${propertyType || "N/A"}</p>
                  <p><strong>Περιοχή:</strong> ${region || "N/A"}</p>
                  <p><strong>Σχόλια:</strong> ${comments || "Κανένα"}</p>
                  <p><strong>Αρχεία (${uploadedFiles.length}):</strong></p>
                  <ul>
                    ${uploadedFiles.map((f) => `<li><a href="${f.url}">${f.name}</a></li>`).join("")}
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
