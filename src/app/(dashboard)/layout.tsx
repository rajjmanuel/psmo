import type { ReactNode } from "react";
import { ClientDashboard } from "@/components/ClientDashboard";
import { getSessionContext } from "@/lib/auth-server";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSessionContext();

  return (
    <ClientDashboard serverUser={session?.user ?? null} sessionToken={session?.token ?? null}>
      {children}
    </ClientDashboard>
  );
}
