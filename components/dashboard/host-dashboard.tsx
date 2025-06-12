import { MetricsCard } from "./metrics-card";
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  UserPlus,
  Mail,
} from "lucide-react";

interface HostDashboardProps {
  metrics: {
    totalEvents: number;
    totalBookings: number;
    totalRevenue: number;
    totalCustomers: number;
    totalReferrers: number;
    pendingInvites: number;
    revenueGrowth: number;
    customerGrowth: number;
  };
}

export function HostDashboard({ metrics }: HostDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <MetricsCard
        title="Total Events"
        value={metrics.totalEvents}
        icon={Calendar}
        description="Active and upcoming events"
      />
      <MetricsCard
        title="Total Bookings"
        value={metrics.totalBookings}
        icon={Calendar}
        description="Across all events"
        trend={{
          value: 12,
          isPositive: true,
        }}
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
        title="Total Customers"
        value={metrics.totalCustomers}
        icon={Users}
        trend={{
          value: metrics.customerGrowth,
          isPositive: metrics.customerGrowth > 0,
        }}
      />
      <MetricsCard
        title="Total Referrers"
        value={metrics.totalReferrers}
        icon={UserPlus}
        description="Active referral partners"
      />
      <MetricsCard
        title="Pending Invites"
        value={metrics.pendingInvites}
        icon={Mail}
        description="Awaiting response"
      />
    </div>
  );
}
