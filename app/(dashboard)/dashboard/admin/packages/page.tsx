"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PackagesTable } from "@/components/admin/packages-table";
import { CreatePackageDialog } from "@/components/admin/create-package-dialog";
import { PageHeader } from "@/components/layout/page-header";

export default function AdminPackagesPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Packages"
        description="Manage subscription packages for users to purchase swipe limits."
      >
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Package
        </Button>
      </PageHeader>

      <PackagesTable onPackageCreated={() => setShowCreateDialog(false)} />

      <CreatePackageDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          // The table will refresh automatically due to revalidatePath
        }}
      />
    </div>
  );
}
