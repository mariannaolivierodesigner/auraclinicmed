import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getTreatmentsCatalog } from "@/lib/treatments-catalog.functions";

export function SiteFooter() {
  const { data } = useQuery({
    queryKey: ["treatments-catalog"],
    queryFn: () => getTreatmentsCatalog(),
    staleTime: 5 * 60 * 1000,
  });
  const categories = data?.categories ?? [];
  return (
    <footer className="border-t border-border bg-secondary/60">
      <div className="container-aura py-20">
        <div className="grid gap-12 md:grid-cols-4">
          <div>
            <div className="text-[1.05rem] font-semibold tracking-[-0.02em]">
              AURA<span className="text-sage"> Clinic</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Chirurgia plastica ed estetica. Milano, Via della Spiga 12.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              <a href="tel:+390200000000" className="transition hover:text-foreground">
                +39 02 0000 0000
              </a>
              <br />
              <a href="mailto:info@auraclinic.it" className="transition hover:text-foreground">
                info@auraclinic.it
              </a>
            </p>
          </div>

          <div>
            <div className="eyebrow">Trattamenti</div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    to="/trattamenti/$categoria"
                    params={{ categoria: c.slug }}
                    className="transition hover:text-foreground"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="eyebrow">Studio</div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/il-dottore" className="transition hover:text-foreground">
                  Il Dottore
                </Link>
              </li>
              <li>
                <Link to="/risultati" className="transition hover:text-foreground">
                  Risultati
                </Link>
              </li>
              <li>
                <Link to="/testimonianze" className="transition hover:text-foreground">
                  Testimonianze
                </Link>
              </li>
              <li>
                <Link to="/magazine" className="transition hover:text-foreground">
                  Magazine
                </Link>
              </li>
              <li>
                <Link to="/contatti" className="transition hover:text-foreground">
                  Contatti
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="eyebrow">Legale</div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/legale/privacy" className="transition hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/legale/cookie" className="transition hover:text-foreground">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/legale/termini" className="transition hover:text-foreground">
                  Termini e Condizioni
                </Link>
              </li>
              <li>
                <Link to="/legale/dati-sanitari" className="transition hover:text-foreground">
                  Informativa dati sanitari (Art. 9)
                </Link>
              </li>
              <li>
                <Link to="/legale/diritti" className="transition hover:text-foreground">
                  Diritti dell'interessato
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 border-t border-border pt-8 text-xs leading-relaxed text-muted-foreground">
          <p>
            AURA Clinic S.r.l. — P.IVA 00000000000 — Direttore Sanitario Dott. Alessandro Rinaldi,
            iscritto all'Ordine dei Medici di Milano n. 00000. Autorizzazione sanitaria n. 0000.
          </p>
        </div>
      </div>
    </footer>
  );
}
