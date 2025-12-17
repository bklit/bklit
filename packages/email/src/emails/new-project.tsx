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
        <Container className="max-w-480px mx-auto pt-12 px-8 pb-12">
          <div className="bg-black flex items-center justify-center rounded-lg overflow-clip">
            <Img
              src={`${baseUrl}/react-email-header.jpg`}
              alt="Bklit"
              width="100%"
              height="auto"
            />
          </div>

          <Text className="text-2xl font-semibold">
            <strong>{username}</strong>, a new project was created on your
            account: <strong>{projectName}</strong>.
          </Text>

          <Section className="p-4 border border-gray-200 rounded-md bg-white">
            <Text className="text-left text-lg">
              Hey <strong>{username}</strong>!
            </Text>
            <Text className="text-left">
              You've successfully created a new project. To get started, install
              the SDK:
            </Text>

            <div className="bg-black text-gray-400 p-3 rounded-md my-2 font-mono text-xs">
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
              <Link href="https://docs.bklit.com/sdk" className="text-lime-500">
                SDK documentation
              </Link>{" "}
              for more information.
            </Text>

            <Button
              className="inline-block text-center py-3 px-5 text-white text-base font-bold bg-lime-500 rounded-md"
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
