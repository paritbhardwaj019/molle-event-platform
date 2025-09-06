"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ui/form-error";
import { phoneSchema, type PhoneFormData } from "@/lib/validations/auth";
import { updateUserPhone } from "@/lib/actions/auth";

interface PhoneNumberPopupProps {
  userId: string;
  onSuccess: () => void;
  onClose: () => void;
}

export function PhoneNumberPopup({
  userId,
  onSuccess,
  onClose,
}: PhoneNumberPopupProps) {
  const [serverError, setServerError] = useState<string>();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
  });

  const onSubmit = async (data: PhoneFormData) => {
    try {
      setServerError(undefined);
      const result = await updateUserPhone(userId, data.phone);

      if (result.error) {
        setServerError(result.error);
      } else {
        onSuccess();
      }
    } catch (error) {
      setServerError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Complete Your Profile
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Please provide your mobile number to complete your registration
          </p>
        </div>

        {serverError && (
          <div className="p-3 rounded-md bg-red-500/10 border border-red-500/50 text-red-500 mb-4">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="phone">Mobile Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your 10-digit mobile number"
              {...register("phone")}
            />
            <FormError message={errors.phone?.message} />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
