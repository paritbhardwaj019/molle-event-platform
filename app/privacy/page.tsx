import Link from "next/link";

export default function PrivacyPolicyPage() {
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
              Privacy Policy for Molle
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
                Welcome to Molle. This Privacy Policy explains how we collect,
                use, and share your personal information when you use our mobile
                application and services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Information We Collect
              </h2>

              <h3 className="text-xl font-medium text-gray-900 mb-3">
                A. Personal Information:
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you sign up or interact with Molle, we may collect:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Contact information</li>
                <li>Date of birth</li>
                <li>
                  Payment information (processed by third-party payment
                  providers)
                </li>
                <li>Location data</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">
                B. Non-Personal Information
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may also collect non-personal information automatically when
                you use the app, such as:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Device information (e.g., IP address, browser type)</li>
                <li>App usage data</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. How We Use Your Information
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use the information we collect for the following purposes:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>
                  <strong>To Provide and Maintain the Service:</strong> To allow
                  you to create and manage an account, host or attend events,
                  and interact with other users.
                </li>
                <li>
                  <strong>To Process Payments:</strong> To securely process
                  payments for events and transfer funds to hosts after the
                  event.
                </li>
                <li>
                  <strong>To Communicate with You:</strong> To send you
                  notifications about your account, events, or app updates.
                </li>
                <li>
                  <strong>To Improve the App:</strong> To analyse usage patterns
                  and improve the functionality and performance of the app.
                </li>
                <li>
                  <strong>For Marketing and Promotions:</strong> With your
                  consent, we may send you promotional materials, offers, or
                  other information related to Molle.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Sharing Your Information
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We will not share your personal information with third parties
                except in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>
                  <strong>With Service Providers:</strong> We may share your
                  information with third-party vendors who help us operate Molle
                  (e.g., payment processors, hosting providers).
                </li>
                <li>
                  <strong>For Legal Compliance:</strong> We may disclose your
                  information if required by law or in response to valid legal
                  requests by public authorities.
                </li>
                <li>
                  <strong>To Protect Rights and Safety:</strong> We may disclose
                  your information when necessary to protect Molle's rights,
                  your safety, or the safety of others.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Data Security
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We take the security of your personal information seriously and
                implement reasonable technical, administrative, and physical
                safeguards to protect it. However, no method of data
                transmission or storage is completely secure, and we cannot
                guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Data Retention
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We will retain your personal information only for as long as
                necessary to fulfil the purposes outlined in this policy, unless
                a longer retention period is required or permitted by law. Once
                your data is no longer needed, we will securely dispose of it.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Your Rights
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Depending on your location, you may have certain rights
                regarding your personal data, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>
                  <strong>Access and Correction:</strong> You may access and
                  correct the personal information we hold about you.
                </li>
                <li>
                  <strong>Deletion:</strong> You may request that we delete your
                  personal information, subject to certain exceptions (e.g.,
                  legal obligations).
                </li>
                <li>
                  <strong>Data Portability:</strong> You may request a copy of
                  your personal information in a structured, machine-readable
                  format.
                </li>
                <li>
                  <strong>Opt-Out:</strong> You may opt-out of receiving
                  marketing communications from us at any time by following the
                  unsubscribe instructions in those communications.
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                To exercise your rights, please contact us at{" "}
                <a
                  href="mailto:molle.app@gmail.com"
                  className="text-primary hover:underline"
                >
                  molle.app@gmail.com
                </a>
                .
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Location Data
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Molle uses location data to show relevant events near you. By
                enabling location services in the app, you consent to the
                collection and use of your location data. You can manage your
                location preferences in your device settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Payments
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Molle uses third-party payment processors to handle
                transactions. These payment processors comply with industry
                standards for secure payment processing. Molle does not store
                your payment information directly but relies on the security
                measures of the payment provider. By hosting events, you agree
                that payment will be transferred to you after the event takes
                place.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Third-Party Links
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Molle may contain links to third-party websites, services, or
                offers. We are not responsible for the privacy practices or the
                content of these third parties. We encourage you to review the
                privacy policies of those third parties before providing any
                personal information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. Changes to This Privacy Policy
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time to reflect
                changes in our practices or for legal, operational, or
                regulatory reasons. We will notify you of any significant
                changes by updating the "Effective Date" at the top of this
                policy. Continued use of the app after the update constitutes
                your acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                12. Contact Us
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions or concerns about this Privacy Policy
                or your data, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong>{" "}
                  <a
                    href="mailto:molle.app@gmail.com"
                    className="text-primary hover:underline"
                  >
                    molle.app@gmail.com
                  </a>
                </p>
                <p className="text-gray-700">
                  <strong>Contact No:</strong>{" "}
                  <a
                    href="tel:9328212269"
                    className="text-primary hover:underline"
                  >
                    9328212269
                  </a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
