import { BklitLogo } from "@bklit/ui/icons/bklit";
import { GitHubIcon } from "@bklit/ui/icons/github";
import { XIcon } from "@bklit/ui/icons/x";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-background p-4 py-16 mt-16 border-t">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-3">
          <div className="col-span-1 flex flex-col items-start justify-start gap-8">
            <div className="flex items-center gap-2">
              <BklitLogo size={16} theme="dark" />
              <span className="text-sm text-muted-foreground">Bklit Store</span>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/bklit/bklit"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <GitHubIcon className="size-4" />
                <span className="sr-only">GitHub</span>
              </a>
              <a
                href="https://x.com/bklitai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <XIcon className="size-4" />
                <span className="sr-only">X</span>
              </a>
            </div>
          </div>
          <div className="col-span-2">
            <ul className="flex flex-col gap-2 text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-foreground">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-foreground">
                  Products
                </Link>
              </li>
              <li>
                <a
                  href="https://docs.bklit.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-foreground"
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
