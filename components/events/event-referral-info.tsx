"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSetting } from "@/lib/actions/settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Package {
  id?: string;
  name: string;
  price: number;
}

interface EventReferralInfoProps {
  enableReferrers: boolean;
  referralPercentage: number;
  packages: Package[];
}

export function EventReferralInfo({
  enableReferrers,
  referralPercentage,
  packages,
}: EventReferralInfoProps) {
  const [userFeePercentage, setUserFeePercentage] = useState(5);
  const [hostFeePercentage, setHostFeePercentage] = useState(6);
  const [activePackage, setActivePackage] = useState<string>(
    packages[0]?.id || "0"
  );

  // Fetch platform fee settings
  useEffect(() => {
    const fetchFeeSettings = async () => {
      const userFee = await getSetting("user_fee_percentage", "5");
      const hostFee = await getSetting("host_fee_percentage", "6");

      setUserFeePercentage(parseFloat(userFee));
      setHostFeePercentage(parseFloat(hostFee));
    };

    fetchFeeSettings();
  }, []);

  if (!enableReferrers || packages.length === 0) {
    return null;
  }

  const renderPriceBreakdown = (packageItem: Package) => {
    const basePrice = packageItem.price;

    // Calculate fees
    const userFeeAmount = basePrice * (userFeePercentage / 100);
    const hostFeeAmount = basePrice * (hostFeePercentage / 100);

    const userPays = basePrice + userFeeAmount;
    const hostGets = basePrice - hostFeeAmount;

    // Calculate referral fee
    const referralFeeAmount = hostGets * (referralPercentage / 100);
    const hostGetsWithReferral = hostGets - referralFeeAmount;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Referral Percentage:</span>
          <span className="text-sm font-semibold text-purple-600">
            {referralPercentage}%
          </span>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Base Price</span>
            <span className="font-medium">₹{basePrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Host Earnings (without referral)</span>
            <span className="font-medium">₹{hostGets.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Referrer Earnings</span>
            <span className="font-medium text-purple-600">
              ₹{referralFeeAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Host Earnings (with referral)</span>
            <span className="font-medium text-amber-600">
              ₹{hostGetsWithReferral.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="bg-blue-50 p-3 rounded-md text-xs text-blue-700">
          <p>• Referrers earn {referralPercentage}% of host earnings</p>
          <p>• Referral fees are deducted from the host's earnings</p>
          <p>• Referrers must use their unique code when booking</p>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Referral Program</CardTitle>
      </CardHeader>
      <CardContent>
        {packages.length === 1 ? (
          renderPriceBreakdown(packages[0])
        ) : (
          <Tabs
            defaultValue={packages[0]?.id?.toString() || "0"}
            className="w-full bg-white"
          >
            <TabsList className="w-full mb-4">
              {packages.map((pkg, index) => (
                <TabsTrigger
                  key={pkg.id || index}
                  value={pkg.id?.toString() || index.toString()}
                  className="flex-1"
                >
                  {pkg.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {packages.map((pkg, index) => (
              <TabsContent
                key={pkg.id || index}
                value={pkg.id?.toString() || index.toString()}
              >
                {renderPriceBreakdown(pkg)}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
