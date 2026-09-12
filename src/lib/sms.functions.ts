import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Invio SMS o WhatsApp reale (Twilio) di "promemoria" o "conferma" per un appuntamento.
//
// Richiede queste variabili d'ambiente configurate su Vercel (Project Settings → Environment
// Variables), esattamente come SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY sono già disponibili:
//   TWILIO_ACCOUNT_SID        -> Account SID Twilio
//   TWILIO_AUTH_TOKEN         -> Auth Token Twilio
//   TWILIO_FROM_NUMBER        -> numero mittente Twilio per SMS, formato E.164 (es. +390212345678)
//   TWILIO_WHATSAPP_FROM_NUMBER -> numero mittente Twilio abilitato per WhatsApp, formato E.164
//                                  (in fase demo è il numero del sandbox WhatsApp di Twilio;
//                                  per un cliente reale serve un mittente WhatsApp Business approvato)

const inputSchema = z.object({
  appointment_id: z.string().uuid(),
  kind: z.enum(["reminder", "confirmation"]),
  channel: z.enum(["sms", "whatsapp"]).default("sms"),
});

function buildMessage(
  kind: "reminder" | "confirmation",
  patientName: string,
  title: string,
  startsAt: string,
) {
  const when = new Date(startsAt).toLocaleString("it-IT", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Rome",
  });
  if (kind === "confirmation") {
    return `Ciao ${patientName}, confermiamo il tuo appuntamento "${title}" per ${when}. A presto!`;
  }
  return `Ciao ${patientName}, ti ricordiamo il tuo appuntamento "${title}" per ${when}. Se devi disdire o spostare, contattaci al più presto.`;
}

export const sendAppointmentSms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: isStaff } = await supabaseAdmin.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) {
      throw new Error("Operazione riservata allo staff.");
    }

    const TWILIO_ACCOUNT_SID = process.env["TWILIO_ACCOUNT_SID"];
    const TWILIO_AUTH_TOKEN = process.env["TWILIO_AUTH_TOKEN"];
    const TWILIO_FROM_NUMBER = process.env["TWILIO_FROM_NUMBER"];
    const TWILIO_WHATSAPP_FROM_NUMBER = process.env["TWILIO_WHATSAPP_FROM_NUMBER"];

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error(
        "Messaggi non configurati: mancano le variabili TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN su Vercel.",
      );
    }
    if (data.channel === "sms" && !TWILIO_FROM_NUMBER) {
      throw new Error("SMS non configurato: manca la variabile TWILIO_FROM_NUMBER su Vercel.");
    }
    if (data.channel === "whatsapp" && !TWILIO_WHATSAPP_FROM_NUMBER) {
      throw new Error(
        "WhatsApp non configurato: manca la variabile TWILIO_WHATSAPP_FROM_NUMBER su Vercel.",
      );
    }

    const { data: appt, error: apptError } = await supabaseAdmin
      .from("appointments")
      .select("id, title, starts_at, patients(first_name, last_name, phone)")
      .eq("id", data.appointment_id)
      .single();

    if (apptError || !appt) {
      throw new Error("Appuntamento non trovato.");
    }

    const patient = appt.patients as {
      first_name: string;
      last_name: string;
      phone: string | null;
    } | null;
    if (!patient?.phone) {
      throw new Error("Il paziente non ha un numero di telefono salvato.");
    }

    const body = buildMessage(data.kind, patient.first_name, appt.title, appt.starts_at);

    const isWhatsapp = data.channel === "whatsapp";
    const from = isWhatsapp ? `whatsapp:${TWILIO_WHATSAPP_FROM_NUMBER}` : TWILIO_FROM_NUMBER!;
    const to = isWhatsapp ? `whatsapp:${patient.phone}` : patient.phone;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const twilioRes = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }),
    });

    const twilioJson = (await twilioRes.json()) as unknown;
    const success = twilioRes.ok;

    await supabaseAdmin.from("sms_log").insert({
      appointment_id: data.appointment_id,
      kind: data.kind,
      channel: data.channel,
      phone: patient.phone,
      status: success ? "inviato" : "errore",
      provider_response: JSON.stringify(twilioJson).slice(0, 2000),
      sent_by: context.userId,
    });

    if (!success) {
      throw new Error(
        `Invio ${isWhatsapp ? "WhatsApp" : "SMS"} non riuscito: Twilio ha rifiutato la richiesta.`,
      );
    }

    const column = data.kind === "reminder" ? "reminder_sent_at" : "confirmation_sent_at";
    const now = new Date().toISOString();
    await supabaseAdmin
      .from("appointments")
      .update(
        column === "reminder_sent_at" ? { reminder_sent_at: now } : { confirmation_sent_at: now },
      )
      .eq("id", data.appointment_id);

    return { success: true };
  });
