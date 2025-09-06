"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/ui/star-rating";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { createReview } from "@/lib/actions/review";
import { Loader2 } from "lucide-react";
import {
  ReviewImageUpload,
  ReviewImage,
} from "@/lib/components/review-image-upload";

interface ReviewFormProps {
  eventId: string;
  onReviewSubmitted?: () => void;
}

export function ReviewForm({ eventId, onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<ReviewImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (comment.length > 200) {
      toast.error("Review comment must be 200 characters or less");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createReview({
        rating,
        comment: comment.trim() || undefined,
        media: images.length > 0 ? images : undefined,
        eventId,
      });

      if (result.success) {
        toast.success("Review submitted successfully!");
        setRating(0);
        setComment("");
        setImages([]);
        onReviewSubmitted?.();
      } else {
        toast.error(result.error || "Failed to submit review");
      }
    } catch (error) {
      toast.error("An error occurred while submitting your review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Leave a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Rating *
            </label>
            <StarRating
              rating={rating}
              onRatingChange={setRating}
              size="lg"
              className="mb-1"
            />
            <p className="text-xs text-gray-400">Click a star to rate</p>
          </div>

          <div>
            <label
              htmlFor="comment"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Review (optional)
            </label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-gray-400 mt-1">
              {comment.length}/200 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Photos (optional)
            </label>
            <ReviewImageUpload
              images={images}
              onImagesChange={setImages}
              maxImages={3}
              cloudinaryConfig={{
                cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
                uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
                folder: "review-images",
              }}
              uploadOptions={{
                quality: "auto",
              }}
            />
            <p className="text-xs text-gray-400 mt-1">
              Upload up to 3 photos to share with your review
            </p>
          </div>

          <Button
            type="submit"
            disabled={rating === 0 || isSubmitting}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
