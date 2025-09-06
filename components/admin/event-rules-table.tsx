"use client";

import { useState } from "react";
import { format } from "date-fns";
import { MoreHorizontal, Edit, Trash2, Eye, EyeOff, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EventRule, toggleEventRuleStatus } from "@/lib/actions/event-rule";
import { CreateEventRuleDialog } from "@/components/admin/create-event-rule-dialog";
import { EditEventRuleDialog } from "@/components/admin/edit-event-rule-dialog";
import { DeleteEventRuleDialog } from "@/components/admin/delete-event-rule-dialog";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";

interface EventRulesTableProps {
  eventRules: EventRule[];
}

export function EventRulesTable({ eventRules }: EventRulesTableProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<EventRule | null>(null);

  const handleEdit = (rule: EventRule) => {
    setSelectedRule(rule);
    setEditDialogOpen(true);
  };

  const handleDelete = (rule: EventRule) => {
    setSelectedRule(rule);
    setDeleteDialogOpen(true);
  };

  const handleToggleStatus = async (rule: EventRule) => {
    try {
      const result = await toggleEventRuleStatus(rule.id);
      if (result.success) {
        toast.success(
          `Event rule ${
            rule.isActive ? "deactivated" : "activated"
          } successfully`
        );
      } else {
        toast.error(result.error || "Failed to update event rule status");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const handleDialogClose = () => {
    setSelectedRule(null);
    setEditDialogOpen(false);
    setDeleteDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Event Rules"
        subtitle="Manage event rules that are displayed to users on the events page"
        action={
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Rule
          </Button>
        }
      />

      {eventRules.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No event rules found</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create your first rule
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-100 bg-white">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-gray-50">
                <TableHead>Order</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.order}</TableCell>
                  <TableCell className="font-medium">{rule.title}</TableCell>
                  <TableCell className="max-w-md">
                    <p className="truncate" title={rule.description}>
                      {rule.description}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={rule.isActive ? "default" : "secondary"}>
                      {rule.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(rule.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {format(new Date(rule.updatedAt), "MMM d, yyyy")}
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
                              onClick={() => handleEdit(rule)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit rule</p>
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
                              onClick={() => handleToggleStatus(rule)}
                            >
                              {rule.isActive ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{rule.isActive ? "Deactivate" : "Activate"}</p>
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
                              onClick={() => handleDelete(rule)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete rule</p>
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
      )}

      <CreateEventRuleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {selectedRule && (
        <>
          <EditEventRuleDialog
            rule={selectedRule}
            open={editDialogOpen}
            onOpenChange={handleDialogClose}
          />
          <DeleteEventRuleDialog
            rule={selectedRule}
            open={deleteDialogOpen}
            onOpenChange={handleDialogClose}
          />
        </>
      )}
    </div>
  );
}
