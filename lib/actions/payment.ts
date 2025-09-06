"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import crypto from "crypto";
import { calculateFees } from "./settings";
import { Cashfree, CFEnvironment } from "cashfree-pg";
import { sendTicketConfirmationEmails } from "@/lib/email";

interface CreateBookingData {
  eventId: string;
  packageSelections: Array<{
    packageId: string;
    quantity: number;
    ticketHolders: Array<{
      fullName: string;
      age: number;
      phoneNumber: string;
    }>;
  }>;
  totalAmount: number;
  referralCode?: string;
  referralDiscount?: number;
}

const cashfree = new Cashfree(
  CFEnvironment.PRODUCTION,
  process.env.CASHFREE_CLIENT_ID!,
  process.env.CASHFREE_CLIENT_SECRET!
);

export async function createBookingWithPayment(data: CreateBookingData) {
  let booking: any = null;

  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    const event = await db.event.findUnique({
      where: { id: data.eventId },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            hostFeePercentage: true,
          },
        },
        packages: true,
      },
    });

    if (!event) {
      return { error: "Event not found" };
    }

    const fees = await calculateFees(event);

    let totalTicketCount = 0;
    let totalUserPays = 0;
    let totalHostGets = 0;
    let totalAdminGets = 0;
    let totalReferralAmount = 0;

    for (const selection of data.packageSelections) {
      const selectedPackage = event.packages.find(
        (pkg) => pkg.id === selection.packageId
      );
      if (!selectedPackage) {
        return { error: `Package not found: ${selection.packageId}` };
      }

      const packagePrice = Number(selectedPackage.price);

      const userFeeAmount = packagePrice * (fees.userFeePercentage / 100);
      const hostFeeAmount = packagePrice * (fees.hostFeePercentage / 100);
      const cgstAmount = packagePrice * (fees.cgstPercentage / 100);
      const sgstAmount = packagePrice * (fees.sgstPercentage / 100);
      const totalTaxAmount = cgstAmount + sgstAmount;

      const userPaysPerTicket = packagePrice + userFeeAmount + totalTaxAmount;
      const hostGetsPerTicketBeforeReferral = packagePrice - hostFeeAmount;
      const referralAmountPerTicket =
        hostGetsPerTicketBeforeReferral * (fees.referralPercentage / 100);
      const hostGetsPerTicket =
        hostGetsPerTicketBeforeReferral - referralAmountPerTicket;
      const adminGetsPerTicket = userFeeAmount + hostFeeAmount;

      totalTicketCount += selection.quantity;
      totalUserPays += userPaysPerTicket * selection.quantity;
      totalHostGets += hostGetsPerTicket * selection.quantity;
      totalAdminGets += adminGetsPerTicket * selection.quantity;
      totalReferralAmount += referralAmountPerTicket * selection.quantity;
    }

    let referralLinkId: string | null = null;
    if (data.referralCode) {
      const referralLink = await db.referralLink.findUnique({
        where: {
          referralCode: data.referralCode,
          type: "EVENT",
          eventId: data.eventId,
        },
        include: {
          referrer: true,
        },
      });

      if (!referralLink) {
        return { error: "Invalid referral code" };
      }

      referralLinkId = referralLink.id;
    }

    const primaryPackageId = data.packageSelections[0].packageId;

    booking = await db.booking.create({
      data: {
        bookingNumber: `BK${Date.now()}`,
        status: "PENDING",
        ticketCount: totalTicketCount,
        totalAmount: totalUserPays,
        userId: session.user.id,
        eventId: data.eventId,
        packageId: primaryPackageId,
        referralLinkId: referralLinkId,
      },
      include: {
        user: true,
        event: true,
      },
    });

    // Store ticket data in database instead of order tags
    const ticketData = data.packageSelections.map((selection) => ({
      pkgId: selection.packageId,
      qty: selection.quantity,
      holders: selection.ticketHolders.map((holder) => ({
        name: holder.fullName,
        age: holder.age,
        phone: holder.phoneNumber,
      })),
    }));

    // Create ticket data entry
    await db.ticketData.create({
      data: {
        bookingId: booking.id,
        data: ticketData,
      },
    });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const kycRequest = await db.kycRequest.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    const orderData = {
      order_id: booking.bookingNumber,
      order_amount: Number(totalUserPays.toFixed(2)),
      order_currency: "INR",
      customer_details: {
        customer_id: session.user.id.toString(),
        customer_name: session.user.name || "Unknown",
        customer_email: session.user.email,
        customer_phone: (
          session.user.phone ||
          kycRequest?.contactNumber ||
          "9876543210"
        ).replace(/\D/g, ""),
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_URL}/book/${event.slug}?booking_id=${booking.id}&cf_id=${booking.bookingNumber}`,
      },
      order_note: `Booking for ${event.title} - ${booking.bookingNumber}`,
      order_tags: {
        bid: booking.id.toString(),
        eid: data.eventId.toString(),
        uid: session.user.id.toString(),
        tkt: totalTicketCount.toString(),
        upay: totalUserPays.toFixed(2),
        hget: totalHostGets.toFixed(2),
        aget: totalAdminGets.toFixed(2),
        rget: totalReferralAmount.toFixed(2),
        slug: event.slug,
        ...(data.referralCode ? { ref: data.referralCode } : {}),
      },
    };

    const cashfreeOrder = await createCashfreeOrder(orderData);

    if (!cashfreeOrder || !cashfreeOrder.cf_order_id) {
      await db.ticketData.deleteMany({
        where: { bookingId: booking.id },
      });
      await db.booking.delete({
        where: { id: booking.id },
      });
      throw new Error("Failed to create Cashfree order");
    }

    await db.payment.create({
      data: {
        cashfreeOrderId: cashfreeOrder.cf_order_id,
        amount: totalUserPays,
        status: "PENDING",
        bookingId: booking.id,
      },
    });

    return {
      success: true,
      data: {
        bookingId: booking.id,
        orderId: cashfreeOrder.cf_order_id,
        amount: totalUserPays,
        currency: "INR",
        paymentSessionId: cashfreeOrder.payment_session_id,
        bookingNumber: booking.bookingNumber,
        user: {
          name: booking.user.name,
          email: booking.user.email,
          phone: booking.user.phone,
        },
      },
    };
  } catch (error: any) {
    if (booking?.id) {
      try {
        await db.ticketData.deleteMany({
          where: { bookingId: booking.id },
        });
        await db.booking.delete({
          where: { id: booking.id },
        });
      } catch (cleanupError) {
        console.error("Error during cleanup:", cleanupError);
      }
    }

    return { error: "Failed to create booking" };
  }
}

export async function verifyPayment(
  orderId: string,
  paymentId: string,
  bid: string
) {
  try {
    if (!orderId) {
      console.error("Order ID is undefined");
      return { error: "Order ID is required" };
    }

    const payment = await db.payment.update({
      where: { bookingId: bid },
      data: {
        cashfreePaymentId: paymentId.toString(),
        status: "COMPLETED",
      },
    });

    const booking = await db.booking.findUnique({
      where: { id: payment.bookingId },
      include: {
        user: true,
        event: {
          include: {
            host: true,
          },
        },
        referralLink: {
          include: {
            referrer: true,
            event: true,
          },
        },
      },
    });

    if (!booking) {
      return { error: "Booking not found" };
    }

    await db.booking.update({
      where: { id: booking.id },
      data: {
        status: "CONFIRMED",
      },
    });

    const cashfreeOrderDetails = await fetchCashfreeOrder(orderId);

    const ticketDataEntry = await db.ticketData.findUnique({
      where: { bookingId: booking.id },
    });

    if (ticketDataEntry) {
      try {
        const packageSelections = ticketDataEntry.data as any[];

        if (!Array.isArray(packageSelections)) {
          console.error("Invalid package data format: expected array");
          return { error: "Invalid package data format" };
        }

        const event = await db.event.findUnique({
          where: { id: booking.eventId },
          include: {
            packages: true,
            host: {
              select: {
                hostFeePercentage: true,
              },
            },
          },
        });

        if (!event) {
          console.error("Event not found for ticket creation");
          return { error: "Event not found" };
        }

        const fees = await calculateFees(event);
        let ticketIndex = 0;
        let totalTicketsCreated = 0;

        for (const selection of packageSelections) {
          if (
            !selection.pkgId ||
            !selection.qty ||
            !Array.isArray(selection.holders)
          ) {
            console.error("Invalid package selection structure:", selection);
            continue;
          }

          const selectedPackage = event.packages.find(
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
            totalTicketsCreated++;
          }
        }

        await db.ticketData.delete({
          where: { bookingId: booking.id },
        });

        console.log("Cleaned up ticket data for booking:", booking.id);
      } catch (error) {
        console.error("Error creating tickets:", error);
      }
    } else {
      console.log("No ticket data found in database for booking:", booking.id);
    }

    const totalHostGets = parseFloat(
      String(cashfreeOrderDetails.order_tags?.hget || "0")
    );
    const totalAdminGets = parseFloat(
      String(cashfreeOrderDetails.order_tags?.aget || "0")
    );
    const totalReferralAmount = parseFloat(
      String(cashfreeOrderDetails.order_tags?.rget || "0")
    );

    let finalHostGets = totalHostGets;
    let finalAdminGets = totalAdminGets;
    let finalReferralAmount = totalReferralAmount;

    if (!totalHostGets || !totalAdminGets) {
      const event = await db.event.findUnique({
        where: { id: booking.eventId },
        include: {
          packages: true,
          host: {
            select: {
              hostFeePercentage: true,
            },
          },
        },
      });

      if (event) {
        const fees = await calculateFees(event);

        const ticketCount = parseInt(
          String(cashfreeOrderDetails.order_tags?.tkt || "1")
        );
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
          const selectedPackage = event.packages.find(
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
          finalAdminGets +=
            (userFeeAmount + hostFeeAmount) * selection.quantity;
          finalReferralAmount += referralAmountPerTicket * selection.quantity;
        }
      }
    }

    if (finalHostGets > 0) {
      await db.user.update({
        where: { id: booking.event.host.id },
        data: {
          walletBalance: {
            increment: finalHostGets,
          },
        },
      });
    }

    if (finalAdminGets > 0) {
      const adminUser = await db.user.findFirst({
        where: { role: "ADMIN" },
      });

      if (adminUser) {
        await db.user.update({
          where: { id: adminUser.id },
          data: {
            adminWallet: {
              increment: finalAdminGets,
            },
          },
        });
      }
    }

    if (booking.referralLink?.referrer && finalReferralAmount > 0) {
      await db.user.update({
        where: { id: booking.referralLink.referrer.id },
        data: {
          walletBalance: {
            increment: finalReferralAmount,
          },
        },
      });

      const existingReferral = await db.referral.findFirst({
        where: {
          referrerId: booking.referralLink.referrer.id,
          referredUserId: booking.user.id,
          referralLinkId: booking.referralLink.id,
        },
      });

      if (!existingReferral) {
        await db.referral.create({
          data: {
            referralCode: booking.referralLink.referralCode,
            commission: finalReferralAmount,
            isCommissionPaid: true,
            referrerId: booking.referralLink.referrer.id,
            referredUserId: booking.user.id,
            referralLinkId: booking.referralLink.id,
          },
        });
      } else {
        await db.referral.update({
          where: { id: existingReferral.id },
          data: {
            commission: { increment: finalReferralAmount },
            isCommissionPaid: true,
          },
        });
      }
    }

    // Send confirmation emails to user and host
    try {
      // Fetch the created tickets with package information
      const createdTickets = await db.ticket.findMany({
        where: { bookingId: booking.id },
        include: {
          package: true,
        },
      });

      if (createdTickets.length > 0) {
        // Prepare ticket data for email
        const ticketData = createdTickets.map((ticket) => ({
          ticketNumber: ticket.ticketNumber,
          fullName: ticket.fullName,
          age: ticket.age,
          phoneNumber: ticket.phoneNumber,
          packageName: ticket.package.name,
          ticketPrice: ticket.ticketPrice.toString(),
          id: ticket.id,
        }));

        // Format event date and time
        const eventDate = new Date(booking.event.startDate).toLocaleDateString(
          "en-US",
          {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }
        );

        const eventTime = new Date(booking.event.startDate).toLocaleTimeString(
          "en-US",
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        );

        // Prepare email data
        const emailData = {
          userName: booking.user.name,
          userEmail: booking.user.email,
          hostName: booking.event.host.name,
          hostEmail: booking.event.host.email,
          eventTitle: booking.event.title,
          eventDate: eventDate,
          eventTime: eventTime,
          eventLocation: booking.event.location,
          bookingNumber: booking.bookingNumber,
          totalAmount: booking.totalAmount.toString(),
          hostEarnings: finalHostGets.toString(),
          tickets: ticketData,
          downloadUrl: `${process.env.NEXT_PUBLIC_URL}/tickets/${booking.id}`,
        };

        // Send emails
        const emailResult = await sendTicketConfirmationEmails(emailData);
        if (emailResult.success) {
          console.log("✅ Confirmation emails sent successfully");
        } else {
          console.error(
            "❌ Failed to send confirmation emails:",
            emailResult.error
          );
        }
      } else {
        console.log("No tickets found for email sending");
      }
    } catch (emailError) {
      console.error("❌ Error sending confirmation emails:", emailError);
    }

    console.log(`Payment verified successfully for order: ${orderId}`);
    return { success: true };
  } catch (error) {
    console.error("Error verifying payment:", error);
    return { error: "Failed to verify payment" };
  }
}

async function createCashfreeOrder(orderData: any) {
  try {
    const response = await cashfree.PGCreateOrder(orderData);
    return response.data;
  } catch (error) {
    console.log("ERROR IN CREATE CASHFREE ORDER", error);
    console.error("Error creating Cashfree order:", error);
    throw error;
  }
}

async function fetchCashfreeOrder(orderId: string) {
  try {
    const response = await cashfree.PGFetchOrder(orderId);
    return response.data;
  } catch (error) {
    console.error("Error fetching Cashfree order:", error);
    throw error;
  }
}
