import { getPublicFAQs } from "@/lib/actions/faq";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, MessageCircle } from "lucide-react";

export const metadata = {
  title: "Contact Us - Frequently Asked Questions",
  description:
    "Find answers to common questions about our event platform and services.",
};

export default async function ContactUsPage() {
  const result = await getPublicFAQs();
  const faqs = result.success && result.data ? result.data : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Have questions? We're here to help. Find answers to common questions
            below or reach out to us directly.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Get in Touch
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">WhatsApp</p>
                      <a
                        href="https://wa.me/918160309135?text=Hi%2C%20I%20have%20a%20question%20about%20Molle%20Events.%20Can%20you%20help%20me%3F"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 transition-colors"
                      >
                        +91 8160309135
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MessageCircle className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">
                        Promotional Queries
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        For promotional queries, reach out to:
                      </p>
                      <div className="space-y-1">
                        <a
                          href="https://wa.me/918160309135?text=Hi%2C%20I'm%20interested%20in%20promotional%20opportunities%20with%20Molle%20Events.%20Can%20you%20help%20me%3F"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-700 transition-colors block"
                        >
                          WhatsApp: +91 8160309135
                        </a>
                        <a
                          href="mailto:molle.app@gmail.com?subject=Promotional%20Query"
                          className="text-blue-600 hover:text-blue-700 transition-colors block"
                        >
                          Email: molle.app@gmail.com
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Our support team typically responds within 24 hours during
                    business days.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* FAQs */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {faqs.length === 0 ? (
                  <div className="text-center py-12">
                    <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      No FAQs available at the moment.
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Please contact us directly for any questions.
                    </p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                      <AccordionItem key={faq.id} value={`item-${index}`}>
                        <AccordionTrigger className="text-left hover:no-underline">
                          <span className="font-medium">{faq.question}</span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="prose prose-sm max-w-none text-gray-600">
                            <div
                              dangerouslySetInnerHTML={{
                                __html: faq.answer.replace(/\n/g, "<br />"),
                              }}
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Help */}
        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Still need help?
              </h3>
              <p className="text-gray-600 mb-4">
                Can't find what you're looking for? Our support team is here to
                help you with any questions or issues.
              </p>
              <div className="flex justify-center">
                <a
                  href="https://wa.me/918160309135?text=Hi%2C%20I%20need%20support%20with%20Molle%20Events.%20Can%20you%20please%20help%20me%3F"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat with us on WhatsApp
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
