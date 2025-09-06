"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface DownloadTicketButtonProps {
  ticketId: string;
  eventTitle: string;
}

export function DownloadTicketButton({
  ticketId,
  eventTitle,
}: DownloadTicketButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const downloadTicket = async () => {
    setIsLoading(true);
    try {
      // Create a hidden iframe to load the ticket page
      const iframe = document.createElement("iframe");
      iframe.style.width = "1000px";
      iframe.style.height = "1200px";
      iframe.style.position = "absolute";
      iframe.style.left = "-9999px";
      document.body.appendChild(iframe);

      // Load the ticket page
      iframe.src = `/tickets/${ticketId}`;

      // Wait for the iframe to load
      await new Promise<void>((resolve) => {
        iframe.onload = () => resolve();
      });

      // Wait a bit for all content to render
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Get the ticket element from the iframe
      const ticketElement = iframe.contentDocument?.querySelector(
        ".bg-white.rounded-2xl"
      );
      if (!ticketElement) {
        throw new Error("Ticket element not found");
      }

      // Generate PDF
      const canvas = await html2canvas(ticketElement as HTMLElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${eventTitle}-ticket.pdf`);

      // Clean up
      document.body.removeChild(iframe);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={downloadTicket}
      disabled={isLoading}
    >
      <Download className="h-4 w-4 mr-1" />
      {isLoading ? "Generating..." : "Download PDF"}
    </Button>
  );
}
