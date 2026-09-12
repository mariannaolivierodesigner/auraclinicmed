import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { sendAppointmentSms } from "@/lib/sms.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SmsKind = "reminder" | "confirmation";
type SmsChannel = "sms" | "whatsapp";

const searchSchema = z.object({
  patient_id: z.string().optional(),
  title: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/admin/agenda")({
  validateSearch: searchSchema,
  component: AgendaPage,
});

const KINDS = ["consulenza", "intervento", "controllo", "medicina-estetica"] as const;

const schema = z.object({
  title: z.string().trim().min(3, "Titolo obbligatorio").max(120),
  starts_at: z.string().min(1, "Data e ora obbligatorie"),
  kind: z.string(),
  patient_id: z.string(),
});

function AgendaPage() {
  const qc = useQueryClient();
  const search = Route.useSearch();
  const [form, setForm] = useState({
    title: search.title ?? "",
    starts_at: "",
    kind: "consulenza",
    patient_id: search.patient_id ?? "",
  });
  const [prefillNotice, setPrefillNotice] = useState(!!search.patient_id);

  const { data: patients } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, first_name, last_name")
        .order("last_name");
      if (error) throw error;
      return data;
    },
  });

  // Se arriviamo da "Fissa appuntamento" (Lead o Pazienti) con un patient_id nell'URL,
  // pre-selezioniamo il paziente appena la lista è disponibile.
  useEffect(() => {
    if (search.patient_id) {
      setForm((f) => ({ ...f, patient_id: search.patient_id! }));
    }
  }, [search.patient_id]);

  const { data: appointments } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, patients(first_name,last_name,phone)")
        .order("starts_at");
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);
      const v = parsed.data;
      const start = new Date(v.starts_at);
      const { error } = await supabase.from("appointments").insert({
        title: v.title,
        kind: v.kind,
        starts_at: start.toISOString(),
        ends_at: new Date(start.getTime() + 60 * 60 * 1000).toISOString(),
        patient_id: v.patient_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm({ title: "", starts_at: "", kind: "consulenza", patient_id: "" });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appuntamento creato");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Creazione non riuscita"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appuntamento eliminato");
    },
  });

  const sendSms = useMutation({
    mutationFn: async ({
      appointmentId,
      kind,
      channel,
    }: {
      appointmentId: string;
      kind: SmsKind;
      channel: SmsChannel;
    }) => {
      return sendAppointmentSms({ data: { appointment_id: appointmentId, kind, channel } });
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      const channelLabel = variables.channel === "whatsapp" ? "WhatsApp" : "SMS";
      toast.success(
        variables.kind === "reminder"
          ? `Promemoria ${channelLabel} inviato`
          : `Conferma ${channelLabel} inviata`,
      );
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Invio non riuscito"),
  });

  const groups = new Map<string, typeof appointments>();
  for (const a of appointments ?? []) {
    const day = new Date(a.starts_at).toLocaleDateString("it-IT", { dateStyle: "full" });
    groups.set(day, [...(groups.get(day) ?? []), a]);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <p className="eyebrow">Gestionale</p>
      <h1 className="display-md mt-3 text-3xl">Agenda</h1>

      {prefillNotice && (
        <div className="mt-6 flex items-center justify-between gap-3 rounded-xl bg-sage/10 px-4 py-3 text-sm text-sage">
          <span>Paziente precompilato — controlla titolo, data e ora e conferma.</span>
          <button
            className="underline-offset-4 hover:underline"
            onClick={() => setPrefillNotice(false)}
          >
            Ok
          </button>
        </div>
      )}

      <div className="card-aura mt-8 grid gap-5 p-6 md:grid-cols-4 md:p-8">
        <div className="md:col-span-2">
          <Label>Titolo</Label>
          <Input
            className="mt-2 h-12 rounded-xl"
            value={form.title}
            maxLength={120}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <div>
          <Label>Data e ora</Label>
          <Input
            type="datetime-local"
            className="mt-2 h-12 rounded-xl"
            value={form.starts_at}
            onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
          />
        </div>
        <div>
          <Label>Tipo</Label>
          <select
            className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm"
            value={form.kind}
            onChange={(e) => setForm({ ...form, kind: e.target.value })}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-3">
          <Label>Paziente</Label>
          <select
            className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm"
            value={form.patient_id}
            onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
          >
            <option value="">Nessuno</option>
            {(patients ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.last_name} {p.first_name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <Button
            variant="hero"
            size="pill"
            className="w-full"
            disabled={create.isPending}
            onClick={() => create.mutate()}
          >
            Aggiungi
          </Button>
        </div>
      </div>

      <div className="mt-12 space-y-8">
        {[...groups.entries()].map(([day, items]) => (
          <div key={day}>
            <h2 className="eyebrow">{day}</h2>
            <div className="card-aura mt-3 divide-y divide-border">
              {(items ?? []).map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <div>
                    <div className="font-medium">{a.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {a.patients
                        ? `${a.patients.first_name} ${a.patients.last_name}`
                        : "Senza paziente"}{" "}
                      · {a.kind}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        {a.confirmation_sent_at ? "✓ Conferma inviata" : "Conferma non inviata"}
                      </span>
                      <span>
                        {a.reminder_sent_at ? "✓ Promemoria inviato" : "Promemoria non inviato"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {new Date(a.starts_at).toLocaleTimeString("it-IT", { timeStyle: "short" })}
                    </span>
                    {a.patients?.phone && (
                      <>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>Conferma:</span>
                          <button
                            className="underline-offset-4 hover:underline disabled:opacity-50"
                            disabled={sendSms.isPending}
                            onClick={() =>
                              sendSms.mutate({ appointmentId: a.id, kind: "confirmation", channel: "sms" })
                            }
                          >
                            SMS
                          </button>
                          <span>·</span>
                          <button
                            className="underline-offset-4 hover:underline disabled:opacity-50"
                            disabled={sendSms.isPending}
                            onClick={() =>
                              sendSms.mutate({
                                appointmentId: a.id,
                                kind: "confirmation",
                                channel: "whatsapp",
                              })
                            }
                          >
                            WhatsApp
                          </button>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>Promemoria:</span>
                          <button
                            className="underline-offset-4 hover:underline disabled:opacity-50"
                            disabled={sendSms.isPending}
                            onClick={() =>
                              sendSms.mutate({ appointmentId: a.id, kind: "reminder", channel: "sms" })
                            }
                          >
                            SMS
                          </button>
                          <span>·</span>
                          <button
                            className="underline-offset-4 hover:underline disabled:opacity-50"
                            disabled={sendSms.isPending}
                            onClick={() =>
                              sendSms.mutate({
                                appointmentId: a.id,
                                kind: "reminder",
                                channel: "whatsapp",
                              })
                            }
                          >
                            WhatsApp
                          </button>
                        </div>
                      </>
                    )}
                    <button
                      className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                      onClick={() => remove.mutate(a.id)}
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {(appointments?.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground">Agenda vuota.</p>
        )}
      </div>
    </div>
  );
}
