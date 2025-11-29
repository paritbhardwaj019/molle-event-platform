"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, X, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

interface KycVerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  kycStatus: string | null;
  context: "discover" | "event" | "chat";
  onContinue?: () => void;
}

export function KycVerificationDialog({
  isOpen,
  onClose,
  kycStatus,
  context,
  onContinue,
}: KycVerificationDialogProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const getContextMessage = () => {
    switch (context) {
      case "discover":
        return "connecting with someone";
      case "event":
        return "connecting with event attendees";
      case "chat":
        return "starting a conversation";
      default:
        return "connecting with others";
    }
  };

  const getStatusInfo = () => {
    switch (kycStatus) {
      case "NOT_STARTED":
        return {
          icon: AlertCircle,
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          title: "KYC Not Started",
          message:
            "Complete your dating KYC verification to build trust with other users.",
        };
      case "PENDING":
        return {
          icon: Clock,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          title: "KYC Under Review",
          message:
            "Your KYC is being reviewed. This usually takes 24-48 hours.",
        };
      case "REJECTED":
        return {
          icon: AlertCircle,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          title: "KYC Rejected",
          message:
            "Please check your dashboard for details and resubmit your verification.",
        };
      default:
        return {
          icon: AlertCircle,
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          title: "KYC Not Started",
          message:
            "Complete your dating KYC verification to build trust with other users.",
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const handleClose = () => {
    setIsDismissed(true);
    onClose();
  };

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    }
    handleClose();
  };

  const handleCompleteKyc = () => {
    // Redirect to dashboard where they can complete KYC
    window.location.href = "/dashboard";
    handleClose();
  };

  // Don't show the dialog if KYC is approved
  if (kycStatus === "APPROVED") {
    return null;
  }

  return (
    <Dialog open={isOpen && !isDismissed} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            Dating KYC Verification (Optional)
          </DialogTitle>
          <DialogDescription className="text-left">
            You're about to start {getContextMessage()}. Complete your dating
            KYC verification to build trust and enhance your experience, but you
            can continue without it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* KYC Status */}
          <div
            className={`p-4 rounded-lg border ${statusInfo.bgColor} ${statusInfo.borderColor}`}
          >
            <div className="flex items-start gap-3">
              <StatusIcon className={`w-5 h-5 ${statusInfo.color} mt-0.5`} />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {statusInfo.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {statusInfo.message}
                </p>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Benefits of KYC Verification:
            </h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Build trust with other users
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Get verified badge on your profile
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Enhanced safety and authenticity
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Better matching opportunities
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={handleCompleteKyc}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Shield className="w-4 h-4 mr-2" />
              Complete KYC Verification
            </Button>

            <Button
              onClick={handleContinue}
              variant="outline"
              className="w-full"
            >
              Continue Without KYC
            </Button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            You can complete KYC verification anytime from your dashboard
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
