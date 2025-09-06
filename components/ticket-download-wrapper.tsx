"use client";

import { DownloadTicketButton } from "@/components/download-ticket-button";

interface TicketDownloadWrapperProps {
  ticketId: string;
  eventTitle: string;
}

export function TicketDownloadWrapper({
  ticketId,
  eventTitle,
}: TicketDownloadWrapperProps) {
  return <DownloadTicketButton ticketId={ticketId} eventTitle={eventTitle} />;
}
