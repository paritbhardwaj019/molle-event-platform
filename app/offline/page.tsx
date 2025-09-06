"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WifiOff, RefreshCw, Home } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OfflinePage() {
  const router = useRouter();

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-purple-200 dark:border-purple-800">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            You're Offline
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            It looks like you've lost your internet connection. Don't worry -
            you can still access some features of Molle while offline.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
                <Home className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                  Home Page
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-xs">
                  Access the main page and cached content
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                  Retry Connection
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-xs">
                  Check if your connection is restored
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <Button
              onClick={handleRetry}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>

            <Button
              onClick={handleGoHome}
              variant="outline"
              className="w-full border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
