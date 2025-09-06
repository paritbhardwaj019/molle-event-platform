"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requestWithdrawal } from "@/lib/actions/payout";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getUserBankAccounts,
  type BankAccount,
} from "@/lib/actions/bank-account";
import { getHostKycRequest, type KycRequest } from "@/lib/actions/kyc";
import { UserRole } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WithdrawalRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  maxAmount: number;
  userRole: UserRole;
}

export function WithdrawalRequestDialog({
  open,
  onOpenChange,
  onSuccess,
  maxAmount,
  userRole,
}: WithdrawalRequestDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedBankAccountId, setSelectedBankAccountId] =
    useState<string>("");
  const [isLoadingBankAccounts, setIsLoadingBankAccounts] = useState(false);
  const [hostKyc, setHostKyc] = useState<KycRequest | null>(null);
  const [isLoadingKyc, setIsLoadingKyc] = useState(false);

  useEffect(() => {
    if (open) {
      if (userRole === "REFERRER") {
        fetchBankAccounts();
      } else if (userRole === "HOST") {
        fetchHostKyc();
      }
    }
  }, [open, userRole]);

  const fetchBankAccounts = async () => {
    try {
      setIsLoadingBankAccounts(true);
      const result = await getUserBankAccounts();
      if (result.success && result.data) {
        setBankAccounts(result.data);

        // Set default bank account if available
        const defaultAccount = result.data.find((account) => account.isDefault);
        if (defaultAccount) {
          setSelectedBankAccountId(defaultAccount.id);
        } else if (result.data.length > 0) {
          setSelectedBankAccountId(result.data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
    } finally {
      setIsLoadingBankAccounts(false);
    }
  };

  const fetchHostKyc = async () => {
    try {
      setIsLoadingKyc(true);
      const result = await getHostKycRequest();
      if (result.success && result.data) {
        setHostKyc(result.data);
      }
    } catch (error) {
      console.error("Error fetching KYC details:", error);
    } finally {
      setIsLoadingKyc(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const withdrawalAmount = parseFloat(amount);

    // Validation
    if (!withdrawalAmount || withdrawalAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (withdrawalAmount < 100) {
      toast.error("Minimum withdrawal amount is ₹100");
      return;
    }

    if (withdrawalAmount > maxAmount) {
      toast.error("Amount exceeds your wallet balance");
      return;
    }

    // For referrers, validate bank account selection
    if (userRole === "REFERRER" && !selectedBankAccountId) {
      toast.error("Please select a bank account");
      return;
    }

    try {
      setIsLoading(true);
      const result = await requestWithdrawal(
        withdrawalAmount,
        selectedBankAccountId
      );

      if (result.success) {
        toast.success("Withdrawal request submitted successfully", {
          description: `Your request for ₹${withdrawalAmount.toLocaleString()} has been submitted for admin approval.`,
        });
        onSuccess?.();
        onOpenChange(false);
        // Reset form
        setAmount("");
      } else {
        toast.error("Failed to submit withdrawal request", {
          description:
            result.error ||
            "Please try again or contact support if the problem persists.",
        });
      }
    } catch (error) {
      toast.error("Failed to submit withdrawal request", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    const regex = /^\d*\.?\d*$/;
    if (regex.test(value) || value === "") {
      setAmount(value);
    }
  };

  // Helper function to mask account number
  const maskAccountNumber = (accountNumber: string): string => {
    if (accountNumber.length <= 4) return accountNumber;
    const lastFour = accountNumber.slice(-4);
    const masked = "X".repeat(accountNumber.length - 4);
    return masked + lastFour;
  };

  const getSelectedBankAccount = () => {
    return bankAccounts.find((account) => account.id === selectedBankAccountId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Withdrawal</DialogTitle>
          <DialogDescription>
            Submit a withdrawal request from your wallet balance. All requests
            require admin approval and will be processed using your{" "}
            {userRole === "HOST" ? "KYC bank details" : "selected bank account"}
            .
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Wallet Balance Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(maxAmount)}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Minimum withdrawal: ₹100
              </p>
            </CardContent>
          </Card>

          {/* Withdrawal Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                ₹
              </span>
              <Input
                id="amount"
                type="text"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                className="pl-8"
                disabled={isLoading}
              />
            </div>
            {amount && parseFloat(amount) > 0 && (
              <p className="text-sm text-gray-500">
                You will receive: {formatCurrency(parseFloat(amount))}
              </p>
            )}
          </div>

          {/* Bank Account Selection for Referrers */}
          {userRole === "REFERRER" && (
            <div className="space-y-2">
              <Label htmlFor="bankAccount">Select Bank Account</Label>
              {isLoadingBankAccounts ? (
                <div className="h-10 bg-gray-100 animate-pulse rounded-md"></div>
              ) : bankAccounts.length === 0 ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You need to add a bank account before requesting a
                    withdrawal.
                  </AlertDescription>
                </Alert>
              ) : (
                <Select
                  value={selectedBankAccountId}
                  onValueChange={setSelectedBankAccountId}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.bankName} -{" "}
                        {maskAccountNumber(account.accountNumber)}
                        {account.isDefault ? " (Default)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Selected Bank Account Details for Referrers */}
          {userRole === "REFERRER" && selectedBankAccountId && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Selected Bank Account
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const account = getSelectedBankAccount();
                  if (!account) return null;

                  return (
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-medium">Bank:</span>{" "}
                        {account.bankName}
                      </div>
                      <div>
                        <span className="font-medium">Account Number:</span>{" "}
                        {maskAccountNumber(account.accountNumber)}
                      </div>
                      <div>
                        <span className="font-medium">IFSC:</span>{" "}
                        {account.ifscCode}
                      </div>
                      <div>
                        <span className="font-medium">Account Holder:</span>{" "}
                        {account.accountName}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Bank Details for Hosts */}
          {userRole === "HOST" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  KYC Bank Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingKyc ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-100 animate-pulse rounded-md w-3/4"></div>
                    <div className="h-4 bg-gray-100 animate-pulse rounded-md w-1/2"></div>
                    <div className="h-4 bg-gray-100 animate-pulse rounded-md w-2/3"></div>
                  </div>
                ) : hostKyc ? (
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="font-medium">Bank:</span>{" "}
                      {hostKyc.bankName}
                    </div>
                    <div>
                      <span className="font-medium">IFSC Code:</span>{" "}
                      {hostKyc.bankBranch}
                    </div>
                    <div>
                      <span className="font-medium">Account Number:</span>{" "}
                      {maskAccountNumber(hostKyc.accountNumber)}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    KYC details not found. Please complete your KYC
                    verification.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Processing Time:</strong> Withdrawal requests are
              typically processed within 1-3 business days after admin approval.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                !amount ||
                parseFloat(amount) < 100 ||
                parseFloat(amount) > maxAmount ||
                (userRole === "REFERRER" &&
                  (!selectedBankAccountId || bankAccounts.length === 0))
              }
            >
              {isLoading ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
