"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { HostDashboard } from "@/components/dashboard/host-dashboard";
import { ReferrerDashboard } from "@/components/dashboard/referrer-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { UserDashboard } from "@/components/dashboard/user-dashboard";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Calendar,
  BookOpen,
  Plus,
  Eye,
  Heart,
  MessageCircle,
  Shield,
} from "lucide-react";

type HostMetrics = {
  totalEvents: number;
  totalBookings: number;
  totalRevenue: number;
  totalCustomers: number;
  totalReferrers: number;
  pendingInvites: number;
  revenueGrowth: number;
  customerGrowth: number;
};

type ReferrerMetrics = {
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  availableBalance: number;
  totalLinks: number;
  conversionRate: number;
  earningsGrowth: number;
};

type AdminMetrics = {
  totalUsers: number;
  totalHosts: number;
  totalReferrers: number;
  totalEvents: number;
  totalRevenue: number;
  pendingPayouts: number;
  userGrowth: number;
  revenueGrowth: number;
};

type DashboardMap = {
  HOST: {
    component: typeof HostDashboard;
    metrics: HostMetrics;
  };
  REFERRER: {
    component: typeof ReferrerDashboard;
    metrics: ReferrerMetrics;
  };
  ADMIN: {
    component: typeof AdminDashboard;
    metrics: AdminMetrics;
  };
  USER: {
    component: typeof UserDashboard;
    metrics: any;
  };
};

const dashboardComponents: Record<
  keyof DashboardMap,
  DashboardMap[keyof DashboardMap]["component"]
> = {
  HOST: HostDashboard,
  REFERRER: ReferrerDashboard,
  ADMIN: AdminDashboard,
  USER: UserDashboard,
};

export default function DashboardPage() {
  const { user, isLoading } = useLoggedInUser();
  const router = useRouter();
  const [metrics, setMetrics] = useState<any>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    if (user && !["HOST", "REFERRER", "ADMIN", "USER"].includes(user.role)) {
      router.push("/");
      return;
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    async function fetchMetrics() {
      if (!user || !user.role) return;

      try {
        setMetricsLoading(true);
        let endpoint = "";

        switch (user.role) {
          case "HOST":
            endpoint = "/api/dashboard/host-metrics";
            break;
          case "REFERRER":
            endpoint = "/api/dashboard/referrer-metrics";
            break;
          case "ADMIN":
            endpoint = "/api/dashboard/admin-metrics";
            break;
          case "USER":
            endpoint = "/api/dashboard/user-metrics";
            break;
          default:
            return;
        }

        const response = await fetch(endpoint, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error("Error fetching metrics:", error);
      } finally {
        setMetricsLoading(false);
      }
    }

    if (user) {
      fetchMetrics();
    }
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!["HOST", "REFERRER", "ADMIN", "USER"].includes(user.role)) {
    return null;
  }

  const role = user.role as keyof DashboardMap;
  const DashboardComponent = dashboardComponents[role];

  if (metricsLoading || !metrics) {
    return (
      <div className="p-6 space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <DashboardComponent metrics={metrics} />

      {/* Quick Access Section for Hosts */}
      {role === "HOST" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Your Events
              </CardTitle>
              <CardDescription>
                Manage your created events and create new ones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  You have {(metrics as HostMetrics).totalEvents} active events
                </span>
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm">
                  <Link href="/dashboard/events">
                    <Eye className="h-4 w-4 mr-2" />
                    View All Events
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/events">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Event Bookings
              </CardTitle>
              <CardDescription>
                View and manage bookings for your events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {(metrics as HostMetrics).totalBookings} total bookings across
                  all events
                </span>
              </div>
              <Button asChild size="sm" className="w-full">
                <Link href="/dashboard/bookings">
                  <BookOpen className="h-4 w-4 mr-2" />
                  View All Bookings
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Access Section for Admins */}
      {role === "ADMIN" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Platform Events
              </CardTitle>
              <CardDescription>
                View and manage all events across the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {(metrics as AdminMetrics).totalEvents} total events on
                  platform
                </span>
              </div>
              <Button asChild size="sm" className="w-full">
                <Link href="/dashboard/events">
                  <Eye className="h-4 w-4 mr-2" />
                  View All Events
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Platform Bookings
              </CardTitle>
              <CardDescription>
                View and manage all bookings across the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  All bookings across the platform
                </span>
              </div>
              <Button asChild size="sm" className="w-full">
                <Link href="/dashboard/bookings">
                  <BookOpen className="h-4 w-4 mr-2" />
                  View All Bookings
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
