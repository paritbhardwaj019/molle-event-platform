"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Shield,
  Heart,
  Users,
  AlertTriangle,
  MessageCircle,
  Eye,
} from "lucide-react";

interface CommunityGuidelinesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
  title?: string;
}

export function CommunityGuidelinesDialog({
  open,
  onOpenChange,
  onAccept,
  title = "Community Guidelines",
}: CommunityGuidelinesDialogProps) {
  const [hasAccepted, setHasAccepted] = useState(false);

  const handleAccept = () => {
    onAccept();
    onOpenChange(false);
  };

  const guidelines = [
    {
      icon: Heart,
      title: "Be Respectful",
      description:
        "Treat everyone with kindness and respect. No harassment, hate speech, or discriminatory language.",
      color: "text-pink-600 dark:text-pink-400",
      bgColor: "bg-pink-100 dark:bg-pink-900/20",
    },
    {
      icon: Shield,
      title: "Stay Safe",
      description:
        "Never share personal information like your address, phone number, or financial details. Meet in public places.",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      icon: Users,
      title: "Be Authentic",
      description:
        "Use real photos and honest information about yourself. Fake profiles and catfishing are not allowed.",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      icon: MessageCircle,
      title: "Appropriate Communication",
      description:
        "Keep conversations friendly and appropriate. No sexual content, spam, or unwanted advances.",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      icon: Eye,
      title: "Report Violations",
      description:
        "If someone makes you uncomfortable or violates these guidelines, report them immediately.",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
    {
      icon: AlertTriangle,
      title: "Zero Tolerance",
      description:
        "We have zero tolerance for threatening behavior, illegal activities, or attempts to harm others.",
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900/20",
    },
  ];

  const safetyTips = [
    "Trust your instincts - if something feels wrong, it probably is",
    "Meet in public places for the first few meetings",
    "Tell a friend or family member about your plans",
    "Don't share personal or financial information",
    "Never send money or gifts to someone you've only met online",
    "Video chat before meeting in person to verify identity",
    "Block and report users who make you uncomfortable",
    "Use the in-app messaging until you feel comfortable sharing contact info",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Shield className="w-5 h-5 mr-2 text-blue-600" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Introduction */}
            <div className="text-center space-y-2 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Welcome to Our Community!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                We're committed to creating a safe, respectful, and positive
                environment for everyone. Please read and follow these
                guidelines to help us maintain our community standards.
              </p>
            </div>

            {/* Guidelines */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Community Guidelines
              </h4>
              {guidelines.map((guideline, index) => {
                const IconComponent = guideline.icon;
                return (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div
                      className={`p-2 rounded-full ${guideline.bgColor} flex-shrink-0`}
                    >
                      <IconComponent className={`w-4 h-4 ${guideline.color}`} />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                        {guideline.title}
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {guideline.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Safety Tips */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <Shield className="w-4 h-4 mr-2 text-green-600" />
                Safety Tips
              </h4>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <ul className="space-y-2">
                  {safetyTips.map((tip, index) => (
                    <li
                      key={index}
                      className="flex items-start space-x-2 text-sm"
                    >
                      <span className="text-green-600 dark:text-green-400 mt-1">
                        •
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {tip}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Consequences */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />
                Violations & Consequences
              </h4>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  Violating these guidelines may result in:
                </p>
                <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <li>• Warning and temporary restrictions</li>
                  <li>• Temporary suspension of account</li>
                  <li>• Permanent ban from the platform</li>
                  <li>
                    • Reporting to law enforcement (for illegal activities)
                  </li>
                </ul>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Need Help?
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                If you experience any issues or need to report someone, use the
                report feature in the app or contact our support team. We take
                all reports seriously and investigate them promptly.
              </p>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
          <div className="flex items-center space-x-2 sm:mr-auto">
            <Checkbox
              id="accept-guidelines"
              checked={hasAccepted}
              onCheckedChange={(checked) => setHasAccepted(checked === true)}
            />
            <label
              htmlFor="accept-guidelines"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I agree to follow these community guidelines
            </label>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!hasAccepted}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Accept & Continue
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
