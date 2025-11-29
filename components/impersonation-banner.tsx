"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Shield, X } from "lucide-react";

export function ImpersonationBanner() {
  const [isActive, setIsActive] = useState(false);
  const [impersonationData, setImpersonationData] = useState<any>(null);
  const [isStopping, setIsStopping] = useState(false);

  useEffect(() => {
    // Check impersonation status on mount
    fetch("/api/admin/impersonate/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.active) {
          setIsActive(true);
          setImpersonationData(data);
        }
      })
      .catch(() => {
        // Ignore errors
      });

    // Poll for changes every 5 seconds
    const interval = setInterval(() => {
      fetch("/api/admin/impersonate/status")
        .then((res) => res.json())
        .then((data) => {
          if (data.active) {
            setIsActive(true);
            setImpersonationData(data);
          } else {
            setIsActive(false);
            setImpersonationData(null);
          }
        })
        .catch(() => {
          // Ignore errors
        });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleStop = async () => {
    setIsStopping(true);

    try {
      const response = await fetch("/api/admin/impersonate/stop", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        setIsActive(false);
        setImpersonationData(null);

        // Reload page to refresh all data
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to stop impersonation:", error);
    } finally {
      setIsStopping(false);
    }
  };

  if (!isActive || !impersonationData) {
    return null;
  }

  return (
    <Alert className="border-orange-200 bg-orange-50 border-b-2">
      <Shield className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-orange-800">
            ⚠️ Admin Impersonation Active
          </span>
          <span className="text-orange-700">
            Viewing as user: {impersonationData.targetUserId}
          </span>
        </div>
        <Button
          onClick={handleStop}
          disabled={isStopping}
          variant="outline"
          size="sm"
          className="text-orange-700 border-orange-300 hover:bg-orange-100"
        >
          {isStopping ? "Stopping..." : "Stop Impersonation"}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
