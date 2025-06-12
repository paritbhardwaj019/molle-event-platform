"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { toast } from "sonner";
import { getUserReferrals } from "@/lib/actions/referral";
import { Badge } from "@/components/ui/badge";

interface Referral {
  id: string;
  commission: number;
  isPaid: boolean;
  createdAt: Date;
  customer: {
    name: string;
    email: string;
  };
  event: {
    title: string;
    slug: string;
  } | null;
}

export function ReferralsTable() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const result = await getUserReferrals();
        if (result.success && result.data) {
          setReferrals(result.data);
        } else {
          toast.error(result.error || "Failed to fetch referrals");
        }
      } catch (error) {
        console.error("Failed to fetch referrals:", error);
        toast.error("An error occurred while fetching referrals");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReferrals();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead>Event</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Given At</TableHead>
              <TableHead>Customer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-48" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-100 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-gray-50">
            <TableHead>Event</TableHead>
            <TableHead>Commission</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Given At</TableHead>
            <TableHead>Customer</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {referrals.map((referral) => (
            <TableRow key={referral.id}>
              <TableCell>
                {referral.event ? (
                  <Link
                    href={`/events/${referral.event.slug}`}
                    className="text-primary hover:underline"
                  >
                    {referral.event.title}
                  </Link>
                ) : (
                  <span className="text-gray-500">Event Deleted</span>
                )}
              </TableCell>
              <TableCell>
                <span className="font-medium">
                  {formatCurrency(referral.commission)}
                </span>
              </TableCell>
              <TableCell>
                <Badge
                  variant={referral.isPaid ? "default" : "secondary"}
                  className="font-medium"
                >
                  {referral.isPaid ? "Paid" : "Unpaid"}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(referral.createdAt), "MMM d, yyyy HH:mm")}
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{referral.customer.name}</p>
                  <p className="text-sm text-gray-500">
                    {referral.customer.email}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
