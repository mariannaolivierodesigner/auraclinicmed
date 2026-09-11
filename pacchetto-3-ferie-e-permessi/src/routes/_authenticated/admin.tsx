import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  CalendarDays,
  FileSignature,
  LayoutDashboard,
  LogOut,
  Palmtree,
  Sparkle,
  UserRound,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStaff } from "@/hooks/use-staff";
import { InstallAppButton } from "@/hooks/use-install-prompt";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Panoramica", icon: LayoutDashboard, exact: true },
  { to: "/admin/lead", label: "Lead", icon: Sparkle, exact: false },
  { to: "/admin/pazienti", label: "Pazienti", icon: Users, exact: false },
  { to: "/admin/agenda", label: "Agenda", icon: CalendarDays, exact: false },
  { to: "/admin/turni", label: "Turni", icon: CalendarClock, exact: false },
  { to: "/admin/ferie", label: "Ferie e permessi", icon: Palmtree, exact: false },
  { to: "/admin/documenti", label: "Documenti", icon: FileSignature, exact: false },
  { to: "/admin/impostazioni", label: "Team", icon: UserRound, exact: false },
] as const;

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data } = useStaff();
  const isStaff = (data?.roles.length ?? 0) > 0;

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-background/80 px-5 py-8 backdrop-blur-xl md:flex">
        <Link to="/" className="text-lg font-semibold tracking-[-0.03em]">
          AURA<span className="text-sage">.</span>
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">Gestionale interno</p>

        <nav className="mt-10 flex flex-1 flex-col gap-1">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-300 ${
                  active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border pt-5">
          <p className="truncate text-xs text-muted-foreground">{data?.user?.email}</p>
          <InstallAppButton className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-full border border-border text-xs font-medium transition-colors hover:bg-muted" />
          <button
            onClick={signOut}
            className="mt-3 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="size-4" /> Esci
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 overflow-x-auto border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl md:hidden">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="whitespace-nowrap text-sm text-muted-foreground"
            >
              {item.label}
            </Link>
          ))}
          <button onClick={signOut} className="whitespace-nowrap text-sm text-muted-foreground">
            Esci
          </button>
        </div>

        <main className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-12">
          {data && !isStaff ? (
            <div className="mx-auto max-w-md py-24 text-center">
              <h1 className="display-md text-2xl">Account in attesa di autorizzazione</h1>
              <p className="lede mt-3 text-base">
                Il tuo account è stato creato ma non ha ancora accesso ai dati clinici. Chiedi a un
                amministratore dello studio di abilitarti.
              </p>
              <Button variant="quiet" size="pill" className="mt-8" onClick={signOut}>
                Esci
              </Button>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
