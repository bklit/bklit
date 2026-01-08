import { BklitLogo } from "@bklit/ui/icons/bklit";
import { GitHubIcon } from "@bklit/ui/icons/github";
import { XIcon } from "@bklit/ui/icons/x";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="mt-16 border-t bg-background p-4 py-16">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-3">
          <div className="col-span-1 flex flex-col items-start justify-start gap-8">
            <div className="flex items-center gap-2">
              <BklitLogo size={16} theme="dark" />
              <span className="text-muted-foreground text-sm">Bklit Store</span>
            </div>
            <div className="flex items-center gap-3">
              <a
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                href="https://github.com/bklit/bklit"
                rel="noopener noreferrer"
                target="_blank"
              >
                <GitHubIcon className="size-4" />
                <span className="sr-only">GitHub</span>
              </a>
              <a
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                href="https://x.com/bklitai"
                rel="noopener noreferrer"
                target="_blank"
              >
                <XIcon className="size-4" />
                <span className="sr-only">X</span>
              </a>
            </div>
          </div>
          <div className="col-span-2">
            <ul className="flex flex-col gap-2 text-muted-foreground">
              <li>
                <Link className="hover:text-foreground" to="/">
                  Home
                </Link>
              </li>
              <li>
                <Link className="hover:text-foreground" to="/products">
                  Products
                </Link>
              </li>
              <li>
                <a
                  className="flex items-center gap-2 hover:text-foreground"
                  href="https://docs.bklit.com"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Documentation
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};
