import Link from "next/link";
import { KitaRadarLogo } from "@/components/ui/KitaRadarLogo";

interface LegalPageShellProps {
  title: string;
  updatedAt?: string;
  children: React.ReactNode;
}

export function LegalPageShell({
  title,
  updatedAt = "Mai 2026",
  children,
}: LegalPageShellProps) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 h-14 flex items-center">
        <Link href="/" className="flex items-center gap-2 font-bold text-zinc-900 dark:text-white">
          <KitaRadarLogo className="h-7 w-7" />
          KitaRadar
        </Link>
        <nav className="ml-auto flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/legal/imprint" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
            Impressum
          </Link>
          <Link href="/legal/privacy" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
            Datenschutz
          </Link>
          <Link href="/legal/terms" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
            AGB
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12">
        {/* Breadcrumb */}
        <div className="text-xs text-zinc-400 mb-6">
          <Link href="/" className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            Startseite
          </Link>
          {" / "}
          <span>{title}</span>
        </div>

        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">{title}</h1>
        <p className="text-xs text-zinc-400 mb-10">Stand: {updatedAt}</p>

        <div className="space-y-6">{children}</div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-16 py-8 px-6">
        <div className="mx-auto max-w-2xl flex flex-wrap gap-4 items-center justify-between text-xs text-zinc-400">
          <p>© {new Date().getFullYear()} WAMOCON GmbH · Alle Rechte vorbehalten.</p>
          <div className="flex gap-4">
            <Link href="/legal/imprint" className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
              Impressum
            </Link>
            <Link href="/legal/privacy" className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
              Datenschutz
            </Link>
            <Link href="/legal/terms" className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
              AGB
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface LegalSectionProps {
  title: string;
  children: React.ReactNode;
}

export function LegalSection({ title, children }: LegalSectionProps) {
  return (
    <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-white mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        {title}
      </h2>
      <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}
