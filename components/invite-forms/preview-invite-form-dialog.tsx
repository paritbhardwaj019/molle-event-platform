"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

interface PreviewInviteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: InviteForm;
}

export function PreviewInviteFormDialog({
  open,
  onOpenChange,
  form,
}: PreviewInviteFormDialogProps) {
  const renderField = (field: any) => {
    const baseProps = {
      id: field.id,
      placeholder: field.placeholder || "",
      disabled: true, // Preview mode - fields are disabled
    };

    switch (field.type) {
      case "text":
        return <Input {...baseProps} />;

      case "textarea":
        return <Textarea {...baseProps} className="min-h-[100px]" />;

      case "number":
        return <Input {...baseProps} type="number" />;

      case "dropdown":
        return (
          <Select disabled>
            <SelectTrigger>
              <SelectValue
                placeholder={field.placeholder || "Select an option"}
              />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((option: string, index: number) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "multiselect":
        return (
          <div className="space-y-2">
            {(field.options || []).map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox disabled />
                <Label>{option}</Label>
              </div>
            ))}
          </div>
        );

      default:
        return <Input {...baseProps} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Form Preview: {form.name}</DialogTitle>
          <DialogDescription>
            This is how users will see your invite form when requesting access
            to your events.
            {form.description && (
              <span className="block mt-2 text-sm text-gray-600">
                {form.description}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{form.name}</CardTitle>
            {form.description && (
              <p className="text-sm text-gray-600">{form.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {form.fields
              .sort((a, b) => a.order - b.order)
              .map((field) => (
                <div key={field.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={field.id}>{field.name}</Label>
                    {field.required && (
                      <Badge variant="destructive" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                  {renderField(field)}
                </div>
              ))}

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500">
                * This is a preview. Users will see an interactive version of
                this form.
              </p>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
