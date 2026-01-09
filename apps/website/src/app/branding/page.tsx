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
import { FigmaIcon } from "@bklit/ui/icons/figma";
import { DownloadIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = {
  title: "Bklit Branding",
  description: "Download the Bklit branding assets",
};

export default function BrandingPage() {
  return (
    <div className="container mx-auto max-w-6xl space-y-16 px-4 py-48">
      <SectionHeader
        description="Download the Bklit branding assets"
        title="Bklit Branding"
      >
        <ButtonGroup>
          <Button asChild size="lg" variant="outline">
            <a
              href="https://www.figma.com/design/i8XNdCS4y9K7r1e1wdk0MU/Bklit.com-Branding?m=auto&t=nZefB3QSZ0RuAPXi-6"
              rel="noopener noreferrer"
              target="_blank"
            >
              <FigmaIcon />
              Figma
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a download href="/branding.zip">
              <DownloadIcon />
              Download Zip
            </a>
          </Button>
        </ButtonGroup>
      </SectionHeader>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="col-span-1">
          <Card className="border-none bg-transparent">
            <CardHeader>
              <CardTitle>Dark</CardTitle>
              <CardDescription>
                The dark version of the Bklit logo &amp; wordmark.
              </CardDescription>
              <CardAction>
                <ButtonGroup>
                  <Button asChild variant="outline">
                    <a download href="/branding/Dark.png">
                      PNG
                    </a>
                  </Button>
                  <Button asChild variant="outline">
                    <a download href="/branding/Dark.svg">
                      SVG
                    </a>
                  </Button>
                </ButtonGroup>
              </CardAction>
            </CardHeader>
            <CardContent>
              <Image
                alt="Bklit Logo: Dark"
                className="h-full w-full object-contain"
                height={256}
                src="/Dark.svg"
                width={473}
              />
            </CardContent>
          </Card>
        </div>
        <div className="col-span-1">
          <Card className="border-none bg-transparent">
            <CardHeader>
              <CardTitle>Light</CardTitle>
              <CardDescription>
                The light version of the Bklit logo &amp; wordmark.
              </CardDescription>
              <CardAction>
                <ButtonGroup>
                  <Button asChild variant="outline">
                    <a download href="/branding/Light.png">
                      PNG
                    </a>
                  </Button>
                  <Button asChild variant="outline">
                    <a download href="/branding/Light.svg">
                      SVG
                    </a>
                  </Button>
                </ButtonGroup>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="bg-white">
                <Image
                  alt="Bklit Logo: Light"
                  className="h-full w-full object-contain"
                  height={256}
                  src="/Light.svg"
                  width={473}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-none bg-transparent">
        <CardHeader>
          <CardTitle>App logos</CardTitle>
          <CardDescription>The logos for the Bklit extension.</CardDescription>
          <CardAction>
            <Button asChild variant="outline">
              <a download href="/branding.zip">
                Download Zip
              </a>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-1">
              <Image
                alt="Bklit Logo: Dark"
                className="h-full w-full object-contain"
                height={256}
                src="/branding/extension-icon-light-mono.svg"
                width={256}
              />
            </div>
            <div className="col-span-1">
              <Image
                alt="Bklit Logo: Dark"
                className="h-full w-full object-contain"
                height={256}
                src="/branding/extension-icon-dark-mono.svg"
                width={256}
              />
            </div>
            <div className="col-span-1">
              <Image
                alt="Bklit Logo: Dark"
                className="h-full w-full object-contain"
                height={256}
                src="/branding/extension-icon-dark-green.svg"
                width={256}
              />
            </div>
            <div className="col-span-1">
              <Image
                alt="Bklit Logo: Dark"
                className="h-full w-full object-contain"
                height={256}
                src="/branding/extension-icon-light-blue.svg"
                width={256}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
