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

interface BklitWelcomeEmailProps {
  username?: string;
}

const baseUrl = process.env.BKLIT_WEBSITE_URL
  ? process.env.BKLIT_WEBSITE_URL
  : "http://localhost:3001";

export const BklitWelcomeEmail = ({ username }: BklitWelcomeEmailProps) => (
  <Tailwind config={tailwindConfig}>
    <Html>
      <Head />
      <Body style={main}>
        <Preview>
          Welcome to Bklit - Start tracking your analytics today
        </Preview>
        <Container className="mx-auto max-w-480px px-8 pt-12 pb-12">
          <div className="flex items-center justify-center overflow-clip rounded-lg bg-black">
            <Img
              alt="Bklit"
              height="auto"
              src={`${baseUrl}/react-email-header.jpg`}
              width="100%"
            />
          </div>

          <Text className="font-semibold text-2xl">
            Welcome to Bklit, <strong>{username}</strong>!
          </Text>

          <Section className="rounded-md border border-gray-200 bg-white p-4">
            <Text className="text-left text-lg">
              Hey <strong>{username}</strong>!
            </Text>
            <Text className="text-left">
              Thanks for signing up! We're excited to have you on board. Bklit
              is a powerful analytics platform that helps you understand your
              users and grow your business.
            </Text>

            <Button
              className="inline-block rounded-md bg-lime-500 px-5 py-3 text-center font-bold text-base text-white"
              href={`${baseUrl}?utm_source=email&utm_medium=email&utm_campaign=welcome&utm_content=cta-button`}
            >
              Get Started
            </Button>
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

BklitWelcomeEmail.PreviewProps = {
  username: "alanturing",
} as BklitWelcomeEmailProps;

export default BklitWelcomeEmail;

const links = [
  {
    title: "Bklit.com",
    href: "https://bklit.com?utm_source=email&utm_medium=email&utm_campaign=welcome&utm_content=footer-link",
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
