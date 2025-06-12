"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  getSettings,
  updateSettings,
  type PlatformSettingWithMeta,
} from "@/lib/actions/settings";

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettingWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const result = await getSettings();
        if (result.success && result.data) {
          setSettings(result.data);

          // Initialize form values
          const initialValues: Record<string, string> = {};
          result.data.forEach((setting) => {
            initialValues[setting.key] = setting.value;
          });
          setFormValues(initialValues);
        } else {
          toast.error("Failed to load settings");
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleInputChange = (key: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const validatePercentage = (value: string): boolean => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && num <= 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all values are proper percentages
    const invalidSettings = Object.entries(formValues).filter(
      ([key, value]) => !validatePercentage(value)
    );

    if (invalidSettings.length > 0) {
      const invalidNames = invalidSettings
        .map(([key]) => settings.find((s) => s.key === key)?.displayName || key)
        .join(", ");

      toast.error(`Invalid percentage values for: ${invalidNames}`, {
        description: "All values must be between 0 and 100",
      });
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateSettings(formValues);
      if (result.success) {
        toast.success("Settings updated successfully", {
          description: "Platform fees is updated!",
        });
      } else {
        toast.error("Failed to update settings", {
          description: result.error || "Please try again",
        });
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate example values
  const ticketPrice = 100;
  const platformFee =
    parseFloat(formValues["platform_fee_percentage"] || "0") || 0;
  const hostFee = parseFloat(formValues["host_fee_percentage"] || "0") || 0;

  const userPays = ticketPrice * (1 + platformFee / 100);
  const hostEarns = ((ticketPrice * platformFee) / 100) * (hostFee / 100);
  const adminEarns = (ticketPrice * platformFee) / 100 - hostEarns;

  return (
    <div className="flex flex-col gap-8 p-8">
      <PageHeader
        title="Platform Settings"
        subtitle="Configure platform-wide settings for pricing and fees"
      />

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Fee Configuration</CardTitle>
              <CardDescription>
                Configure the fees and taxes applied to transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="w-full">
              <form onSubmit={handleSubmit} className="space-y-6 w-full">
                {settings.map((setting) => (
                  <div key={setting.key} className="space-y-2 w-full">
                    <Label htmlFor={setting.key}>{setting.displayName}</Label>
                    <div className="flex items-center w-full">
                      <Input
                        id={setting.key}
                        name={setting.key}
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formValues[setting.key] || ""}
                        onChange={(e) =>
                          handleInputChange(setting.key, e.target.value)
                        }
                        className="flex-1 !w-full"
                        placeholder="0.00"
                      />
                      <span className="ml-2">%</span>
                    </div>
                    {setting.description && (
                      <p className="text-sm text-gray-500">
                        {setting.description}
                      </p>
                    )}
                  </div>
                ))}
                <Button
                  type="submit"
                  disabled={isLoading || isSaving}
                  className="w-full"
                >
                  {isSaving ? "Saving..." : "Save Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fee Calculation Example</CardTitle>
              <CardDescription>
                See how your fees will be applied to transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Base Ticket Price</span>
                    <span className="font-medium">
                      ₹{ticketPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Platform Fee ({platformFee}%)</span>
                    <span className="font-medium">
                      ₹{((ticketPrice * platformFee) / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="flex justify-between font-medium">
                    <span>User Pays</span>
                    <span>₹{userPays.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-gray-200 pt-4">
                  <h3 className="font-medium">Revenue Distribution</h3>
                  <div className="flex justify-between text-sm">
                    <span>Host Earnings ({hostFee}% of platform fee)</span>
                    <span className="font-medium">₹{hostEarns.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Platform Earnings</span>
                    <span className="font-medium">
                      ₹{adminEarns.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-md mt-4">
                  <h3 className="font-medium text-blue-700 mb-2">
                    Understanding the Fee Structure
                  </h3>
                  <p className="text-sm text-blue-600">
                    The platform fee is added on top of the ticket price. A
                    portion of this fee is shared with hosts based on the host
                    fee percentage. Tax rates (CGST & SGST) are applied to the
                    total amount.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
