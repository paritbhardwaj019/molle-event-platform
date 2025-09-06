import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Mail, Star, Users, TrendingUp } from "lucide-react";

export const metadata = {
  title: "Feature Your Brand - Molle Events",
  description:
    "Partner with Molle Events to showcase your brand to our engaged community of event-goers and hosts.",
};

export default function FeatureYourBrandPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Feature Your Brand
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Partner with Molle Events to reach our growing community of event enthusiasts, 
            hosts, and attendees. Let's create amazing experiences together.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Why Partner With Us */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Why Partner With Molle Events?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Engaged Community</h4>
                  <p className="text-gray-600 text-sm">
                    Connect with thousands of active event-goers and hosts in your target market.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Growth Opportunities</h4>
                  <p className="text-gray-600 text-sm">
                    Leverage our platform to increase brand visibility and drive customer engagement.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-yellow-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Premium Positioning</h4>
                  <p className="text-gray-600 text-sm">
                    Showcase your brand alongside premium events and experiences.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Partnership Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Partnership Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Event Sponsorships</h4>
                <p className="text-gray-600 text-sm">
                  Sponsor featured events and reach targeted audiences.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Brand Collaborations</h4>
                <p className="text-gray-600 text-sm">
                  Create co-branded experiences and promotional campaigns.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Platform Advertising</h4>
                <p className="text-gray-600 text-sm">
                  Display your brand across our platform and mobile app.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Content Partnerships</h4>
                <p className="text-gray-600 text-sm">
                  Collaborate on content creation and marketing initiatives.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Information */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Get Started Today
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-gray-600 mb-4">
                Ready to feature your brand with Molle Events? Our partnership team is here to help you get started.
              </p>
              <p className="text-lg font-semibold text-gray-900">
                For promotional queries, reach out to:
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* WhatsApp Contact */}
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <MessageCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">WhatsApp</h4>
                <a
                  href="https://wa.me/918160309135?text=Hi%2C%20I'm%20interested%20in%20featuring%20my%20brand%20with%20Molle%20Events.%20Can%20you%20tell%20me%20more%20about%20partnership%20opportunities%3F"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-700 transition-colors font-medium"
                >
                  +91 8160309135
                </a>
                <p className="text-sm text-gray-500 mt-2">
                  Quick response for partnership inquiries
                </p>
              </div>

              {/* Email Contact */}
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <Mail className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">Email</h4>
                <a
                  href="mailto:molle.app@gmail.com?subject=Brand%20Partnership%20Inquiry"
                  className="text-blue-600 hover:text-blue-700 transition-colors font-medium"
                >
                  molle.app@gmail.com
                </a>
                <p className="text-sm text-gray-500 mt-2">
                  Detailed partnership proposals
                </p>
              </div>
            </div>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                We typically respond to partnership inquiries within 24-48 hours during business days.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
