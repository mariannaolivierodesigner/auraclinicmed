import { createServerFn } from "@tanstack/react-start";

export type PublicTreatmentStep = { title: string; body: string };
export type PublicTreatmentFaq = { q: string; a: string };

export type PublicTreatmentCategory = {
  id: string;
  name: string;
  slug: string;
  blurb: string | null;
  sort_order: number;
};

export type PublicTreatment = {
  id: string;
  category_id: string;
  category_slug: string;
  name: string;
  slug: string;
  summary: string | null;
  what: string | null;
  who: string | null;
  duration: string | null;
  anesthesia: string | null;
  recovery: string | null;
  steps: PublicTreatmentStep[];
  faq: PublicTreatmentFaq[];
  sort_order: number;
};

type CatalogResult = {
  categories: PublicTreatmentCategory[];
  treatments: PublicTreatment[];
};

/**
 * Catalogo trattamenti pubblicato (categorie + trattamenti attivi), letto dal
 * database. Sostituisce il vecchio elenco fisso in src/lib/treatments.ts.
 */
export const getTreatmentsCatalog = createServerFn({ method: "GET" }).handler(
  async (): Promise<CatalogResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [categories, treatments] = await Promise.all([
      supabaseAdmin
        .from("treatment_categories")
        .select("id, name, slug, blurb, sort_order")
        .eq("is_active", true)
        .order("sort_order"),
      supabaseAdmin
        .from("treatments")
        .select(
          "id, category_id, name, slug, summary, what, who, duration, anesthesia, recovery, steps, faq, sort_order, treatment_categories!inner(slug, is_active)",
        )
        .eq("is_active", true)
        .eq("treatment_categories.is_active", true)
        .order("sort_order"),
    ]);

    if (categories.error || treatments.error) {
      console.error("[treatments-catalog]", categories.error, treatments.error);
      return { categories: [], treatments: [] };
    }

    return {
      categories: categories.data ?? [],
      treatments: (treatments.data ?? []).map((t) => {
        const { treatment_categories, ...rest } = t as typeof t & {
          treatment_categories: { slug: string; is_active: boolean } | null;
        };
        return {
          ...rest,
          category_slug: treatment_categories?.slug ?? "",
          steps: (rest.steps ?? []) as PublicTreatmentStep[],
          faq: (rest.faq ?? []) as PublicTreatmentFaq[],
        };
      }),
    };
  },
);
