"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { ReferralsTable } from "@/components/referrals/referrals-table";
import { PageHeader } from "@/components/layout/page-header";
import { ReferralStats } from "@/components/referrals/referral-stats";

export default function ReferralsPage() {
  const router = useRouter();
  const { user, isLoading } = useLoggedInUser();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title="Referrals"
        description="View your referral earnings and track referred customers."
      />
      <ReferralStats />
      <ReferralsTable />
    </div>
  );
}
