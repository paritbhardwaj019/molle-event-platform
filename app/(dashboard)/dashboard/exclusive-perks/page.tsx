"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateExclusivePerkDialog } from "@/components/exclusive-perks/create-exclusive-perk-dialog";
import { ExclusivePerksTable } from "@/components/exclusive-perks/exclusive-perks-table";

export default function ExclusivePerksPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState<string>("0");

  const handlePerkCreated = () => {
    setRefreshKey((prev) => String(Number(prev) + 1));
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-8 p-8">
      <PageHeader
        title="Exclusive Event Perks"
        subtitle="Create and manage exclusive perks for premium events"
        action={
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create New Perk
          </Button>
        }
      />

      <ExclusivePerksTable key={refreshKey} />

      <CreateExclusivePerkDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handlePerkCreated}
      />
    </div>
  );
}
