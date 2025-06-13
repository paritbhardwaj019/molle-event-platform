"use client";

import { useState } from "react";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { PageHeader } from "@/components/page-header";
import { PaymentsTable } from "@/components/payments/payments-table";
import { WithdrawalRequestDialog } from "@/components/payments/withdrawal-request-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Wallet, CreditCard, TrendingUp } from "lucide-react";

export default function PaymentsPage() {
  const { user } = useLoggedInUser();
  const [isWithdrawalDialogOpen, setIsWithdrawalDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState<string>("0");

  const handleWithdrawalRequested = () => {
    setRefreshKey((prev) => String(Number(prev) + 1));
    setIsWithdrawalDialogOpen(false);
  };

  if (!user) {
    return <div>Please log in to access payments.</div>;
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
          user.role !== "ADMIN" ? (
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

      {/* Wallet Balance Card - Only for HOST and REFERRER */}
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

      {/* Payments Table */}
      <PaymentsTable key={refreshKey} />

      {/* Withdrawal Request Dialog - Only for HOST and REFERRER */}
      {user.role !== "ADMIN" && (
        <WithdrawalRequestDialog
          open={isWithdrawalDialogOpen}
          onOpenChange={setIsWithdrawalDialogOpen}
          onSuccess={handleWithdrawalRequested}
          maxAmount={user.walletBalance}
        />
      )}
    </div>
  );
}
