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
import { Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import {
  getAllExclusivePerks,
  togglePerkStatus,
  deleteExclusivePerk,
} from "@/lib/actions/exclusive-perk";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ExclusivePerksTableProps {
  key?: string;
  onPerkCreated?: () => void;
}

export function ExclusivePerksTable({
  onPerkCreated,
}: ExclusivePerksTableProps) {
  const [perks, setPerks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [perkToDelete, setPerkToDelete] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const fetchPerks = async () => {
    try {
      const result = await getAllExclusivePerks();
      if (result.success && result.data) {
        setPerks(result.data as any[]);
      } else {
        setPerks([]);
      }
    } catch (error) {
      console.error("Failed to fetch perks:", error);
      toast.error("Failed to load exclusive perks", {
        description:
          "There was a problem loading the exclusive perks. Please try refreshing the page.",
      });
      setPerks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPerks();
  }, []);

  const handleStatusToggle = async (perk: any) => {
    try {
      setIsUpdating(perk.id);
      const result = await togglePerkStatus(perk.id, !perk.isEnabled);

      if (result.success) {
        toast.success(`Perk ${perk.isEnabled ? "disabled" : "enabled"}`, {
          description: `"${perk.name}" is now ${
            perk.isEnabled ? "disabled" : "enabled"
          }.`,
        });
        fetchPerks();
      } else {
        toast.error("Failed to update perk status", {
          description:
            result.error || "An error occurred while updating the perk status",
        });
      }
    } catch (error) {
      toast.error("Failed to update perk status", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteClick = (perk: any) => {
    setPerkToDelete(perk);
  };

  const handleDelete = async () => {
    if (!perkToDelete) return;

    try {
      const result = await deleteExclusivePerk(perkToDelete.id);

      if (result.success) {
        toast.success("Perk deleted successfully", {
          description: `"${perkToDelete.name}" has been permanently deleted.`,
        });
        fetchPerks();
      } else {
        toast.error("Failed to delete perk", {
          description:
            result.error || "An error occurred while deleting the perk",
        });
      }
    } catch (error) {
      toast.error("Failed to delete perk", {
        description: "An unexpected error occurred",
      });
    } finally {
      setPerkToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-[150px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[200px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-[80px]" />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end space-x-2">
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

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {perks.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-gray-500"
                >
                  No exclusive perks found. Create your first perk to get
                  started.
                </TableCell>
              </TableRow>
            ) : (
              perks.map((perk) => (
                <TableRow key={perk.id}>
                  <TableCell className="font-medium">{perk.name}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {perk.description || "-"}
                  </TableCell>
                  <TableCell>
                    {format(new Date(perk.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={perk.isEnabled}
                        onCheckedChange={() => handleStatusToggle(perk)}
                        disabled={isUpdating === perk.id}
                        className={isUpdating === perk.id ? "opacity-50" : ""}
                      />
                      <Badge
                        variant={perk.isEnabled ? "default" : "outline"}
                        className={
                          perk.isEnabled
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "text-gray-500"
                        }
                      >
                        {perk.isEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={isUpdating === perk.id}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteClick(perk)}
                        disabled={isUpdating === perk.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!perkToDelete}
        onOpenChange={() => setPerkToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the exclusive perk &quot;
              {perkToDelete?.name}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
