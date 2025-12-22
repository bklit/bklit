import {
  Body,
  Button,
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

interface BklitInvitationEmailProps {
  inviterName?: string;
  organizationName?: string;
  inviteLink?: string;
  role?: string;
}

const baseUrl = process.env.BKLIT_WEBSITE_URL
  ? process.env.BKLIT_WEBSITE_URL
  : "http://localhost:3001";

export const BklitInvitationEmail = ({
  inviterName = "Someone",
  organizationName = "an organization",
  inviteLink = `${baseUrl}/accept-invite?utm_campaign=invite&utm_source=email&utm_medium=email&utm_content=invitation`,
  role = "member",
}: BklitInvitationEmailProps) => (
  <Tailwind config={tailwindConfig}>
    <Html>
      <Head />
      <Body style={main}>
        <Preview>
          You've been invited to join {organizationName} on Bklit Analytics
        </Preview>
        <Container className="mx-auto max-w-480px px-8 pt-12 pb-12">
          <div className="block w-full overflow-clip rounded-lg bg-black">
            <Img
              alt="Bklit"
              height="auto"
              src={`${baseUrl}/react-email-header.jpg`}
              width="100%"
            />
          </div>

          <Text className="font-semibold text-2xl">
            You've been invited to {organizationName}
          </Text>

          <Section className="rounded-md border border-gray-200 bg-white p-4">
            <Text className="text-left text-lg">
              <strong>{inviterName}</strong> has invited you to join{" "}
              <strong>{organizationName}</strong> on Bklit.com as a {role}.
            </Text>

            <Text className="text-left">
              To accept this invitation, sign in to Bklit with this email
              address. If you don't have an account yet, you can create one when
              you sign in. Your invitation will be waiting in your notifications
              when you log in.
            </Text>

            <Button
              className="inline-block rounded-md bg-lime-500 px-5 py-3 text-center font-bold text-base text-white"
              href={inviteLink}
            >
              Sign in to Accept
            </Button>

            <Text className="text-red-400 text-sm">
              This invitation expires in 7 days.
            </Text>

            <Text className="text-gray-400 text-xs">
              If you weren't expecting this invitation, you can ignore this
              email.
            </Text>
          </Section>

          <Section className="mt-8">
            <Row className="text-center">
              {links?.map((link) => (
                <Column key={link.title}>
                  <Link
                    className="font-bold text-black text-xs"
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

BklitInvitationEmail.PreviewProps = {
  inviterName: "John Doe",
  organizationName: "Acme Corp",
  role: "member",
  inviteLink: "https://bklit.com/accept-invite/abc123",
} as BklitInvitationEmailProps;

export default BklitInvitationEmail;

const links = [
  {
    title: "Bklit.com",
    href: "https://bklit.com?utm_source=email&utm_medium=email&utm_campaign=invitation&utm_content=footer-link",
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
