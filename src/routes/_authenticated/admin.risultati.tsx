import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useStaff } from "@/hooks/use-staff";
import { watermarkImage } from "@/lib/watermark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/admin/risultati")({
  component: GalleryAdminPage,
});

const empty = {
  category_id: "",
  treatment_id: "",
  meta: "",
  description: "",
  consent: false,
  consent_signer: "",
  face_anonymized: false,
  published: false,
};

function GalleryAdminPage() {
  const qc = useQueryClient();
  const { data: me } = useStaff();
  const isAdmin = me?.roles.includes("admin") ?? false;
  const [form, setForm] = useState(empty);
  const [before, setBefore] = useState<File | null>(null);
  const [after, setAfter] = useState<File | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["admin-treatment-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatment_categories")
        .select("id, name, slug")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: treatments } = useQuery({
    queryKey: ["admin-treatments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatments")
        .select("id, category_id, name")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const treatmentsInCategory = (treatments ?? []).filter((t) => t.category_id === form.category_id);
  const selectedTreatment = (treatments ?? []).find((t) => t.id === form.treatment_id);
  const selectedCategory = (categories ?? []).find((c) => c.id === form.category_id);

  const { data: cases } = useQuery({
    queryKey: ["case_photos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_photos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const paths = data.flatMap((c) =>
        [c.before_public_path, c.after_public_path].filter((p): p is string => !!p),
      );
      const previews = new Map<string, string>();
      if (paths.length) {
        const { data: signed } = await supabase.storage
          .from("case-photos")
          .createSignedUrls(paths, 3600);
        (signed ?? []).forEach((s) => {
          if (s.path && s.signedUrl) previews.set(s.path, s.signedUrl);
        });
      }
      return data.map((c) => ({
        ...c,
        beforeUrl: c.before_public_path ? previews.get(c.before_public_path) : undefined,
        afterUrl: c.after_public_path ? previews.get(c.after_public_path) : undefined,
      }));
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.category_id) throw new Error("Seleziona una categoria");
      if (!selectedTreatment) throw new Error("Seleziona un trattamento");
      if (!before || !after) throw new Error("Carica sia la foto prima sia quella dopo");
      if (!form.consent) throw new Error("Serve il consenso alla pubblicazione delle immagini");
      if (!form.consent_signer.trim()) throw new Error("Indica chi ha firmato il consenso");

      const { data: userData } = await supabase.auth.getUser();
      const folder = crypto.randomUUID();

      const upload = async (file: File, kind: "before" | "after") => {
        const raw = `${folder}/${kind}-originale.${file.name.split(".").pop() ?? "jpg"}`;
        const wm = `${folder}/${kind}-filigrana.jpg`;
        const { error: e1 } = await supabase.storage
          .from("case-photos")
          .upload(raw, file, { upsert: false, contentType: file.type });
        if (e1) throw e1;
        const watermarked = await watermarkImage(file);
        const { error: e2 } = await supabase.storage
          .from("case-photos")
          .upload(wm, watermarked, { upsert: false, contentType: "image/jpeg" });
        if (e2) throw e2;
        return { raw, wm };
      };

      const b = await upload(before, "before");
      const a = await upload(after, "after");

      const { error } = await supabase.from("case_photos").insert({
        title: selectedTreatment.name,
        category: selectedCategory?.slug ?? "",
        meta: form.meta.trim() || null,
        description: form.description.trim() || null,
        before_path: b.raw,
        after_path: a.raw,
        before_public_path: b.wm,
        after_public_path: a.wm,
        face_anonymized: form.face_anonymized,
        publication_consent: form.consent,
        consent_at: new Date().toISOString(),
        consent_signer: form.consent_signer.trim(),
        published: form.published,
        created_by: userData.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm(empty);
      setBefore(null);
      setAfter(null);
      qc.invalidateQueries({ queryKey: ["case_photos"] });
      toast.success("Caso caricato con filigrana");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Caricamento non riuscito"),
  });

  const update = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Database["public"]["Tables"]["case_photos"]["Update"];
    }) => {
      const { error } = await supabase.from("case_photos").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["case_photos"] });
      toast.success("Caso aggiornato");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Aggiornamento non riuscito"),
  });

  const remove = useMutation({
    mutationFn: async (c: {
      id: string;
      before_path: string | null;
      after_path: string | null;
      before_public_path: string | null;
      after_public_path: string | null;
    }) => {
      const paths = [c.before_path, c.after_path, c.before_public_path, c.after_public_path].filter(
        (p): p is string => !!p,
      );
      if (paths.length) await supabase.storage.from("case-photos").remove(paths);
      const { error } = await supabase.from("case_photos").delete().eq("id", c.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["case_photos"] });
      toast.success("Caso eliminato");
    },
    onError: () => toast.error("Operazione non consentita"),
  });

  return (
    <div className="mx-auto max-w-5xl">
      <p className="eyebrow">Gestionale</p>
      <h1 className="display-md mt-3 text-3xl">Galleria prima/dopo</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        Le foto restano in un archivio privato. Sul sito pubblico vengono mostrate solo le versioni
        con filigrana dei casi pubblicati con consenso attivo; alla revoca spariscono subito.
      </p>

      <div className="mt-8 rounded-3xl border border-border bg-background p-6 md:p-8">
        <h2 className="text-base font-semibold">Nuovo caso</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <Label>Categoria</Label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value, treatment_id: "" })}
              className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Seleziona...</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Trattamento</Label>
            <select
              value={form.treatment_id}
              onChange={(e) => setForm({ ...form, treatment_id: e.target.value })}
              disabled={!form.category_id}
              className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
            >
              <option value="">
                {form.category_id ? "Seleziona..." : "Scegli prima una categoria"}
              </option>
              {treatmentsInCategory.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {form.category_id && treatmentsInCategory.length === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Nessun trattamento in questa categoria: aggiungilo prima dalla scheda "Trattamenti".
              </p>
            )}
          </div>
          <div>
            <Label>Dettagli (età, tempo dall'intervento)</Label>
            <Input
              value={form.meta}
              onChange={(e) => setForm({ ...form, meta: e.target.value })}
              placeholder="Donna, 29 anni · 12 mesi dopo"
            />
          </div>
          <div>
            <Label>Firmatario del consenso</Label>
            <Input
              value={form.consent_signer}
              onChange={(e) => setForm({ ...form, consent_signer: e.target.value })}
              placeholder="Nome e cognome del paziente"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Note pubbliche</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <Label>Foto prima</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setBefore(e.target.files?.[0] ?? null)}
            />
          </div>
          <div>
            <Label>Foto dopo</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setAfter(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <div className="mt-6 space-y-3 rounded-2xl bg-muted/50 p-4 text-sm">
          <label className="flex items-start gap-3">
            <Checkbox
              checked={form.consent}
              onCheckedChange={(v) => setForm({ ...form, consent: v === true })}
            />
            <span>
              Consenso scritto specifico alla pubblicazione delle immagini (Art. 9 GDPR), distinto
              dal consenso al trattamento sanitario e revocabile.
            </span>
          </label>
          <label className="flex items-start gap-3">
            <Checkbox
              checked={form.face_anonymized}
              onCheckedChange={(v) => setForm({ ...form, face_anonymized: v === true })}
            />
            <span>Volto anonimizzato su richiesta del paziente</span>
          </label>
          <label className="flex items-start gap-3">
            <Checkbox
              checked={form.published}
              onCheckedChange={(v) => setForm({ ...form, published: v === true })}
            />
            <span>Pubblica subito nella galleria del sito</span>
          </label>
        </div>

        <Button
          className="mt-6"
          onClick={() => create.mutate()}
          disabled={create.isPending}
          size="pill"
        >
          {create.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          Carica con filigrana
        </Button>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {(cases ?? []).map((c) => (
          <div key={c.id} className="rounded-3xl border border-border bg-background p-5">
            <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-2xl">
              {[c.beforeUrl, c.afterUrl].map((src, i) => (
                <div key={i} className="aspect-[3/4] bg-muted">
                  {src && (
                    <img
                      src={src}
                      alt={`${c.title} — ${i === 0 ? "prima" : "dopo"}`}
                      className="size-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 font-medium">{c.title}</div>
            <div className="text-sm text-muted-foreground">{c.meta}</div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-border px-3 py-1">
                {c.published ? "Pubblicato" : "Bozza"}
              </span>
              <span className="rounded-full border border-border px-3 py-1">
                {c.consent_revoked_at ? "Consenso revocato" : "Consenso attivo"}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="quiet"
                size="sm"
                onClick={() => update.mutate({ id: c.id, patch: { published: !c.published } })}
                disabled={!!c.consent_revoked_at && !c.published}
              >
                {c.published ? "Ritira dal sito" : "Pubblica"}
              </Button>
              {!c.consent_revoked_at && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    update.mutate({
                      id: c.id,
                      patch: { consent_revoked_at: new Date().toISOString(), published: false },
                    })
                  }
                >
                  Registra revoca
                </Button>
              )}
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (
                      confirm(
                        `Eliminare definitivamente il caso "${c.title}"? Le foto verranno rimosse.`,
                      )
                    )
                      remove.mutate(c);
                  }}
                >
                  <Trash2 className="size-4" />
                  Elimina
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
