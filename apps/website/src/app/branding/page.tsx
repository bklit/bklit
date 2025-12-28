import { Button } from "@bklit/ui/components/button";
import { ButtonGroup } from "@bklit/ui/components/button-group";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import type { Metadata } from "next";
import Image from "next/image";
import { Footer } from "@/components/footer";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = {
  title: "Bklit Branding",
  description: "Download the Bklit branding assets",
};

export default function BrandingPage() {
  return (
    <>
      <PageHeader />
      <div className="container mx-auto max-w-6xl py-48 space-y-16 px-4">
        <SectionHeader
          title="Bklit Branding"
          description="Download the Bklit branding assets"
        >
          <Button variant="outline" asChild>
            <a href="/branding.zip" download>
              Download Zip
            </a>
          </Button>
        </SectionHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="col-span-1">
            <Card className="bg-transparent border-none">
              <CardHeader>
                <CardTitle>Dark</CardTitle>
                <CardDescription>
                  The dark version of the Bklit logo &amp; wordmark.
                </CardDescription>
                <CardAction>
                  <ButtonGroup>
                    <Button variant="outline" asChild>
                      <a href="/branding/Dark.png" download>
                        PNG
                      </a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href="/branding/Dark.svg" download>
                        SVG
                      </a>
                    </Button>
                  </ButtonGroup>
                </CardAction>
              </CardHeader>
              <CardContent>
                <Image
                  src="/Dark.svg"
                  alt="Bklit Logo: Dark"
                  width={473}
                  height={256}
                  className="w-full h-full object-contain"
                />
              </CardContent>
            </Card>
          </div>
          <div className="col-span-1">
            <Card className="bg-transparent border-none">
              <CardHeader>
                <CardTitle>Light</CardTitle>
                <CardDescription>
                  The light version of the Bklit logo &amp; wordmark.
                </CardDescription>
                <CardAction>
                  <ButtonGroup>
                    <Button variant="outline" asChild>
                      <a href="/branding/Light.png" download>
                        PNG
                      </a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href="/branding/Light.svg" download>
                        SVG
                      </a>
                    </Button>
                  </ButtonGroup>
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="bg-white">
                  <Image
                    src="/Light.svg"
                    alt="Bklit Logo: Light"
                    width={473}
                    height={256}
                    className="w-full h-full object-contain"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="bg-transparent border-none">
          <CardHeader>
            <CardTitle>App logos</CardTitle>
            <CardDescription>
              The logos for the Bklit extension.
            </CardDescription>
            <CardAction>
              <Button variant="outline" asChild>
                <a href="/branding.zip" download>
                  Download Zip
                </a>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="col-span-1">
                <Image
                  src="/branding/extension-icon-light-mono.svg"
                  alt="Bklit Logo: Dark"
                  width={256}
                  height={256}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="col-span-1">
                <Image
                  src="/branding/extension-icon-dark-mono.svg"
                  alt="Bklit Logo: Dark"
                  width={256}
                  height={256}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="col-span-1">
                <Image
                  src="/branding/extension-icon-dark-green.svg"
                  alt="Bklit Logo: Dark"
                  width={256}
                  height={256}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="col-span-1">
                <Image
                  src="/branding/extension-icon-light-blue.svg"
                  alt="Bklit Logo: Dark"
                  width={256}
                  height={256}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  );
}
