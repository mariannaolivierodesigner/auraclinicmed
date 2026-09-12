import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/motion-primitives";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getTreatmentsCatalog } from "@/lib/treatments-catalog.functions";

export const Route = createFileRoute("/trattamenti/$categoria/$slug")({
  loader: async ({ params }) => {
    const catalog = await getTreatmentsCatalog();
    const treatment = catalog.treatments.find(
      (t) => t.slug === params.slug && t.category_slug === params.categoria,
    );
    if (!treatment) throw notFound();
    const category = catalog.categories.find((c) => c.slug === params.categoria);
    return { treatment, category };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Trattamento non disponibile | AURA Clinic" }, { name: "robots", content: "noindex" }],
      };
    }
    const t = loaderData.treatment;
    const title = `${t.name} — indicazioni, percorso e recupero | AURA Clinic`;
    return {
      meta: [
        { title },
        { name: "description", content: t.summary ?? "" },
        { property: "og:title", content: title },
        { property: "og:description", content: t.summary ?? "" },
      ],
    };
  },
  component: TreatmentPage,
  notFoundComponent: () => (
    <PageHero eyebrow="Trattamenti" title="Trattamento non trovato" lede="Torna all'elenco dei trattamenti." />
  ),
});

function TreatmentPage() {
  const { treatment: t, category } = Route.useLoaderData();

  return (
    <>
      <PageHero eyebrow={category?.name ?? "Trattamenti"} title={t.name} lede={t.summary ?? ""}>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild variant="hero" size="pill">
            <Link to="/contatti">Prenota una consulenza</Link>
          </Button>
          <Button asChild variant="quiet" size="pill">
            <Link to="/trattamenti/$categoria" params={{ categoria: t.category_slug }}>
              Altri trattamenti
            </Link>
          </Button>
        </div>
      </PageHero>

      <section className="py-20 md:py-28">
        <div className="container-aura grid gap-16 lg:grid-cols-[1fr_320px]">
          <div className="space-y-16">
            {t.what && (
              <Reveal>
                <h2 className="display-md text-2xl">Cos'è</h2>
                <p className="lede mt-3">{t.what}</p>
              </Reveal>
            )}

            {t.who && (
              <Reveal>
                <h2 className="display-md text-2xl">Per chi è indicato</h2>
                <p className="lede mt-3">{t.who}</p>
              </Reveal>
            )}

            {t.steps.length > 0 && (
              <div>
                <Reveal>
                  <h2 className="display-md text-2xl">Come si svolge</h2>
                </Reveal>
                <ol className="mt-8 space-y-6">
                  {t.steps.map((s, i) => (
                    <Reveal key={s.title} delay={i * 0.07}>
                      <li className="flex gap-6">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-sage text-sm font-medium text-sage tabular-nums">
                          {i + 1}
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold tracking-[-0.02em]">{s.title}</h3>
                          <p className="mt-1 text-muted-foreground">{s.body}</p>
                        </div>
                      </li>
                    </Reveal>
                  ))}
                </ol>
              </div>
            )}

            {t.faq.length > 0 && (
              <Reveal>
                <h2 className="display-md text-2xl">Domande frequenti</h2>
                <Accordion type="single" collapsible className="mt-4">
                  {t.faq.map((f) => (
                    <AccordionItem key={f.q} value={f.q}>
                      <AccordionTrigger className="text-left text-base">{f.q}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Reveal>
            )}
          </div>

          <Reveal delay={0.1}>
            <aside className="card-aura sticky top-24 p-7">
              <dl className="space-y-5 text-sm">
                <div>
                  <dt className="eyebrow">Durata</dt>
                  <dd className="mt-1">{t.duration}</dd>
                </div>
                <div>
                  <dt className="eyebrow">Anestesia</dt>
                  <dd className="mt-1">{t.anesthesia}</dd>
                </div>
                <div>
                  <dt className="eyebrow">Recupero</dt>
                  <dd className="mt-1 text-muted-foreground">{t.recovery}</dd>
                </div>
              </dl>
              <Button asChild variant="sage" size="pill" className="mt-7 w-full">
                <Link to="/contatti">Parlane con il Dottore</Link>
              </Button>
              <p className="mt-4 text-xs text-muted-foreground">
                I contenuti hanno finalità informativa e non sostituiscono una valutazione clinica.
                I risultati individuali possono variare.
              </p>
            </aside>
          </Reveal>
        </div>
      </section>
    </>
  );
}
