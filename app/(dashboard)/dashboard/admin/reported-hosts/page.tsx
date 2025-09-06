"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { ReportedHostsTable } from "@/components/admin/reported-hosts-table";

export default function ReportedHostsPage() {
  return (
    <div className="flex flex-col gap-8 p-8">
      <PageHeader
        title="Reported Hosts"
        subtitle="Manage and review host reports from users"
      />

      <ReportedHostsTable />
    </div>
  );
}
