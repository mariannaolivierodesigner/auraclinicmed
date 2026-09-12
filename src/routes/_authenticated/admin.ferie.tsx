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

export const Route = createFileRoute("/_authenticated/admin/ferie")({
  component: FeriePage,
});

const TYPE_LABELS: Record<string, string> = {
  ferie: "Ferie",
  malattia: "Malattia",
  permesso: "Permesso",
};

const schema = z
  .object({
    staff_id: z.string().min(1, "Seleziona un membro dello staff"),
    type: z.enum(["ferie", "malattia", "permesso"]),
    start_date: z.string().min(1, "Data di inizio obbligatoria"),
    end_date: z.string().min(1, "Data di fine obbligatoria"),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
    reason: z.string().max(300).optional(),
  })
  .refine((v) => v.end_date >= v.start_date, {
    message: "La data di fine non può precedere quella di inizio",
    path: ["end_date"],
  })
  .refine((v) => v.type !== "permesso" || (v.start_time && v.end_time), {
    message: "Per un permesso indica l'orario di inizio e fine",
    path: ["start_time"],
  });

function FeriePage() {
  const qc = useQueryClient();
  const { data: me } = useStaff();
  const isAdmin = me?.roles.includes("admin") ?? false;

  const [form, setForm] = useState({
    staff_id: "",
    type: "ferie" as "ferie" | "malattia" | "permesso",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    reason: "",
  });

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

  const { data: absences } = useQuery({
    queryKey: ["staff-absences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_absences")
        .select("*, profiles:staff_id(full_name, email)")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);
      const v = parsed.data;
      const { error } = await supabase.from("staff_absences").insert({
        staff_id: v.staff_id,
        type: v.type,
        start_date: v.start_date,
        end_date: v.end_date,
        start_time: v.type === "permesso" ? v.start_time || null : null,
        end_time: v.type === "permesso" ? v.end_time || null : null,
        reason: v.reason?.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm({
        staff_id: "",
        type: "ferie",
        start_date: "",
        end_date: "",
        start_time: "",
        end_time: "",
        reason: "",
      });
      qc.invalidateQueries({ queryKey: ["staff-absences"] });
      toast.success("Assenza registrata");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Creazione non riuscita"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("staff_absences").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff-absences"] });
      toast.success("Assenza eliminata");
    },
    onError: () => toast.error("Operazione non consentita"),
  });

  const formatDateRange = (a: { start_date: string; end_date: string }) => {
    const start = new Date(a.start_date + "T00:00:00").toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
    });
    const end = new Date(a.end_date + "T00:00:00").toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return a.start_date === a.end_date ? end : `${start} – ${end}`;
  };

  return (
    <div className="mx-auto max-w-5xl">
      <p className="eyebrow">Gestionale</p>
      <h1 className="display-md mt-3 text-3xl">Ferie e permessi</h1>
      <p className="lede mt-3 text-base">
        Registra ferie, malattie e permessi dello staff. La creazione e la modifica sono
        riservate agli amministratori; tutto lo staff può consultarli.
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
          <div className="md:col-span-2">
            <Label>Tipo</Label>
            <select
              className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })}
            >
              <option value="ferie">Ferie</option>
              <option value="malattia">Malattia</option>
              <option value="permesso">Permesso (poche ore)</option>
            </select>
          </div>
          <div>
            <Label>Data inizio</Label>
            <Input
              type="date"
              className="mt-2 h-12 rounded-xl"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </div>
          <div>
            <Label>Data fine</Label>
            <Input
              type="date"
              className="mt-2 h-12 rounded-xl"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </div>
          {form.type === "permesso" && (
            <>
              <div>
                <Label>Ora inizio</Label>
                <Input
                  type="time"
                  className="mt-2 h-12 rounded-xl"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                />
              </div>
              <div>
                <Label>Ora fine</Label>
                <Input
                  type="time"
                  className="mt-2 h-12 rounded-xl"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                />
              </div>
            </>
          )}
          <div className="md:col-span-2">
            <Label>Motivo (facoltativo)</Label>
            <Input
              className="mt-2 h-12 rounded-xl"
              maxLength={300}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>
          <div className="flex items-end md:col-span-2">
            <Button
              variant="hero"
              size="pill"
              className="w-full"
              disabled={create.isPending}
              onClick={() => create.mutate()}
            >
              Registra assenza
            </Button>
          </div>
        </div>
      )}

      <div className="card-aura mt-12 divide-y divide-border">
        {(absences ?? []).map((a) => (
          <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <div className="font-medium">
                {(a.profiles as { full_name?: string; email?: string } | null)?.full_name ?? "Staff"}
              </div>
              <div className="text-sm text-muted-foreground">
                {TYPE_LABELS[a.type] ?? a.type} · {formatDateRange(a)}
                {a.type === "permesso" && a.start_time && a.end_time
                  ? ` · ${a.start_time.slice(0, 5)}–${a.end_time.slice(0, 5)}`
                  : ""}
              </div>
              {a.reason && <div className="mt-1 text-xs text-muted-foreground">{a.reason}</div>}
            </div>
            {isAdmin && (
              <button
                className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                onClick={() => remove.mutate(a.id)}
              >
                Elimina
              </button>
            )}
          </div>
        ))}
        {(absences?.length ?? 0) === 0 && (
          <p className="p-5 text-sm text-muted-foreground">Nessuna assenza registrata.</p>
        )}
      </div>
    </div>
  );
}
