"use client";

import { PageHeader } from "@/components/page-header";
import { ReferrersTable } from "@/components/referrers/referrers-table";

export default function ReferrersPage() {
  return (
    <div className="flex flex-col gap-8 p-8">
      <PageHeader
        title="Referrers"
        subtitle="Manage and track your referrers"
      />

      <ReferrersTable />
    </div>
  );
}
