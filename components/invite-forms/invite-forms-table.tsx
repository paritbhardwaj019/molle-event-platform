"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { toast } from "sonner";
import { getInviteForms, deleteInviteForm } from "@/lib/actions/invite-form";
import { Edit, Trash2, Eye } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EditInviteFormDialog } from "./edit-invite-form-dialog";
import { PreviewInviteFormDialog } from "./preview-invite-form-dialog";

interface InviteForm {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  fields: {
    id: string;
    name: string;
    type: string;
    placeholder: string | null;
    required: boolean;
    options: any;
    order: number;
  }[];
  _count: {
    events: number;
  };
}

export function InviteFormsTable() {
  const [inviteForms, setInviteForms] = useState<InviteForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedForm, setSelectedForm] = useState<InviteForm | null>(null);

  useEffect(() => {
    fetchInviteForms();
  }, []);

  const fetchInviteForms = async () => {
    try {
      const result = await getInviteForms();
      if (result.success && result.data) {
        setInviteForms(result.data);
      } else {
        toast.error(result.error || "Failed to fetch invite forms");
      }
    } catch (error) {
      console.error("Failed to fetch invite forms:", error);
      toast.error("An error occurred while fetching invite forms");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteInviteForm(id);
      if (result.success) {
        setInviteForms((prev) => prev.filter((form) => form.id !== id));
        toast.success("Invite form deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete invite form");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the invite form");
    }
  };

  const handleEdit = (form: InviteForm) => {
    setSelectedForm(form);
    setShowEditDialog(true);
  };

  const handlePreview = (form: InviteForm) => {
    setSelectedForm(form);
    setShowPreviewDialog(true);
  };

  const handleFormUpdated = () => {
    fetchInviteForms();
    setShowEditDialog(false);
    setSelectedForm(null);
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead>Form Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Fields</TableHead>
              <TableHead>Used in Events</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-48" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (inviteForms.length === 0) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white p-8 text-center">
        <p className="text-gray-500 mb-4">No invite forms created yet.</p>
        <p className="text-sm text-gray-400">
          Create your first invite form to collect custom information from users
          requesting invites to your events.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead>Form Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Fields</TableHead>
              <TableHead>Used in Events</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inviteForms.map((form) => (
              <TableRow key={form.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{form.name}</p>
                    {!form.isActive && (
                      <span className="text-xs text-gray-500">(Inactive)</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600 line-clamp-2">
                    {form.description || "No description"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{form.fields.length} fields</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{form._count.events} events</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-500">
                    {format(new Date(form.createdAt), "MMM d, yyyy")}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePreview(form)}
                      className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-gray-50"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(form)}
                      className="h-8 w-8 text-gray-400 hover:text-green-600 hover:bg-gray-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-gray-50"
                          disabled={form._count.events > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete Invite Form
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{form.name}"? This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(form.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedForm && (
        <>
          <EditInviteFormDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            form={selectedForm}
            onSuccess={handleFormUpdated}
          />
          <PreviewInviteFormDialog
            open={showPreviewDialog}
            onOpenChange={setShowPreviewDialog}
            form={selectedForm}
          />
        </>
      )}
    </>
  );
}
