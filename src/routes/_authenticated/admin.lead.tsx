import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserCheck, CalendarPlus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStaff } from "@/hooks/use-staff";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/lead")({
  component: LeadsPage,
});

const STATUSES = [
  { value: "nuovo", label: "Nuovo" },
  { value: "contattato", label: "Contattato" },
  { value: "consulenza-fissata", label: "Consulenza fissata" },
  { value: "chiuso", label: "Chiuso" },
  { value: "convertito", label: "Convertito" },
] as const;

function LeadsPage() {
  const qc = useQueryClient();
  const { data: me } = useStaff();
  const isAdmin = me?.roles.includes("admin") ?? false;

  const { data: leads } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: staff } = useQuery({
    queryKey: ["staff-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const updateLead = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: { status?: string; assigned_to?: string | null };
    }) => {
      const { error } = await supabase.from("leads").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead aggiornato");
    },
    onError: () => toast.error("Aggiornamento non riuscito"),
  });

  const convert = useMutation({
    mutationFn: async (leadId: string) => {
      const { data, error } = await supabase.rpc("convert_lead_to_patient", {
        _lead_id: leadId,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (patientId) => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Lead convertito in paziente");
      if (patientId) {
        qc.setQueryData(["patient-converted-from", patientId], true);
      }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Conversione non riuscita"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead eliminato");
    },
    onError: () => toast.error("Operazione non consentita"),
  });

  return (
    <div className="mx-auto max-w-5xl">
      <p className="eyebrow">Gestionale</p>
      <h1 className="display-md mt-3 text-3xl">Lead dal sito</h1>
      <p className="lede mt-3 text-base">
        Richieste ricevute dal modulo contatti. I dati sono trattati secondo la base giuridica del
        consenso raccolto in fase di invio.
      </p>

      <div className="mt-10 space-y-5">
        {(leads ?? []).map((l) => (
          <div key={l.id} className="card-aura p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold tracking-[-0.02em]">{l.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  <a href={`mailto:${l.email}`} className="hover:text-foreground">
                    {l.email}
                  </a>{" "}
                  ·{" "}
                  <a href={`tel:${l.phone}`} className="hover:text-foreground">
                    {l.phone}
                  </a>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {l.interest ?? "—"} · disponibilità: {l.slot ?? "—"}
                </div>
              </div>
              <div className="text-right">
                <select
                  value={l.status}
                  onChange={(e) =>
                    updateLead.mutate({ id: l.id, patch: { status: e.target.value } })
                  }
                  disabled={updateLead.isPending}
                  className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <div className="mt-2 text-xs text-muted-foreground">
                  {new Date(l.created_at).toLocaleString("it-IT", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Marketing: {l.marketing_consent ? "sì" : "no"}
                </div>
                {isAdmin && (
                  <button
                    className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      if (confirm(`Eliminare definitivamente il lead "${l.name}"?`))
                        remove.mutate(l.id);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                    Elimina
                  </button>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Assegnato a
                </label>
                <select
                  value={l.assigned_to ?? ""}
                  onChange={(e) =>
                    updateLead.mutate({
                      id: l.id,
                      patch: { assigned_to: e.target.value || null },
                    })
                  }
                  disabled={updateLead.isPending}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                >
                  <option value="">— Non assegnato —</option>
                  {(staff ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name ?? s.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end justify-start gap-2 sm:justify-end">
                {l.converted_patient_id ? (
                  <>
                    <Link
                      to="/admin/pazienti"
                      className="inline-flex items-center gap-2 rounded-full bg-sage/15 px-4 py-2 text-sm font-medium text-sage hover:bg-sage/20"
                    >
                      <UserCheck className="size-4" />
                      Convertito in paziente
                    </Link>
                    <Link
                      to="/admin/agenda"
                      search={{
                        patient_id: l.converted_patient_id,
                        title: l.interest
                          ? `Consulenza — ${l.interest}`
                          : `Appuntamento — ${l.name}`,
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
                    >
                      <CalendarPlus className="size-4" />
                      Fissa appuntamento
                    </Link>
                  </>
                ) : (
                  <Button
                    variant="hero"
                    size="sm"
                    disabled={convert.isPending}
                    onClick={() => convert.mutate(l.id)}
                  >
                    <UserCheck className="size-4" />
                    Converti in paziente
                  </Button>
                )}
              </div>
            </div>

            <p className="mt-5 rounded-xl bg-muted p-4 text-sm text-foreground/90">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Richiesta del cliente
              </span>
              <span className="mt-1 block">
                {l.note || "Nessuna nota lasciata dal cliente in fase di richiesta."}
              </span>
            </p>
          </div>
        ))}
        {(leads?.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground">Nessun lead ricevuto finora.</p>
        )}
      </div>
    </div>
  );
}
