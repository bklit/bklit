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

interface BklitNewProjectEmailProps {
  username?: string;
  projectName?: string;
  projectId?: string;
}

const baseUrl = process.env.BKLIT_WEBSITE_URL
  ? process.env.BKLIT_WEBSITE_URL
  : "http://localhost:3001";

export const BklitNewProjectEmail = ({
  username,
  projectName,
  projectId,
}: BklitNewProjectEmailProps) => (
  <Tailwind config={tailwindConfig}>
    <Html>
      <Head />
      <Body style={main}>
        <Preview>
          {projectName
            ? `Your new project "${projectName}" has been created`
            : "Your new project has been created"}
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
            <strong>{username}</strong>, a new project was created on your
            account: <strong>{projectName}</strong>.
          </Text>

          <Section className="rounded-md border border-gray-200 bg-white p-4">
            <Text className="text-left text-lg">
              Hey <strong>{username}</strong>!
            </Text>
            <Text className="text-left">
              You've successfully created a new project. To get started, install
              the SDK:
            </Text>

            <div className="my-2 rounded-md bg-black p-3 font-mono text-gray-400 text-xs">
              <code>
                <span className="text-lime-200">npm install</span>{" "}
                <span className="text-white">@bklit/sdk</span>
                <br /># or
                <br />
                <span className="text-lime-200">pnpm add</span>{" "}
                <span className="text-white">@bklit/sdk</span>
              </code>
            </div>

            <Text className="text-left">
              See the{" "}
              <Link className="text-lime-500" href="https://docs.bklit.com/sdk">
                SDK documentation
              </Link>{" "}
              for more information.
            </Text>

            <Button
              className="inline-block rounded-md bg-lime-500 px-5 py-3 text-center font-bold text-base text-white"
              href={`${baseUrl}?utm_source=email&utm_medium=email&utm_campaign=new-project&utm_content=cta-button`}
            >
              View your project
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

BklitNewProjectEmail.PreviewProps = {
  username: "alanturing",
  projectName: "My Project",
  projectId: "1234567890",
} as BklitNewProjectEmailProps;

export default BklitNewProjectEmail;

const links = [
  {
    title: "Bklit.com",
    href: "https://bklit.com?utm_source=email&utm_medium=email&utm_campaign=new-project&utm_content=footer-link",
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
