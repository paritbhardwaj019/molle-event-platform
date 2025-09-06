"use client";

import { useState, useEffect } from "react";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { PageHeader } from "@/components/page-header";
import { EventsTable } from "@/components/events/events-table";
import { CreateEventDialog } from "@/components/events/create-event-dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, AlertCircle } from "lucide-react";
import { getHostKycRequest, type KycRequest } from "@/lib/actions/kyc";
import { type EventFormData } from "@/lib/validations/event";

export default function EventsPage() {
  const { user } = useLoggedInUser();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<
    (EventFormData & { id: string }) | null
  >(null);
  const [kycRequest, setKycRequest] = useState<KycRequest | null>(null);
  const [isLoadingKyc, setIsLoadingKyc] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchKycRequest = async () => {
      if (user && user.role === "HOST") {
        try {
          const result = await getHostKycRequest();
          if (result.success && result.data) {
            setKycRequest(result.data);
          }
        } catch (error) {
          console.error("Failed to fetch KYC request:", error);
        } finally {
          setIsLoadingKyc(false);
        }
      } else {
        setIsLoadingKyc(false);
      }
    };

    if (user) {
      fetchKycRequest();
    }
  }, [user]);

  // Check if KYC is approved for hosts
  const isKycApproved =
    user?.role !== "HOST" || (kycRequest && kycRequest.status === "APPROVED");
  const canCreateEvent = user?.role === "HOST" ? isKycApproved : true;

  const handleCreateEvent = () => {
    setIsCreateDialogOpen(true);
  };

  const handleEditEvent = (event: EventFormData & { id: string }) => {
    setEditingEvent(event);
    setIsEditDialogOpen(true);
  };

  const handleCreateDialogClose = () => {
    setIsCreateDialogOpen(false);
    // Refresh the events list after create
    setRefreshKey((prev) => prev + 1);
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    setEditingEvent(null);
    // Refresh the events list after edit
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col gap-8 p-8">
      <PageHeader
        title="Events"
        subtitle="Create and manage your events"
        action={
          canCreateEvent ? (
            <Button
              onClick={handleCreateEvent}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          ) : undefined
        }
      />

      {/* KYC Status Alert for Hosts */}
      {user?.role === "HOST" && !isLoadingKyc && !isKycApproved && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>KYC Verification Required -</strong> Please verify your KYC
            to create events.{" "}
            <a
              href="/dashboard/kyc-verification"
              className="underline hover:no-underline font-medium"
            >
              Complete KYC Verification
            </a>
          </AlertDescription>
        </Alert>
      )}

      <EventsTable key={refreshKey} onEditEvent={handleEditEvent} />

      {/* Create Event Dialog */}
      {canCreateEvent && (
        <CreateEventDialog
          open={isCreateDialogOpen}
          onOpenChange={handleCreateDialogClose}
        />
      )}

      {/* Edit Event Dialog */}
      {editingEvent && (
        <CreateEventDialog
          open={isEditDialogOpen}
          onOpenChange={handleEditDialogClose}
          event={editingEvent}
        />
      )}
    </div>
  );
}
