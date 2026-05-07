import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ReactNode } from "react";
import Link from "next/link";
import { Shield, Users, CreditCard, LayoutDashboard, ChevronRight } from "lucide-react";

export default async function AdminLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/auth/login`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect(`/${locale}/dashboard`);

  const navItems = [
    { href: `/${locale}/admin`, label: "Übersicht", icon: LayoutDashboard },
    { href: `/${locale}/admin/users`, label: "Nutzerverwaltung", icon: Users },
    { href: `/${locale}/admin/subscriptions`, label: "Aboverwaltung", icon: CreditCard },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-border bg-card flex flex-col">
        <div className="flex items-center gap-2 border-b border-border px-4 py-4">
          <Shield className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">Admin-Bereich</p>
            <p className="text-xs text-muted-foreground truncate max-w-[140px]">{profile?.full_name ?? user.email}</p>
          </div>
        </div>
        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-border p-3">
          <Link
            href={`/${locale}/dashboard`}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="h-3 w-3 rotate-180" />
            Zurück zum Dashboard
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
