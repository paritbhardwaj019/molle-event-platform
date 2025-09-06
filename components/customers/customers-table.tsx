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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Ban, Trash2, Eye, CheckCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Customer,
  getAllCustomers,
  deleteCustomer,
  blockCustomer,
  unblockCustomer,
} from "@/lib/actions/customer";

export function CustomersTable() {
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const result = await getAllCustomers();

        if (result.success && result.data) {
          setCustomers(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch customers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(customers.map((customer) => customer.id));
    } else {
      setSelectedCustomers([]);
    }
  };

  const toggleCustomer = (customerId: string) => {
    setSelectedCustomers((prev) => {
      if (prev.includes(customerId)) {
        return prev.filter((id) => id !== customerId);
      } else {
        return [...prev, customerId];
      }
    });
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      setIsDeleting(true);
      const result = await deleteCustomer(customerId);

      if (result.success) {
        setCustomers((prevCustomers) =>
          prevCustomers.filter((customer) => customer.id !== customerId)
        );
        toast.success("Customer deleted successfully", {
          description: "The customer has been deleted successfully",
        });
      } else {
        toast.error(result.error || "Failed to delete customer");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the customer");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBlockCustomer = async (customerId: string) => {
    try {
      const result = await blockCustomer(customerId);

      if (result.success) {
        setCustomers((prevCustomers) =>
          prevCustomers.map((customer) =>
            customer.id === customerId
              ? { ...customer, status: "INACTIVE" }
              : customer
          )
        );
        toast.success("Customer blocked successfully", {
          description: "The customer has been blocked successfully",
        });
      } else {
        toast.error(result.error || "Failed to block customer");
      }
    } catch (error) {
      toast.error("An error occurred while blocking the customer");
    }
  };

  const handleUnblockCustomer = async (customerId: string) => {
    try {
      const result = await unblockCustomer(customerId);

      if (result.success) {
        setCustomers((prevCustomers) =>
          prevCustomers.map((customer) =>
            customer.id === customerId
              ? { ...customer, status: "ACTIVE" }
              : customer
          )
        );
        toast.success("Customer unblocked successfully", {
          description: "The customer has been unblocked successfully",
        });
      } else {
        toast.error(result.error || "Failed to unblock customer");
      }
    } catch (error) {
      toast.error("An error occurred while unblocking the customer");
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead className="w-[30px]">
                <Skeleton className="h-4 w-4" />
              </TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Joined Date</TableHead>
              <TableHead>Total Purchase</TableHead>
              <TableHead>Referred By</TableHead>
              <TableHead>Last Purchase</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-4" />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-[150px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
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

  return (
    <div className="rounded-lg border border-gray-100 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-gray-50">
            <TableHead className="w-[30px]">
              <Checkbox
                checked={
                  selectedCustomers.length === customers.length &&
                  customers.length > 0
                }
                onCheckedChange={(checked) => toggleAll(checked as boolean)}
              />
            </TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Joined Date</TableHead>
            <TableHead>Total Purchase</TableHead>
            <TableHead>Referred By</TableHead>
            <TableHead>Last Purchase</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>
                <Checkbox
                  checked={selectedCustomers.includes(customer.id)}
                  onCheckedChange={() => toggleCustomer(customer.id)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="space-y-1">
                    <span className="font-medium">{customer.name}</span>
                    <p className="text-sm text-muted-foreground">
                      {customer.email}
                    </p>
                  </div>
                  {customer.status === "INACTIVE" && (
                    <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-full">
                      Blocked
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {format(new Date(customer.createdAt), "MMM d, yyyy")}
              </TableCell>
              <TableCell>
                ₹{customer.totalPurchaseValue.toLocaleString("en-IN")}
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <span className="font-medium">
                    {customer.referrerName || "—"}
                  </span>
                  {customer.referrerCode && (
                    <p className="text-sm text-muted-foreground">
                      {customer.referrerCode}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {customer.lastPurchaseDate
                  ? format(new Date(customer.lastPurchaseDate), "MMM d, yyyy")
                  : "—"}
              </TableCell>
              <TableCell>
                <div className="flex justify-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="h-8 w-8 flex items-center justify-center text-gray-400">
                          <Eye className="h-4 w-4" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View customer details</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 text-gray-400 hover:bg-gray-50 ${
                            customer.status === "INACTIVE"
                              ? "hover:text-green-600"
                              : "hover:text-red-600"
                          }`}
                          onClick={() =>
                            customer.status === "INACTIVE"
                              ? handleUnblockCustomer(customer.id)
                              : handleBlockCustomer(customer.id)
                          }
                        >
                          {customer.status === "INACTIVE" ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Ban className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {customer.status === "INACTIVE"
                            ? "Unblock customer"
                            : "Block customer"}
                        </p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-gray-50"
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Customer
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this customer?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteCustomer(customer.id)
                                }
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete customer</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
