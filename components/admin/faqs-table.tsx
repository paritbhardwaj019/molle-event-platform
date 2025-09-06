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
import { getAllFAQs, deleteFAQ, toggleFAQStatus } from "@/lib/actions/faq";
import type { FAQ } from "@/lib/actions/faq";
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

interface FAQsTableProps {
  onEdit: (faq: FAQ) => void;
  refreshKey?: string;
}

export function FAQsTable({ onEdit, refreshKey }: FAQsTableProps) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [faqToDelete, setFaqToDelete] = useState<FAQ | null>(null);

  const fetchFAQs = async () => {
    try {
      const result = await getAllFAQs();
      if (result.success && result.data) {
        setFaqs(result.data);
      } else {
        toast.error("Failed to load FAQs", {
          description: result.error || "Could not load FAQs",
        });
      }
    } catch (error) {
      console.error("Failed to fetch FAQs:", error);
      toast.error("Failed to load FAQs", {
        description:
          "There was a problem loading FAQs. Please try refreshing the page.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFAQs();
  }, [refreshKey]);

  const handleDeleteClick = (faq: FAQ) => {
    setFaqToDelete(faq);
  };

  const handleDelete = async () => {
    if (!faqToDelete) return;

    try {
      const result = await deleteFAQ(faqToDelete.id);
      if (result.success) {
        toast.success("FAQ deleted successfully", {
          description: "The FAQ has been permanently deleted.",
        });
        fetchFAQs();
      } else {
        toast.error("Failed to delete FAQ", {
          description:
            result.error || "An error occurred while deleting the FAQ",
        });
      }
    } catch (error) {
      toast.error("Failed to delete FAQ", {
        description: "An unexpected error occurred",
      });
    } finally {
      setFaqToDelete(null);
    }
  };

  const handleToggleStatus = async (faq: FAQ) => {
    try {
      const result = await toggleFAQStatus(faq.id);
      if (result.success) {
        toast.success(`FAQ ${faq.isActive ? "hidden" : "published"}`, {
          description: `The FAQ is now ${
            faq.isActive ? "hidden from" : "visible on"
          } the contact page.`,
        });
        fetchFAQs();
      } else {
        toast.error("Failed to update FAQ status", {
          description:
            result.error || "An error occurred while updating the FAQ",
        });
      }
    } catch (error) {
      toast.error("Failed to update FAQ status", {
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
              <TableHead>Question</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-[300px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-[60px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[30px]" />
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
              <TableHead>Question</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {faqs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="text-gray-500">
                    <p>No FAQs found</p>
                    <p className="text-sm">
                      Create your first FAQ to get started
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              faqs.map((faq) => (
                <TableRow key={faq.id}>
                  <TableCell className="max-w-md">
                    <div>
                      <p className="font-medium line-clamp-2">{faq.question}</p>
                      <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                        {faq.answer}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={faq.isActive ? "default" : "secondary"}>
                      {faq.isActive ? "Active" : "Hidden"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700">
                      {faq.order}
                    </span>
                  </TableCell>
                  <TableCell>
                    {format(new Date(faq.createdAt), "MMM d, yyyy")}
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
                              onClick={() => handleToggleStatus(faq)}
                            >
                              {faq.isActive ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{faq.isActive ? "Hide FAQ" : "Show FAQ"}</p>
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
                              onClick={() => onEdit(faq)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit FAQ</p>
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
                              onClick={() => handleDeleteClick(faq)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete FAQ</p>
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
        open={!!faqToDelete}
        onOpenChange={() => setFaqToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this FAQ? This action cannot be
              undone.
              <br />
              <br />
              <strong>Question:</strong> {faqToDelete?.question}
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
