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
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Users, Zap, Crown, Eye, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  getAllSubscriptionPackages,
  deleteSubscriptionPackage,
  updateSubscriptionPackage,
} from "@/lib/actions/package";
import type { SubscriptionPackage } from "@/lib/actions/package";
import { PackageDuration } from "@prisma/client";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

interface PackagesTableProps {
  key?: string;
  onPackageCreated?: () => void;
}

const durationLabels = {
  [PackageDuration.MONTHLY]: "Monthly",
  [PackageDuration.QUARTERLY]: "Quarterly",
  [PackageDuration.YEARLY]: "Yearly",
  [PackageDuration.LIFETIME]: "Lifetime",
};

export function PackagesTable({ onPackageCreated }: PackagesTableProps) {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [packageToDelete, setPackageToDelete] =
    useState<SubscriptionPackage | null>(null);
  const [editingPackage, setEditingPackage] =
    useState<SubscriptionPackage | null>(null);

  const fetchPackages = async () => {
    try {
      const result = await getAllSubscriptionPackages();
      if (result.success && result.data) {
        setPackages(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch packages:", error);
      toast.error("Failed to load subscription packages", {
        description:
          "There was a problem loading your subscription packages. Please try refreshing the page.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleDeleteClick = (pkg: SubscriptionPackage) => {
    if (pkg.userCount && pkg.userCount > 0) {
      toast.error("Cannot delete this package", {
        description: `This package has ${pkg.userCount} active subscribers. Please deactivate it instead.`,
      });
      return;
    }
    setPackageToDelete(pkg);
  };

  const handleDelete = async () => {
    if (!packageToDelete) return;

    try {
      const result = await deleteSubscriptionPackage(packageToDelete.id);
      if (result.success) {
        toast.success("Package deleted successfully", {
          description: `The subscription package "${packageToDelete.name}" has been permanently deleted.`,
        });
        fetchPackages();
      } else {
        toast.error("Failed to delete package", {
          description:
            result.error || "An error occurred while deleting the package",
        });
      }
    } catch (error) {
      toast.error("Failed to delete package", {
        description: "An unexpected error occurred",
      });
    } finally {
      setPackageToDelete(null);
    }
  };

  const handleEdit = async (updatedPackage: SubscriptionPackage) => {
    try {
      const result = await updateSubscriptionPackage({
        id: updatedPackage.id,
        name: updatedPackage.name,
        description: updatedPackage.description || undefined,
        price: updatedPackage.price,
        dailySwipeLimit: updatedPackage.dailySwipeLimit,
        duration: updatedPackage.duration,
        isActive: updatedPackage.isActive,
        allowBadge: updatedPackage.allowBadge,
        canSeeLikes: updatedPackage.canSeeLikes,
        priorityMatching: updatedPackage.priorityMatching,
        isHidden: updatedPackage.isHidden,
      });

      if (result.success) {
        toast.success("Package updated successfully", {
          description: `The subscription package "${updatedPackage.name}" has been updated.`,
        });
        fetchPackages();
        setEditingPackage(null);
      } else {
        toast.error("Failed to update package", {
          description:
            result.error || "An error occurred while updating the package",
        });
      }
    } catch (error) {
      toast.error("Failed to update package", {
        description: "An unexpected error occurred",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead>Package Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Daily Swipes</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Features</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Subscribers</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-[150px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[80px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[60px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[80px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[60px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[40px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
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
              <TableHead>Package Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Daily Swipes</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Subscribers</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.map((pkg) => (
              <TableRow key={pkg.id}>
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900">{pkg.name}</div>
                    {pkg.description && (
                      <div className="text-sm text-gray-500 mt-1">
                        {pkg.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-gray-900">
                    {formatPrice(pkg.price)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">{pkg.dailySwipeLimit}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {durationLabels[pkg.duration]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {pkg.allowBadge && (
                      <Badge variant="secondary" className="text-xs">
                        <Crown className="h-3 w-3 mr-1" />
                        Gold Badge
                      </Badge>
                    )}
                    {pkg.canSeeLikes && (
                      <Badge variant="secondary" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        See Likes
                      </Badge>
                    )}
                    {pkg.priorityMatching && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Priority
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={pkg.isActive ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {pkg.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={pkg.isHidden ? "secondary" : "default"}
                    className="text-xs"
                  >
                    {pkg.isHidden ? "Hidden" : "Visible"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{pkg.userCount || 0}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(pkg.createdAt), "MMM d, yyyy")}
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
                            onClick={() => setEditingPackage(pkg)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit package</p>
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
                            onClick={() => handleDeleteClick(pkg)}
                            disabled={!!pkg.userCount && pkg.userCount > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete package</p>
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

      <AlertDialog
        open={!!packageToDelete}
        onOpenChange={() => setPackageToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the subscription package "
              {packageToDelete?.name}". This action cannot be undone.
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

      {/* Edit Package Dialog */}
      <Dialog
        open={!!editingPackage}
        onOpenChange={() => setEditingPackage(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Subscription Package</DialogTitle>
          </DialogHeader>
          {editingPackage && (
            <EditPackageForm
              package={editingPackage}
              onSave={handleEdit}
              onCancel={() => setEditingPackage(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Edit Package Form Component
function EditPackageForm({
  package: pkg,
  onSave,
  onCancel,
}: {
  package: SubscriptionPackage;
  onSave: (pkg: SubscriptionPackage) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: pkg.name,
    description: pkg.description ?? "",
    price: pkg.price,
    dailySwipeLimit: pkg.dailySwipeLimit,
    duration: pkg.duration,
    isActive: pkg.isActive,
    allowBadge: pkg.allowBadge,
    canSeeLikes: pkg.canSeeLikes,
    priorityMatching: pkg.priorityMatching,
    isHidden: pkg.isHidden,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...pkg,
      ...formData,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Package Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Price (₹)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: parseFloat(e.target.value) })
            }
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dailySwipeLimit">Daily Swipe Limit</Label>
          <Input
            id="dailySwipeLimit"
            type="number"
            value={formData.dailySwipeLimit}
            onChange={(e) =>
              setFormData({
                ...formData,
                dailySwipeLimit: parseInt(e.target.value),
              })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration">Duration</Label>
          <select
            id="duration"
            value={formData.duration}
            onChange={(e) =>
              setFormData({
                ...formData,
                duration: e.target.value as PackageDuration,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={PackageDuration.MONTHLY}>Monthly</option>
            <option value={PackageDuration.QUARTERLY}>Quarterly</option>
            <option value={PackageDuration.YEARLY}>Yearly</option>
            <option value={PackageDuration.LIFETIME}>Lifetime</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-medium">Package Features</Label>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crown className="h-4 w-4 text-yellow-500" />
              <Label htmlFor="allowBadge">Gold Badge</Label>
            </div>
            <Switch
              id="allowBadge"
              checked={formData.allowBadge}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, allowBadge: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-blue-500" />
              <Label htmlFor="canSeeLikes">See Who Liked You</Label>
            </div>
            <Switch
              id="canSeeLikes"
              checked={formData.canSeeLikes}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, canSeeLikes: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-purple-500" />
              <Label htmlFor="priorityMatching">Priority Matching</Label>
            </div>
            <Switch
              id="priorityMatching"
              checked={formData.priorityMatching}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, priorityMatching: checked })
              }
            />
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isActive: checked })
          }
        />
        <Label htmlFor="isActive">Active Package</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isHidden"
          checked={formData.isHidden}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isHidden: checked })
          }
        />
        <Label htmlFor="isHidden">Hidden from Users</Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Changes</Button>
      </DialogFooter>
    </form>
  );
}
