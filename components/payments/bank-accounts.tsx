"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Check, Trash2, CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getUserBankAccounts,
  addBankAccount,
  setDefaultBankAccount,
  deleteBankAccount,
  type BankAccount,
  type BankAccountFormData,
} from "@/lib/actions/bank-account";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function BankAccounts() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<BankAccountFormData>({
    accountNumber: "",
    ifscCode: "",
    accountName: "",
    bankName: "",
    isDefault: false,
  });

  const fetchBankAccounts = async () => {
    try {
      setIsLoading(true);
      const result = await getUserBankAccounts();
      if (result.success && result.data) {
        setBankAccounts(result.data);
      } else {
        toast.error("Failed to load bank accounts");
      }
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
      toast.error("Failed to load bank accounts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const handleInputChange = (
    field: keyof BankAccountFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await addBankAccount(formData);
      if (result.success) {
        toast.success("Bank account added successfully");
        setIsAddDialogOpen(false);
        setFormData({
          accountNumber: "",
          ifscCode: "",
          accountName: "",
          bankName: "",
          isDefault: false,
        });
        fetchBankAccounts();
      } else {
        toast.error(result.error || "Failed to add bank account");
      }
    } catch (error) {
      console.error("Error adding bank account:", error);
      toast.error("Failed to add bank account");
    }
  };

  const handleSetDefault = async (accountId: string) => {
    try {
      const result = await setDefaultBankAccount(accountId);
      if (result.success) {
        toast.success("Default bank account updated");
        fetchBankAccounts();
      } else {
        toast.error(result.error || "Failed to update default bank account");
      }
    } catch (error) {
      console.error("Error setting default bank account:", error);
      toast.error("Failed to update default bank account");
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      setIsDeleting(true);
      const result = await deleteBankAccount(accountId);
      if (result.success) {
        toast.success("Bank account deleted successfully");
        fetchBankAccounts();
      } else {
        toast.error(result.error || "Failed to delete bank account");
      }
    } catch (error) {
      console.error("Error deleting bank account:", error);
      toast.error("Failed to delete bank account");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Bank Accounts</CardTitle>
          <CardDescription>
            Manage your bank accounts for withdrawals
          </CardDescription>
        </div>
        <Button
          size="sm"
          onClick={() => setIsAddDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Add Account
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-16 bg-gray-100 animate-pulse rounded-md"></div>
            <div className="h-16 bg-gray-100 animate-pulse rounded-md"></div>
          </div>
        ) : bankAccounts.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="font-medium text-lg mb-2">No Bank Accounts</h3>
            <p className="text-gray-500 mb-4">
              Add a bank account to receive withdrawal payments
            </p>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="flex items-center gap-2 mx-auto"
            >
              <PlusCircle className="h-4 w-4" />
              Add Your First Account
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {bankAccounts.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Withdrawals will be sent to your default bank account. You can
                  change your default account at any time.
                </AlertDescription>
              </Alert>
            )}
            <div className="divide-y">
              {bankAccounts.map((account) => (
                <div
                  key={account.id}
                  className="py-4 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{account.bankName}</span>
                      {account.isDefault && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {account.accountName} •{" "}
                      {maskAccountNumber(account.accountNumber)}
                    </div>
                    <div className="text-xs text-gray-400">
                      IFSC: {account.ifscCode}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!account.isDefault && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetDefault(account.id)}
                        disabled={isDeleting}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Set Default
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteAccount(account.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Add Bank Account Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Bank Account</DialogTitle>
            <DialogDescription>
              Add a new bank account for receiving withdrawal payments
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddAccount} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Holder Name</Label>
              <Input
                id="accountName"
                value={formData.accountName}
                onChange={(e) =>
                  handleInputChange("accountName", e.target.value)
                }
                placeholder="Enter account holder name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e) =>
                  handleInputChange("accountNumber", e.target.value)
                }
                placeholder="Enter account number"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ifscCode">IFSC Code</Label>
              <Input
                id="ifscCode"
                value={formData.ifscCode}
                onChange={(e) => handleInputChange("ifscCode", e.target.value)}
                placeholder="Enter IFSC code"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={formData.bankName}
                onChange={(e) => handleInputChange("bankName", e.target.value)}
                placeholder="Enter bank name"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) =>
                  handleInputChange("isDefault", checked === true)
                }
              />
              <Label htmlFor="isDefault" className="cursor-pointer">
                Set as default account
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Account</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Helper function to mask account number
function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber;
  const lastFour = accountNumber.slice(-4);
  const masked = "X".repeat(accountNumber.length - 4);
  return masked + lastFour;
}
