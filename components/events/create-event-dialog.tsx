"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSteps } from "@/lib/hooks/use-steps";
import { eventSchema, type EventFormData } from "@/lib/validations/event";
import { createEvent } from "@/lib/actions/event";
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

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEPS = [
  { title: "Basic Information", component: BasicInfoStep },
  { title: "Event Duration", component: DurationStep },
  { title: "Capacity & Restrictions", component: CapacityStep },
  { title: "Packages & Pricing", component: PackagesStep },
  { title: "Amenities", component: AmenitiesStep },
  { title: "Additional Settings", component: SettingsStep },
];

const defaultValues: Partial<EventFormData> = {
  eventType: "normal",
  status: "draft",
  settings: {
    featured: false,
    allowReferrals: true,
    autoApproveInvites: false,
  },
  amenities: [],
  ageLimits: {
    min: undefined,
    max: undefined,
    note: undefined,
  },
};

export function CreateEventDialog({
  open,
  onOpenChange,
}: CreateEventDialogProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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
      settings: {
        allowReferrals: true,
      },
    },
  });

  const CurrentStepComponent = STEPS[currentStep - 1].component;

  const onClose = () => {
    form.reset();
    reset();
    onOpenChange(false);
  };

  console.log(form.formState.errors);

  const onSubmit = form.handleSubmit((data: EventFormData) => {
    startTransition(async () => {
      const result = await createEvent(data);

      if (result.success && result.data) {
        toast.success("Event created successfully!");
        router.push(`/events/${result.data.slug}`);
        onClose();
      } else {
        toast.error(
          typeof result.error === "string"
            ? result.error
            : "Failed to create event"
        );
      }
    });
  });

  const handleSaveAsDraft = () => {
    startTransition(async () => {
      const data = form.getValues();
      data.status = "draft";

      const result = await createEvent(data);

      if (result.success && result.data) {
        toast.success("Event saved as draft!");
        router.push(`/events/${result.data.slug}`);
        onClose();
      } else {
        toast.error(
          typeof result.error === "string"
            ? result.error
            : "Failed to save draft"
        );
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
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

          <form onSubmit={onSubmit}>
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
                      disabled={isPending || !form.formState.isValid}
                      className="min-w-[120px]"
                    >
                      {isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Creating...</span>
                        </div>
                      ) : (
                        "Create Event"
                      )}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={goToNextStep}
                      disabled={isPending}
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
