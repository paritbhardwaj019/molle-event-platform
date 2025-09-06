"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ShoppingCart, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";

interface PricingTier {
  swipeCount: number;
  price: number;
  pricePerSwipe: number;
  popular: boolean;
  bestValue: boolean;
}

interface PurchaseSwipesDialogProps {
  onPurchase: (swipeCount: number) => Promise<void>;
  pricingTiers: PricingTier[];
}

export function PurchaseSwipesDialog({
  onPurchase,
  pricingTiers,
}: PurchaseSwipesDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async () => {
    if (!selectedTier) return;

    setIsProcessing(true);
    try {
      await onPurchase(selectedTier.swipeCount);
      setIsOpen(false);
      setSelectedTier(null);
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error("Failed to process purchase");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
          <ShoppingCart className="w-4 h-4 mr-2" />
          Get More Swipes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
            Purchase Additional Swipes
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Get more swipes to discover more people and increase your chances of
            finding matches!
          </p>

          <div className="space-y-3">
            {pricingTiers.map((tier) => (
              <Card
                key={tier.swipeCount}
                className={`cursor-pointer transition-all ${
                  selectedTier?.swipeCount === tier.swipeCount
                    ? "ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20"
                    : "hover:ring-1 hover:ring-purple-300"
                }`}
                onClick={() => setSelectedTier(tier)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {selectedTier?.swipeCount === tier.swipeCount && (
                        <Check className="w-4 h-4 text-purple-600" />
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">
                            {tier.swipeCount} Swipes
                          </span>
                          {tier.popular && (
                            <Badge variant="secondary" className="text-xs">
                              Popular
                            </Badge>
                          )}
                          {tier.bestValue && (
                            <Badge variant="default" className="text-xs">
                              Best Value
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          ₹{tier.pricePerSwipe.toFixed(2)} per swipe
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">₹{tier.price}</div>
                      <div className="text-xs text-gray-500">
                        Save ₹
                        {Math.round(
                          (tier.pricePerSwipe - tier.price / tier.swipeCount) *
                            tier.swipeCount
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={!selectedTier || isProcessing}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isProcessing ? "Processing..." : "Purchase"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
