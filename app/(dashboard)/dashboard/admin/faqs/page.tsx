"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { FAQsTable } from "@/components/admin/faqs-table";
import { CreateFAQDialog } from "@/components/admin/create-faq-dialog";
import { EditFAQDialog } from "@/components/admin/edit-faq-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { FAQ } from "@/lib/actions/faq";

export default function FAQsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [refreshKey, setRefreshKey] = useState<string>("0");

  const handleFAQCreated = () => {
    setRefreshKey((prev) => String(Number(prev) + 1));
    setIsCreateDialogOpen(false);
  };

  const handleFAQUpdated = () => {
    setRefreshKey((prev) => String(Number(prev) + 1));
    setIsEditDialogOpen(false);
    setEditingFAQ(null);
  };

  const handleEditFAQ = (faq: FAQ) => {
    setEditingFAQ(faq);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-8 p-8">
      <PageHeader
        title="Frequently Asked Questions"
        subtitle="Manage FAQs displayed on the contact page"
        action={
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create FAQ
          </Button>
        }
      />

      <FAQsTable
        key={refreshKey}
        onEdit={handleEditFAQ}
        refreshKey={refreshKey}
      />

      <CreateFAQDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleFAQCreated}
      />

      <EditFAQDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={handleFAQUpdated}
        faq={editingFAQ}
      />
    </div>
  );
}
