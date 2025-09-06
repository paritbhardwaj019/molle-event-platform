import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy - Molle",
  description: "Cancellation and refund policy for Molle events platform",
};

export default function RefundPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-3xl font-bold text-center mb-8">
          Cancellation & Refund Policy
        </h1>
        <p className="text-sm text-gray-600 text-center mb-8">
          Last updated on 12-08-2025
        </p>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <p className="text-sm">
            <strong>OM SURESHBHAI BARAIYA</strong> believes in helping its
            customers as far as possible, and has therefore a liberal
            cancellation policy. Under this policy:
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border">
            <ul className="space-y-4 text-sm">
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>
                  Cancellations will be considered only if the request is made
                  immediately after placing the order. However, the cancellation
                  request may not be entertained if the orders have been
                  communicated to the vendors/merchants and they have initiated
                  the process of shipping them.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>
                  <strong>OM SURESHBHAI BARAIYA</strong> does not accept
                  cancellation requests for perishable items like flowers,
                  eatables etc. However, refund/replacement can be made if the
                  customer establishes that the quality of product delivered is
                  not good.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>
                  In case of receipt of damaged or defective items please report
                  the same to our Customer Service team. The request will,
                  however, be entertained once the merchant has checked and
                  determined the same at his own end. This should be reported
                  within <strong>Only same day</strong> days of receipt of the
                  products. In case you feel that the product received is not as
                  shown on the site or as per your expectations, you must bring
                  it to the notice of our customer service within{" "}
                  <strong>Only same day</strong> days of receiving the product.
                  The Customer Service Team after looking into your complaint
                  will take an appropriate decision.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>
                  In case of complaints regarding products that come with a
                  warranty from manufacturers, please refer the issue to them.
                  In case of any Refunds approved by the{" "}
                  <strong>OM SURESHBHAI BARAIYA</strong>, it'll take{" "}
                  <strong>9-15 Days</strong> days for the refund to be processed
                  to the end customer.
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4 text-primary">
              1. General Policy
            </h2>
            <p className="text-sm mb-4">
              Molle is a platform that connects event organizers (Hosts) with
              attendees. All events listed on Molle are managed by independent
              Hosts. Molle acts as an intermediary and does not directly host
              events.
            </p>
            <p className="text-sm mb-4">
              All ticket purchases are final unless explicitly stated otherwise
              on the event page.
            </p>
            <p className="text-sm">
              Refunds, if applicable, are subject to the Host's individual
              refund policy.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4 text-primary">
              2. Refund Eligibility
            </h2>
            <p className="text-sm mb-4">You may be eligible for a refund if:</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>The event is cancelled by the Host.</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>
                  The event date or venue is changed, and you cannot attend.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>
                  There was an error in ticket purchase due to technical issues
                  on Molle's platform.
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4 text-primary">
              3. Non-Refundable Cases
            </h2>
            <p className="text-sm mb-4">Refunds will not be provided if:</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>
                  You cannot attend due to personal reasons (travel delays,
                  illness, etc.).
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>You missed the event start time.</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>
                  You purchased the wrong ticket type or entered incorrect
                  details.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>
                  You were denied entry due to violation of event rules or age
                  restrictions.
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4 text-primary">
              4. Refund Request Process
            </h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>
                  Refund requests must be submitted within 48 hours of event
                  cancellation or change.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>
                  To request a refund, email{" "}
                  <strong>support@molleapp.com</strong> with your ticket
                  details, order ID, and reason for refund.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>
                  All refunds will be processed to the original payment method
                  within 7–14 business days, subject to payment gateway
                  timelines.
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4 text-primary">
              5. Service & Platform Fees
            </h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>
                  Molle's platform fees are non-refundable unless the refund is
                  due to a platform error.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>
                  In partial refunds, service charges may be deducted as per
                  payment gateway rules.
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4 text-primary">
              6. Host Responsibility
            </h2>
            <p className="text-sm">
              Since Hosts create and manage events, refund approval is at the
              discretion of the Host unless the event is cancelled or
              significantly changed.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4 text-primary">
              7. No-Show Policy
            </h2>
            <p className="text-sm">
              If you do not attend the event without prior notice to the Host,
              you are not entitled to a refund.
            </p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-center text-gray-600">
            For any questions regarding this refund policy, please contact us at{" "}
            <a
              href="mailto:support@molleapp.com"
              className="text-primary hover:underline"
            >
              support@molleapp.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
