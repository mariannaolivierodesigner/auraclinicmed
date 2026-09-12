import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/trattamenti")({
  component: TrattamentiPage,
});

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function TrattamentiPage() {
  const qc = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ["admin-treatment-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatment_categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: treatments } = useQuery({
    queryKey: ["admin-treatments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("treatments").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const [newCategory, setNewCategory] = useState({ name: "", blurb: "" });
  const createCategory = useMutation({
    mutationFn: async () => {
      if (!newCategory.name.trim()) throw new Error("Il nome della categoria è obbligatorio");
      const { error } = await supabase.from("treatment_categories").insert({
        name: newCategory.name.trim(),
        slug: slugify(newCategory.name),
        blurb: newCategory.blurb.trim() || null,
        sort_order: categories?.length ?? 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewCategory({ name: "", blurb: "" });
      qc.invalidateQueries({ queryKey: ["admin-treatment-categories"] });
      toast.success("Categoria creata");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Creazione non riuscita"),
  });

  const toggleCategoryActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("treatment_categories").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-treatment-categories"] }),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("treatment_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-treatment-categories"] });
      qc.invalidateQueries({ queryKey: ["admin-treatments"] });
      toast.success("Categoria eliminata");
    },
    onError: () => toast.error("Elimina prima i trattamenti di questa categoria, oppure riprova"),
  });

  const emptyTreatment = {
    category_id: "",
    name: "",
    summary: "",
    what: "",
    who: "",
    duration: "",
    anesthesia: "",
    recovery: "",
  };
  const [newTreatment, setNewTreatment] = useState(emptyTreatment);
  const createTreatment = useMutation({
    mutationFn: async () => {
      if (!newTreatment.category_id) throw new Error("Seleziona una categoria");
      if (!newTreatment.name.trim()) throw new Error("Il nome del trattamento è obbligatorio");
      const sameCategory = (treatments ?? []).filter((t) => t.category_id === newTreatment.category_id);
      const { error } = await supabase.from("treatments").insert({
        category_id: newTreatment.category_id,
        name: newTreatment.name.trim(),
        slug: slugify(newTreatment.name),
        summary: newTreatment.summary.trim() || null,
        what: newTreatment.what.trim() || null,
        who: newTreatment.who.trim() || null,
        duration: newTreatment.duration.trim() || null,
        anesthesia: newTreatment.anesthesia.trim() || null,
        recovery: newTreatment.recovery.trim() || null,
        sort_order: sameCategory.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewTreatment(emptyTreatment);
      qc.invalidateQueries({ queryKey: ["admin-treatments"] });
      toast.success("Trattamento creato");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Creazione non riuscita"),
  });

  const toggleTreatmentActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("treatments").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-treatments"] }),
  });

  const deleteTreatment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("treatments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-treatments"] });
      toast.success("Trattamento eliminato");
    },
    onError: () => toast.error("Operazione non consentita"),
  });

  return (
    <div className="mx-auto max-w-5xl">
      <p className="eyebrow">Gestionale</p>
      <h1 className="display-md mt-3 text-3xl">Trattamenti</h1>
      <p className="lede mt-3 text-base">
        Categorie e trattamenti mostrati anche sul sito pubblico, nella sezione "Trattamenti". Disattiva
        una voce per nasconderla dal sito senza eliminarla.
      </p>

      {/* CATEGORIE */}
      <h2 className="display-md mt-12 text-xl">Categorie</h2>
      <div className="card-aura mt-4 grid gap-4 p-6 md:grid-cols-3">
        <Input
          className="h-11 rounded-xl"
          placeholder="Nome nuova categoria"
          value={newCategory.name}
          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
        />
        <Input
          className="h-11 rounded-xl md:col-span-1"
          placeholder="Sottotitolo (facoltativo)"
          value={newCategory.blurb}
          onChange={(e) => setNewCategory({ ...newCategory, blurb: e.target.value })}
        />
        <Button variant="hero" size="pill" disabled={createCategory.isPending} onClick={() => createCategory.mutate()}>
          Aggiungi categoria
        </Button>
      </div>

      <div className="card-aura mt-4 divide-y divide-border">
        {(categories ?? []).map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <div className="font-medium">{c.name}</div>
              {c.blurb && <div className="text-sm text-muted-foreground">{c.blurb}</div>}
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={c.is_active}
                  onChange={(e) => toggleCategoryActive.mutate({ id: c.id, is_active: e.target.checked })}
                />
                Pubblicata sul sito
              </label>
              <button
                className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                onClick={() => deleteCategory.mutate(c.id)}
              >
                Elimina
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* TRATTAMENTI */}
      <h2 className="display-md mt-14 text-xl">Nuovo trattamento</h2>
      <div className="card-aura mt-4 grid gap-4 p-6 md:grid-cols-2">
        <div>
          <Label>Categoria</Label>
          <select
            className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            value={newTreatment.category_id}
            onChange={(e) => setNewTreatment({ ...newTreatment, category_id: e.target.value })}
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
          <Label>Nome del trattamento</Label>
          <Input
            className="mt-2 h-11 rounded-xl"
            value={newTreatment.name}
            onChange={(e) => setNewTreatment({ ...newTreatment, name: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <Label>Riassunto breve (mostrato nell'elenco)</Label>
          <Input
            className="mt-2 h-11 rounded-xl"
            value={newTreatment.summary}
            onChange={(e) => setNewTreatment({ ...newTreatment, summary: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <Label>Cos'è (descrizione)</Label>
          <Textarea
            className="mt-2 rounded-xl"
            rows={3}
            value={newTreatment.what}
            onChange={(e) => setNewTreatment({ ...newTreatment, what: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <Label>Per chi è indicato</Label>
          <Textarea
            className="mt-2 rounded-xl"
            rows={2}
            value={newTreatment.who}
            onChange={(e) => setNewTreatment({ ...newTreatment, who: e.target.value })}
          />
        </div>
        <div>
          <Label>Durata</Label>
          <Input
            className="mt-2 h-11 rounded-xl"
            placeholder="es. 60-90 minuti"
            value={newTreatment.duration}
            onChange={(e) => setNewTreatment({ ...newTreatment, duration: e.target.value })}
          />
        </div>
        <div>
          <Label>Anestesia</Label>
          <Input
            className="mt-2 h-11 rounded-xl"
            placeholder="es. Locale, Generale..."
            value={newTreatment.anesthesia}
            onChange={(e) => setNewTreatment({ ...newTreatment, anesthesia: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <Label>Recupero</Label>
          <Input
            className="mt-2 h-11 rounded-xl"
            value={newTreatment.recovery}
            onChange={(e) => setNewTreatment({ ...newTreatment, recovery: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <Button variant="hero" size="pill" disabled={createTreatment.isPending} onClick={() => createTreatment.mutate()}>
            Aggiungi trattamento
          </Button>
        </div>
      </div>

      <h2 className="display-md mt-14 text-xl">Trattamenti esistenti</h2>
      <div className="card-aura mt-4 divide-y divide-border">
        {(categories ?? []).map((c) => {
          const list = (treatments ?? []).filter((t) => t.category_id === c.id);
          if (list.length === 0) return null;
          return (
            <div key={c.id} className="p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{c.name}</div>
              <div className="mt-2 divide-y divide-border">
                {list.map((t) => (
                  <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <div className="font-medium">{t.name}</div>
                      {t.summary && <div className="text-sm text-muted-foreground">{t.summary}</div>}
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={t.is_active}
                          onChange={(e) => toggleTreatmentActive.mutate({ id: t.id, is_active: e.target.checked })}
                        />
                        Pubblicato
                      </label>
                      <button
                        className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                        onClick={() => deleteTreatment.mutate(t.id)}
                      >
                        Elimina
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {(treatments?.length ?? 0) === 0 && (
          <p className="p-4 text-sm text-muted-foreground">Nessun trattamento creato.</p>
        )}
      </div>
    </div>
  );
}
