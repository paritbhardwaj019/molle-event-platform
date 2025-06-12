import { auth } from "@/lib/auth";
import {
  getHostMetrics,
  getReferrerMetrics,
  getAdminMetrics,
} from "@/lib/actions/dashboard";
import { HostDashboard } from "@/components/dashboard/host-dashboard";
import { ReferrerDashboard } from "@/components/dashboard/referrer-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

type HostMetrics = {
  totalEvents: number;
  totalBookings: number;
  totalRevenue: number;
  totalCustomers: number;
  totalReferrers: number;
  pendingInvites: number;
  revenueGrowth: number;
  customerGrowth: number;
};

type ReferrerMetrics = {
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  availableBalance: number;
  totalLinks: number;
  conversionRate: number;
  earningsGrowth: number;
};

type AdminMetrics = {
  totalUsers: number;
  totalHosts: number;
  totalReferrers: number;
  totalEvents: number;
  totalRevenue: number;
  pendingPayouts: number;
  userGrowth: number;
  revenueGrowth: number;
};

type DashboardMap = {
  HOST: {
    component: typeof HostDashboard;
    metrics: HostMetrics;
  };
  REFERRER: {
    component: typeof ReferrerDashboard;
    metrics: ReferrerMetrics;
  };
  ADMIN: {
    component: typeof AdminDashboard;
    metrics: AdminMetrics;
  };
};

const dashboardComponents: Record<
  keyof DashboardMap,
  DashboardMap[keyof DashboardMap]["component"]
> = {
  HOST: HostDashboard,
  REFERRER: ReferrerDashboard,
  ADMIN: AdminDashboard,
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role as keyof DashboardMap;
  if (!(role in dashboardComponents)) {
    redirect("/");
  }

  const DashboardComponent = dashboardComponents[role];
  let metrics: DashboardMap[typeof role]["metrics"] | null = null;

  switch (role) {
    case "HOST":
      metrics = await getHostMetrics();
      console.log("metrics", metrics);
      break;
    case "REFERRER":
      metrics = await getReferrerMetrics();
      break;
    case "ADMIN":
      metrics = await getAdminMetrics();
      break;
  }

  if (!metrics) {
    redirect("/");
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Welcome back, {session.user.name}
      </h1>
      {/* @ts-expect-error - TypeScript doesn't understand that metrics type matches the component */}
      <DashboardComponent metrics={metrics} />
    </div>
  );
}
