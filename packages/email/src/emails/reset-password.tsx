import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { tailwindConfig } from "../tailwind.config";

interface BklitResetPasswordProps {
  resetLink?: string;
  username?: string;
}

const baseUrl = process.env.BKLIT_WEBSITE_URL
  ? process.env.BKLIT_WEBSITE_URL
  : "http://localhost:3001";

export const BklitResetPassword = ({
  resetLink = "https://bklit.com/reset-password?token=example",
  username = "there",
}: BklitResetPasswordProps) => (
  <Tailwind config={tailwindConfig}>
    <Html>
      <Head />
      <Body style={main}>
        <Preview>Reset your Bklit password</Preview>
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
            Reset your password
          </Text>

          <Section className="p-4 border border-gray-200 rounded-md bg-white">
            <Text className="text-left text-lg">
              Hi <strong>{username}</strong>,
            </Text>
            <Text className="text-left">
              We received a request to reset your password for your Bklit
              account. Click the button below to create a new password:
            </Text>

            <Button
              className="inline-block text-center py-3 px-5 text-white text-base font-bold bg-lime-500 rounded-md"
              href={resetLink}
            >
              Reset Password
            </Button>

            <Text className="text-left text-sm text-gray-600 mt-4">
              This link will expire in 1 hour for security reasons.
            </Text>

            <Text className="text-left text-sm text-gray-600">
              If the button doesn't work, copy and paste this link into your
              browser:
            </Text>
            <Text className="text-left text-xs text-gray-500 break-all">
              {resetLink}
            </Text>
          </Section>

          <Text className="text-sm text-gray-600 text-center mt-4">
            If you didn't request a password reset, you can safely ignore this
            email. Your password will remain unchanged.
          </Text>
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

BklitResetPassword.PreviewProps = {
  resetLink: "https://bklit.com/reset-password?token=example",
  username: "alanturing",
} as BklitResetPasswordProps;

export default BklitResetPassword;

const main = {
  backgroundColor: "#ffffff",
  color: "#24292e",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"',
};

