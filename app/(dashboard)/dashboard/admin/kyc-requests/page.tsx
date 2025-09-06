"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { KycRequestsTable } from "@/components/kyc/kyc-requests-table";
import { PageHeader } from "@/components/layout/page-header";

export default function KycRequestsPage() {
  const router = useRouter();
  const { user, isLoading } = useLoggedInUser();

  useEffect(() => {
    if (!isLoading && user && user.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return null;
  }

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title="KYC Requests"
        description="Review and manage KYC verification requests from hosts."
      />
      <KycRequestsTable />
    </div>
  );
}
