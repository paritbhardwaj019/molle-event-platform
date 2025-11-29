import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateFees } from "@/lib/actions/settings";
import crypto from "crypto";

interface WebhookPayload {
  data?: {
    order?: {
      order_id?: string;
      order_amount?: number;
      order_currency?: string;
      order_tags?: {
        bid?: string;
        eid?: string;
        slug?: string;
        tkt?: string;
        uid?: string;
        upay?: string;
        aget?: string;
        hget?: string;
        rget?: string;
      };
    };
    payment?: {
      cf_payment_id?: number;
      payment_status?: string;
      payment_amount?: number;
      payment_currency?: string;
      payment_message?: string;
      payment_time?: string;
    };
    customer_details?: {
      customer_name?: string;
      customer_id?: string;
      customer_email?: string;
      customer_phone?: string;
    };
  };
  event_time?: string;
  type?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { payload } = body;

    if (!payload) {
      return NextResponse.json(
        { error: "Webhook payload is required" },
        { status: 400 }
      );
    }

    // Extract order information from payload
    const orderId = payload.data?.order?.order_id;
    const orderTags = payload.data?.order?.order_tags;
    const paymentStatus = payload.data?.payment?.payment_status;
    const customerDetails = payload.data?.customer_details;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID not found in payload" },
        { status: 400 }
      );
    }

    if (paymentStatus !== "SUCCESS") {
      return NextResponse.json(
        { error: "Payment status is not SUCCESS" },
        { status: 400 }
      );
    }

    // Find the booking by order_id (bookingNumber)
    const booking = await db.booking.findUnique({
      where: { bookingNumber: orderId },
      include: {
        user: true,
        event: {
          include: {
            packages: true,
            host: {
              select: {
                hostFeePercentage: true,
              },
            },
          },
        },
        payment: true,
        ticketData: true,
        tickets: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found for order ID: " + orderId },
        { status: 404 }
      );
    }

    // Debug logging
    console.log(`[ManualRelease] Found booking: ${booking.id}`);
    console.log(`[ManualRelease] Booking status: ${booking.status}`);
    console.log(`[ManualRelease] User email: ${booking.user.email}`);
    console.log(
      `[ManualRelease] Customer email: ${customerDetails?.customer_email}`
    );
    console.log(`[ManualRelease] Existing tickets: ${booking.tickets.length}`);

    // Check if booking is already confirmed and has tickets
    if (booking.status === "CONFIRMED" && booking.tickets.length > 0) {
      return NextResponse.json(
        {
          error: "Booking is already confirmed and tickets exist",
          bookingId: booking.id,
          ticketCount: booking.tickets.length,
        },
        { status: 400 }
      );
    }

    // Update payment status if payment exists
    if (booking.payment) {
      await db.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: "COMPLETED",
          cashfreePaymentId: payload.data?.payment?.cf_payment_id?.toString(),
        },
      });
    }

    // Update booking status to CONFIRMED (only if not already confirmed)
    if (booking.status !== "CONFIRMED") {
      await db.booking.update({
        where: { id: booking.id },
        data: {
          status: "CONFIRMED",
        },
      });
      console.log(
        `[ManualRelease] Updated booking ${booking.id} status to CONFIRMED`
      );
    }

    let ticketsCreated = 0;

    // Create tickets if they don't exist yet (either from ticketData or from order tags)
    if (booking.tickets.length === 0) {
      console.log(`[ManualRelease] Creating tickets for booking ${booking.id}`);
      try {
        let packageSelections = null;

        // Try to get ticket data from stored ticketData
        if (booking.ticketData) {
          packageSelections = booking.ticketData.data as any[];
          console.log(`[ManualRelease] Found ticketData:`, packageSelections);
        }

        // If no ticketData, create tickets from order tags and customer details
        if (!packageSelections || !Array.isArray(packageSelections)) {
          const ticketCount = parseInt(orderTags?.tkt || "1");
          const customerName =
            customerDetails?.customer_name || booking.user.name || "Unknown";
          const customerPhone =
            customerDetails?.customer_phone || booking.user.phone || "";

          console.log(
            `[ManualRelease] Creating fallback tickets: count=${ticketCount}, name=${customerName}`
          );

          packageSelections = [
            {
              pkgId: booking.packageId,
              qty: ticketCount,
              holders: [
                {
                  name: customerName,
                  age: 18, // Default age
                  phone: customerPhone,
                },
              ],
            },
          ];
        }

        if (Array.isArray(packageSelections)) {
          const fees = await calculateFees(booking.event);
          let ticketIndex = 0;

          for (const selection of packageSelections) {
            if (
              !selection.pkgId ||
              !selection.qty ||
              !Array.isArray(selection.holders)
            ) {
              console.error("Invalid package selection structure:", selection);
              continue;
            }

            const selectedPackage = booking.event.packages.find(
              (pkg) => pkg.id === selection.pkgId
            );

            if (!selectedPackage) {
              console.error("Package not found:", selection.pkgId);
              continue;
            }

            const packagePrice = Number(selectedPackage.price);
            const userFeeAmount = packagePrice * (fees.userFeePercentage / 100);
            const cgstAmount = packagePrice * (fees.cgstPercentage / 100);
            const sgstAmount = packagePrice * (fees.sgstPercentage / 100);
            const totalTaxAmount = cgstAmount + sgstAmount;
            const ticketPrice = packagePrice + userFeeAmount + totalTaxAmount;

            for (let i = 0; i < selection.qty; i++) {
              const ticketHolder = selection.holders[i] || {
                name: booking.user.name || "Unknown",
                age: 18,
                phone: booking.user.phone || "",
              };

              if (!ticketHolder.name) {
                console.error("Invalid ticket holder data:", ticketHolder);
                continue;
              }

              const ticketNumber = `TK${Date.now()}${ticketIndex
                .toString()
                .padStart(3, "0")}`;
              const qrCode = `${booking.id}-${ticketNumber}-${crypto
                .randomBytes(8)
                .toString("hex")}`;

              await db.ticket.create({
                data: {
                  ticketNumber,
                  qrCode,
                  fullName: ticketHolder.name,
                  age: ticketHolder.age || 18,
                  phoneNumber: ticketHolder.phone || "",
                  ticketPrice: ticketPrice,
                  userId: booking.userId,
                  eventId: booking.eventId,
                  packageId: selection.pkgId,
                  bookingId: booking.id,
                },
              });

              ticketIndex++;
              ticketsCreated++;
            }
          }

          // Clean up ticket data only if it exists
          const ticketDataExists = await db.ticketData.findUnique({
            where: { bookingId: booking.id },
          });

          if (ticketDataExists) {
            await db.ticketData.delete({
              where: { bookingId: booking.id },
            });
            console.log("Cleaned up ticket data for booking:", booking.id);
          }
        }
      } catch (error) {
        console.error("Error creating tickets:", error);
        // Continue even if ticket creation fails
      }
    }

    // Handle wallet updates based on order tags or calculate from event
    const totalHostGets = orderTags?.hget ? parseFloat(orderTags.hget) : 0;
    const totalAdminGets = orderTags?.aget ? parseFloat(orderTags.aget) : 0;
    const totalReferralAmount = orderTags?.rget
      ? parseFloat(orderTags.rget)
      : 0;

    let finalHostGets = totalHostGets;
    let finalAdminGets = totalAdminGets;
    let finalReferralAmount = totalReferralAmount;

    // If no order tags, calculate from event
    if (!totalHostGets || !totalAdminGets) {
      const fees = await calculateFees(booking.event);
      const ticketCount = parseInt(orderTags?.tkt || "1");
      const packageSelections = [
        {
          packageId: booking.packageId,
          quantity: ticketCount,
        },
      ];

      finalHostGets = 0;
      finalAdminGets = 0;
      finalReferralAmount = 0;

      for (const selection of packageSelections) {
        const selectedPackage = booking.event.packages.find(
          (pkg) => pkg.id === selection.packageId
        );
        if (!selectedPackage) continue;

        const packagePrice = Number(selectedPackage.price);
        const userFeeAmount = packagePrice * (fees.userFeePercentage / 100);
        const hostFeeAmount = packagePrice * (fees.hostFeePercentage / 100);
        const hostGetsPerTicketBeforeReferral = packagePrice - hostFeeAmount;
        const referralAmountPerTicket =
          hostGetsPerTicketBeforeReferral * (fees.referralPercentage / 100);

        finalHostGets +=
          (hostGetsPerTicketBeforeReferral - referralAmountPerTicket) *
          selection.quantity;
        finalAdminGets += (userFeeAmount + hostFeeAmount) * selection.quantity;
        finalReferralAmount += referralAmountPerTicket * selection.quantity;
      }
    }

    // Update host wallet
    if (finalHostGets > 0) {
      await db.user.update({
        where: { id: booking.event.hostId },
        data: {
          walletBalance: {
            increment: finalHostGets,
          },
        },
      });
    }

    // Update admin wallet
    if (finalAdminGets > 0) {
      const adminUser = await db.user.findFirst({
        where: { role: "ADMIN" },
      });

      if (adminUser) {
        await db.user.update({
          where: { id: adminUser.id },
          data: {
            walletBalance: {
              increment: finalAdminGets,
            },
          },
        });
      }
    }

    // Update event sold tickets count
    await db.event.update({
      where: { id: booking.eventId },
      data: {
        soldTickets: {
          increment: ticketsCreated || booking.ticketCount,
        },
      },
    });

    // Fetch updated booking with tickets to get accurate count
    const updatedBooking = await db.booking.findUnique({
      where: { id: booking.id },
      include: {
        tickets: true,
      },
    });

    console.log(
      `[ManualRelease] Final result: ticketsCreated=${ticketsCreated}, totalTickets=${updatedBooking?.tickets.length || 0}`
    );
    console.log(
      `[ManualRelease] Final booking status: ${updatedBooking?.status}`
    );
    console.log(
      `[ManualRelease] User ID: ${booking.userId}, User email: ${booking.user.email}`
    );

    return NextResponse.json({
      success: true,
      message:
        ticketsCreated > 0
          ? `Tickets released successfully (${ticketsCreated} tickets created)`
          : "Booking confirmed and tickets verified",
      bookingId: booking.id,
      ticketCount: updatedBooking?.tickets.length || 0,
    });
  } catch (error) {
    console.error("Manual release error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
