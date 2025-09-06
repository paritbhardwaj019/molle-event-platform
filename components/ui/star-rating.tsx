"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  showValue?: boolean;
  className?: string;
}

export function StarRating({
  rating,
  onRatingChange,
  size = "md",
  readonly = false,
  showValue = false,
  className,
}: StarRatingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const handleStarClick = (starValue: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starValue);
    }
  };

  const handleStarHover = (starValue: number) => {
    // Could implement hover preview here if needed
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((starValue) => (
          <button
            key={starValue}
            type="button"
            onClick={() => handleStarClick(starValue)}
            onMouseEnter={() => handleStarHover(starValue)}
            disabled={readonly}
            className={cn(
              "transition-colors",
              !readonly && "hover:scale-110 cursor-pointer",
              readonly && "cursor-default"
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                starValue <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300",
                !readonly && "hover:text-yellow-400"
              )}
            />
          </button>
        ))}
      </div>
      {showValue && (
        <span className="text-sm text-gray-600 ml-1">
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  );
}
