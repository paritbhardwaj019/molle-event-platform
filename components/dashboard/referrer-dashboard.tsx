import { MetricsCard } from "./metrics-card";
import {
  Users,
  DollarSign,
  TrendingUp,
  Link as LinkIcon,
  ArrowLeftRight,
} from "lucide-react";

interface ReferrerDashboardProps {
  metrics: {
    totalReferrals: number;
    activeReferrals: number;
    totalEarnings: number;
    availableBalance: number;
    totalLinks: number;
    conversionRate: number;
    earningsGrowth: number;
  };
}

export function ReferrerDashboard({ metrics }: ReferrerDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <MetricsCard
        title="Total Referrals"
        value={metrics.totalReferrals}
        icon={Users}
        description="All time referrals"
      />
      <MetricsCard
        title="Active Referrals"
        value={metrics.activeReferrals}
        icon={Users}
        description="Currently active users"
      />
      <MetricsCard
        title="Total Earnings"
        value={metrics.totalEarnings}
        icon={DollarSign}
        isCurrency={true}
        trend={{
          value: metrics.earningsGrowth,
          isPositive: metrics.earningsGrowth > 0,
        }}
      />
      <MetricsCard
        title="Available Balance"
        value={metrics.availableBalance}
        icon={ArrowLeftRight}
        isCurrency={true}
        description="Ready for withdrawal"
      />
      <MetricsCard
        title="Active Links"
        value={metrics.totalLinks}
        icon={LinkIcon}
        description="Tracking referral sources"
      />
      <MetricsCard
        title="Conversion Rate"
        value={`${metrics.conversionRate}%`}
        icon={TrendingUp}
        description="Average conversion"
      />
    </div>
  );
}
