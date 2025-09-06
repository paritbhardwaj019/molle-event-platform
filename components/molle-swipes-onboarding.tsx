"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Users, MapPin, Sparkles } from "lucide-react";

interface MolleSwipesOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MolleSwipesOnboarding({
  isOpen,
  onClose,
}: MolleSwipesOnboardingProps) {
  const { isAuthenticated, isLoading } = useLoggedInUser();
  const router = useRouter();

  const handleContinue = () => {
    if (isAuthenticated) {
      router.push("/dashboard/social/discover");
    } else {
      router.push("/login");
    }
    onClose();
  };

  const features = [
    {
      icon: Heart,
      title: "Find Your Match",
      description: "Discover people with shared interests and values",
    },
    {
      icon: MapPin,
      title: "Local Connections",
      description: "Connect with people in your city and nearby areas",
    },
    {
      icon: Users,
      title: "Build Community",
      description: "Join events and meet new friends in real life",
    },
    {
      icon: Sparkles,
      title: "Smart Matching",
      description: "AI-powered compatibility for better connections",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 border-purple-200 dark:border-purple-800">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Welcome to Molle Swipes
          </DialogTitle>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            Discover amazing people, build meaningful connections, and join
            exciting events in your area.
          </p>
        </DialogHeader>

        <div className="space-y-4 my-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <IconComponent className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-xs">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Continue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
