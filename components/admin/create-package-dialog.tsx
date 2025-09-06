"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSubscriptionPackage } from "@/lib/actions/package";
import { PackageDuration } from "@prisma/client";
import { Switch } from "@/components/ui/switch";
import { Crown, Eye, Star } from "lucide-react";

interface CreatePackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const durationOptions = [
  { value: PackageDuration.MONTHLY, label: "Monthly" },
  { value: PackageDuration.QUARTERLY, label: "Quarterly" },
  { value: PackageDuration.YEARLY, label: "Yearly" },
  { value: PackageDuration.LIFETIME, label: "Lifetime" },
];

export function CreatePackageDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreatePackageDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    dailySwipeLimit: "",
    duration: PackageDuration.MONTHLY,
    allowBadge: false,
    canSeeLikes: false,
    priorityMatching: false,
    isHidden: false,
  });

  const handleCreate = async () => {
    if (!formData.name || !formData.price || !formData.dailySwipeLimit) {
      toast.error("Please fill in all required fields", {
        description: "Name, price, and daily swipe limit are required.",
      });
      return;
    }

    const price = parseFloat(formData.price);
    const dailySwipeLimit = parseInt(formData.dailySwipeLimit);

    if (isNaN(price) || price <= 0) {
      toast.error("Invalid price", {
        description: "Please enter a valid price greater than 0.",
      });
      return;
    }

    if (isNaN(dailySwipeLimit) || dailySwipeLimit <= 0) {
      toast.error("Invalid daily swipe limit", {
        description: "Please enter a valid daily swipe limit greater than 0.",
      });
      return;
    }

    try {
      setIsLoading(true);

      const result = await createSubscriptionPackage({
        name: formData.name,
        description: formData.description || undefined,
        price,
        dailySwipeLimit,
        duration: formData.duration,
        allowBadge: formData.allowBadge,
        canSeeLikes: formData.canSeeLikes,
        priorityMatching: formData.priorityMatching,
        isHidden: formData.isHidden,
      });

      if (result.success) {
        toast.success("Subscription package created", {
          description: `The package "${formData.name}" has been created successfully.`,
        });
        onSuccess?.();
        onOpenChange(false);
        // Reset form
        setFormData({
          name: "",
          description: "",
          price: "",
          dailySwipeLimit: "",
          duration: PackageDuration.MONTHLY,
          allowBadge: false,
          canSeeLikes: false,
          priorityMatching: false,
          isHidden: false,
        });
      } else {
        toast.error("Failed to create package", {
          description:
            result.error ||
            "There was a problem creating your subscription package. Please try again.",
        });
      }
    } catch (error) {
      toast.error("Failed to create package", {
        description:
          "An unexpected error occurred. Please try again or contact support if the problem persists.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Subscription Package</DialogTitle>
          <DialogDescription>
            Create a new subscription package for users to purchase.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Package Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Basic Plan, Premium Plan"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this package includes..."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (INR) *</Label>
            <Input
              id="price"
              type="number"
              placeholder="0.00"
              value={formData.price}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, price: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dailySwipeLimit">Daily Swipe Limit *</Label>
            <Input
              id="dailySwipeLimit"
              type="number"
              placeholder="e.g., 50"
              value={formData.dailySwipeLimit}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  dailySwipeLimit: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Select
              value={formData.duration}
              onValueChange={(value: PackageDuration) =>
                setFormData((prev) => ({ ...prev, duration: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {durationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              id="isHidden"
              checked={formData.isHidden}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isHidden: checked })
              }
            />
            <Label htmlFor="isHidden">Hidden from Users</Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            Create Package
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
