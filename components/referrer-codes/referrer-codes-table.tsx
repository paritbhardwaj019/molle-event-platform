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
import { Copy, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
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
import {
  getAllReferrerCodes,
  deleteReferrerCode,
} from "@/lib/actions/referrer-code";

export interface ReferrerCode {
  id: string;
  code: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  referrerCount: number;
}

interface ReferrerCodesTableProps {
  key?: string;
  onCodeCreated?: () => void;
}

export function ReferrerCodesTable({ onCodeCreated }: ReferrerCodesTableProps) {
  const [codes, setCodes] = useState<ReferrerCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [codeToDelete, setCodeToDelete] = useState<ReferrerCode | null>(null);

  const fetchCodes = async () => {
    try {
      const result = await getAllReferrerCodes();
      if (result.success && result.data) {
        setCodes(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch referrer codes:", error);
      toast.error("Failed to load referrer codes", {
        description:
          "There was a problem loading your referrer codes. Please try refreshing the page.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleCopyCode = (code: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_URL || window.location.origin;
    const link = `${baseUrl}/affiliate?ref=${code}`;

    navigator.clipboard.writeText(link);
    toast.success("Referrer code link copied", {
      description:
        "Share this link with potential referrers to have them join your team.",
    });
  };

  const handleDeleteClick = (code: ReferrerCode) => {
    if (code.referrerCount > 0) {
      toast.error("Cannot delete this referrer code", {
        description:
          "You cannot delete a code that has active referrers using it.",
      });
      return;
    }
    setCodeToDelete(code);
  };

  const handleDelete = async () => {
    if (!codeToDelete) return;

    try {
      const result = await deleteReferrerCode(codeToDelete.id);
      if (result.success) {
        toast.success("Referrer code deleted successfully", {
          description: `The referrer code ${codeToDelete.code} has been permanently deleted.`,
        });
        fetchCodes();
      } else {
        toast.error("Failed to delete referrer code", {
          description:
            result.error || "An error occurred while deleting the code",
        });
      }
    } catch (error) {
      toast.error("Failed to delete referrer code", {
        description: "An unexpected error occurred",
      });
    } finally {
      setCodeToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead>Referrer Code</TableHead>
              <TableHead>Total Referrers</TableHead>
              <TableHead>Generated At</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-6 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[50px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
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
              <TableHead>Referrer Code</TableHead>
              <TableHead>Total Referrers</TableHead>
              <TableHead>Generated At</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {codes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-gray-500"
                >
                  No referrer codes found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              codes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell className="font-medium">
                    <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md font-mono">
                      {code.code}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700">
                      {code.referrerCount} referrer
                      {code.referrerCount !== 1 ? "s" : ""}
                    </span>
                  </TableCell>
                  <TableCell>
                    {format(new Date(code.createdAt), "MMM d, yyyy")}
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
                              onClick={() => handleCopyCode(code.code)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copy referrer link</p>
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
                              onClick={() => handleDeleteClick(code)}
                              disabled={code.referrerCount > 0}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {code.referrerCount > 0
                                ? "Cannot delete code with active referrers"
                                : "Delete code"}
                            </p>
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
        open={!!codeToDelete}
        onOpenChange={() => setCodeToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this referrer code. This action
              cannot be undone.
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
