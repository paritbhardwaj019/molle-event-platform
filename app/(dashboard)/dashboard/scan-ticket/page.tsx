"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { getTicketByQrCode } from "@/lib/actions/ticket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  QrCode,
  CheckCircle,
  XCircle,
  User,
  Phone,
  Calendar,
  MapPin,
  Camera,
  Upload,
  StopCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import QrScanner from "qr-scanner";
import jsQR from "jsqr";

interface TicketData {
  id: string;
  ticketNumber: string;
  qrCode: string;
  status: string;
  fullName: string;
  age: number;
  phoneNumber: string;
  ticketPrice: number | any;
  verifiedAt: Date | null;
  verifiedBy: string | null;
  createdAt: Date;
  event: {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    location: string;
    city?: string;
    landmark?: string;
    streetAddress?: string;
    coverImage: string;
    organizerName: string;
  };
  package: {
    id: string;
    name: string;
    description: string | null;
    benefits: string[];
  };
  booking: {
    id: string;
    bookingNumber: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function ScanTicketPage() {
  const [qrCode, setQrCode] = useState("");
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState("manual");

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  const handleScanTicket = async (scannedCode?: string) => {
    const codeToScan = scannedCode || qrCode.trim();
    if (!codeToScan) {
      toast.error("Please enter a QR code");
      return;
    }

    setLoading(true);
    try {
      const result = await getTicketByQrCode(codeToScan);
      if (result.error) {
        toast.error(result.error);
        setTicket(null);
      } else {
        setTicket(result.data as TicketData);
        setQrCode(codeToScan);

        // Scroll to ticket details
        setTimeout(() => {
          document.getElementById("ticket-details")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);
      }
    } catch (error) {
      toast.error("Failed to fetch ticket details");
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  const startScanning = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      setIsScanning(true);

      if (!QrScanner.hasCamera()) {
        toast.error("No camera found on this device");
        setIsScanning(false);
        return;
      }

      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          if (result?.data) {
            // Stop scanning immediately when a QR code is detected
            if (qrScannerRef.current) {
              qrScannerRef.current.stop();
              qrScannerRef.current.destroy();
              qrScannerRef.current = null;
            }
            setIsScanning(false);

            toast.success("QR Code detected!", {
              description: "Scroll down to see the ticket details",
            });
            handleScanTicket(result.data);
          }
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: "environment",
        }
      );

      await qrScannerRef.current.start();
    } catch (error: any) {
      console.error("Error starting camera:", error);
      let errorMessage = "Failed to start camera.";

      if (error.name === "NotAllowedError") {
        errorMessage =
          "Camera permission denied. Please allow camera access and try again.";
      } else if (error.name === "NotFoundError") {
        errorMessage = "No camera found on this device.";
      } else if (error.name === "NotSupportedError") {
        errorMessage = "Camera not supported on this device.";
      } else if (error.name === "NotReadableError") {
        errorMessage = "Camera is already in use by another application.";
      }

      toast.error(errorMessage);
      setIsScanning(false);
    }
  }, []);

