import { cn } from "@bklit/ui/lib/utils";

interface IconProps {
  className?: string;
  size?: number;
}

export function BklitLogo({ className, size = 16 }: IconProps) {
  return (
    <svg
      height={size}
      width={size}
      viewBox="0 0 41 41"
      className={cn("icon", className)}
    >
      <title>Bklit Logo</title>
      <rect
        x="20.0938"
        y="0.000488281"
        width="7.10417"
        height="7.10417"
        transform="rotate(45 20.0938 0.000488281)"
        fill="currentColor"
      />
      <rect
        opacity="0.8"
        x="25.1172"
        y="5.02344"
        width="7.10417"
        height="7.10417"
        transform="rotate(45 25.1172 5.02344)"
        fill="currentColor"
      />
      <rect
        opacity="0.6"
        x="30.1406"
        y="10.0469"
        width="7.10417"
        height="7.10417"
        transform="rotate(45 30.1406 10.0469)"
        fill="currentColor"
      />
      <rect
        opacity="0.4"
        x="35.1636"
        y="15.0703"
        width="7.10417"
        height="7.10417"
        transform="rotate(45 35.1636 15.0703)"
        fill="currentColor"
      />
      <rect
        opacity="0.8"
        x="15.0703"
        y="5.02344"
        width="7.10417"
        height="7.10417"
        transform="rotate(45 15.0703 5.02344)"
        fill="currentColor"
      />
      <rect
        opacity="0.6"
        x="20.0938"
        y="10.0469"
        width="7.10417"
        height="7.10417"
        transform="rotate(45 20.0938 10.0469)"
        fill="currentColor"
      />
      <rect
        opacity="0.4"
        x="25.1172"
        y="15.0703"
        width="7.10417"
        height="7.10417"
        transform="rotate(45 25.1172 15.0703)"
        fill="currentColor"
      />
      <rect
        opacity="0.2"
        x="30.1406"
        y="20.0938"
        width="7.10417"
        height="7.10417"
        transform="rotate(45 30.1406 20.0938)"
        fill="currentColor"
      />
      <rect
        opacity="0.6"
        x="10.0469"
        y="10.0469"
        width="7.10417"
        height="7.10417"
        transform="rotate(45 10.0469 10.0469)"
        fill="currentColor"
      />
      <rect
        opacity="0.4"
        x="15.0703"
        y="15.0703"
        width="7.10417"
        height="7.10417"
        transform="rotate(45 15.0703 15.0703)"
        fill="currentColor"
      />
      <rect
        opacity="0.2"
        x="20.0938"
        y="20.0938"
        width="7.10417"
        height="7.10417"
        transform="rotate(45 20.0938 20.0938)"
        fill="currentColor"
      />
      <rect
        opacity="0.1"
        x="25.1172"
        y="25.1172"
        width="7.10417"
        height="7.10417"
        transform="rotate(45 25.1172 25.1172)"
        fill="currentColor"
      />
      <rect
        opacity="0.4"
        x="5.02344"
        y="15.0703"
        width="7.10417"
        height="7.10417"
        transform="rotate(45 5.02344 15.0703)"
        fill="currentColor"
      />
      <rect
        opacity="0.2"
        x="10.0469"
        y="20.0938"
        width="7.10417"
        height="7.10417"
        transform="rotate(45 10.0469 20.0938)"
        fill="currentColor"
      />
      <rect
        opacity="0.1"
        x="15.0703"
        y="25.1172"
        width="7.10417"
        height="7.10417"
        transform="rotate(45 15.0703 25.1172)"
        fill="currentColor"
      />
    </svg>
  );
}
