"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { AdminReviewsTable } from "@/components/admin/admin-reviews-table";

export default function AdminReviewsPage() {
  const [refreshKey, setRefreshKey] = useState<string>("0");

  const handleReviewDeleted = () => {
    setRefreshKey((prev) => String(Number(prev) + 1));
  };

  return (
    <div className="flex flex-col gap-8 p-8">
      <PageHeader
        title="All Reviews"
        subtitle="Manage and monitor all reviews across the platform"
      />

      <AdminReviewsTable key={refreshKey} />
    </div>
  );
}
