import { Button } from "@bklit/ui/components/button";
import { Card } from "@bklit/ui/components/card";
import { Github, Mail, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Contact Us - Bklit Analytics",
  description: "Get in touch with the Bklit team",
};

export default function ContactPage() {
  return (
    <>
      <PageHeader />
      <div className="min-h-screen pt-32 pb-16">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Get in Touch</h1>
            <p className="text-xl text-muted-foreground">
              We'd love to hear from you. Choose the best way to reach us.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-12">
            <Card className="p-6 hover:border-primary/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Mail className="size-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Email Support</h3>
                  <p className="text-muted-foreground mb-4">
                    For general inquiries and support questions
                  </p>
                  <Button variant="outline" asChild>
                    <a href="mailto:support@bklit.com">support@bklit.com</a>
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:border-primary/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Github className="size-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">GitHub</h3>
                  <p className="text-muted-foreground mb-4">
                    Report bugs, request features, or contribute
                  </p>
                  <Button variant="outline" asChild>
                    <a
                      href="https://github.com/bklit/bklit"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Visit Repository
                    </a>
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:border-primary/50 transition-colors md:col-span-2">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <MessageCircle className="size-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">
                    Community & Discussions
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Join our community to discuss features, best practices, and
                    connect with other users
                  </p>
                  <Button variant="outline" asChild>
                    <a
                      href="https://github.com/bklit/bklit/discussions"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Join Discussions
                    </a>
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Quick Links</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="ghost" asChild>
                <a
                  href="https://docs.bklit.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Documentation
                </a>
              </Button>
              <Button variant="ghost" asChild>
                <a href="/pricing">Pricing</a>
              </Button>
              <Button variant="ghost" asChild>
                <a href="/status">Status Page</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

