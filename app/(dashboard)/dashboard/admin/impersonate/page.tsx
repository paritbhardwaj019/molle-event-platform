"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Shield, UserCheck, UserX } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

export default function ImpersonatePage() {
  const router = useRouter();
  const { user, isLoading } = useLoggedInUser();
  const [targetUserInput, setTargetUserInput] = useState("");
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentImpersonation, setCurrentImpersonation] = useState<any>(null);

  useEffect(() => {
    if (!isLoading && user && user.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  // Note: We don't check for active impersonation on mount since credentials are displayed inline

  const handleStart = async () => {
    setError("");
    setSuccess("");

    if (!targetUserInput.trim()) {
      setError("Please enter a user ID or email");
      return;
    }

    if (!reason.trim()) {
      setError("Please provide a reason for impersonation");
      return;
    }

    if (confirmation !== "CONFIRM") {
      setError('Please type "CONFIRM" to proceed');
      return;
    }

    setIsStarting(true);

    try {
      // Create impersonation and get demo credentials
      const startResponse = await fetch("/api/admin/impersonate/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          targetUserIdOrEmail: targetUserInput.trim(),
          reason: reason.trim(),
          expiresInMinutes: 15, // 15 minutes default
        }),
      });

      const startData = await startResponse.json();

      if (!startResponse.ok) {
        throw new Error(startData.error || "Failed to start impersonation");
      }

      setSuccess(`Demo credentials generated successfully!`);
      setCurrentImpersonation(startData.data);
      setTargetUserInput("");
      setReason("");
      setConfirmation("");
      setShowConfirmModal(false);
    } catch (err: any) {
      setError(err.message || "Failed to start impersonation");
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    setIsStopping(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/impersonate/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token: currentImpersonation?.token,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to stop impersonation");
      }

      setSuccess("Impersonation stopped. Temporary password revoked.");
      setCurrentImpersonation(null);
    } catch (err: any) {
      setError(err.message || "Failed to stop impersonation");
    } finally {
      setIsStopping(false);
    }
  };

  if (isLoading) {
    return null;
  }

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title="Admin Impersonation"
        description="Securely impersonate users to provide support"
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Impersonate User
            </CardTitle>
            <CardDescription>
              Start an impersonation session. All actions will be logged.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetUser">User ID or Email</Label>
              <Input
                id="targetUser"
                placeholder="user@example.com or user_id"
                value={targetUserInput}
                onChange={(e) => setTargetUserInput(e.target.value)}
                disabled={isStarting || !!currentImpersonation}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Customer support - investigating payment issue"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isStarting || !!currentImpersonation}
                rows={3}
              />
              <p className="text-sm text-gray-500">
                Required. This will be logged for audit purposes.
              </p>
            </div>

            <Button
              onClick={() => setShowConfirmModal(true)}
              disabled={isStarting || !!currentImpersonation}
              className="w-full"
            >
              {isStarting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Start Impersonation
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {showConfirmModal && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-5 w-5" />
                Confirm Impersonation
              </CardTitle>
              <CardDescription className="text-yellow-700">
                This action will allow you to act as the target user. All
                actions will be audited and logged.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="confirmation">
                  Type <code className="font-mono font-bold">CONFIRM</code> to
                  proceed
                </Label>
                <Input
                  id="confirmation"
                  placeholder="CONFIRM"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  disabled={isStarting}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleStart}
                  disabled={isStarting || confirmation !== "CONFIRM"}
                  className="flex-1"
                  variant="default"
                >
                  Confirm & Start
                </Button>
                <Button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmation("");
                  }}
                  variant="outline"
                  disabled={isStarting}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentImpersonation && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <UserCheck className="h-5 w-5" />
                Demo Credentials
              </CardTitle>
              <CardDescription className="text-blue-700">
                Use these credentials to login as the target user
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Email</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white px-3 py-2 rounded border border-gray-200 text-sm font-mono">
                    {currentImpersonation.email}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(currentImpersonation.email);
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Password</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white px-3 py-2 rounded border border-gray-200 text-sm font-mono">
                    {currentImpersonation.password}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        currentImpersonation.password
                      );
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Expires At</p>
                <p className="text-sm text-gray-600">
                  {new Date(currentImpersonation.expiresAt).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleStop}
                  disabled={isStopping}
                  variant="destructive"
                  className="flex-1"
                >
                  {isStopping ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Stopping...
                    </>
                  ) : (
                    <>
                      <UserX className="mr-2 h-4 w-4" />
                      Revoke Access
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    window.open("/login", "_blank");
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Open Login
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="border-gray-200 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-base">Security Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>• Impersonation sessions are limited to 15 minutes</p>
          <p>• All actions are logged with your admin ID and timestamp</p>
          <p>• The target user may be notified via email (optional)</p>
          <p>• Tokens are stored in-memory and expire automatically</p>
          <p>• For multi-instance deployments, consider using Redis</p>
        </CardContent>
      </Card>
    </div>
  );
}
