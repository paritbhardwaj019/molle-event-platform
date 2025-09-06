"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createInviteRequest } from "@/lib/actions/invite";

interface InviteForm {
  id: string;
  name: string;
  description: string | null;
  fields: {
    id: string;
    name: string;
    type: string;
    placeholder: string | null;
    required: boolean;
    options: any;
    order: number;
  }[];
}

interface DynamicInviteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviteForm: InviteForm;
  eventId: string;
  userId: string;
  onSuccess?: () => void;
}

export function DynamicInviteForm({
  open,
  onOpenChange,
  inviteForm,
  eventId,
  userId,
  onSuccess,
}: DynamicInviteFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Create dynamic schema based on form fields
  const createSchema = () => {
    const schemaFields: Record<string, z.ZodTypeAny> = {};

    inviteForm.fields.forEach((field) => {
      let fieldSchema: z.ZodTypeAny;

      switch (field.type) {
        case "text":
        case "textarea":
          fieldSchema = field.required
            ? z.string().min(1, `${field.name} is required`)
            : z.string().optional();
          break;
        case "number":
          fieldSchema = field.required
            ? z.number().min(0, `${field.name} is required`)
            : z.number().optional();
          break;
        case "dropdown":
          fieldSchema = field.required
            ? z.string().min(1, `${field.name} is required`)
            : z.string().optional();
          break;
        case "multiselect":
          fieldSchema = field.required
            ? z.array(z.string()).min(1, `${field.name} is required`)
            : z.array(z.string()).optional();
          break;
        default:
          fieldSchema = field.required
            ? z.string().min(1, `${field.name} is required`)
            : z.string().optional();
      }

      schemaFields[field.id] = fieldSchema;
    });

    return z.object(schemaFields);
  };

  const schema = createSchema();
  type FormData = z.infer<typeof schema>;

  // Create default values
  const createDefaultValues = (): Partial<FormData> => {
    const defaultValues: any = {};
    inviteForm.fields.forEach((field) => {
      if (field.type === "multiselect") {
        defaultValues[field.id] = [];
      } else if (field.type === "number") {
        defaultValues[field.id] = "";
      } else {
        defaultValues[field.id] = "";
      }
    });
    return defaultValues;
  };

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: createDefaultValues(),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      // Transform form data to include field names for better readability
      const formDataWithNames: Record<string, any> = {};
      inviteForm.fields.forEach((field) => {
        formDataWithNames[field.name] = data[field.id as keyof FormData];
      });

      const result = await createInviteRequest({
        userId,
        eventId,
        formData: formDataWithNames,
      });

      if (result.success) {
        toast.success("Your invite request has been sent to the host", {
          description: "Please wait for the host to approve your request",
        });
        form.reset();
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to send invite request");
      }
    } catch (error) {
      toast.error("An error occurred while sending the invite request");
    } finally {
      setIsLoading(false);
    }
  };

  const renderField = (field: any) => {
    const fieldId = field.id;

    switch (field.type) {
      case "text":
        return (
          <FormField
            control={form.control}
            name={fieldId}
            render={({ field: formField }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel className="text-gray-200">{field.name}</FormLabel>
                  {field.required && (
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
                <FormControl>
                  <Input
                    placeholder={field.placeholder || ""}
                    {...formField}
                    className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "textarea":
        return (
          <FormField
            control={form.control}
            name={fieldId}
            render={({ field: formField }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel className="text-gray-200">{field.name}</FormLabel>
                  {field.required && (
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
                <FormControl>
                  <Textarea
                    placeholder={field.placeholder || ""}
                    {...formField}
                    className="min-h-[100px] bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "number":
        return (
          <FormField
            control={form.control}
            name={fieldId}
            render={({ field: formField }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel className="text-gray-200">{field.name}</FormLabel>
                  {field.required && (
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={field.placeholder || ""}
                    value={formField.value || ""}
                    onChange={(e) =>
                      formField.onChange(
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                    className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "dropdown":
        return (
          <FormField
            control={form.control}
            name={fieldId}
            render={({ field: formField }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel className="text-gray-200">{field.name}</FormLabel>
                  {field.required && (
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
                <Select
                  onValueChange={formField.onChange}
                  value={formField.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue
                        placeholder={field.placeholder || "Select an option"}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(field.options || []).map(
                      (option: string, index: number) => (
                        <SelectItem key={index} value={option}>
                          {option}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "multiselect":
        return (
          <FormField
            control={form.control}
            name={fieldId}
            render={({ field: formField }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel className="text-gray-200">{field.name}</FormLabel>
                  {field.required && (
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
                <div className="space-y-2">
                  {(field.options || []).map(
                    (option: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                          checked={(formField.value || []).includes(option)}
                          onCheckedChange={(checked) => {
                            const currentValue = formField.value || [];
                            if (checked) {
                              formField.onChange([...currentValue, option]);
                            } else {
                              formField.onChange(
                                currentValue.filter(
                                  (val: string) => val !== option
                                )
                              );
                            }
                          }}
                        />
                        <Label className="text-gray-200">{option}</Label>
                      </div>
                    )
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{inviteForm.name}</DialogTitle>
          {inviteForm.description && (
            <DialogDescription className="text-gray-300">
              {inviteForm.description}
            </DialogDescription>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {inviteForm.fields
                .sort((a, b) => a.order - b.order)
                .map((field) => (
                  <div key={field.id}>{renderField(field)}</div>
                ))}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isLoading ? "Sending..." : "Send Request"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
