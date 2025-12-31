import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = {
  title: "Terms of Use - Bklit",
  description: "Terms of Use for Bklit analytics platform",
};

export default function TermsPage() {
  return (
    <main className="w-full min-h-screen flex flex-col gap-32">
      <PageHeader />
      <div className="container mx-auto max-w-6xl flex flex-col px-4 py-48 space-y-12">
        <SectionHeader
          title="Terms of Use"
          description="Terms of Use for Bklit analytics platform"
        >
          <p className="text-muted-foreground">
            Last updated: December 28, 2025
          </p>
        </SectionHeader>
        <div className="prose prose-neutral dark:prose-invert max-w-4xl mx-auto space-y-8 text-sm">
          <section className="page-content">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using Bklit (&quot;Service&quot;), you agree to be
              bound by these Terms of Use. If you do not agree, please do not
              use our Service.
            </p>
          </section>

          <section className="page-content">
            <h2>2. Description of Service</h2>
            <p>
              Bklit provides web analytics and event tracking services. We offer
              both free and paid subscription plans with usage-based billing for
              events tracked through our platform.
            </p>
          </section>

          <section className="page-content">
            <h2>3. Account Registration</h2>
            <p>
              You must create an account to use our Service. You are responsible
              for maintaining the security of your account and for all
              activities that occur under your account.
            </p>
          </section>

          <section className="page-content">
            <h2>4. Billing and Payment</h2>
            <ul>
              <li>
                <strong>Free Plan:</strong> 4,000 events per month at no charge
              </li>
              <li>
                <strong>Pro Plan:</strong> $10/month for 100,000 base events,
                then $0.0004 per additional event
              </li>
              <li>
                Usage-based charges are billed automatically via our payment
                processor, Polar
              </li>
              <li>Prices exclude applicable taxes</li>
              <li>Subscriptions renew automatically until canceled</li>
              <li>
                Cancellations take effect at the end of the billing period
              </li>
            </ul>
          </section>

          <section className="page-content">
            <h2>5. Refund Policy</h2>
            <p>
              <strong>No Refunds.</strong> All payments are final and
              non-refundable. Bklit is an open-source project under active
              development. While we strive for reliability, bugs and issues may
              occur.
            </p>
            <p>
              Refunds, if any, are issued solely at Bklit&apos;s discretion on a
              case-by-case basis. Requests for refunds do not guarantee
              approval.
            </p>
            <p>
              By subscribing to a paid plan, you acknowledge and accept this
              no-refund policy.
            </p>
          </section>

          <section className="page-content">
            <h2>6. Usage Limits</h2>
            <p>
              Free plan users are limited to 4,000 events per month. Exceeding
              this limit will result in event tracking being disabled until the
              next billing cycle or until you upgrade to a paid plan.
            </p>
            <p>
              Pro plan users with active subscriptions have no hard limits.
              Usage beyond 100,000 events is billed automatically.
            </p>
          </section>

          <section className="page-content">
            <h2>7. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any illegal purpose</li>
              <li>Attempt to bypass usage limits or access controls</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Share your account credentials</li>
              <li>Use the Service to track users without proper consent</li>
            </ul>
          </section>

          <section className="page-content">
            <h2>8. Data Ownership</h2>
            <p>
              Analytics data collected through our Service is owned by Bklit.
              You retain rights to your personal identifying information (name,
              email) and may request deletion of such information at any time.
              Analytics data (pageviews, events, session data) remains with
              Bklit and is not available for export.
            </p>
          </section>

          <section className="page-content">
            <h2>9. Service Availability</h2>
            <p>
              We strive for 99.9% uptime but do not guarantee uninterrupted
              access. We may perform maintenance that temporarily affects
              availability.
            </p>
          </section>

          <section className="page-content">
            <h2>10. Termination</h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate
              these terms. You may cancel your account at any time through your
              account settings.
            </p>
          </section>

          <section className="page-content">
            <h2>11. Changes to Terms</h2>
            <p>
              We may update these terms from time to time. Continued use of the
              Service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="page-content">
            <h2>12. Contact</h2>
            <p>
              For questions about these terms, please contact us at{" "}
              <a
                href="mailto:support@bklit.com"
                className="text-primary hover:underline"
              >
                support@bklit.com
              </a>
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
