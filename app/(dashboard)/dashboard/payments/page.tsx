"use client";

import { useState, useEffect } from "react";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { PageHeader } from "@/components/page-header";
import { PaymentsTable } from "@/components/payments/payments-table";
import { WithdrawalRequestDialog } from "@/components/payments/withdrawal-request-dialog";
import { BankAccounts } from "@/components/payments/bank-accounts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Wallet,
  CreditCard,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { getHostKycRequest, type KycRequest } from "@/lib/actions/kyc";
import { getUserBankAccounts } from "@/lib/actions/bank-account";

export default function PaymentsPage() {
  const { user } = useLoggedInUser();
  const [isWithdrawalDialogOpen, setIsWithdrawalDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState<string>("0");
  const [kycRequest, setKycRequest] = useState<KycRequest | null>(null);
  const [isLoadingKyc, setIsLoadingKyc] = useState(true);
  const [hasBankAccounts, setHasBankAccounts] = useState(false);
  const [isCheckingBankAccounts, setIsCheckingBankAccounts] = useState(true);

  const handleWithdrawalRequested = () => {
    setRefreshKey((prev) => String(Number(prev) + 1));
    setIsWithdrawalDialogOpen(false);
  };

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
      } else {
        setIsLoadingKyc(false);
      }
    };

    const checkBankAccounts = async () => {
      if (user && user.role === "REFERRER") {
        try {
          const result = await getUserBankAccounts();
          if (result.success && result.data) {
            setHasBankAccounts(result.data.length > 0);
          }
        } catch (error) {
          console.error("Failed to fetch bank accounts:", error);
        } finally {
          setIsCheckingBankAccounts(false);
        }
      } else {
        setIsCheckingBankAccounts(false);
      }
    };

    if (user) {
      fetchKycRequest();
      checkBankAccounts();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col gap-8 p-8 items-center justify-center w-full h-[calc(100vh-100px)]">
        <p>Please log in to access payments.</p>
      </div>
    );
  }

  if (
    user.role !== "HOST" &&
    user.role !== "REFERRER" &&
    user.role !== "ADMIN"
  ) {
    return (
      <div>
        Access denied. Only hosts, referrers, and admins can access payments.
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Check if KYC is approved for hosts
  const isKycApproved =
    user.role !== "HOST" || (kycRequest && kycRequest.status === "APPROVED");

  // For referrers, they need bank accounts
  const canRequestWithdrawal =
    (user.role === "HOST" && isKycApproved) ||
    (user.role === "REFERRER" && hasBankAccounts);

  return (
    <div className="flex flex-col gap-8 p-8">
      <PageHeader
        title={
          user.role === "ADMIN"
            ? "Payment Management"
            : "Payments & Withdrawals"
        }
        subtitle={
          user.role === "ADMIN"
            ? "Manage withdrawal requests and payment approvals"
            : "Manage your wallet balance and withdrawal requests"
        }
        action={
          !isLoadingKyc && !isCheckingBankAccounts && canRequestWithdrawal ? (
            <Button
              onClick={() => setIsWithdrawalDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Request Withdrawal
            </Button>
          ) : undefined
        }
      />

      {user.role !== "ADMIN" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Available Balance
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(user.walletBalance)}
              </div>
              <p className="text-xs text-muted-foreground">
                Available for withdrawal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Minimum Withdrawal
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹100</div>
              <p className="text-xs text-muted-foreground">
                Minimum amount required
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Processing Time
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1-3 Days</div>
              <p className="text-xs text-muted-foreground">
                After admin approval
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* KYC Status Alert for Hosts */}
      {user.role === "HOST" && !isLoadingKyc && !isKycApproved && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>KYC Verification Required -</strong> You need to complete
            and get your KYC approved before you can request withdrawals.{" "}
            <a
              href="/dashboard/kyc-verification"
              className="underline hover:no-underline font-medium"
            >
              Complete KYC Verification
            </a>
          </AlertDescription>
        </Alert>
      )}

      {/* Bank Account Management for Referrers */}
      {user.role === "REFERRER" && <BankAccounts />}

      {/* Payments Table */}
      <PaymentsTable key={refreshKey} />

      {/* Withdrawal Request Dialog - Only for HOST and REFERRER with approved KYC or bank accounts */}
      {canRequestWithdrawal && (
        <WithdrawalRequestDialog
          open={isWithdrawalDialogOpen}
          onOpenChange={setIsWithdrawalDialogOpen}
          onSuccess={handleWithdrawalRequested}
          maxAmount={user.walletBalance}
          userRole={user.role}
        />
      )}
    </div>
  );
}
