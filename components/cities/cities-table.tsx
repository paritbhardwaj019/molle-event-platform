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
import { Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  getAllCities,
  deleteCity,
  updateCityStatus,
  updateCityPriority,
  setPopularCities,
} from "@/lib/actions/city";
import type { City } from "@/lib/actions/city";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface CitiesTableProps {
  key?: string;
  onCityCreated?: () => void;
}

type FilterType = "all" | "active" | "inactive";

export function CitiesTable({ onCityCreated }: CitiesTableProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [cityToDelete, setCityToDelete] = useState<City | null>(null);
  const [editingPriority, setEditingPriority] = useState<string | null>(null);
  const [priorityValue, setPriorityValue] = useState<string>("");

  const fetchCities = async () => {
    try {
      const result = await getAllCities();
      if (result.success && result.data) {
        setCities(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch cities:", error);
      toast.error("Failed to load cities", {
        description:
          "There was a problem loading the cities. Please try refreshing the page.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const handleToggleStatus = async (cityId: string, currentStatus: boolean) => {
    try {
      const result = await updateCityStatus(cityId, !currentStatus);
      if (result.success) {
        toast.success(
          `City ${!currentStatus ? "activated" : "deactivated"} successfully`,
          {
            description: `The city has been ${
              !currentStatus ? "activated" : "deactivated"
            }.`,
          }
        );
        fetchCities();
      } else {
        toast.error("Failed to update city status", {
          description:
            result.error || "An error occurred while updating the city status",
        });
      }
    } catch (error) {
      toast.error("Failed to update city status", {
        description: "An unexpected error occurred",
      });
    }
  };

  const handleDeleteClick = (city: City) => {
    setCityToDelete(city);
  };

  const handleDelete = async () => {
    if (!cityToDelete) return;

    try {
      const result = await deleteCity(cityToDelete.id);
      if (result.success) {
        toast.success("City deleted successfully", {
          description: `${cityToDelete.name} has been permanently deleted.`,
        });
        fetchCities();
      } else {
        toast.error("Failed to delete city", {
          description:
            result.error || "An error occurred while deleting the city",
        });
      }
    } catch (error) {
      toast.error("Failed to delete city", {
        description: "An unexpected error occurred",
      });
    } finally {
      setCityToDelete(null);
    }
  };

  const handlePriorityEdit = (city: City) => {
    setEditingPriority(city.id);
    setPriorityValue(city.priority.toString());
  };

  const handlePrioritySave = async (cityId: string) => {
    try {
      const priority = parseInt(priorityValue);
      if (isNaN(priority)) {
        toast.error("Invalid priority value");
        return;
      }

      const result = await updateCityPriority(cityId, priority);
      if (result.success) {
        toast.success("Priority updated successfully");
        fetchCities();
      } else {
        toast.error("Failed to update priority", {
          description:
            result.error || "An error occurred while updating priority",
        });
      }
    } catch (error) {
      toast.error("Failed to update priority", {
        description: "An unexpected error occurred",
      });
    } finally {
      setEditingPriority(null);
      setPriorityValue("");
    }
  };

  const handlePriorityCancel = () => {
    setEditingPriority(null);
    setPriorityValue("");
  };

  const handleSetPopularCities = async () => {
    try {
      const result = await setPopularCities();
      if (result.success) {
        toast.success("Popular cities set successfully", {
          description:
            "City priorities have been updated for popular Indian cities.",
        });
        fetchCities();
      } else {
        toast.error("Failed to set popular cities", {
          description:
            result.error || "An error occurred while setting popular cities",
        });
      }
    } catch (error) {
      toast.error("Failed to set popular cities", {
        description: "An unexpected error occurred",
      });
    }
  };

  const filteredCities = cities.filter((city) => {
    if (filterType === "all") return true;
    if (filterType === "active") return city.isActive;
    if (filterType === "inactive") return !city.isActive;
    return true;
  });

  // Group cities by state
  const citiesByState = filteredCities.reduce((acc, city) => {
    if (!acc[city.state]) {
      acc[city.state] = [];
    }
    acc[city.state].push(city);
    return acc;
  }, {} as Record<string, City[]>);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead>City</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-[120px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[60px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-16" />
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
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            onClick={handleSetPopularCities}
            variant="outline"
            className="text-sm"
          >
            Set Popular Cities
          </Button>
          <div className="text-xs text-gray-500">
            🔥 = Top tier (90-100) | ⭐ = Second tier (80-89) | • = Third tier
            (70-79)
          </div>
        </div>

        <Select
          value={filterType}
          onValueChange={(value: FilterType) => setFilterType(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            <SelectItem value="active">Active Cities</SelectItem>
            <SelectItem value="inactive">Inactive Cities</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead>City</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(citiesByState).map(([state, stateCities]) =>
              stateCities.map((city, index) => (
                <TableRow key={city.id}>
                  <TableCell className="font-medium">{city.name}</TableCell>
                  <TableCell>{city.state}</TableCell>
                  <TableCell>
                    {editingPriority === city.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={priorityValue}
                          onChange={(e) => setPriorityValue(e.target.value)}
                          className="w-16 h-8 text-sm"
                          min="0"
                          max="100"
                        />
                        <Button
                          size="sm"
                          onClick={() => handlePrioritySave(city.id)}
                          className="h-6 px-2 text-xs"
                        >
                          ✓
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handlePriorityCancel}
                          className="h-6 px-2 text-xs"
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {city.priority}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePriorityEdit(city)}
                          className="h-6 px-2 text-xs text-gray-400 hover:text-gray-600"
                        >
                          ✎
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        city.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {city.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {format(new Date(city.createdAt), "MMM d, yyyy")}
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
                              onClick={() =>
                                handleToggleStatus(city.id, city.isActive)
                              }
                            >
                              {city.isActive ? (
                                <ToggleRight className="h-4 w-4 text-green-600" />
                              ) : (
                                <ToggleLeft className="h-4 w-4 text-red-600" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {city.isActive ? "Deactivate" : "Activate"} city
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
                              className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteClick(city)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete city</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
            {filteredCities.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="text-gray-500">
                    {filterType === "all"
                      ? "No cities found"
                      : `No ${filterType} cities found`}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!cityToDelete}
        onOpenChange={() => setCityToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {cityToDelete?.name} from{" "}
              {cityToDelete?.state}. This action cannot be undone.
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
