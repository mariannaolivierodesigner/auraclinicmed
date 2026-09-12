import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { Check, MapPin, Clock, Phone, MessageCircle } from "lucide-react";
import { z } from "zod";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/motion-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { getTreatmentsCatalog } from "@/lib/treatments-catalog.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/contatti")({
  head: () => ({
    meta: [
      { title: "Contatti e prenotazione consulenza | AURA Clinic Milano" },
      {
        name: "description",
        content:
          "Prenota una consulenza riservata presso AURA Clinic, Via della Spiga 12, Milano. Orari, telefono, WhatsApp e modulo di contatto.",
      },
      { property: "og:title", content: "Contatti | AURA Clinic Milano" },
      { property: "og:description", content: "Prenota una consulenza riservata a Milano." },
    ],
  }),
  component: ContactPage,
});

const EASE = [0.22, 1, 0.36, 1] as const;

const schema = z.object({
  interest: z.string().min(1, "Seleziona un'area di interesse"),
  name: z.string().trim().min(2, "Inserisci il tuo nome").max(80),
  email: z.string().trim().email("Email non valida").max(160),
  phone: z.string().trim().min(6, "Telefono non valido").max(30),
  note: z.string().trim().max(800).optional(),
  slot: z.string().min(1, "Indica una preferenza"),
  privacy: z.literal(true, { errorMap: () => ({ message: "Il consenso privacy è obbligatorio" }) }),
});

const slots = ["Mattina infrasettimanale", "Pomeriggio infrasettimanale", "Sabato mattina", "Nessuna preferenza"];

