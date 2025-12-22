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

interface BklitVerifyEmailProps {
  verificationCode?: string;
  verificationLink?: string;
}

const baseUrl = process.env.BKLIT_WEBSITE_URL
  ? process.env.BKLIT_WEBSITE_URL
  : "http://localhost:3001";

export const BklitVerifyEmail = ({
  verificationCode = "123456",
  verificationLink,
}: BklitVerifyEmailProps) => (
  <Tailwind config={tailwindConfig}>
    <Html>
      <Head />
      <Body style={main}>
        <Preview>Verify your email address for Bklit</Preview>
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
            Verify your email address
          </Text>

          <Section className="p-4 border border-gray-200 rounded-md bg-white">
            <Text className="text-left text-lg">
              Welcome to <strong>Bklit</strong>!
            </Text>
            <Text className="text-left">
              To complete your registration, please verify your email address by
              entering this verification code:
            </Text>

            <div className="text-center p-4 bg-gray-100 rounded-md my-4">
              <Text className="text-3xl font-bold tracking-wider m-0">
                {verificationCode}
              </Text>
            </div>

            <Text className="text-left text-sm text-gray-600">
              This code will expire in 10 minutes.
            </Text>

            {verificationLink && (
              <>
                <Text className="text-left text-sm text-gray-600">
                  Or click the button below to verify automatically:
                </Text>
                <Button
                  className="inline-block text-center py-3 px-5 text-white text-base font-bold bg-lime-500 rounded-md"
                  href={verificationLink}
                >
                  Verify Email
                </Button>
              </>
            )}
          </Section>

          <Text className="text-sm text-gray-600 text-center mt-4">
            If you didn't create an account with Bklit, you can safely ignore
            this email.
          </Text>
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

BklitVerifyEmail.PreviewProps = {
  verificationCode: "123456",
} as BklitVerifyEmailProps;

export default BklitVerifyEmail;

const main = {
  backgroundColor: "#ffffff",
  color: "#24292e",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"',
};

