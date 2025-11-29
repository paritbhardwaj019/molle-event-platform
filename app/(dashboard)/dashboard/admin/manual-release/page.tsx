"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface ReleaseResult {
  success: boolean;
  message: string;
  bookingId?: string;
  ticketCount?: number;
}

export default function ManualReleasePage() {
  const router = useRouter();
  const { user, isLoading } = useLoggedInUser();
  const [webhookPayload, setWebhookPayload] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ReleaseResult | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user && user.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  const validateJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      setJsonError(null);
      return parsed;
    } catch (error) {
      setJsonError("Invalid JSON format");
      return null;
    }
  };

  const handlePayloadChange = (value: string) => {
    setWebhookPayload(value);
    setResult(null);

    if (value.trim()) {
      validateJson(value);
    } else {
      setJsonError(null);
    }
  };

  const handleReleaseTickets = async () => {
    if (!webhookPayload.trim()) {
      setResult({
        success: false,
        message: "Please paste the webhook payload",
      });
      return;
    }

    const parsedPayload = validateJson(webhookPayload);
    if (!parsedPayload) {
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/manual-release", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payload: parsedPayload }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          bookingId: data.bookingId,
          ticketCount: data.ticketCount,
        });
        setWebhookPayload(""); // Clear the form on success
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to release tickets",
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Network error. Please try again.",
      });
    } finally {
      setIsProcessing(false);
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
        title="Manual Ticket Release"
        description="Manually release tickets by processing webhook payloads from payment gateways."
      />

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Webhook Payload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-payload">
              Paste the webhook JSON payload below:
            </Label>
            <Textarea
              id="webhook-payload"
              placeholder="Paste the webhook payload here..."
              value={webhookPayload}
              onChange={(e) => handlePayloadChange(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
              disabled={isProcessing}
            />
            {jsonError && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{jsonError}</AlertDescription>
              </Alert>
            )}
          </div>

          <Button
            onClick={handleReleaseTickets}
            disabled={isProcessing || !!jsonError || !webhookPayload.trim()}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Release Tickets"
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Alert variant={result.success ? "default" : "destructive"}>
          {result.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            {result.success ? (
              <div className="space-y-1">
                <div className="font-medium text-green-800">
                  ✅ {result.message}
                </div>
                {result.bookingId && (
                  <div className="text-sm text-green-700">
                    Booking ID: {result.bookingId}
                  </div>
                )}
                {result.ticketCount !== undefined && (
                  <div className="text-sm text-green-700">
                    Total Tickets: {result.ticketCount}
                  </div>
                )}
              </div>
            ) : (
              <div className="font-medium text-red-800">
                ❌ {result.message}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-900">How to Use</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              Copy the webhook payload from your payment gateway (Cashfree,
              Razorpay, etc.)
            </li>
            <li>Paste it into the text area above</li>
            <li>
              Click "Release Tickets" to process the payment and create tickets
            </li>
            <li>
              The system will find the booking using the order_id and confirm it
            </li>
            <li>
              Tickets will be automatically created (even for already confirmed
              bookings)
            </li>
            <li>
              Perfect for fixing missing tickets or reprocessing failed webhooks
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
