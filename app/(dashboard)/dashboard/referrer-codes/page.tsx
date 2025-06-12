"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { ReferrerCodesTable } from "@/components/referrer-codes/referrer-codes-table";
import { CreateCodeDialog } from "@/components/referrer-codes/create-code-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

export default function ReferrerCodesPage() {
  const { user } = useLoggedInUser();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState<string>("0");

  // If user is not a HOST, redirect them
  if (user && user.role !== UserRole.HOST) {
    redirect("/dashboard");
  }

  const handleCodeCreated = () => {
    setRefreshKey((prev) => String(Number(prev) + 1));
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-8 p-8">
      <PageHeader
        title="Referrer Codes"
        subtitle="Generate and manage referrer codes for your team"
        action={
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Code
          </Button>
        }
      />

      <ReferrerCodesTable key={refreshKey} />

      <CreateCodeDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCodeCreated}
      />
    </div>
  );
}
