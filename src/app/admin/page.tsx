import { AdminApp } from "@/components/admin/AdminApp";
import { siteConfig } from "@/lib/site-config";

/**
 * Passes the committed config in as the editing baseline, so the admin can
 * tell what has changed and offer a revert.
 */
export default function AdminPage() {
  return <AdminApp base={siteConfig} />;
}
