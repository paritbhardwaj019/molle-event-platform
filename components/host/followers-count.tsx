"use client";

import { useState, useEffect } from "react";
import { getFollowersCount } from "@/lib/actions/follow";

interface FollowersCountProps {
  hostId: string;
}

export function FollowersCount({ hostId }: FollowersCountProps) {
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCount() {
      try {
        const result = await getFollowersCount(hostId);
        if (result.success && result.data) {
          setCount(result.data.count);
        }
      } catch (error) {
        console.error("Error fetching followers count:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCount();
  }, [hostId]);

  if (isLoading) {
    return <span className="text-2xl font-bold text-gray-900">-</span>;
  }

  return <span className="text-2xl font-bold text-gray-900">{count}</span>;
}
