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

    // Validate all values are proper percentages (except platform fee which is fixed)
    const invalidSettings = Object.entries(formValues).filter(
      ([key, value]) =>
        key !== "platform_fee_percentage" && !validatePercentage(value)
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
          description: "Platform fees have been updated!",
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

  // Calculate example values with fixed base price of ₹100
  const baseTicketPrice = 100;
  const userFeePercentage = parseFloat(
    formValues["user_fee_percentage"] || "5"
  );
  const hostFeePercentage = parseFloat(
    formValues["host_fee_percentage"] || "6"
  );
  const platformFeePercentage = parseFloat(
    formValues["platform_fee_percentage"] || "0"
  );
  const cgstPercentage = parseFloat(formValues["cgst_percentage"] || "9");
  const sgstPercentage = parseFloat(formValues["sgst_percentage"] || "9");

  // Calculate fees using the new model
  const userFeeAmount = baseTicketPrice * (userFeePercentage / 100);
  const hostFeeAmount = baseTicketPrice * (hostFeePercentage / 100);
  const platformFeeAmount = baseTicketPrice * (platformFeePercentage / 100);
  const cgstAmount = baseTicketPrice * (cgstPercentage / 100);
  const sgstAmount = baseTicketPrice * (sgstPercentage / 100);
  const totalTaxAmount = cgstAmount + sgstAmount;

  const userPays = baseTicketPrice + userFeeAmount + totalTaxAmount;
  const hostGets = baseTicketPrice - hostFeeAmount;
  const adminGets = userFeeAmount + hostFeeAmount;

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
                Configure the fees applied to ticket sales (Base ticket price:
                ₹100)
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
                        disabled={setting.key === "platform_fee_percentage"}
                      />
                      <span className="ml-2">%</span>
                    </div>
                    {setting.description && (
                      <p className="text-sm text-gray-500">
                        {setting.description}
                      </p>
                    )}
                    {setting.key === "platform_fee_percentage" && (
                      <p className="text-xs text-orange-600">
                        This field is fixed and cannot be edited
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
                See how your fees will be applied to a ₹{baseTicketPrice} base
                ticket
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Base Ticket Price</span>
                    <span className="font-medium">
                      ₹{baseTicketPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>User Fee ({userFeePercentage}%)</span>
                    <span className="font-medium">
                      ₹{userFeeAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Host Fee ({hostFeePercentage}%)</span>
                    <span className="font-medium">
                      ₹{hostFeeAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Platform Fee ({platformFeePercentage}%)</span>
                    <span className="font-medium">
                      ₹{platformFeeAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>CGST ({cgstPercentage}%)</span>
                    <span className="font-medium">
                      ₹{cgstAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>SGST ({sgstPercentage}%)</span>
                    <span className="font-medium">
                      ₹{sgstAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-orange-600">
                    <span>Total Tax (CGST + SGST)</span>
                    <span>₹{totalTaxAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="flex justify-between font-medium text-lg">
                    <span>User Pays</span>
                    <span className="text-blue-600">
                      ₹{userPays.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium text-lg">
                    <span>Host Gets</span>
                    <span className="text-green-600">
                      ₹{hostGets.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium text-lg">
                    <span>Admin Gets</span>
                    <span className="text-purple-600">
                      ₹{adminGets.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-md">
                  <h3 className="font-medium text-blue-700 mb-2">
                    How It Works
                  </h3>
                  <div className="text-sm text-blue-600 space-y-1">
                    <p>• User pays: Base Price (₹100) + User Fee + Taxes</p>
                    <p>• Host gets: Base Price (₹100) - Host Fee</p>
                    <p>• Admin gets: User Fee + Host Fee</p>
                    <p>
                      • Taxes: CGST ({cgstPercentage}%) + SGST ({sgstPercentage}
                      %)
                    </p>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-md">
                  <h3 className="font-medium text-green-700 mb-2">
                    Example Breakdown
                  </h3>
                  <div className="text-sm text-green-600 space-y-1">
                    <p>
                      • User pays ₹{userPays.toFixed(2)} (₹{baseTicketPrice} + ₹
                      {userFeeAmount.toFixed(2)} + ₹{totalTaxAmount.toFixed(2)})
                    </p>
                    <p>
                      • Host receives ₹{hostGets.toFixed(2)} (₹{baseTicketPrice}{" "}
                      - ₹{hostFeeAmount.toFixed(2)})
                    </p>
                    <p>
                      • Platform earns ₹{adminGets.toFixed(2)} (₹
                      {userFeeAmount.toFixed(2)} + ₹{hostFeeAmount.toFixed(2)})
                    </p>
                    <p>
                      • Tax breakdown: CGST ₹{cgstAmount.toFixed(2)} + SGST ₹
                      {sgstAmount.toFixed(2)} = ₹{totalTaxAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
