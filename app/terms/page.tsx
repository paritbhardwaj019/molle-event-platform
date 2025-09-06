import Link from "next/link";

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-primary hover:text-primary/80 mb-6"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Terms and Conditions for Molle
            </h1>
            <p className="text-gray-600">
              <strong>Effective Date:</strong> June 24, 2025
            </p>
          </div>

          {/* Content */}
          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Introduction
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Welcome to Molle! These Terms and Conditions ("Terms") govern
                your use of the Molle app and any services related to it
                (collectively, "Services"). By downloading, accessing, or using
                Molle, you agree to these Terms. If you do not agree, please do
                not use the app.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Eligibility
              </h2>
              <p className="text-gray-700 leading-relaxed">
                You must be at least 12 years old or the age of majority in your
                jurisdiction to use Molle. By using the app, you confirm that
                you meet this requirement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Account Registration
              </h2>
              <p className="text-gray-700 leading-relaxed">
                You must create an account to access certain features of Molle.
                You agree to provide accurate, current, and complete information
                during the registration process. You are responsible for
                safeguarding your password and any activities that occur under
                your account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Hosting and Attending Events
              </h2>
              <p className="text-gray-700 leading-relaxed">
                By hosting an event on Molle, you agree to adhere to all
                applicable local laws, regulations, and ordinances related to
                your event. As a host, you assume full responsibility for
                ensuring that your event is safe, compliant, and appropriate for
                all participants. You acknowledge that Molle is a platform
                connecting hosts and attendees but does not control the events
                hosted on the platform. Molle is not liable for any incidents,
                damages, losses, or legal issues arising from your event. Hosts
                are responsible for setting clear event terms and providing
                refunds where applicable. Failure to comply with these
                guidelines may result in suspension or termination of your
                account and other legal actions. By hosting on Molle, you agree
                to hold Molle harmless from any and all liabilities related to
                your event and in case of any illicit/illegal/immoral/hateful
                activities in your event, Molle will not be responsible.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Payments and Refunds
              </h2>
              <p className="text-gray-700 leading-relaxed">
                As a host on Molle, you will receive your event earnings after
                the successful completion of the event. Molle uses a secure
                payment processing system to handle transactions, ensuring that
                all payments are collected in advance. Funds will be transferred
                to the host only after the event has taken place and applicable
                processing fees have been deducted. By using Molle, you agree to
                this payment schedule, and acknowledge that Molle holds no
                responsibility for disputes related to payments once the event
                is completed.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. User Conduct
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                By using Molle, you agree:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>
                  Not to post or share illegal, harmful, or offensive content.
                </li>
                <li>Not to harass, threaten, or harm others.</li>
                <li>Not to use Molle for any illegal activities.</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Molle reserves the right to remove any content or
                suspend/terminate accounts for violations of these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. User-Generated Content
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Molle allows users to create and share content. By posting
                content, you grant Molle a non-exclusive, worldwide,
                royalty-free license to use, display, reproduce, and distribute
                your content for the purposes of operating and promoting the
                app.
              </p>
              <p className="text-gray-700 leading-relaxed">
                You retain all ownership rights in your content.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Privacy
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Your use of Molle is subject to our{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                , which explains how we collect, use, and protect your personal
                information. By using the app, you agree to the collection and
                use of information in accordance with the Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Limitation of Liability
              </h2>
              <p className="text-gray-700 leading-relaxed">
                To the fullest extent permitted by law, Molle, its affiliates,
                and its licensors will not be liable for any damages or legal
                issues arising out of your use of the app or attendance at
                events. This includes, but is not limited to, personal injury,
                loss of data, and property damage.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Disclaimers
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Molle provides the app on an "as-is" basis. We make no
                warranties or representations regarding the accuracy,
                completeness, or reliability of any content on the app. Use of
                the app is at your own risk.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. Termination
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Molle reserves the right to terminate or suspend your account at
                any time for violations of these Terms or for any other reason
                at our discretion.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                12. Modifications to the Terms
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We may modify these Terms at any time. If we make material
                changes, we will notify you through the app or by other means.
                Your continued use of the app after such changes constitutes
                your acceptance of the updated Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                13. Governing Law
              </h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms are governed by the laws of India. Any disputes
                arising out of or related to these Terms shall be resolved in
                the courts of India.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                14. Contact Us
              </h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about these Terms, please contact us
                at{" "}
                <a
                  href="mailto:molle.app@gmail.com"
                  className="text-primary hover:underline"
                >
                  molle.app@gmail.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
