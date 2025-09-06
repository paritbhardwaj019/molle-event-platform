"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { EventRule } from "@/lib/actions/event-rule";

interface EventRulesSectionProps {
  eventRules: EventRule[];
}

export function EventRulesSection({ eventRules }: EventRulesSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (eventRules.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-primary/5 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-primary">
                    Event Rules & Guidelines
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Important information for all event attendees
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="p-2">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {eventRules.map((rule, index) => (
                <div
                  key={rule.id}
                  className="border-l-4 border-primary pl-4 py-2 bg-white/50 rounded-r-lg"
                >
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {index + 1}. {rule.title}
                  </h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {rule.description}
                  </p>
                </div>
              ))}
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Please note:</strong> By purchasing a ticket and
                  attending this event, you agree to follow all the above rules
                  and guidelines. Failure to comply may result in removal from
                  the event without refund.
                </p>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
