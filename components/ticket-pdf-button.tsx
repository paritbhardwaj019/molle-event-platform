"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Ticket } from "@/lib/actions/ticket";

interface TicketPdfButtonProps {
  ticket: Ticket;
  ticketId: string;
}

export function TicketPdfButton({ ticket, ticketId }: TicketPdfButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const downloadTicketPdf = async () => {
    setIsLoading(true);
    try {
      // Open the ticket page in a new window
      const ticketWindow = window.open(`/tickets/${ticketId}`, "_blank");

      // Wait for the ticket window to load
      if (!ticketWindow) {
        throw new Error("Popup blocked. Please allow popups for this site.");
      }

      await new Promise((resolve) => {
        ticketWindow.onload = resolve;
      });

      // Wait a bit for all content to render
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Capture the ticket content
      const ticketElement = ticketWindow.document.querySelector(
        ".bg-white.rounded-2xl"
      );
      if (!ticketElement) {
        throw new Error("Ticket element not found");
      }

      const canvas = await html2canvas(ticketElement as HTMLElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${ticket.event.title}-ticket.pdf`);

      // Close the popup window
      ticketWindow.close();
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
      onClick={downloadTicketPdf}
      disabled={isLoading}
    >
      <Download className="h-4 w-4 mr-1" />
      {isLoading ? "Generating..." : "Download PDF"}
    </Button>
  );
}
