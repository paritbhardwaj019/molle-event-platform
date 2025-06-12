"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { LinksTable } from "@/components/links/links-table";
import { CreateLinkDialog } from "@/components/links/create-link-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function LinksPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState<string>("0");

  const handleLinkCreated = () => {
    setRefreshKey((prev) => String(Number(prev) + 1));
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-8 p-8">
      <PageHeader
        title="Referral Links"
        subtitle="Generate and manage your referral links"
        action={
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Link
          </Button>
        }
      />

      <LinksTable key={refreshKey} />

      <CreateLinkDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleLinkCreated}
      />
    </div>
  );
}
