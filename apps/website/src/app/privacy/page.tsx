import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = {
  title: "Privacy Policy - Bklit",
  description: "Privacy Policy for Bklit analytics platform",
};

export default function PrivacyPage() {
  return (
    <main className="w-full min-h-screen flex flex-col gap-32">
      <PageHeader />
      <div className="container mx-auto max-w-6xl flex flex-col px-4 py-48 space-y-12">
        <SectionHeader
          title="Privacy Policy"
          description="Privacy Policy for Bklit analytics platform"
        >
          <p className="text-muted-foreground">
            Last updated: December 28, 2025
          </p>
        </SectionHeader>
        <div className="prose prose-neutral dark:prose-invert max-w-4xl mx-auto space-y-8 text-sm">
          <section className="page-content">
            <h2>1. Information We Collect</h2>
            <h3>Account Information</h3>
            <p>
              When you create an account, we collect your email address, name,
              and authentication credentials.
            </p>

            <h3>Analytics Data</h3>
            <p>When you use Bklit to track your websites, we collect:</p>
            <ul>
              <li>Page views and URLs visited</li>
              <li>Custom events you configure</li>
              <li>Session information (duration, bounce rate)</li>
              <li>
                Location data (country, city - derived from IP address, IP not
                stored)
              </li>
              <li>Device and browser information</li>
              <li>Referrer information</li>
            </ul>

            <h3>Billing Information</h3>
            <p>
              Payment processing is handled by Polar.sh. We do not store credit
              card information. Polar collects billing address and payment
              details necessary to process transactions.
            </p>
          </section>

          <section className="page-content">
            <h2>2. How We Use Your Information</h2>
            <ul>
              <li>To provide and improve our analytics Service</li>
              <li>To process billing and subscriptions</li>
              <li>To send service updates and support communications</li>
              <li>To monitor usage and enforce plan limits</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section className="page-content">
            <h2>3. Data Storage</h2>
            <p>
              Analytics data is stored in ClickHouse for query performance.
              Account and billing data is stored in PostgreSQL. All data is
              stored securely with encryption at rest and in transit.
            </p>
          </section>

          <section className="page-content">
            <h2>4. Data Retention</h2>
            <p>
              We retain analytics data indefinitely unless you choose to delete
              it. Account data is retained while your account is active and for
              90 days after account deletion for billing and legal purposes.
            </p>
          </section>

          <section className="page-content">
            <h2>5. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul>
              <li>
                <strong>Polar.sh</strong> - Payment processing and subscription
                management
              </li>
              <li>
                <strong>Vercel</strong> - Hosting and infrastructure
              </li>
              <li>
                <strong>Better Auth</strong> - Authentication services
              </li>
            </ul>
          </section>

          <section className="page-content">
            <h2>6. Cookies and Tracking</h2>
            <p>
              We use essential cookies for authentication and session
              management.
            </p>
          </section>

          <section className="page-content">
            <h2>7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal identifying information</li>
              <li>
                Request deletion of personal identifying information (name,
                email, account data)
              </li>
              <li>Opt out of marketing communications</li>
              <li>Cancel your subscription at any time</li>
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">
              Note: Analytics data (pageviews, events, session data) collected
              through our Service is owned by Bklit and is not available for
              export. Deleting your account removes your personal information
              but may not delete historical analytics data.
            </p>
          </section>

          <section className="page-content">
            <h2>8. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your
              data, including encryption, secure authentication, and regular
              security audits.
            </p>
          </section>

          <section className="page-content">
            <h2>9. International Data Transfers</h2>
            <p>
              Your data may be processed in countries outside your residence. We
              ensure appropriate safeguards are in place for international data
              transfers.
            </p>
          </section>

          <section className="page-content">
            <h2>10. Children's Privacy</h2>
            <p>
              Our Service is not intended for children under 13. We do not
              knowingly collect information from children under 13.
            </p>
          </section>

          <section className="page-content">
            <h2>11. Changes to Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of significant changes via email or through the
              Service.
            </p>
          </section>

          <section className="page-content">
            <h2>12. Contact Us</h2>
            <p>
              For privacy-related questions or to exercise your rights, contact
              us at{" "}
              <a
                href="mailto:support@bklit.com"
                className="text-primary hover:underline"
              >
                privacy@bklit.com
              </a>
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
