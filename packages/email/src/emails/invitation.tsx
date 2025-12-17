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
        <Container className="max-w-480px mx-auto pt-12 px-8 pb-12">
          <div className="block w-full bg-black rounded-lg overflow-clip">
            <Img
              src={`${baseUrl}/react-email-header.jpg`}
              alt="Bklit"
              width="100%"
              height="auto"
            />
          </div>

          <Text className="text-2xl font-semibold">
            You've been invited to {organizationName}
          </Text>

          <Section className="p-4 border border-gray-200 rounded-md bg-white">
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
              className="inline-block text-center py-3 px-5 text-white text-base font-bold bg-lime-500 rounded-md"
              href={inviteLink}
            >
              Sign in to Accept
            </Button>

            <Text className="text-sm text-red-400">
              This invitation expires in 7 days.
            </Text>

            <Text className="text-xs text-gray-400">
              If you weren't expecting this invitation, you can ignore this
              email.
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
