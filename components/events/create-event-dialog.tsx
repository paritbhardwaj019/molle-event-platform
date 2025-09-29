"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSteps } from "@/lib/hooks/use-steps";
import { eventSchema, type EventFormData } from "@/lib/validations/event";
import { createEvent, updateEvent } from "@/lib/actions/event";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BasicInfoStep } from "./steps/basic-info-step";
import { DurationStep } from "./steps/duration-step";
import { CapacityStep } from "./steps/capacity-step";
import { PackagesStep } from "./steps/packages-step";
import { AmenitiesStep } from "./steps/amenities-step";
import { SettingsStep } from "./steps/settings-step";
import { toast } from "sonner";
import { useEffect } from "react";

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: EventFormData & { id?: string }; // Optional event for edit mode
}

const STEPS = [
  { title: "Basic Information", component: BasicInfoStep },
  { title: "Event Duration", component: DurationStep },
  { title: "Crowd Size & Restrictions", component: CapacityStep },
  { title: "Tickets & Pricing", component: PackagesStep },
  { title: "Amenities", component: AmenitiesStep },
  { title: "Additional Settings", component: SettingsStep },
];

const defaultValues: Partial<EventFormData> = {
  eventType: "normal",
  status: "draft",
  location: "",
  city: "",
  landmark: "",
  streetAddress: "",
  isExclusive: false,
  title: "",
  description: "",
  coverImage: "",
  images: [],
  slug: "",
  organizerName: "",
  organizerBio: "",
  totalCapacity: 1,
  maxTicketsPerUser: undefined,
  startDate: (() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0); // Default to 6:00 PM tomorrow
    return tomorrow;
  })(),
  endDate: (() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(22, 0, 0, 0); // Default to 10:00 PM tomorrow
    return tomorrow;
  })(),
  settings: {
    allowReferrals: false,
    autoApproveInvites: false,
    referralPercentage: 5,
    inviteFormId: "",
  },
  amenities: [],
  ageLimits: {
    min: undefined,
    max: undefined,
    note: "",
  },
  packages: [
    {
      name: "",
      description: "",
      price: 0,
      maxTicketsPerBooking: 1,
      allocation: 1,
      includedItems: [""],
    },
  ],
};

