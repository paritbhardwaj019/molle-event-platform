"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Shield, Crown, CheckCircle, Clock, XCircle } from "lucide-react";

interface StatusBadgesProps {
  kycStatus: "PENDING" | "APPROVED" | "REJECTED" | null;
  datingKycStatus: "NOT_STARTED" | "PENDING" | "APPROVED" | "REJECTED" | null;
  hasActiveSubscription: boolean;
  subscriptionEndDate?: Date | null;
  subscriptionName?: string | null;
}

export function StatusBadges({
  kycStatus,
  datingKycStatus,
  hasActiveSubscription,
  subscriptionEndDate,
  subscriptionName,
}: StatusBadgesProps) {
  const getKycBadge = () => {
    if (kycStatus === "APPROVED") {
      return (
        <Tooltip>
          <TooltipTrigger>
            <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
              <Shield className="w-3 h-3 mr-1" />
              KYC Verified
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Host KYC verification completed</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    if (kycStatus === "PENDING") {
      return (
        <Tooltip>
          <TooltipTrigger>
            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">
              <Clock className="w-3 h-3 mr-1" />
              KYC Pending
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Host KYC verification under review</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    if (kycStatus === "REJECTED") {
      return (
        <Tooltip>
          <TooltipTrigger>
            <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">
              <XCircle className="w-3 h-3 mr-1" />
              KYC Rejected
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Host KYC verification was rejected</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return null;
  };

  const getDatingKycBadge = () => {
    if (datingKycStatus === "APPROVED") {
      return (
        <Tooltip>
          <TooltipTrigger>
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              Dating Verified
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Dating profile verification completed</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    if (datingKycStatus === "PENDING") {
      return (
        <Tooltip>
          <TooltipTrigger>
            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">
              <Clock className="w-3 h-3 mr-1" />
              Dating Pending
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Dating profile verification under review</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    if (datingKycStatus === "REJECTED") {
      return (
        <Tooltip>
          <TooltipTrigger>
            <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">
              <XCircle className="w-3 h-3 mr-1" />
              Dating Rejected
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Dating profile verification was rejected</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return null;
  };

  const getPremiumBadge = () => {
    if (!hasActiveSubscription) return null;

    const endDate = subscriptionEndDate ? new Date(subscriptionEndDate) : null;
    const isExpired = endDate && endDate < new Date();

    if (isExpired) return null;

    return (
      <Tooltip>
        <TooltipTrigger>
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 border-0">
            <Crown className="w-3 h-3 mr-1" />
            {subscriptionName || "Premium"}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-medium">Premium User</p>
            {subscriptionName && (
              <p className="text-sm">{subscriptionName} Plan</p>
            )}
            {endDate && (
              <p className="text-xs text-gray-500">
                Expires: {endDate.toLocaleDateString()}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  const badges = [getKycBadge(), getDatingKycBadge(), getPremiumBadge()].filter(
    Boolean
  );

  if (badges.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2">{badges}</div>
    </TooltipProvider>
  );
}
