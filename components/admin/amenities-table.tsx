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
import { Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  getAllAmenities,
  deleteAmenity,
  toggleAmenityStatus,
} from "@/lib/actions/amenity";
import type { Amenity } from "@/lib/actions/amenity";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { Badge } from "@/components/ui/badge";

interface AmenitiesTableProps {
  onEdit: (amenity: Amenity) => void;
  refreshKey?: string;
}

export function AmenitiesTable({ onEdit, refreshKey }: AmenitiesTableProps) {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [amenityToDelete, setAmenityToDelete] = useState<Amenity | null>(null);

  const fetchAmenities = async () => {
    try {
      const result = await getAllAmenities();
      if (result.success && result.data) {
        setAmenities(result.data);
      } else {
        toast.error("Failed to load amenities", {
          description: result.error || "Could not load amenities",
        });
      }
    } catch (error) {
      console.error("Failed to fetch amenities:", error);
      toast.error("Failed to load amenities", {
        description:
          "There was a problem loading amenities. Please try refreshing the page.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAmenities();
  }, [refreshKey]);

  const handleDeleteClick = (amenity: Amenity) => {
    setAmenityToDelete(amenity);
  };

  const handleDelete = async () => {
    if (!amenityToDelete) return;

    try {
      const result = await deleteAmenity(amenityToDelete.id);
      if (result.success) {
        toast.success("Amenity deleted successfully", {
          description: "The amenity has been permanently deleted.",
        });
        fetchAmenities();
      } else {
        toast.error("Failed to delete amenity", {
          description:
            result.error || "An error occurred while deleting the amenity",
        });
      }
    } catch (error) {
      toast.error("Failed to delete amenity", {
        description: "An unexpected error occurred",
      });
    } finally {
      setAmenityToDelete(null);
    }
  };

  const handleToggleStatus = async (amenity: Amenity) => {
    try {
      const result = await toggleAmenityStatus(amenity.id);
      if (result.success) {
        toast.success(`Amenity ${amenity.isEnabled ? "disabled" : "enabled"}`, {
          description: `The amenity is now ${
            amenity.isEnabled ? "hidden from" : "available to"
          } hosts when creating events.`,
        });
        fetchAmenities();
      } else {
        toast.error("Failed to update amenity status", {
          description:
            result.error || "An error occurred while updating the amenity",
        });
      }
    } catch (error) {
      toast.error("Failed to update amenity status", {
        description: "An unexpected error occurred",
      });
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
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-end">Actions</TableHead>
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
                  <Skeleton className="h-6 w-[60px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
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

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {amenities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="text-gray-500">
                    <p>No amenities found</p>
                    <p className="text-sm">
                      Create your first amenity to get started
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              amenities.map((amenity) => (
                <TableRow key={amenity.id}>
                  <TableCell className="font-medium">{amenity.name}</TableCell>
                  <TableCell className="max-w-md">
                    {amenity.description ? (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {amenity.description}
                      </p>
                    ) : (
                      <span className="text-gray-400 text-sm">
                        No description
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={amenity.isEnabled ? "default" : "secondary"}
                      className={
                        amenity.isEnabled
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-100"
                      }
                    >
                      {amenity.isEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(amenity.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                              onClick={() => handleToggleStatus(amenity)}
                            >
                              {amenity.isEnabled ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {amenity.isEnabled ? "Disable" : "Enable"} amenity
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                              onClick={() => onEdit(amenity)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit amenity</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteClick(amenity)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete amenity</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!amenityToDelete}
        onOpenChange={() => setAmenityToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the amenity "{amenityToDelete?.name}
              ". This action cannot be undone.
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
