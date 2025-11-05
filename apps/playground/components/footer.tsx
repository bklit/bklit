import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-background p-4 pt-16 mt-16 border-t">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-3">
          <div className="col-span-1">❖ Bklit Store</div>
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
                  href="https://github.com/bklit/bklit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://x.com/bklitai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                >
                  X.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};
