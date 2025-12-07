import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@bklit/ui/components/accordion";

interface FAQItem {
  value: string;
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    value: "item-1",
    question: "What is open source?",
    answer:
      "Open source means the entire Bklit codebase is publicly available and free to use. You can view, modify, and self-host the code on your own infrastructure. This gives you complete control over your analytics data and the freedom to customize Bklit to meet your specific needs.",
  },
  {
    value: "item-2",
    question: "Is Bklit free?",
    answer:
      "Yes, Bklit is completely free if you use the open-source version and self-host it on your own infrastructure. You'll have access to all core features including real-time analytics, custom events, session tracking, and geographical data without any cost.",
  },
  {
    value: "item-3",
    question: "Is there a hosted version?",
    answer:
      "Yes, we're working on a fully managed hosted version of Bklit. This will be a paid service that handles all infrastructure, maintenance, and updates for you, so you can focus on analyzing your data without worrying about server management.",
  },
  {
    value: "item-4",
    question: "Are there any limits?",
    answer:
      "Usage limits depend on your plan. For self-hosted installations, limits are only constrained by your infrastructure. For the upcoming hosted version, we'll have tiered plans with different limits for pageviews, events, and data retention. Check our dashboard plans for detailed information.",
  },
  {
    value: "item-5",
    question: "Is there a paid plan?",
    answer:
      "We're currently developing our paid plans for the hosted version. While these aren't live yet, they'll include features like extended data retention, priority support, higher usage limits, and advanced analytics capabilities. The open-source version will always remain free.",
  },
  {
    value: "item-6",
    question: "What analytics features does Bklit provide?",
    answer:
      "Bklit offers comprehensive analytics including real-time visitor tracking, custom event tracking for conversions, campaign tracking with UTM parameters, detailed session analysis with entry and exit pages, acquisition tracking, and geographical data to understand where your visitors are coming from.",
  },
  {
    value: "item-7",
    question: "How does Bklit handle user privacy?",
    answer:
      "Bklit is designed with privacy in mind. When self-hosted, all data stays on your infrastructure. We don't use cookies that require consent banners, and we don't track users across sites. You have complete control over what data is collected and how it's stored.",
  },
  {
    value: "item-8",
    question: "Is Bklit a Google Analytics alternative?",
    answer:
      "Yes, Bklit can be used as a privacy-friendly alternative to Google Analytics. While we track similar metrics like pageviews, sessions, and events, our open-source nature and self-hosting option means you maintain complete ownership of your data without sharing it with third parties.",
  },
];

export const FAQ = () => {
  return (
    <div className="container mx-auto max-w-4xl">
      <div className="flex flex-col">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq) => (
            <AccordionItem
              key={faq.value}
              value={faq.value}
              className="border-none"
            >
              <AccordionTrigger className="text-2xl font-normal hover:cursor-pointer">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4 text-balance">
                <p className="text-lg text-muted-foreground">{faq.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};
