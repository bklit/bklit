import { BklitLogo } from "@bklit/ui/icons/bklit";
import { Link } from "react-router-dom";

export const Header = () => {
  return (
    <header className="bg-background p-4 pt-8">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BklitLogo size={32} />
            <span className="text-2xl font-bold">Bklit Store</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
