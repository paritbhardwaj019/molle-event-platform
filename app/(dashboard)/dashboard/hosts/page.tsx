"use client";

import { PageHeader } from "@/components/page-header";
import { HostsTable } from "@/components/hosts/hosts-table";

export default function HostsPage() {
  return (
    <div className="flex flex-col gap-8 p-8">
      <PageHeader
        title="Platform Hosts"
        subtitle="Manage and monitor all hosts on the platform"
      />

      <HostsTable />
    </div>
  );
}
