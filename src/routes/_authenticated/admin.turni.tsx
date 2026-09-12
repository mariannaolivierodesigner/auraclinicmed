import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useStaff } from "@/hooks/use-staff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin/turni")({
  component: TurniPage,
});

const CLINICAL_ROLE_LABELS: Record<string, string> = {
  medico: "Medico",
  infermiera: "Infermiera",
  assistente: "Assistente",
  segreteria: "Segreteria",
  altro: "Altro",
};

const schema = z.object({
  staff_id: z.string().min(1, "Seleziona un membro dello staff"),
  starts_at: z.string().min(1, "Data e ora di inizio obbligatorie"),
  ends_at: z.string().min(1, "Data e ora di fine obbligatorie"),
});

function TurniPage() {
  const qc = useQueryClient();
  const { data: me } = useStaff();
  const isAdmin = me?.roles.includes("admin") ?? false;

  const [form, setForm] = useState({ staff_id: "", starts_at: "", ends_at: "" });

  const { data: team } = useQuery({
    queryKey: ["team-for-shifts"],
    queryFn: async () => {
      const [profiles, roles] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, clinical_role").order("full_name"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (profiles.error) throw profiles.error;
      const staffIds = new Set((roles.data ?? []).map((r) => r.user_id));
      return (profiles.data ?? []).filter((p) => staffIds.has(p.id));
    },
  });

  const selectedStaff = (team ?? []).find((p) => p.id === form.staff_id);
  const autoRoleLabel = selectedStaff?.clinical_role
    ? (CLINICAL_ROLE_LABELS[selectedStaff.clinical_role] ?? selectedStaff.clinical_role)
    : null;

  const { data: shifts } = useQuery({
    queryKey: ["staff-shifts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_shifts")
        .select("*, profiles:staff_id(full_name, email)")
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
      const staff = (team ?? []).find((p) => p.id === v.staff_id);
      const roleLabel = staff?.clinical_role
        ? (CLINICAL_ROLE_LABELS[staff.clinical_role] ?? staff.clinical_role)
        : null;
      const { error } = await supabase.from("staff_shifts").insert({
        staff_id: v.staff_id,
        starts_at: new Date(v.starts_at).toISOString(),
        ends_at: new Date(v.ends_at).toISOString(),
        role_label: roleLabel,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm({ staff_id: "", starts_at: "", ends_at: "" });
      qc.invalidateQueries({ queryKey: ["staff-shifts"] });
      toast.success("Turno creato");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Creazione non riuscita"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("staff_shifts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff-shifts"] });
      toast.success("Turno eliminato");
    },
    onError: () => toast.error("Operazione non consentita"),
  });

  const groups = new Map<string, typeof shifts>();
  for (const s of shifts ?? []) {
    const day = new Date(s.starts_at).toLocaleDateString("it-IT", { dateStyle: "full" });
    groups.set(day, [...(groups.get(day) ?? []), s]);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <p className="eyebrow">Gestionale</p>
      <h1 className="display-md mt-3 text-3xl">Turni staff</h1>
      <p className="lede mt-3 text-base">
        Pianifica la copertura di reception, sala e assistenza. La creazione e la modifica dei turni
        sono riservate agli amministratori; tutto lo staff può consultarli.
      </p>

      {isAdmin && (
        <div className="card-aura mt-8 grid gap-5 p-6 md:grid-cols-4 md:p-8">
          <div className="md:col-span-2">
            <Label>Membro dello staff</Label>
            <select
              className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm"
              value={form.staff_id}
              onChange={(e) => setForm({ ...form, staff_id: e.target.value })}
            >
              <option value="">Seleziona...</option>
              {(team ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name ?? p.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Ruolo</Label>
            <div className="mt-2 flex h-12 items-center rounded-xl border border-border bg-muted px-3 text-sm text-muted-foreground">
              {autoRoleLabel ?? (form.staff_id ? "Nessun ruolo clinico impostato" : "Seleziona uno staff")}
            </div>
          </div>
          <div>
            <Label>Inizio</Label>
            <Input
              type="datetime-local"
              className="mt-2 h-12 rounded-xl"
              value={form.starts_at}
              onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Fine</Label>
            <Input
              type="datetime-local"
              className="mt-2 h-12 rounded-xl"
              value={form.ends_at}
              onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="hero"
              size="pill"
              className="w-full"
              disabled={create.isPending}
              onClick={() => create.mutate()}
            >
              Aggiungi turno
            </Button>
          </div>
        </div>
      )}

      <div className="mt-12 space-y-8">
        {[...groups.entries()].map(([day, items]) => (
          <div key={day}>
            <h2 className="eyebrow">{day}</h2>
            <div className="card-aura mt-3 divide-y divide-border">
              {(items ?? []).map((s) => (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <div>
                    <div className="font-medium">
                      {(s.profiles as { full_name?: string; email?: string } | null)?.full_name ??
                        "Staff"}
                    </div>
                    <div className="text-sm text-muted-foreground">{s.role_label ?? "Turno"}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {new Date(s.starts_at).toLocaleTimeString("it-IT", { timeStyle: "short" })} –{" "}
                      {new Date(s.ends_at).toLocaleTimeString("it-IT", { timeStyle: "short" })}
                    </span>
                    {isAdmin && (
                      <button
                        className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                        onClick={() => remove.mutate(s.id)}
                      >
                        Elimina
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {(shifts?.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground">Nessun turno pianificato.</p>
        )}
      </div>
    </div>
  );
}
