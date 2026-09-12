import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, CountUp } from "@/components/site/motion-primitives";
import { getTreatmentsCatalog } from "@/lib/treatments-catalog.functions";
import heroImg from "@/assets/hero-clinic.jpg";
import doctorImg from "@/assets/doctor-portrait.jpg";
import silkImg from "@/assets/texture-silk.jpg";

export const Route = createFileRoute("/")({
  loader: () => getTreatmentsCatalog(),
  head: () => ({
    meta: [
      { title: "AURA Clinic — Chirurgia plastica ed estetica a Milano" },
      {
        name: "description",
        content:
          "Un percorso su misura guidato dall'esperienza chirurgica e da un ascolto autentico. Prenota una consulenza riservata.",
      },
      { property: "og:title", content: "AURA Clinic — Chirurgia plastica ed estetica a Milano" },
      {
        property: "og:description",
        content:
          "Bellezza autentica, cura senza compromessi. Studio di chirurgia plastica a Milano.",
      },
    ],
  }),
  component: Home,
});

const EASE = [0.22, 1, 0.36, 1] as const;

function Home() {
  const { categories, treatments } = Route.useLoaderData();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <>
      {/* HERO */}
      <section ref={heroRef} className="relative h-[100svh] min-h-[620px] overflow-hidden">
        <motion.div style={{ y: imgY }} className="absolute inset-0 -top-[10%] h-[120%]">
          <img
            src={heroImg}
            alt="Sala d'attesa dello studio AURA Clinic, luce naturale e materiali caldi"
            width={1920}
            height={1200}
            className="size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/45 to-background" />
        </motion.div>

        <motion.div
          style={{ y: textY, opacity: fade }}
          className="container-aura relative flex h-full flex-col items-center justify-center text-center"
        >
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="eyebrow"
          >
            Chirurgia plastica ed estetica · Milano
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.08, ease: EASE }}
            className="display-xl mt-6 max-w-4xl"
          >
            Bellezza autentica,
            <br />
            cura senza compromessi.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.18, ease: EASE }}
            className="lede mt-7 max-w-2xl"
          >
            Un percorso su misura, guidato dall'esperienza chirurgica e da un ascolto autentico.
            Perché ogni scelta estetica comincia da una domanda: chi vuoi essere, ancora più te
            stesso.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.28, ease: EASE }}
            className="mt-10 flex flex-col gap-3 sm:flex-row"
          >
            <Button asChild variant="hero" size="pill">
              <Link to="/contatti">Prenota una consulenza riservata</Link>
            </Button>
            <Button asChild variant="quiet" size="pill">
              <Link to="/trattamenti">
                Scopri i trattamenti <ArrowRight className="size-4" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* TRUST */}
      <section className="border-y border-border bg-secondary/50 py-24">
        <div className="container-aura grid gap-12 text-center sm:grid-cols-3">
          {[
            { n: 22, suffix: "", label: "anni di attività chirurgica" },
            { n: 6400, suffix: "+", label: "pazienti seguiti" },
            { n: 31, suffix: "", label: "pubblicazioni e relazioni a congressi" },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <div className="display-lg tabular-nums">
                <CountUp to={s.n} suffix={s.suffix} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TRATTAMENTI */}
      <section className="py-28 md:py-36">
        <div className="container-aura">
          <Reveal>
            <p className="eyebrow">Trattamenti</p>
            <h2 className="display-lg mt-4 max-w-2xl">
              Quattro aree, un unico criterio: la proporzione.
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {categories.map((c, i) => (
              <Reveal key={c.slug} delay={i * 0.06}>
                <Link
                  to="/trattamenti/$categoria"
                  params={{ categoria: c.slug }}
                  className="card-aura card-hover group flex h-full flex-col justify-between overflow-hidden p-8 md:p-10"
                >
                  <div>
                    <h3 className="display-md">{c.name}</h3>
                    <p className="lede mt-3 text-base">{c.blurb}</p>
                  </div>
                  <div className="mt-10 flex items-center gap-2 text-sm text-sage">
                    Esplora
                    <ArrowUpRight className="size-4 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <div className="mt-10 flex flex-wrap gap-2">
              {treatments.slice(0, 8).map((t) => (
                <Link
                  key={t.slug}
                  to="/trattamenti/$categoria/$slug"
                  params={{ categoria: t.category_slug, slug: t.slug }}
                  className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-all duration-300 hover:border-sage hover:text-foreground"
                >
                  {t.name}
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* IL DOTTORE */}
      <section className="bg-secondary/50 py-28 md:py-36">
        <div className="container-aura grid items-center gap-14 md:grid-cols-2">
          <Reveal>
            <div className="overflow-hidden rounded-3xl shadow-[var(--shadow-lift)]">
              <img
                src={doctorImg}
                alt="Ritratto del Dott. Alessandro Rinaldi"
                width={1024}
                height={1280}
                loading="lazy"
                className="size-full object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="eyebrow">Il Dottore</p>
            <h2 className="display-lg mt-4">Dott. Alessandro Rinaldi</h2>
            <p className="lede mt-6">
              Specialista in Chirurgia Plastica, Ricostruttiva ed Estetica. Formazione tra Milano e
              Parigi, oltre vent'anni di sala operatoria e una convinzione semplice: il risultato
              migliore è quello che nessuno riconosce come chirurgico.
            </p>
            <p className="lede mt-4">
              Ogni percorso inizia con una consulenza lunga, senza fretta. A volte finisce con un
              consiglio di non operare: anche questa è chirurgia fatta bene.
            </p>
            <Button asChild variant="quiet" size="pill" className="mt-8">
              <Link to="/il-dottore">
                Il percorso completo <ArrowRight className="size-4" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* RISULTATI */}
      <section className="relative overflow-hidden py-28 md:py-36">
        <div className="container-aura grid items-center gap-14 md:grid-cols-2">
          <Reveal>
            <p className="eyebrow">Risultati</p>
            <h2 className="display-lg mt-4">Prima e dopo, senza filtri.</h2>
            <p className="lede mt-6">
              Una galleria interattiva di casi reali, pubblicati esclusivamente con consenso
              esplicito, revocabile e documentato. Dove richiesto, i volti sono anonimizzati.
            </p>
            <Button asChild variant="hero" size="pill" className="mt-8">
              <Link to="/risultati">Apri la galleria</Link>
            </Button>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="overflow-hidden rounded-3xl">
              <img
                src={silkImg}
                alt="Dettaglio materico di seta avorio"
                width={1600}
                height={900}
                loading="lazy"
                className="size-full object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA FINALE */}
      <section className="border-t border-border bg-primary py-28 text-primary-foreground md:py-36">
        <div className="container-aura text-center">
          <Reveal>
            <h2 className="display-lg">Il prossimo passo è una conversazione.</h2>
            <p className="mx-auto mt-6 max-w-xl text-lg opacity-70">
              Nessun impegno, nessuna pressione. Solo il tempo necessario per capire se e come
              procedere.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Button asChild variant="sage" size="pill-lg">
                <Link to="/contatti">Prenota una consulenza</Link>
              </Button>
              <Button
                asChild
                size="pill-lg"
                variant="ghost"
                className="border border-primary-foreground/25 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
              >
                <a href="https://wa.me/390200000000" target="_blank" rel="noreferrer">
                  Scrivici su WhatsApp
                </a>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
