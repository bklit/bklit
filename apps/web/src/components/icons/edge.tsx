import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
  size?: number;
}

export function EdgeIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      height={size}
      viewBox="0 0 256 256"
      width={size}
      className={cn("icon", className)}
    >
      <title>Edge Icon</title>
      <defs>
        <radialGradient
          id="b"
          cx="161.8"
          cy="68.9"
          r="95.4"
          gradientTransform="matrix(1 0 0 -.95 0 248.8)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset=".7" stop-opacity="0" />
          <stop offset=".9" stop-opacity=".5" />
          <stop offset="1" />
        </radialGradient>
        <radialGradient
          id="d"
          cx="-340.3"
          cy="63"
          r="143.2"
          gradientTransform="matrix(.15 -.99 -.8 -.12 176.6 -125.4)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset=".8" stop-opacity="0" />
          <stop offset=".9" stop-opacity=".5" />
          <stop offset="1" />
        </radialGradient>
        <radialGradient
          id="e"
          cx="113.4"
          cy="570.2"
          r="202.4"
          gradientTransform="matrix(-.04 1 2.13 .08 -1179.5 -106.7)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stop-color="#35c1f1" />
          <stop offset=".1" stop-color="#34c1ed" />
          <stop offset=".2" stop-color="#2fc2df" />
          <stop offset=".3" stop-color="#2bc3d2" />
          <stop offset=".7" stop-color="#36c752" />
        </radialGradient>
        <radialGradient
          id="f"
          cx="376.5"
          cy="568"
          r="97.3"
          gradientTransform="matrix(.28 .96 .78 -.23 -303.8 -148.5)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stop-color="#66eb6e" />
          <stop offset="1" stop-color="#66eb6e" stop-opacity="0" />
        </radialGradient>
        <linearGradient
          id="a"
          x1="63.3"
          y1="84"
          x2="241.7"
          y2="84"
          gradientTransform="matrix(1 0 0 -1 0 266)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stop-color="#0c59a4" />
          <stop offset="1" stop-color="#114a8b" />
        </linearGradient>
        <linearGradient
          id="c"
          x1="157.3"
          y1="161.4"
          x2="46"
          y2="40.1"
          gradientTransform="matrix(1 0 0 -1 0 266)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stop-color="#1b9de2" />
          <stop offset=".2" stop-color="#1595df" />
          <stop offset=".7" stop-color="#0680d7" />
          <stop offset="1" stop-color="#0078d4" />
        </linearGradient>
      </defs>
      <path
        d="M235.7 195.5a93.7 93.7 0 0 1-10.6 4.7 101.9 101.9 0 0 1-35.9 6.4c-47.3 0-88.5-32.5-88.5-74.3a31.5 31.5 0 0 1 16.4-27.3c-42.8 1.8-53.8 46.4-53.8 72.5 0 74 68.1 81.4 82.8 81.4 7.9 0 19.8-2.3 27-4.6l1.3-.4a128.3 128.3 0 0 0 66.6-52.8 4 4 0 0 0-5.3-5.6Z"
        transform="translate(-4.6 -5)"
        fill="url(#a)"
      />
      <path
        d="M235.7 195.5a93.7 93.7 0 0 1-10.6 4.7 101.9 101.9 0 0 1-35.9 6.4c-47.3 0-88.5-32.5-88.5-74.3a31.5 31.5 0 0 1 16.4-27.3c-42.8 1.8-53.8 46.4-53.8 72.5 0 74 68.1 81.4 82.8 81.4 7.9 0 19.8-2.3 27-4.6l1.3-.4a128.3 128.3 0 0 0 66.6-52.8 4 4 0 0 0-5.3-5.6Z"
        transform="translate(-4.6 -5)"
        fill="url(#b)"
      />
      <path
        d="M110.3 246.3A79.2 79.2 0 0 1 87.6 225a80.7 80.7 0 0 1 29.5-120c3.2-1.5 8.5-4.1 15.6-4a32.4 32.4 0 0 1 25.7 13 31.9 31.9 0 0 1 6.3 18.7c0-.2 24.5-79.6-80-79.6-43.9 0-80 41.6-80 78.2a130.2 130.2 0 0 0 12.1 56 128 128 0 0 0 156.4 67 75.5 75.5 0 0 1-62.8-8Z"
        transform="translate(-4.6 -5)"
        fill="url(#c)"
      />
      <path
        d="M110.3 246.3A79.2 79.2 0 0 1 87.6 225a80.7 80.7 0 0 1 29.5-120c3.2-1.5 8.5-4.1 15.6-4a32.4 32.4 0 0 1 25.7 13 31.9 31.9 0 0 1 6.3 18.7c0-.2 24.5-79.6-80-79.6-43.9 0-80 41.6-80 78.2a130.2 130.2 0 0 0 12.1 56 128 128 0 0 0 156.4 67 75.5 75.5 0 0 1-62.8-8Z"
        transform="translate(-4.6 -5)"
        fill="url(#d)"
      />
      <path
        d="M157 153.8c-.9 1-3.4 2.5-3.4 5.6 0 2.6 1.7 5.2 4.8 7.3 14.3 10 41.4 8.6 41.5 8.6a59.6 59.6 0 0 0 30.3-8.3 61.4 61.4 0 0 0 30.4-52.9c.3-22.4-8-37.3-11.3-43.9C228 28.8 182.3 5 132.6 5a128 128 0 0 0-128 126.2c.5-36.5 36.8-66 80-66 3.5 0 23.5.3 42 10a72.6 72.6 0 0 1 30.9 29.3c6.1 10.6 7.2 24.1 7.2 29.5s-2.7 13.3-7.8 19.9Z"
        transform="translate(-4.6 -5)"
        fill="url(#e)"
      />
      <path
        d="M157 153.8c-.9 1-3.4 2.5-3.4 5.6 0 2.6 1.7 5.2 4.8 7.3 14.3 10 41.4 8.6 41.5 8.6a59.6 59.6 0 0 0 30.3-8.3 61.4 61.4 0 0 0 30.4-52.9c.3-22.4-8-37.3-11.3-43.9C228 28.8 182.3 5 132.6 5a128 128 0 0 0-128 126.2c.5-36.5 36.8-66 80-66 3.5 0 23.5.3 42 10a72.6 72.6 0 0 1 30.9 29.3c6.1 10.6 7.2 24.1 7.2 29.5s-2.7 13.3-7.8 19.9Z"
        transform="translate(-4.6 -5)"
        fill="url(#f)"
      />
    </svg>
  );
}
