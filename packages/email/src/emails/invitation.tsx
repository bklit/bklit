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

interface BklitInvitationEmailProps {
  inviterName?: string;
  organizationName?: string;
  inviteLink?: string;
  role?: string;
}

const baseUrl = process.env.BKLIT_WEBSITE_URL
  ? process.env.BKLIT_WEBSITE_URL
  : "https://bklit.com";

export const BklitInvitationEmail = ({
  inviterName = "Someone",
  organizationName = "an organization",
  inviteLink = `${baseUrl}/accept-invite`,
  role = "member",
}: BklitInvitationEmailProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Preview>
        You've been invited to join {organizationName} on Bklit
      </Preview>
      <Container style={container}>
        <Img width="184" src={`${baseUrl}/bklit-logo.png`} alt="Bklit" />

        <Text style={title}>You've been invited to join a team!</Text>

        <Section style={section}>
          <Text style={text}>
            <strong>{inviterName}</strong> has invited you to join{" "}
            <strong>{organizationName}</strong> on Bklit as a {role}.
          </Text>

          <Text style={text}>
            Bklit is a powerful analytics platform that helps teams understand
            their users and grow their business together.
          </Text>

          <Button style={button} href={inviteLink}>
            Accept Invitation
          </Button>

          <Text style={footerText}>
            If you weren't expecting this invitation, you can ignore this email.
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

BklitInvitationEmail.PreviewProps = {
  inviterName: "John Doe",
  organizationName: "Acme Corp",
  role: "member",
  inviteLink: "https://bklit.com/accept-invite/abc123",
} as BklitInvitationEmailProps;

export default BklitInvitationEmail;

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

const button = {
  fontSize: "14px",
  backgroundColor: "#000000",
  color: "#fff",
  lineHeight: 1.5,
  borderRadius: "0.5em",
  padding: "12px 24px",
  display: "inline-block",
  marginTop: "12px",
  marginBottom: "12px",
};

const link = {
  color: "#0366d6",
  fontSize: "12px",
};

const footerText = {
  color: "#6a737d",
  fontSize: "12px",
  marginTop: "20px",
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

