"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { createInviteForm } from "@/lib/actions/invite-form";

const fieldSchema = z.object({
  name: z.string().min(1, "Field name is required"),
  type: z.enum(["text", "textarea", "number", "dropdown", "multiselect"]),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  order: z.number().default(0),
});

const inviteFormSchema = z.object({
  name: z.string().min(1, "Form name is required"),
  description: z.string().optional(),
  fields: z.array(fieldSchema).min(1, "At least one field is required"),
});

type InviteFormData = z.infer<typeof inviteFormSchema>;

interface CreateInviteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const FIELD_TYPES = [
  { value: "text", label: "Text Input" },
  { value: "textarea", label: "Textarea" },
  { value: "number", label: "Number" },
  { value: "dropdown", label: "Dropdown" },
  { value: "multiselect", label: "Multi-select" },
];

export function CreateInviteFormDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateInviteFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      name: "",
      description: "",
      fields: [
        {
          name: "Instagram Handle",
          type: "text",
          placeholder: "@username",
          required: true,
          order: 0,
        },
      ],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "fields",
  });

  const onSubmit = async (data: InviteFormData) => {
    setIsLoading(true);
    try {
      const result = await createInviteForm({
        name: data.name,
        description: data.description,
        fields: data.fields.map((field, index) => ({
          ...field,
          order: index,
        })),
      });

      if (result.success) {
        toast.success("Invite form created successfully");
        form.reset();
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to create invite form");
      }
    } catch (error) {
      toast.error("An error occurred while creating the invite form");
    } finally {
      setIsLoading(false);
    }
  };

  const addField = () => {
    append({
      name: "",
      type: "text",
      placeholder: "",
      required: false,
      order: fields.length,
    });
  };

  const addOption = (fieldIndex: number) => {
    const field = form.getValues(`fields.${fieldIndex}`);
    const currentOptions = field.options || [];
    form.setValue(`fields.${fieldIndex}.options`, [...currentOptions, ""]);
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const field = form.getValues(`fields.${fieldIndex}`);
    const currentOptions = field.options || [];
    const newOptions = currentOptions.filter((_, i) => i !== optionIndex);
    form.setValue(`fields.${fieldIndex}.options`, newOptions);
  };

  const updateOption = (
    fieldIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const field = form.getValues(`fields.${fieldIndex}`);
    const currentOptions = field.options || [];
    const newOptions = [...currentOptions];
    newOptions[optionIndex] = value;
    form.setValue(`fields.${fieldIndex}.options`, newOptions);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Invite Form</DialogTitle>
          <DialogDescription>
            Create a custom form to collect information from users requesting
            invites to your events.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Form Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., VIP Event Application"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of what this form is for..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Form Fields</h3>
                <Button
                  type="button"
                  onClick={addField}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <Card key={field.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-gray-400" />
                          Field {index + 1}
                        </CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`fields.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Field Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter field name"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`fields.${index}.type`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Field Type</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select field type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {FIELD_TYPES.map((type) => (
                                    <SelectItem
                                      key={type.value}
                                      value={type.value}
                                    >
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`fields.${index}.placeholder`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Placeholder Text (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter placeholder text"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`fields.${index}.required`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Required field</FormLabel>
                              <FormDescription>
                                Users must fill this field to submit the form
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      {(form.watch(`fields.${index}.type`) === "dropdown" ||
                        form.watch(`fields.${index}.type`) ===
                          "multiselect") && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <FormLabel>Options</FormLabel>
                            <Button
                              type="button"
                              onClick={() => addOption(index)}
                              variant="outline"
                              size="sm"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Option
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {(form.watch(`fields.${index}.options`) || []).map(
                              (option, optionIndex) => (
                                <div
                                  key={optionIndex}
                                  className="flex items-center gap-2"
                                >
                                  <Input
                                    placeholder={`Option ${optionIndex + 1}`}
                                    value={option}
                                    onChange={(e) =>
                                      updateOption(
                                        index,
                                        optionIndex,
                                        e.target.value
                                      )
                                    }
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      removeOption(index, optionIndex)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Form"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
