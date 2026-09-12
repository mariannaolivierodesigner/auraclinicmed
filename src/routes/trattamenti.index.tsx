import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/motion-primitives";
import { getTreatmentsCatalog } from "@/lib/treatments-catalog.functions";

export const Route = createFileRoute("/trattamenti/")({
  loader: () => getTreatmentsCatalog(),
  head: () => ({
    meta: [
      { title: "Trattamenti — Chirurgia e medicina estetica | AURA Clinic" },
      {
        name: "description",
        content:
          "Chirurgia del viso, del seno, del corpo e medicina estetica non chirurgica. Ogni trattamento spiegato con chiarezza: indicazioni, percorso, recupero.",
      },
      { property: "og:title", content: "Trattamenti | AURA Clinic" },
      {
        property: "og:description",
        content: "Quattro aree di intervento, spiegate senza gergo medico inutile.",
      },
    ],
  }),
  component: TreatmentsIndex,
});

function TreatmentsIndex() {
  const { categories, treatments } = Route.useLoaderData();

  return (
    <>
      <PageHero
        eyebrow="Trattamenti"
        title="Quello che facciamo, spiegato come lo spieghiamo in studio."
        lede="Nessun elenco di procedure fine a sé stesso. Per ogni trattamento trovi indicazioni reali, come si svolge, quanto dura il recupero e quando invece è meglio non farlo."
      />

      <section className="py-20 md:py-28">
        <div className="container-aura space-y-24">
          {categories.map((c) => (
            <div key={c.slug}>
              <Reveal>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 className="display-md">{c.name}</h2>
                    {c.blurb && <p className="lede mt-2 text-base">{c.blurb}</p>}
                  </div>
                  <Link
                    to="/trattamenti/$categoria"
                    params={{ categoria: c.slug }}
                    className="text-sm text-sage underline-offset-4 hover:underline"
                  >
                    Vedi la categoria
                  </Link>
                </div>
              </Reveal>

              <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {treatments
                  .filter((t) => t.category_slug === c.slug)
                  .map((t, i) => (
                    <Reveal key={t.slug} delay={i * 0.05}>
                      <Link
                        to="/trattamenti/$categoria/$slug"
                        params={{ categoria: c.slug, slug: t.slug }}
                        className="card-aura card-hover group flex h-full flex-col justify-between p-7"
                      >
                        <div>
                          <h3 className="text-xl font-semibold tracking-[-0.02em]">{t.name}</h3>
                          <p className="mt-2 text-sm text-muted-foreground">{t.summary}</p>
                        </div>
                        <ArrowUpRight className="mt-8 size-4 text-sage transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" />
                      </Link>
                    </Reveal>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