function ContactPage() {
  const { data: catalog } = useQuery({
    queryKey: ["treatments-catalog"],
    queryFn: () => getTreatmentsCatalog(),
    staleTime: 5 * 60 * 1000,
  });
  const categories = catalog?.categories ?? [];
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    interest: "",
    name: "",
    email: "",
    phone: "",
    note: "",
    slot: "",
    privacy: false,
    marketing: false,
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const next = () => {
    setError(null);
    if (step === 0 && !form.interest) return setError("Seleziona un'area di interesse");
    if (step === 1) {
      const partial = z
        .object({
          name: schema.shape.name,
          email: schema.shape.email,
          phone: schema.shape.phone,
        })
        .safeParse(form);
      if (!partial.success) return setError(partial.error.issues[0]!.message);
    }
    setStep((s) => s + 1);
  };

  const [sending, setSending] = useState(false);

  const submit = async () => {
    setError(null);
    const result = schema.safeParse(form);
    if (!result.success) {
      setError(result.error.issues[0]!.message);
      return;
    }
    setSending(true);
    const { error: dbError } = await supabase.from("leads").insert({
      name: result.data.name,
      email: result.data.email,
      phone: result.data.phone,
      interest: result.data.interest,
      slot: result.data.slot,
      note: result.data.note ?? null,
      privacy_consent: true,
      marketing_consent: form.marketing,
    });
    setSending(false);
    if (dbError) {
      setError("Invio non riuscito. Riprova o chiamaci direttamente.");
      return;
    }
    setDone(true);
  };

  return (
    <>
      <PageHero
        eyebrow="Contatti"
        title="Prenota una consulenza riservata."
        lede="Tre passaggi, meno di un minuto. Ti richiamiamo entro 24 ore lavorative per confermare data e ora."
      />

      <section className="py-20 md:py-28">
        <div className="container-aura grid gap-14 lg:grid-cols-[1fr_360px]">
          <Reveal>
            <div className="card-aura p-8 md:p-10">
              {done ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="py-10 text-center"
                >
                  <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-sage text-sage-foreground">
                    <Check className="size-6" />
                  </div>
                  <h2 className="display-md mt-6 text-2xl">Richiesta inviata</h2>
                  <p className="lede mt-3 text-base">
                    Grazie {form.name.split(" ")[0]}. La segreteria ti contatterà entro 24 ore
                    lavorative all'indirizzo {form.email}.
                  </p>
                </motion.div>
              ) : (
                <>
                  <div className="mb-8 flex items-center gap-2">
                    {[0, 1, 2].map((s) => (
                      <div
                        key={s}
                        className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                          s <= step ? "bg-sage" : "bg-border"
                        }`}
                      />
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.4, ease: EASE }}
                    >
                      {step === 0 && (
                        <div>
                          <h2 className="display-md text-2xl">Di cosa vorresti parlare?</h2>
                          <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            {categories.map((c) => (
                              <button
                                key={c.slug}
                                type="button"
                                onClick={() => set("interest", c.name)}
                                className={`rounded-2xl border p-5 text-left transition-all duration-300 active:scale-[0.99] ${
                                  form.interest === c.name
                                    ? "border-sage bg-sage/10"
                                    : "border-border hover:border-foreground/30"
                                }`}
                              >
                                <div className="font-medium">{c.name}</div>
                                <div className="mt-1 text-sm text-muted-foreground">{c.blurb}</div>
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => set("interest", "Non lo so ancora")}
                              className={`rounded-2xl border p-5 text-left transition-all duration-300 sm:col-span-2 ${
                                form.interest === "Non lo so ancora"
                                  ? "border-sage bg-sage/10"
                                  : "border-border hover:border-foreground/30"
                              }`}
                            >
                              <div className="font-medium">Non lo so ancora</div>
                              <div className="mt-1 text-sm text-muted-foreground">
                                Va benissimo: la consulenza serve anche a questo.
                              </div>
                            </button>
                          </div>
                        </div>
                      )}

                      {step === 1 && (
                        <div>
                          <h2 className="display-md text-2xl">Come possiamo ricontattarti?</h2>
                          <div className="mt-6 grid gap-5">
                            <div>
                              <Label htmlFor="name">Nome e cognome</Label>
                              <Input
                                id="name"
                                className="mt-2 h-12 rounded-xl"
                                value={form.name}
                                maxLength={80}
                                onChange={(e) => set("name", e.target.value)}
                              />
                            </div>
                            <div className="grid gap-5 sm:grid-cols-2">
                              <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                  id="email"
                                  type="email"
                                  className="mt-2 h-12 rounded-xl"
                                  value={form.email}
                                  maxLength={160}
                                  onChange={(e) => set("email", e.target.value)}
                                />
                              </div>
                              <div>
                                <Label htmlFor="phone">Telefono</Label>
                                <Input
                                  id="phone"
                                  type="tel"
                                  className="mt-2 h-12 rounded-xl"
                                  value={form.phone}
                                  maxLength={30}
                                  onChange={(e) => set("phone", e.target.value)}
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="note">Qualcosa che vuoi anticiparci (facoltativo)</Label>
                              <Textarea
                                id="note"
                                className="mt-2 min-h-28 rounded-xl"
                                maxLength={800}
                                value={form.note}
                                onChange={(e) => set("note", e.target.value)}
                              />
                              <p className="mt-2 text-xs text-muted-foreground">
                                Non inserire dati sanitari dettagliati in questo campo: li
                                raccoglieremo in sede, in condizioni di riservatezza.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {step === 2 && (
                        <div>
                          <h2 className="display-md text-2xl">Quando preferisci?</h2>
                          <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            {slots.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => set("slot", s)}
                                className={`rounded-2xl border px-5 py-4 text-left text-sm transition-all duration-300 ${
                                  form.slot === s
                                    ? "border-sage bg-sage/10"
                                    : "border-border hover:border-foreground/30"
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>

                          <div className="mt-8 space-y-4 border-t border-border pt-6">
                            <label className="flex items-start gap-3 text-sm">
                              <Checkbox
                                checked={form.privacy}
                                onCheckedChange={(v) => set("privacy", v === true)}
                                className="mt-1"
                              />
                              <span className="text-muted-foreground">
                                Ho letto la{" "}
                                <Link to="/legale/privacy" className="text-foreground underline underline-offset-4">
                                  Privacy Policy
                                </Link>{" "}
                                e acconsento al trattamento dei miei dati per essere ricontattato.
                                (obbligatorio)
                              </span>
                            </label>
                            <label className="flex items-start gap-3 text-sm">
                              <Checkbox
                                checked={form.marketing}
                                onCheckedChange={(v) => set("marketing", v === true)}
                                className="mt-1"
                              />
                              <span className="text-muted-foreground">
                                Acconsento a ricevere comunicazioni informative dallo studio.
                                (facoltativo, revocabile in ogni momento)
                              </span>
                            </label>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {error && <p className="mt-6 text-sm text-destructive">{error}</p>}

                  <div className="mt-8 flex items-center gap-3">
                    {step > 0 && (
                      <Button variant="quiet" size="pill" onClick={() => setStep((s) => s - 1)}>
                        Indietro
                      </Button>
                    )}
                    {step < 2 ? (
                      <Button variant="hero" size="pill" onClick={next}>
                        Continua
                      </Button>
                    ) : (
                      <Button variant="hero" size="pill" onClick={submit}>
                        Invia richiesta
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="space-y-6">
              <div className="card-aura p-7">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-4 text-sage" />
                  <div>
                    <div className="font-medium">AURA Clinic</div>
                    <p className="text-sm text-muted-foreground">Via della Spiga 12, 20121 Milano</p>
                  </div>
                </div>
                <div className="mt-5 flex items-start gap-3">
                  <Clock className="mt-0.5 size-4 text-sage" />
                  <p className="text-sm text-muted-foreground">
                    Lun–Ven 9:00–19:00
                    <br />
                    Sab 9:00–13:00
                  </p>
                </div>
                <div className="mt-5 flex items-start gap-3">
                  <Phone className="mt-0.5 size-4 text-sage" />
                  <a href="tel:+390200000000" className="text-sm text-muted-foreground hover:text-foreground">
                    +39 02 0000 0000
                  </a>
                </div>
                <Button asChild variant="sage" size="pill" className="mt-7 w-full">
                  <a href="https://wa.me/390200000000" target="_blank" rel="noreferrer">
                    <MessageCircle className="size-4" /> Scrivici su WhatsApp
                  </a>
                </Button>
              </div>

              <div className="overflow-hidden rounded-3xl border border-border">
                <iframe
                  title="Mappa dello studio AURA Clinic"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=9.190%2C45.466%2C9.200%2C45.472&layer=mapnik"
                  className="h-64 w-full"
                  loading="lazy"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
