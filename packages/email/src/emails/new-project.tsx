import {
  Body,
  Button,
  CodeBlock,
  Container,
  Font,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface BklitNewProjectEmailProps {
  username?: string;
  projectName?: string;
  projectId?: string;
}

const baseUrl = process.env.BKLIT_WEBSITE_URL
  ? process.env.BKLIT_WEBSITE_URL
  : "https://bklit.com";

export const BklitNewProjectEmail = ({
  username,
  projectName,
  projectId,
}: BklitNewProjectEmailProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Preview>
        {projectName
          ? `Your new project "${projectName}" has been created`
          : "Your new project has been created"}
      </Preview>
      <Container style={container}>
        <Img width="184" src={`${baseUrl}/bklit-logo.png`} alt="Bklit" />

        <Text style={title}>
          <strong>{username}</strong>, a new project was created on your
          account: <strong>{projectName}</strong>.
        </Text>

        <Section style={section}>
          <Text style={text}>
            Hey <strong>{username}</strong>!
          </Text>
          <Font
            fallbackFontFamily="monospace"
            fontFamily="CommitMono"
            fontStyle="normal"
            fontWeight={400}
            webFont={{
              url: "https://react.email/fonts/commit-mono/commit-mono-regular.ttf",
              format: "truetype",
            }}
          />
          <CodeBlock
            code={`npm install @bklit/sdk
# or
pnpm add @bklit/sdk`}
            fontFamily="'CommitMono', monospace"
            language="bash"
            theme={{}}
          />
          <CodeBlock
            code={`import { initBklit } from "@bklit/sdk";

initBklit({
  projectId: "${projectId}",
  apiHost: "https://your-api-host.com",
  debug: true,
});`}
            fontFamily="'CommitMono', monospace"
            language="javascript"
            theme={{}}
          />

          <Button style={button} href={`${baseUrl}`}>
            View your project
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

BklitNewProjectEmail.PreviewProps = {
  username: "alanturing",
} as BklitNewProjectEmailProps;

export default BklitNewProjectEmail;

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
  backgroundColor: "#28a745",
  color: "#fff",
  lineHeight: 1.5,
  borderRadius: "0.5em",
  padding: "12px 24px",
};

const links = {
  textAlign: "center" as const,
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
};
