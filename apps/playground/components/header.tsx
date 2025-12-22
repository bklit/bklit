import { BklitLogo } from "@bklit/ui/icons/bklit";
import { Link } from "react-router-dom";

export const Header = () => {
  return (
    <header className="p-4 pt-8">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <Link className="flex items-center gap-2" to="/">
            <BklitLogo
              className="hidden text-black sm:inline-flex dark:text-white"
              size={32}
              theme="dark"
            />
            <span className="font-semibold text-2xl">Bklit Store</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
