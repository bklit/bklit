import { useEffect, useRef, useState } from "react";

interface Bounds {
  height: number;
  width: number;
}

export function useMeasure(): [React.RefObject<HTMLDivElement>, Bounds] {
  const ref = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState<Bounds>({ height: 0, width: 0 });

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver(() => {
      if (ref.current) {
        // Use offsetHeight/offsetWidth to include padding and border
        setBounds({
          height: ref.current.offsetHeight,
          width: ref.current.offsetWidth,
        });
      }
    });

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return [ref, bounds];
}

