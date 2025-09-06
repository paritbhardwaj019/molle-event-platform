"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { BookingsTable } from "@/components/bookings/bookings-table";
import { PageHeader } from "@/components/layout/page-header";
import { BookingStats } from "@/components/bookings/booking-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

export default function BookingsPage() {
  const router = useRouter();
  const { user, isLoading } = useLoggedInUser();

  useEffect(() => {
    if (!isLoading && user && user.role !== "HOST" && user.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return null;
  }

  if (!user || (user.role !== "HOST" && user.role !== "ADMIN")) {
    return null;
  }

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title="Bookings"
        description="View and manage all event bookings and transactions."
      />
      {user.role === "ADMIN" && user.adminWallet !== undefined && (
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Admin Wallet Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPrice(user.adminWallet)}
            </div>
          </CardContent>
        </Card>
      )}
      <BookingStats />
      <BookingsTable />
    </div>
  );
}
