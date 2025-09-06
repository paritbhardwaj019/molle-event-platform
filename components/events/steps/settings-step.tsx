"use client";

import { useState, useEffect } from "react";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { UseFormReturn } from "react-hook-form";
import { EventFormData } from "@/lib/validations/event";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSetting } from "@/lib/actions/settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getInviteForms } from "@/lib/actions/invite-form";
import { PreviewInviteFormDialog } from "@/components/invite-forms/preview-invite-form-dialog";

interface SettingsStepProps {
  form: UseFormReturn<EventFormData>;
}

export function SettingsStep({ form }: SettingsStepProps) {
  const { user, isLoading: userLoading } = useLoggedInUser();
  const eventType = form.watch("eventType");
  const allowReferrals = form.watch("settings.allowReferrals");
  const referralPercentage = form.watch("settings.referralPercentage") || 5;
  const packages = form.watch("packages") || [];

  const [userFeePercentage, setUserFeePercentage] = useState(5);
  const [platformHostFeePercentage, setPlatformHostFeePercentage] = useState(6);
  const [currentHostFeePercentage, setCurrentHostFeePercentage] = useState(6);
  const [isLoadingFees, setIsLoadingFees] = useState(true);
  const [inviteForms, setInviteForms] = useState<any[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedFormForPreview, setSelectedFormForPreview] =
    useState<any>(null);

  // Fetch platform fee settings and set host fee based on user data
  useEffect(() => {
    const fetchFeeSettings = async () => {
      if (userLoading) return; // Don't fetch if user is still loading

      setIsLoadingFees(true);
      try {
        const userFee = await getSetting("user_fee_percentage", "5");
        const platformHostFee = await getSetting("host_fee_percentage", "6");

        setUserFeePercentage(parseFloat(userFee));
        setPlatformHostFeePercentage(parseFloat(platformHostFee));

        // Use user's custom host fee percentage if available, otherwise use platform default
        if (
          user?.hostFeePercentage !== null &&
          user?.hostFeePercentage !== undefined
        ) {
          setCurrentHostFeePercentage(Number(user.hostFeePercentage));
        } else {
          setCurrentHostFeePercentage(parseFloat(platformHostFee));
        }
      } finally {
        setIsLoadingFees(false);
      }
    };

    fetchFeeSettings();
  }, [user, userLoading]);

  // Fetch invite forms when event type is invite_only
  useEffect(() => {
    if (eventType === "invite_only") {
      const fetchInviteForms = async () => {
        setIsLoadingForms(true);
        try {
          const result = await getInviteForms();
          if (result.success && result.data) {
            setInviteForms(result.data);
          } else {
            console.error("Failed to fetch invite forms:", result.error);
            setInviteForms([]);
          }
        } catch (error) {
          console.error("Error fetching invite forms:", error);
          setInviteForms([]);
        } finally {
          setIsLoadingForms(false);
        }
      };

      fetchInviteForms();
    }
  }, [eventType]);

  // Function to render price preview for a single package
  const renderPackagePreview = (pkg: any, index: number) => {
    const baseTicketPrice = Number(pkg.price) || 100;

    // Calculate fees
    const userFeeAmount = baseTicketPrice * (userFeePercentage / 100);
    const hostFeeAmount = baseTicketPrice * (currentHostFeePercentage / 100);

    const userPays = baseTicketPrice + userFeeAmount;
    const hostGets = baseTicketPrice - hostFeeAmount;

    // Calculate referral fee if enabled
    const referralFeeAmount = allowReferrals
      ? hostGets * (referralPercentage / 100)
      : 0;
    const hostGetsWithReferral = hostGets - referralFeeAmount;

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Base Price</span>
            <span className="font-medium">₹{baseTicketPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>User Fee ({userFeePercentage}%)</span>
            <span className="font-medium">₹{userFeeAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            {isLoadingFees || userLoading ? (
              <>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </>
            ) : (
              <>
                <span>
                  Host Fee ({currentHostFeePercentage}%)
                  {user?.hostFeePercentage !== null &&
                  user?.hostFeePercentage !== undefined ? (
                    <span className="text-xs text-blue-600 ml-1">(Custom)</span>
                  ) : (
                    <span className="text-xs text-gray-500 ml-1">
                      (Platform Default)
                    </span>
                  )}
                </span>
                <span className="font-medium">₹{hostFeeAmount.toFixed(2)}</span>
              </>
            )}
          </div>

          <div className="border-t border-gray-200 my-2"></div>

          <div className="flex justify-between font-medium">
            <span>User Pays</span>
            <span className="text-blue-600">₹{userPays.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Host Gets</span>
            {isLoadingFees || userLoading ? (
              <Skeleton className="h-5 w-20" />
            ) : (
              <span className="text-green-600">₹{hostGets.toFixed(2)}</span>
            )}
          </div>

          {allowReferrals && (
            <>
              <div className="border-t border-gray-200 my-2"></div>

              <div className="flex justify-between text-sm">
                <span>
                  Referral Fee ({referralPercentage}% of host earnings)
                </span>
                {isLoadingFees || userLoading ? (
                  <Skeleton className="h-4 w-16" />
                ) : (
                  <span className="font-medium">
                    ₹{referralFeeAmount.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="flex justify-between font-medium">
                <span>Host Gets (with referral)</span>
                {isLoadingFees || userLoading ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  <span className="text-amber-600">
                    ₹{hostGetsWithReferral.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="flex justify-between font-medium">
                <span>Referrer Gets</span>
                {isLoadingFees || userLoading ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  <span className="text-purple-600">
                    ₹{referralFeeAmount.toFixed(2)}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Event Status</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              Set the current status of your event
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="settings.allowReferrals"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Allow Referrals</FormLabel>
                <FormDescription>
                  Enable referral program for this event
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {allowReferrals && (
          <FormField
            control={form.control}
            name="settings.referralPercentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Referral Percentage</FormLabel>
                <div className="flex items-center">
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value))
                      }
                    />
                  </FormControl>
                  <span className="ml-2">%</span>
                </div>
                <FormDescription>
                  Percentage of host earnings that referrers will receive
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {eventType === "invite_only" && (
          <>
            <FormField
              control={form.control}
              name="settings.inviteFormId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invite Form</FormLabel>
                  <div className="flex gap-2">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an invite form" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingForms ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            Loading forms...
                          </div>
                        ) : inviteForms.length > 0 ? (
                          inviteForms.map((form) => (
                            <SelectItem key={form.id} value={form.id}>
                              {form.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            No invite forms available
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {field.value && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const selectedForm = inviteForms.find(
                            (f) => f.id === field.value
                          );
                          if (selectedForm) {
                            setSelectedFormForPreview(selectedForm);
                            setShowPreviewDialog(true);
                          }
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <FormDescription>
                    Choose a custom form for users to fill when requesting
                    invites.
                    {inviteForms.length === 0 && !isLoadingForms && (
                      <span className="text-amber-600">
                        {" "}
                        Create an invite form first in your dashboard.
                      </span>
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="settings.autoApproveInvites"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Auto-approve Invites
                    </FormLabel>
                    <FormDescription>
                      Automatically approve invited guests
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        )}
      </div>

      {/* Host Fee Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Your Host Fee Settings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingFees || userLoading ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Current Host Fee:</span>
                <span className="text-lg font-semibold text-blue-600">
                  {currentHostFeePercentage}%
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {user?.hostFeePercentage !== null &&
                user?.hostFeePercentage !== undefined ? (
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="font-medium text-blue-800">Custom Fee Rate</p>
                    <p>
                      You have a custom host fee rate of{" "}
                      {currentHostFeePercentage}% set by the admin. This rate
                      will be used for all your events.
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="font-medium text-gray-800">
                      Platform Default Rate
                    </p>
                    <p>
                      You're using the platform default host fee rate of{" "}
                      {platformHostFeePercentage}%. Contact admin for custom
                      rates.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {packages.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Price Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {packages.length === 1 ? (
              <>
                {renderPackagePreview(packages[0], 0)}
                <div className="bg-blue-50 p-3 rounded-md text-xs text-blue-700 mt-4">
                  <p>• This is a preview based on your package price</p>
                  <p>• Referral fees are deducted from the host's earnings</p>
                  <p>• Actual amounts may vary based on platform settings</p>
                </div>
              </>
            ) : (
              <Tabs defaultValue="0" className="w-full">
                <TabsList className="w-full mb-4">
                  {packages.map((pkg, index) => (
                    <TabsTrigger
                      key={index}
                      value={index.toString()}
                      className="flex-1"
                    >
                      {pkg.name || `Package ${index + 1}`}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {packages.map((pkg, index) => (
                  <TabsContent key={index} value={index.toString()}>
                    {renderPackagePreview(pkg, index)}

                    <div className="bg-blue-50 p-3 rounded-md text-xs text-blue-700 mt-4">
                      <p>• This is a preview based on this package's price</p>
                      <p>
                        • Referral fees are deducted from the host's earnings
                      </p>
                      <p>
                        • Actual amounts may vary based on platform settings
                      </p>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}

      {selectedFormForPreview && (
        <PreviewInviteFormDialog
          open={showPreviewDialog}
          onOpenChange={setShowPreviewDialog}
          form={selectedFormForPreview}
        />
      )}
    </div>
  );
}
