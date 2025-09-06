"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { PushNotificationsTable } from "@/components/admin/push-notifications-table";
import { CreateNotificationDialog } from "@/components/admin/create-notification-dialog";
import { Button } from "@/components/ui/button";
import { Bell, Plus, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function PushNotificationsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState<string>("0");

  const handleNotificationSent = () => {
    setRefreshKey((prev) => String(Number(prev) + 1));
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-8 p-8">
      <PageHeader
        title="Push Notifications"
        subtitle="Send promotional notifications to users on their devices"
        action={
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Send Notification
          </Button>
        }
      />

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Push Notifications
            </CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PWA Ready</div>
            <p className="text-xs text-muted-foreground">
              Native notifications on mobile devices and PWA apps
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Target Audiences
            </CardTitle>
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4 Types</div>
            <p className="text-xs text-muted-foreground">
              Send to All Users, Hosts, Regular Users, or Referrers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Delivery Tracking
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Track delivery success rates and reach</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <div className="text-green-600">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Analytics</div>
            <p className="text-xs text-muted-foreground">
              Monitor success rates and device reach
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Instructions Card */}
      <Card className="border-blue-100 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            How Notifications Work
          </CardTitle>
          <CardDescription>
            Understanding the dual notification system and best practices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-white rounded-lg border border-blue-200">
            <h4 className="font-medium text-sm mb-2 text-blue-800">
              🔄 Dual Notification System
            </h4>
            <p className="text-sm text-gray-600 mb-2">
              Every notification creates both push notifications (for devices)
              and in-app notifications (visible in header bell).
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>
                • Push notifications reach active devices (FCM tokens from last
                30 days)
              </li>
              <li>• In-app notifications are created for all target users</li>
              <li>
                • Users see notifications in header even without push support
              </li>
              <li>
                • Links in notifications are clickable in the in-app dropdown
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">📱 Device Support</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• PWA apps (iOS/Android)</li>
                <li>• Desktop browsers</li>
                <li>• Mobile browsers (when allowed)</li>
                <li>• Active users in last 30 days</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">💡 Best Practices</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Keep titles under 60 characters</li>
                <li>• Messages should be under 200 characters</li>
                <li>• Use engaging images when possible</li>
                <li>• Include clear call-to-action links</li>
                <li>• Invalid tokens are automatically cleaned up</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Table */}
      <PushNotificationsTable key={refreshKey} />

      <CreateNotificationDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleNotificationSent}
      />
    </div>
  );
}
