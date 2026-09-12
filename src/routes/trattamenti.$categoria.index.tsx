import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/motion-primitives";
import { Button } from "@/components/ui/button";
import { getTreatmentsCatalog } from "@/lib/treatments-catalog.functions";

export const Route = createFileRoute("/trattamenti/$categoria/")({
  loader: async ({ params }) => {
    const catalog = await getTreatmentsCatalog();
    const category = catalog.categories.find((c) => c.slug === params.categoria);
    if (!category) throw notFound();
    return {
      category,
      treatments: catalog.treatments.filter((t) => t.category_slug === category.slug),
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Categoria non disponibile | AURA Clinic" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.category.name} | AURA Clinic`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.category.blurb ?? "" },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.category.blurb ?? "" },
      ],
    };
  },
  component: CategoryPage,
  notFoundComponent: () => (
    <PageHero eyebrow="Trattamenti" title="Categoria non trovata" lede="Torna all'elenco completo dei trattamenti." />
  ),
});

function CategoryPage() {
  const { category, treatments: list } = Route.useLoaderData();

  return (
    <>
      <PageHero eyebrow="Trattamenti" title={category.name} lede={category.blurb ?? ""}>
        <Button asChild variant="hero" size="pill" className="mt-8">
          <Link to="/contatti">Prenota una consulenza</Link>
        </Button>
      </PageHero>

      <section className="py-20 md:py-28">
        <div className="container-aura grid gap-5 md:grid-cols-2">
          {list.map((t, i) => (
            <Reveal key={t.slug} delay={i * 0.05}>
              <Link
                to="/trattamenti/$categoria/$slug"
                params={{ categoria: category.slug, slug: t.slug }}
                className="card-aura card-hover group flex h-full flex-col justify-between p-8 md:p-10"
              >
                <div>
                  <h2 className="display-md text-2xl">{t.name}</h2>
                  <p className="lede mt-3 text-base">{t.summary}</p>
                  <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
                    <div>
                      <dt className="eyebrow">Durata</dt>
                      <dd className="mt-1 text-foreground">{t.duration}</dd>
                    </div>
                    <div>
                      <dt className="eyebrow">Anestesia</dt>
                      <dd className="mt-1 text-foreground">{t.anesthesia}</dd>
                    </div>
                  </dl>
                </div>
                <ArrowUpRight className="mt-8 size-4 text-sage transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
