"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { CustomersTable } from "@/components/customers/customers-table";
import { PageHeader } from "@/components/layout/page-header";

export default function CustomersPage() {
  const router = useRouter();
  const { user, isLoading } = useLoggedInUser();

  useEffect(() => {
    if (!isLoading && user && user.role !== "HOST" && user.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return null;
  }

  if (!user || (user.role !== "HOST" && user.role !== "ADMIN")) {
    return null;
  }

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title="Customers"
        description="Manage your customers and their access."
      />
      <CustomersTable />
    </div>
  );
}
