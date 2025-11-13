import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface ApiHealthAlertEmailProps {
  endpoint: string;
  consecutiveFailures: number;
  durationMinutes: number;
}

const baseUrl = process.env.BKLIT_WEBSITE_URL
  ? process.env.BKLIT_WEBSITE_URL
  : "https://bklit.com";

export const ApiHealthAlertEmail = ({
  endpoint,
  consecutiveFailures,
  durationMinutes,
}: ApiHealthAlertEmailProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Preview>
        API Health Alert: {endpoint} has been unhealthy for {durationMinutes.toFixed(1)} minutes
      </Preview>
      <Container style={container}>
        <Img width="184" src={`${baseUrl}/bklit-logo.png`} alt="Bklit" />

        <Text style={title}>API Health Alert</Text>

        <Section style={section}>
          <Text style={text}>
            <strong>Endpoint:</strong> {endpoint}
          </Text>
          <Text style={text}>
            <strong>Status:</strong> Unhealthy
          </Text>
          <Text style={text}>
            <strong>Consecutive Failures:</strong> {consecutiveFailures}
          </Text>
          <Text style={text}>
            <strong>Duration:</strong> {durationMinutes.toFixed(1)} minutes
          </Text>

          <Text style={text}>
            The API endpoint has been experiencing health issues for the past{" "}
            {durationMinutes.toFixed(1)} minutes. Please investigate the issue
            immediately.
          </Text>

          <Text style={text}>
            This alert was triggered after {consecutiveFailures} consecutive
            failed health checks (5-second intervals).
          </Text>
        </Section>

        <Text style={footer}>
          <Link style={link} href={baseUrl}>
            Bklit.com
          </Link>
          <Link style={link} href="https://github.com/bklit/bklit">
            GitHub
          </Link>
          <Link style={link} href="https://x.com/bklitai">
            X.com
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

ApiHealthAlertEmail.PreviewProps = {
  endpoint: "/api/track",
  consecutiveFailures: 60,
  durationMinutes: 5.0,
} as ApiHealthAlertEmailProps;

export default ApiHealthAlertEmail;

const main = {
  backgroundColor: "#ffffff",
  color: "#24292e",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"',
};

const container = {
  maxWidth: "480px",
  margin: "0 auto",
  padding: "20px 0 48px",
};

const title = {
  fontSize: "24px",
  lineHeight: 1.25,
  marginBottom: "24px",
};

const section = {
  padding: "24px",
  border: "solid 1px #dedede",
  borderRadius: "5px",
  textAlign: "left" as const,
};

const text = {
  margin: "0 0 10px 0",
  textAlign: "left" as const,
};

const link = {
  color: "#0366d6",
  fontSize: "12px",
};

const footer = {
  color: "#6a737d",
  fontSize: "12px",
  textAlign: "center" as const,
  marginTop: "60px",
  display: "flex",
  gap: "16px",
  justifyContent: "center",
  alignItems: "center",
};

