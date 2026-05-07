import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel";

export default function AdminUsersPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Nutzerverwaltung</h1>
        <p className="text-sm text-muted-foreground">Alle registrierten Nutzer verwalten, Rollen zuweisen, Accounts sperren</p>
      </div>
      <AdminUsersPanel />
    </div>
  );
}
