"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { PageHeader } from "@/components/layout/page-header";
import { KycForm } from "@/components/kyc/kyc-form";
import { getHostKycRequest } from "@/lib/actions/kyc";
import { KycRequest } from "@/lib/actions/kyc";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Clock } from "lucide-react";

export default function KycVerificationPage() {
  const router = useRouter();
  const { user, isLoading } = useLoggedInUser();
  const [kycRequest, setKycRequest] = useState<KycRequest | null>(null);
  const [isLoadingKyc, setIsLoadingKyc] = useState(true);

  useEffect(() => {
    if (!isLoading && user && user.role !== "HOST") {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchKycRequest = async () => {
      if (user && user.role === "HOST") {
        try {
          const result = await getHostKycRequest();
          if (result.success && result.data) {
            setKycRequest(result.data);
          }
        } catch (error) {
          console.error("Failed to fetch KYC request:", error);
        } finally {
          setIsLoadingKyc(false);
        }
      }
    };

    if (user) {
      fetchKycRequest();
    }
  }, [user]);

  if (isLoading || isLoadingKyc) {
    return (
      <div className="space-y-6 p-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="rounded-lg border border-gray-100 bg-white p-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "HOST") {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "REJECTED":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-50 text-green-700 border-green-200";
      case "REJECTED":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
    }
  };

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title="KYC Verification"
        description="Complete your KYC verification to enable payouts and advanced features."
      />

      {kycRequest && (
        <Alert className={`border ${getStatusColor(kycRequest.status)}`}>
          <div className="flex items-center gap-2">
            {getStatusIcon(kycRequest.status)}
            <AlertDescription className="font-medium">
              {kycRequest.status === "APPROVED" &&
                "Your KYC verification has been approved! You can now receive payouts."}
              {kycRequest.status === "PENDING" &&
                "Your KYC verification is under review. We'll notify you once it's processed."}
              {kycRequest.status === "REJECTED" && (
                <>
                  Your KYC verification was rejected.{" "}
                  {kycRequest.adminReason && (
                    <span className="block mt-1 text-sm">
                      <strong>Reason:</strong> {kycRequest.adminReason}
                    </span>
                  )}
                  <span className="block mt-1 text-sm">
                    Please update your information and resubmit.
                  </span>
                </>
              )}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className="rounded-lg border border-gray-100 bg-white">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {kycRequest && kycRequest.status !== "REJECTED"
              ? "KYC Information"
              : "Submit KYC Verification"}
          </h2>

          <KycForm
            existingRequest={kycRequest}
            onSuccess={(updatedRequest: KycRequest) =>
              setKycRequest(updatedRequest)
            }
          />
        </div>
      </div>
    </div>
  );
}
