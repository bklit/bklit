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
            Verify your email address
          </Text>

          <Section className="rounded-md border border-gray-200 bg-white p-4">
            <Text className="text-left text-lg">
              Welcome to <strong>Bklit</strong>!
            </Text>
            <Text className="text-left">
              To complete your registration, please verify your email address by
              entering this verification code:
            </Text>

            <div className="my-4 rounded-md bg-gray-100 p-4 text-center">
              <Text className="m-0 font-bold text-3xl tracking-wider">
                {verificationCode}
              </Text>
            </div>

            <Text className="text-left text-gray-600 text-sm">
              This code will expire in 10 minutes.
            </Text>

            {verificationLink && (
              <>
                <Text className="text-left text-gray-600 text-sm">
                  Or click the button below to verify automatically:
                </Text>
                <Button
                  className="inline-block rounded-md bg-lime-500 px-5 py-3 text-center font-bold text-base text-white"
                  href={verificationLink}
                >
                  Verify Email
                </Button>
              </>
            )}
          </Section>

          <Text className="mt-4 text-center text-gray-600 text-sm">
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
