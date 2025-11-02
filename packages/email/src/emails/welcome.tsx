import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface BklitWelcomeEmailProps {
  username?: string;
}

const baseUrl = process.env.BKLIT_WEBSITE_URL
  ? process.env.BKLIT_WEBSITE_URL
  : "https://bklit.com";

export const BklitWelcomeEmail = ({ username }: BklitWelcomeEmailProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Preview>Welcome to Bklit - Start tracking your analytics today</Preview>
      <Container style={container}>
        <Img width="184" src={`${baseUrl}/bklit-logo.png`} alt="Bklit" />

        <Text style={title}>
          Welcome to Bklit, <strong>{username}</strong>!
        </Text>

        <Section style={section}>
          <Text style={text}>
            Hey <strong>{username}</strong>!
          </Text>
          <Text style={text}>
            Thanks for signing up! We're excited to have you on board. Bklit is
            a powerful analytics platform that helps you understand your users
            and grow your business.
          </Text>

          <Text style={text}>Here's what you can do next:</Text>

          <Text style={listItem}>
            • Create your first workspace to organize your projects
          </Text>
          <Text style={listItem}>
            • Add a project and install the SDK on your website to start
            tracking analytics
          </Text>

          <Button style={button} href={`${baseUrl}`}>
            Get Started
          </Button>
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

BklitWelcomeEmail.PreviewProps = {
  username: "alanturing",
} as BklitWelcomeEmailProps;

export default BklitWelcomeEmail;

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

const listItem = {
  margin: "0 0 8px 0",
  textAlign: "left" as const,
  paddingLeft: "8px",
};

const button = {
  fontSize: "14px",
  backgroundColor: "#000000",
  color: "#fff",
  lineHeight: 1.5,
  borderRadius: "0.5em",
  padding: "12px 24px",
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
