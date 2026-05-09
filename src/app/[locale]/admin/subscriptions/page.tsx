import { AdminSubscriptionsPanel } from "@/components/admin/AdminSubscriptionsPanel";

export default function AdminSubscriptionsPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Aboverwaltung</h1>
        <p className="text-sm text-muted-foreground">Pro-Abonnements verwalten, manuell aktivieren oder deaktivieren</p>
      </div>
      <AdminSubscriptionsPanel />
    </div>
  );
}
