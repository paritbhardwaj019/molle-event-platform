import { MetricsCard } from "./metrics-card";
import {
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  UserPlus,
  Wallet,
} from "lucide-react";

interface AdminDashboardProps {
  metrics: {
    totalUsers: number;
    totalHosts: number;
    totalReferrers: number;
    totalEvents: number;
    totalRevenue: number;
    pendingPayouts: number;
    userGrowth: number;
    revenueGrowth: number;
  };
}

export function AdminDashboard({ metrics }: AdminDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricsCard
        title="Total Users"
        value={metrics.totalUsers}
        icon={Users}
        trend={{
          value: metrics.userGrowth,
          isPositive: metrics.userGrowth > 0,
        }}
      />
      <MetricsCard
        title="Total Hosts"
        value={metrics.totalHosts}
        icon={Users}
        description="Active event hosts"
      />
      <MetricsCard
        title="Total Referrers"
        value={metrics.totalReferrers}
        icon={UserPlus}
        description="Active referral partners"
      />
      <MetricsCard
        title="Total Events"
        value={metrics.totalEvents}
        icon={Calendar}
        description="All time events"
      />
      <MetricsCard
        title="Total Revenue"
        value={metrics.totalRevenue}
        icon={DollarSign}
        isCurrency={true}
        trend={{
          value: metrics.revenueGrowth,
          isPositive: metrics.revenueGrowth > 0,
        }}
      />
      <MetricsCard
        title="Pending Payouts"
        value={metrics.pendingPayouts}
        icon={Wallet}
        isCurrency={true}
        description="Awaiting processing"
      />
      <MetricsCard
        title="User Growth"
        value={`${metrics.userGrowth}%`}
        icon={TrendingUp}
        description="Month over month"
      />
      <MetricsCard
        title="Revenue Growth"
        value={`${metrics.revenueGrowth}%`}
        icon={TrendingUp}
        description="Month over month"
      />
    </div>
  );
}
