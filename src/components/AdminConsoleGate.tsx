import { useEffect, useState, type ReactNode } from "react";
import { authedFetch } from "../lib/firebaseClient";

interface ConsoleAccess {
  canViewSuperAdminConsole: boolean;
  canViewCompanyAdminConsole: boolean;
}

export function AdminConsoleGate({
  requireSuperAdmin,
  children,
}: {
  requireSuperAdmin: boolean;
  children: ReactNode;
}) {
  const [access, setAccess] = useState<ConsoleAccess | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    authedFetch("/api/admin/console-access")
      .then((r) => r.json())
      .then(setAccess)
      .catch(() => setAccess({ canViewSuperAdminConsole: false, canViewCompanyAdminConsole: false }))
      .finally(() => setChecked(true));
  }, []);

  if (!checked) return null;
  if (!access) return null;

  const allowed = requireSuperAdmin ? access.canViewSuperAdminConsole : access.canViewCompanyAdminConsole;
  if (!allowed) return null;

  return <>{children}</>;
}

export default AdminConsoleGate;
