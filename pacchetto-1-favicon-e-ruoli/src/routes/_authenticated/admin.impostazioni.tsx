import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStaff } from "@/hooks/use-staff";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/impostazioni")({
  component: TeamPage,
});

const CLINICAL_ROLES = [
  { value: "medico", label: "Medico" },
  { value: "infermiera", label: "Infermiera" },
  { value: "assistente", label: "Assistente" },
  { value: "segreteria", label: "Segreteria" },
  { value: "altro", label: "Altro" },
] as const;

function TeamPage() {
  const qc = useQueryClient();
  const { data: me } = useStaff();
  const isAdmin = me?.roles.includes("admin") ?? false;

  const { data } = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const [profiles, roles] = await Promise.all([
        supabase.from("profiles").select("*, clinical_role").order("created_at"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (profiles.error) throw profiles.error;
      return (profiles.data ?? []).map((p) => ({
        ...p,
        roles: (roles.data ?? []).filter((r) => r.user_id === p.id).map((r) => r.role),
      }));
    },
  });

  const grant = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "staff" }) => {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team"] });
      toast.success("Ruolo assegnato");
    },
    onError: () => toast.error("Operazione non consentita"),
  });

  const revoke = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "staff" }) => {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team"] });
      toast.success("Ruolo rimosso");
    },
    onError: () => toast.error("Operazione non consentita"),
  });

  const setClinicalRole = useMutation({
    mutationFn: async ({
      userId,
      clinicalRole,
    }: {
      userId: string;
      clinicalRole: (typeof CLINICAL_ROLES)[number]["value"] | "";
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ clinical_role: clinicalRole || null })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team"] });
      toast.success("Ruolo clinico aggiornato");
    },
    onError: () => toast.error("Operazione non consentita"),
  });

  return (
    <div className="mx-auto max-w-3xl">
      <p className="eyebrow">Gestionale</p>
      <h1 className="display-md mt-3 text-3xl">Team e permessi</h1>
      <p className="lede mt-3 text-base">
        Solo gli amministratori possono abilitare nuovi membri all'accesso ai dati clinici.
      </p>

      <div className="card-aura mt-8 divide-y divide-border">
        {(data ?? []).map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <div className="font-medium">{p.full_name ?? "Senza nome"}</div>
              <div className="text-sm text-muted-foreground">{p.email}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {p.roles.length ? p.roles.join(", ") : "nessun ruolo"}
              </div>
              {isAdmin ? (
                <select
                  className="mt-3 h-10 rounded-lg border border-border bg-background px-3 text-sm"
                  value={(p as { clinical_role?: string | null }).clinical_role ?? ""}
                  onChange={(e) =>
                    setClinicalRole.mutate({
                      userId: p.id,
                      clinicalRole: e.target.value as (typeof CLINICAL_ROLES)[number]["value"] | "",
                    })
                  }
                >
                  <option value="">Ruolo clinico non impostato</option>
                  {CLINICAL_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              ) : (
                (p as { clinical_role?: string | null }).clinical_role && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Ruolo clinico:{" "}
                    {
                      CLINICAL_ROLES.find(
                        (r) => r.value === (p as { clinical_role?: string | null }).clinical_role,
                      )?.label
                    }
                  </div>
                )
              )}
            </div>
            {isAdmin && (
              <div className="flex flex-wrap gap-2">
                {(["staff", "admin"] as const).map((role) =>
                  p.roles.includes(role) ? (
                    <Button
                      key={role}
                      variant="ghost"
                      size="sm"
                      className="rounded-full px-4"
                      onClick={() => revoke.mutate({ userId: p.id, role })}
                    >
                      Rimuovi {role}
                    </Button>
                  ) : (
                    <Button
                      key={role}
                      variant="quiet"
                      size="sm"
                      className="rounded-full px-4"
                      onClick={() => grant.mutate({ userId: p.id, role })}
                    >
                      Abilita {role}
                    </Button>
                  ),
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
