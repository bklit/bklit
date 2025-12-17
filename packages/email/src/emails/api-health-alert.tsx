import {
  Body,
  Column,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { tailwindConfig } from "../tailwind.config";

interface ApiHealthAlertEmailProps {
  endpoint: string;
  consecutiveFailures: number;
  durationMinutes: number;
}

const baseUrl = process.env.BKLIT_WEBSITE_URL
  ? process.env.BKLIT_WEBSITE_URL
  : "http://localhost:3001";

export const ApiHealthAlertEmail = ({
  endpoint,
  consecutiveFailures,
  durationMinutes,
}: ApiHealthAlertEmailProps) => (
  <Tailwind config={tailwindConfig}>
    <Html>
      <Head />
      <Body style={main}>
        <Preview>
          API Health Alert: {endpoint} has been unhealthy for{" "}
          {durationMinutes.toFixed(1)} minutes
        </Preview>
        <Container className="max-w-480px mx-auto pt-12 px-8 pb-12">
          <div className="bg-black flex items-center justify-center rounded-lg overflow-clip">
            <Img
              src={`${baseUrl}/react-email-header.jpg`}
              alt="Bklit"
              width="100%"
              height="auto"
            />
          </div>

          <Text className="text-2xl font-semibold">API Health Alert</Text>

          <Section className="p-4 border border-red-200 rounded-md bg-red-50">
            <Text className="text-left">
              <strong>Endpoint:</strong> {endpoint}
            </Text>
            <Text className="text-left">
              <strong>Status:</strong> Unhealthy
            </Text>
            <Text className="text-left">
              <strong>Consecutive Failures:</strong> {consecutiveFailures}
            </Text>
            <Text className="text-left">
              <strong>Duration:</strong> {durationMinutes.toFixed(1)} minutes
            </Text>

            <Text className="text-left">
              The API endpoint has been experiencing health issues for the past{" "}
              {durationMinutes.toFixed(1)} minutes. Please investigate the issue
              immediately.
            </Text>

            <Text className="text-left">
              This alert was triggered after {consecutiveFailures} consecutive
              failed health check{consecutiveFailures > 1 ? "s" : ""} (hourly
              checks).
            </Text>
          </Section>

          <Section className="mt-8">
            <Row className="text-center">
              {links?.map((link) => (
                <Column key={link.title}>
                  <Link
                    className="text-xs font-bold text-black"
                    href={link.href}
                  >
                    {link.title}
                  </Link>{" "}
                </Column>
              ))}
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

ApiHealthAlertEmail.PreviewProps = {
  endpoint: "/api/track",
  consecutiveFailures: 60,
  durationMinutes: 5.0,
} as ApiHealthAlertEmailProps;

export default ApiHealthAlertEmail;

const links = [
  {
    title: "Bklit.com",
    href: "https://bklit.com?utm_source=email&utm_medium=email&utm_campaign=health-alert&utm_content=footer-link",
  },
  { title: "Discord", href: "https://discord.gg/GFfD67gZGf" },
  { title: "X.com", href: "https://x.com/bklitai" },
  { title: "GitHub", href: "https://github.com/bklit/bklit" },
];

const main = {
  backgroundColor: "#ffffff",
  color: "#24292e",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"',
};
