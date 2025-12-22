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
        <Container className="mx-auto max-w-480px px-8 pt-12 pb-12">
          <div className="flex items-center justify-center overflow-clip rounded-lg bg-black">
            <Img
              alt="Bklit"
              height="auto"
              src={`${baseUrl}/react-email-header.jpg`}
              width="100%"
            />
          </div>

          <Text className="font-semibold text-2xl">Reset your password</Text>

          <Section className="rounded-md border border-gray-200 bg-white p-4">
            <Text className="text-left text-lg">
              Hi <strong>{username}</strong>,
            </Text>
            <Text className="text-left">
              We received a request to reset your password for your Bklit
              account. Click the button below to create a new password:
            </Text>

            <Button
              className="inline-block rounded-md bg-lime-500 px-5 py-3 text-center font-bold text-base text-white"
              href={resetLink}
            >
              Reset Password
            </Button>

            <Text className="mt-4 text-left text-gray-600 text-sm">
              This link will expire in 1 hour for security reasons.
            </Text>

            <Text className="text-left text-gray-600 text-sm">
              If the button doesn't work, copy and paste this link into your
              browser:
            </Text>
            <Text className="break-all text-left text-gray-500 text-xs">
              {resetLink}
            </Text>
          </Section>

          <Text className="mt-4 text-center text-gray-600 text-sm">
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