  const stopScanning = useCallback(() => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Stop scanning if it's active
      if (isScanning) {
        stopScanning();
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      setLoading(true);
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);

          const imageData = ctx?.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );
          if (imageData) {
            const code = jsQR(
              imageData.data,
              imageData.width,
              imageData.height
            );
            if (code) {
              handleScanTicket(code.data);
            } else {
              toast.error("No QR code found in the image");
              setLoading(false);
            }
          }
        };

        img.onerror = () => {
          toast.error("Failed to load image");
          setLoading(false);
        };

        img.src = URL.createObjectURL(file);
      } catch (error) {
        console.error("Error processing image:", error);
        toast.error("Failed to process image");
        setLoading(false);
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  // Stop scanning when tab changes
  useEffect(() => {
    if (activeTab !== "camera" && isScanning) {
      stopScanning();
    }
  }, [activeTab, isScanning, stopScanning]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-blue-100 text-blue-800";
      case "VERIFIED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <QrCode className="h-10 w-10 sm:h-12 sm:w-12 text-purple-600 mx-auto mb-3 sm:mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Ticket Scanner
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Scan or enter QR code to verify event tickets
          </p>
        </div>

        <Card className="mb-6 sm:mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">Scan QR Code</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6">
                <TabsTrigger value="manual" className="text-xs sm:text-sm">
                  Manual Entry
                </TabsTrigger>
                <TabsTrigger value="camera" className="text-xs sm:text-sm">
                  Camera Scan
                </TabsTrigger>
                <TabsTrigger value="upload" className="text-xs sm:text-sm">
                  Upload Image
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Input
                    placeholder="Enter QR code manually"
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                    className="flex-1 h-11 sm:h-10"
                  />
                  <Button
                    onClick={() => handleScanTicket()}
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700 h-11 sm:h-10 w-full sm:w-auto"
                  >
                    {loading ? "Scanning..." : "Scan Ticket"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="camera" className="space-y-4">
                <div className="space-y-4">
                  {!isScanning ? (
                    <Button
                      onClick={startScanning}
                      className="w-full bg-green-600 hover:bg-green-700 h-12 sm:h-11"
                      size="lg"
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      Start Camera Scan
                    </Button>
                  ) : (
                    <Button
                      onClick={stopScanning}
                      variant="destructive"
                      className="w-full h-12 sm:h-11"
                      size="lg"
                    >
                      <StopCircle className="h-5 w-5 mr-2" />
                      Stop Scanning
                    </Button>
                  )}

                  <div className="relative flex justify-center">
                    <video
                      ref={videoRef}
                      className={`w-full max-w-sm sm:max-w-md rounded-lg border-2 border-gray-200 ${
                        isScanning ? "block" : "hidden"
                      }`}
                      style={{ aspectRatio: "1/1", maxHeight: "350px" }}
                      playsInline
                      muted
                    />
                    {!isScanning && (
                      <div className="w-full max-w-sm sm:max-w-md aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <div className="text-center p-4">
                          <Camera className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 text-xs sm:text-sm">
                            Camera preview will appear here. Make sure to allow
                            camera permissions.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {isScanning && (
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">
                        📱 Point your camera at the QR code
                      </p>
                      <p className="text-xs text-gray-500">
                        The QR code will be scanned automatically when detected
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="upload" className="space-y-4">
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center hover:border-blue-400 transition-colors">
                    <Upload className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 hover:bg-blue-700 mb-4 h-11 sm:h-10"
                      size="lg"
                      disabled={loading}
                    >
                      <Upload className="h-5 w-5 mr-2" />
                      {loading ? "Processing Image..." : "Choose Image File"}
                    </Button>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Select an image containing a QR code from your device
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Supports: JPG, PNG, GIF, WebP
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Ticket Details */}
        {ticket && (
          <Card className="mb-6 sm:mb-8" id="ticket-details">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div>
                  <CardTitle className="text-lg sm:text-xl mb-2">
                    {ticket.event.title}
                  </CardTitle>
                  <Badge className={getStatusColor(ticket.status)}>
                    {ticket.status}
                  </Badge>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm text-gray-500">Ticket #</p>
                  <p className="font-mono text-sm font-medium">
                    {ticket.ticketNumber}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ticket Holder Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Ticket Holder Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="font-medium truncate">
                          {ticket.fullName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 text-gray-400 flex items-center justify-center flex-shrink-0">
                        #
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Age</p>
                        <p className="font-medium">{ticket.age} years</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium truncate">
                          {ticket.phoneNumber}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Event Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-500">Event Date</p>
                        <p className="font-medium text-sm sm:text-base">
                          {format(
                            new Date(ticket.event.startDate),
                            "PPP 'at' p"
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-500">Location</p>
                        {(ticket.event as any).streetAddress ? (
                          <div>
                            <p className="font-medium">
                              {(ticket.event as any).streetAddress}
                            </p>
                            {(ticket.event as any).city && (
                              <p className="text-sm text-gray-600">
                                {(ticket.event as any).city}
                              </p>
                            )}
                            {(ticket.event as any).landmark && (
                              <p className="text-xs text-gray-500 mt-1">
                                Near: {(ticket.event as any).landmark}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="font-medium truncate">
                            {ticket.event.location}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 text-gray-400 flex items-center justify-center flex-shrink-0">
                        ₹
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Ticket Price</p>
                        <p className="font-medium">
                          ₹{Number(ticket.ticketPrice)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Package Details */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Package: {ticket.package.name}
                </h3>
                {ticket.package.description && (
                  <p className="text-gray-600 mb-3 text-sm sm:text-base">
                    {ticket.package.description}
                  </p>
                )}
                {ticket.package.benefits &&
                  ticket.package.benefits.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ticket.package.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0" />
                          <span className="text-sm text-gray-700">
                            {benefit}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              {/* Verification Status */}
              {ticket.status === "VERIFIED" && ticket.verifiedAt && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <h3 className="font-semibold text-green-800">
                        Ticket Already Verified
                      </h3>
                    </div>
                    <p className="text-sm text-green-700">
                      This ticket was verified on{" "}
                      {format(new Date(ticket.verifiedAt), "PPP 'at' p")}
                    </p>
                  </div>
                </div>
              )}

              {/* Cancelled Status */}
              {ticket.status === "CANCELLED" && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                      <h3 className="font-semibold text-red-800">
                        Ticket Cancelled
                      </h3>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      This ticket has been cancelled and cannot be used for
                      entry.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
