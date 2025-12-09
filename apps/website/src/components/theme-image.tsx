"use client";

import Image, { type ImageProps } from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ThemeImageProps extends Omit<ImageProps, "src"> {
  srcLight: string;
  srcDark: string;
}

export function ThemeImage({ srcLight, srcDark, ...props }: ThemeImageProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const src = mounted && resolvedTheme === "dark" ? srcDark : srcLight;

  return <Image src={src} {...props} />;
}