export function CreateEventDialog({
  open,
  onOpenChange,
  event,
}: CreateEventDialogProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isEditMode = !!event;

  const {
    currentStep,
    steps,
    isFirstStep,
    isLastStep,
    progress,
    goToNextStep,
    goToPreviousStep,
    reset,
  } = useSteps({ totalSteps: STEPS.length });

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      ...defaultValues,
      status: "published",
      isExclusive: false,
      images: [],
      startDate: (() => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(18, 0, 0, 0);
        return tomorrow;
      })(),
      endDate: (() => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(22, 0, 0, 0);
        return tomorrow;
      })(),
      packages: [
        {
          name: "",
          description: "",
          price: 0,
          maxTicketsPerBooking: 1,
          allocation: 1,
          includedItems: [""],
        },
      ],
      settings: {
        allowReferrals: false,
        autoApproveInvites: false,
        referralPercentage: 5,
      },
    },
  });

  useEffect(() => {
    if (event && open) {
      form.reset(event);
    } else if (!event && open) {
      form.reset({
        ...defaultValues,
        status: "published",
        isExclusive: false,
        images: [],
        startDate: (() => {
          const now = new Date();
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(18, 0, 0, 0);
          return tomorrow;
        })(),
        endDate: (() => {
          const now = new Date();
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(22, 0, 0, 0);
          return tomorrow;
        })(),
        packages: [
          {
            name: "",
            description: "",
            price: 0,
            maxTicketsPerBooking: 1,
            allocation: 1,
            includedItems: [""],
          },
        ],
        settings: {
          allowReferrals: false,
          autoApproveInvites: false,
          referralPercentage: 5,
        },
      });
    }
  }, [event, open, form]);

  const CurrentStepComponent = STEPS[currentStep - 1].component;

  const canProceedFromCurrentStep = () => {
    const currentStepTitle = STEPS[currentStep - 1].title;

    if (currentStepTitle === "Tickets & Pricing") {
      const packages = form.getValues("packages") || [];
      return packages.length > 0;
    }

    return true;
  };

  const validateFinalStep = () => {
    const formData = form.getValues();
    const errors: string[] = [];

    if (!formData.title?.trim()) {
      errors.push("Event title is required");
    }
    if (!formData.startDate) {
      errors.push("Start date is required");
    }
    if (!formData.endDate) {
      errors.push("End date is required");
    }
    if (!formData.location?.trim()) {
      errors.push("Location is required");
    }
    if (!formData.organizerName?.trim()) {
      errors.push("Host name is required");
    }
    if (!formData.images || formData.images.length === 0) {
      errors.push("At least one image is required");
    }
    if (!formData.packages || formData.packages.length === 0) {
      errors.push("At least one ticket package is required");
    }
    if (!formData.amenities || formData.amenities.length === 0) {
      errors.push("At least one amenity is required");
    }

    // Package validation
    if (formData.packages && formData.packages.length > 0) {
      formData.packages.forEach((pkg, index) => {
        if (!pkg.name?.trim()) {
          errors.push(`Ticket ${index + 1}: Name is required`);
        }
        if (pkg.price === undefined || pkg.price < 0) {
          errors.push(`Ticket ${index + 1}: Valid price is required`);
        }
        if (!pkg.allocation || pkg.allocation < 1) {
          errors.push(`Ticket ${index + 1}: Allocation must be at least 1`);
        }
        if (
          !pkg.includedItems ||
          pkg.includedItems.length === 0 ||
          !pkg.includedItems.some((item) => item.trim())
        ) {
          errors.push(
            `Ticket ${index + 1}: At least one included item is required`
          );
        }
      });

      // Check total allocation
      const totalAllocation = formData.packages.reduce(
        (sum, pkg) => sum + (pkg.allocation || 0),
        0
      );
      if (totalAllocation > (formData.totalCapacity || 0)) {
        errors.push("Total ticket allocation exceeds event capacity");
      }
    }

    return errors;
  };

  const onClose = () => {
    form.reset();
    reset();
    onOpenChange(false);
  };

  const onSubmit = form.handleSubmit((data: EventFormData) => {
    if (!isLastStep) {
      console.warn("Form submission attempted but not on last step");
      return;
    }

    // Validate all required fields before submission
    const validationErrors = validateFinalStep();
    if (validationErrors.length > 0) {
      toast.error(
        `Please fix the following issues:\n• ${validationErrors.join("\n• ")}`
      );
      return;
    }

    startTransition(async () => {
      if (isEditMode && event?.id) {
        const result = await updateEvent(event.id, data);

        if (result.success && result.data) {
          toast.success("Event updated successfully!");
          router.push(`/events/${result.data.slug}`);
          onClose();
        } else {
          toast.error(
            typeof result.error === "string"
              ? result.error
              : "Failed to update event"
          );
        }
      } else {
        const result = await createEvent(data);

        if (result.success && result.data) {
          toast.success("Event created successfully!");
          if (result.data.status === "PUBLISHED") {
            router.push(`/events/${result.data.slug}`);
          }
          onClose();
        } else {
          toast.error(
            typeof result.error === "string"
              ? result.error
              : "Failed to create event"
          );
        }
      }
    });
  });

  const handleSaveAsDraft = () => {
    startTransition(async () => {
      const data = form.getValues();
      // Explicitly set status to draft to override any form state
      data.status = "draft";

      // For drafts, we only require basic fields
      const basicErrors: string[] = [];
      if (!data.title?.trim()) {
        basicErrors.push("Event title is required");
      }
      if (!data.organizerName?.trim()) {
        basicErrors.push("Host name is required");
      }

      if (basicErrors.length > 0) {
        toast.error(
          `Please fix the following issues:\n• ${basicErrors.join("\n• ")}`
        );
        return;
      }

      if (isEditMode && event?.id) {
        const result = await updateEvent(event.id, data);

        if (result.success && result.data) {
          toast.success("Event saved as draft!");
          // Don't redirect for draft events - just close the dialog
          onClose();
        } else {
          toast.error(
            typeof result.error === "string"
              ? result.error
              : "Failed to save draft"
          );
        }
      } else {
        const result = await createEvent(data);

        if (result.success && result.data) {
          toast.success("Event saved as draft!");
          // Don't redirect for draft events - just close the dialog
          onClose();
        } else {
          toast.error(
            typeof result.error === "string"
              ? result.error
              : "Failed to save draft"
          );
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Event" : "Create New Event"}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <div className="mb-8">
            <div className="flex justify-between mb-2 text-sm text-gray-600">
              <span>
                Step {currentStep} of {steps.length}
              </span>
              <span>{STEPS[currentStep - 1].title}</span>
            </div>
            <Progress value={progress} className="h-2 bg-gray-100" />
          </div>

          <form
            onSubmit={(e) => {
              if (!isLastStep) {
                e.preventDefault();
                return;
              }
              onSubmit(e);
            }}
          >
            <FormProvider {...form}>
              <CurrentStepComponent form={form} />

              <div className="flex justify-between mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPreviousStep}
                  disabled={isFirstStep || isPending}
                >
                  Previous
                </Button>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveAsDraft}
                    disabled={isPending}
                  >
                    {isPending ? "Saving..." : "Save as Draft"}
                  </Button>

                  {isLastStep ? (
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="min-w-[120px]"
                    >
                      {isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>
                            {isEditMode ? "Updating..." : "Creating..."}
                          </span>
                        </div>
                      ) : isEditMode ? (
                        "Update Event"
                      ) : (
                        "Create Event"
                      )}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        if (canProceedFromCurrentStep()) {
                          goToNextStep();
                        } else {
                          // Show validation error for packages step
                          const currentStepTitle = STEPS[currentStep - 1].title;
                          if (currentStepTitle === "Tickets & Pricing") {
                            toast.error(
                              "Please add at least one ticket before proceeding"
                            );
                          }
                        }
                      }}
                      disabled={isPending || !canProceedFromCurrentStep()}
                    >
                      Next
                    </Button>
                  )}
                </div>
              </div>
            </FormProvider>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
