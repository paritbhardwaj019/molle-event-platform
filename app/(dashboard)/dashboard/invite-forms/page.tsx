"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { InviteFormsTable } from "@/components/invite-forms/invite-forms-table";
import { CreateInviteFormDialog } from "@/components/invite-forms/create-invite-form-dialog";

export default function InviteFormsPage() {
  const router = useRouter();
  const { user, isLoading } = useLoggedInUser();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (!isLoading && user && user.role !== "HOST") {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return null;
  }

  if (!user || user.role !== "HOST") {
    return null;
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Invite Forms"
          description="Create and manage custom invite forms for your invite-only events."
        />
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Form
        </Button>
      </div>

      <InviteFormsTable />

      <CreateInviteFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
