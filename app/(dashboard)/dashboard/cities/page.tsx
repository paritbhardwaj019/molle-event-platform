"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { CitiesTable } from "@/components/cities/cities-table";
import { CreateCityDialog } from "@/components/cities/create-city-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function CitiesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState<string>("0");

  const handleCityCreated = () => {
    setRefreshKey((prev) => String(Number(prev) + 1));
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-8 p-8">
      <PageHeader
        title="Cities Management"
        subtitle="Manage cities available on the platform"
        action={
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add City
          </Button>
        }
      />

      <CitiesTable key={refreshKey} />

      <CreateCityDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCityCreated}
      />
    </div>
  );
}
