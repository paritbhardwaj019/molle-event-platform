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
import {
  requestWithdrawal,
  getUserBankDetails,
  type BankDetails,
} from "@/lib/actions/payout";
import { CreditCard, Phone, User, Building, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WithdrawalRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  maxAmount: number;
}

export function WithdrawalRequestDialog({
  open,
  onOpenChange,
  onSuccess,
  maxAmount,
}: WithdrawalRequestDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBankDetails, setIsLoadingBankDetails] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    accountNumber: "",
    ifscCode: "",
    accountName: "",
    phone: "",
  });

  useEffect(() => {
    if (open) {
      fetchBankDetails();
    }
  }, [open]);

  const fetchBankDetails = async () => {
    try {
      setIsLoadingBankDetails(true);
      const result = await getUserBankDetails();
      if (result.success && result.data) {
        setBankDetails(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch bank details:", error);
    } finally {
      setIsLoadingBankDetails(false);
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

    if (
      !bankDetails.accountNumber ||
      !bankDetails.ifscCode ||
      !bankDetails.accountName ||
      !bankDetails.phone
    ) {
      toast.error("Please fill in all bank details");
      return;
    }

    // Validate IFSC code format (basic validation)
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(bankDetails.ifscCode.toUpperCase())) {
      toast.error("Please enter a valid IFSC code");
      return;
    }

    // Validate phone number (basic validation for Indian numbers)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(bankDetails.phone)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    try {
      setIsLoading(true);
      const result = await requestWithdrawal(withdrawalAmount, {
        ...bankDetails,
        ifscCode: bankDetails.ifscCode.toUpperCase(),
      });

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

  const handleBankDetailsChange = (field: keyof BankDetails, value: string) => {
    setBankDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Withdrawal</DialogTitle>
          <DialogDescription>
            Submit a withdrawal request from your wallet balance. All requests
            require admin approval.
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

          <Separator />

          {/* Bank Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-semibold">Bank Details</h3>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please ensure your bank details are correct. Incorrect details
                may cause delays in processing your withdrawal.
              </AlertDescription>
            </Alert>

            {isLoadingBankDetails ? (
              <div className="space-y-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Holder Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="accountName"
                      type="text"
                      value={bankDetails.accountName}
                      onChange={(e) =>
                        handleBankDetailsChange("accountName", e.target.value)
                      }
                      placeholder="Full name as per bank account"
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Mobile Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={bankDetails.phone}
                      onChange={(e) =>
                        handleBankDetailsChange("phone", e.target.value)
                      }
                      placeholder="10-digit mobile number"
                      className="pl-10"
                      maxLength={10}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="accountNumber"
                      type="text"
                      value={bankDetails.accountNumber}
                      onChange={(e) =>
                        handleBankDetailsChange("accountNumber", e.target.value)
                      }
                      placeholder="Bank account number"
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    type="text"
                    value={bankDetails.ifscCode}
                    onChange={(e) =>
                      handleBankDetailsChange(
                        "ifscCode",
                        e.target.value.toUpperCase()
                      )
                    }
                    placeholder="ABCD0123456"
                    maxLength={11}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500">
                    11-character IFSC code of your bank branch
                  </p>
                </div>
              </div>
            )}
          </div>

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
                parseFloat(amount) > maxAmount
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
