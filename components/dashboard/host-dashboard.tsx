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
        description="Your created events"
      />
      <MetricsCard
        title="Total Bookings"
        value={metrics.totalBookings}
        icon={Calendar}
        description="Across all your events"
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
        description="Who booked your events"
        trend={{
          value: metrics.customerGrowth,
          isPositive: metrics.customerGrowth > 0,
        }}
      />
      <MetricsCard
        title="Total Referrers"
        value={metrics.totalReferrers || 0}
        icon={UserPlus}
        description="Your referral partners"
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
