"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { AmenitiesTable } from "@/components/admin/amenities-table";
import { CreateAmenityDialog } from "@/components/admin/create-amenity-dialog";
import { EditAmenityDialog } from "@/components/admin/edit-amenity-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Amenity } from "@/lib/actions/amenity";

export default function AmenitiesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<Amenity | null>(null);
  const [refreshKey, setRefreshKey] = useState<string>("0");

  const handleAmenityCreated = () => {
    setRefreshKey((prev) => String(Number(prev) + 1));
    setIsCreateDialogOpen(false);
  };

  const handleAmenityUpdated = () => {
    setRefreshKey((prev) => String(Number(prev) + 1));
    setEditingAmenity(null);
  };

  const handleEdit = (amenity: Amenity) => {
    setEditingAmenity(amenity);
  };

  return (
    <div className="flex flex-col gap-8 p-8">
      <PageHeader
        title="Amenities Management"
        subtitle="Manage amenities that hosts can add to their events"
        action={
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Amenity
          </Button>
        }
      />

      <AmenitiesTable key={refreshKey} onEdit={handleEdit} />

      <CreateAmenityDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleAmenityCreated}
      />

      <EditAmenityDialog
        open={!!editingAmenity}
        onOpenChange={(open: boolean) => !open && setEditingAmenity(null)}
        amenity={editingAmenity}
        onSuccess={handleAmenityUpdated}
      />
    </div>
  );
}
