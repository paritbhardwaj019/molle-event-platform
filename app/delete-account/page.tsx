import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Mail, MessageCircle, Shield } from "lucide-react";

export const metadata = {
  title: "Delete Account - Account Deletion Information",
  description:
    "Information about how to delete your account and what happens to your data.",
};

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-red-100 rounded-full">
              <AlertTriangle className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Delete Your Account
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're sorry to see you go. Here's everything you need to know about
            deleting your account.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Important Notice */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-900">
                <AlertTriangle className="h-5 w-5" />
                Important Notice
              </CardTitle>
            </CardHeader>
            <CardContent className="text-red-800">
              <p className="mb-2">
                Account deletion is permanent and cannot be undone. Please make
                sure you want to proceed before requesting account deletion.
              </p>
            </CardContent>
          </Card>

          {/* What Happens When You Delete Your Account */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                What Happens When You Delete Your Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Data That Will Be Deleted:
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                    <li>Your profile information and personal data</li>
                    <li>Your event bookings history</li>
                    <li>Your saved preferences and settings</li>
                    <li>Your subscription information</li>
                    <li>Your messages and conversations</li>
                    <li>Your social connections and matches</li>
                    <li>Your reviews and ratings</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Data That May Be Retained:
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                    <li>
                      Transaction records (for legal and accounting purposes)
                    </li>
                    <li>
                      Data required for fraud prevention and legal compliance
                    </li>
                    <li>Anonymized analytics data</li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    We retain minimal data as required by law and for business
                    purposes. All personal identifiable information will be
                    deleted within 30 days of your request.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How to Delete Your Account */}
          <Card>
            <CardHeader>
              <CardTitle>How to Request Account Deletion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Step 1: Choose Your Preferred Contact Method
                  </h3>
                  <p className="text-gray-600 mb-4">
                    To delete your account, please contact us using one of the
                    following methods:
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                      <MessageCircle className="h-5 w-5 text-green-600 mt-1" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-1">
                          WhatsApp (Recommended)
                        </p>
                        <p className="text-sm text-gray-600 mb-3">
                          Send us a message on WhatsApp for quick processing:
                        </p>
                        <a
                          href="https://wa.me/918160309135?text=Hi%2C%20I%20would%20like%20to%20delete%20my%20Molle%20Events%20account.%20Please%20help%20me%20with%20the%20account%20deletion%20process."
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Chat on WhatsApp: +91 8160309135
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                      <Mail className="h-5 w-5 text-blue-600 mt-1" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-1">Email</p>
                        <p className="text-sm text-gray-600 mb-3">
                          Send an email to our support team:
                        </p>
                        <a
                          href="mailto:molle.app@gmail.com?subject=Account%20Deletion%20Request&body=Hi%2C%0A%0AI%20would%20like%20to%20delete%20my%20Molle%20Events%20account.%0A%0ARegistered%20Email%3A%20%5BYour%20registered%20email%5D%0ARegistered%20Phone%3A%20%5BYour%20registered%20phone%20number%5D%0A%0APlease%20confirm%20the%20account%20deletion%20and%20let%20me%20know%20the%20next%20steps.%0A%0AThank%20you."
                          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Email: molle.app@gmail.com
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Step 2: Provide Required Information
                  </h3>
                  <p className="text-gray-600 mb-3">
                    To verify your identity and process your request, please
                    include:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                    <li>Your registered email address</li>
                    <li>Your registered phone number</li>
                    <li>
                      Your full name as registered on the account (optional)
                    </li>
                    <li>Reason for deletion (optional)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Step 3: Wait for Confirmation
                  </h3>
                  <p className="text-gray-600">
                    Our support team will verify your identity and process your
                    request within 3-5 business days. You will receive a
                    confirmation message once your account has been deleted.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Before You Go */}
          <Card>
            <CardHeader>
              <CardTitle>Before You Go</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Consider these alternatives before deleting your account:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li>
                    <strong>Deactivate temporarily:</strong> Contact us to
                    temporarily deactivate your account instead
                  </li>
                  <li>
                    <strong>Update preferences:</strong> Adjust your
                    notification and privacy settings
                  </li>
                  <li>
                    <strong>Cancel subscription:</strong> You can cancel your
                    subscription without deleting your account
                  </li>
                </ul>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    If you have any concerns or feedback, we'd love to hear from
                    you before you decide to leave.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Protection */}
          <Card>
            <CardHeader>
              <CardTitle>Your Data Protection Rights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                You have the right to request access to, correction of, or
                deletion of your personal data. For more information about how
                we handle your data, please refer to our:
              </p>
              <div className="flex gap-4">
                <a
                  href="/privacy"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  Privacy Policy
                </a>
                <a
                  href="/terms"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  Terms of Service
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Need Help?
              </h3>
              <p className="text-gray-600 mb-4">
                If you have any questions about the account deletion process or
                need assistance, our support team is here to help.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="https://wa.me/918160309135?text=Hi%2C%20I%20have%20questions%20about%20account%20deletion.%20Can%20you%20help%20me%3F"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Support on WhatsApp
                </a>
                <a
                  href="mailto:molle.app@gmail.com?subject=Account%20Deletion%20Query"
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email Support
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

