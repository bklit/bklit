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

interface BklitNewWorkspaceEmailProps {
  username?: string;
  workspaceName?: string;
  workspaceId?: string;
}

const baseUrl = process.env.BKLIT_WEBSITE_URL
  ? process.env.BKLIT_WEBSITE_URL
  : "https://bklit.com";

export const BklitNewWorkspaceEmail = ({
  username,
  workspaceName,
  workspaceId,
}: BklitNewWorkspaceEmailProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Preview>
        {workspaceName
          ? `Your new workspace "${workspaceName}" has been created`
          : "Your new workspace has been created"}
      </Preview>
      <Container style={container}>
        <Img width="184" src={`${baseUrl}/bklit-logo.png`} alt="Bklit" />

        <Text style={title}>
          <strong>{username}</strong>, a new workspace was created on your
          account: <strong>{workspaceName}</strong>.
        </Text>

        <Section style={section}>
          <Text style={text}>
            Hey <strong>{username}</strong>!
          </Text>
          <Text style={text}>
            You've successfully created a new workspace. Go to your workspace to
            add projects and users.
          </Text>

          <Button style={button} href={`${baseUrl}`}>
            View your workspace
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

BklitNewWorkspaceEmail.PreviewProps = {
  username: "alanturing",
  workspaceName: "My Workspace",
  workspaceId: "1234567890",
} as BklitNewWorkspaceEmailProps;

export default BklitNewWorkspaceEmail;

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

const codeblock = {
  backgroundColor: "#000000",
  color: "#888",
  padding: "12px 24px",
  borderRadius: "0.5em",
  margin: "0 0 10px 0",
  boxSizing: "border-box" as const,
  width: "100%",
  fontSize: "12px",
  lineHeight: "1.5",
  textAlign: "left" as const,
};
