// Generate unique marker colors for live map users
// Uses Tailwind color palette for consistency

const TAILWIND_GRADIENTS = [
  { from: "rgb(254, 202, 202)", to: "rgb(239, 68, 68)" }, // red-200 to red-500
  { from: "rgb(254, 215, 170)", to: "rgb(249, 115, 22)" }, // orange-200 to orange-500
  { from: "rgb(253, 224, 71)", to: "rgb(234, 179, 8)" }, // yellow-200 to yellow-500
  { from: "rgb(187, 247, 208)", to: "rgb(34, 197, 94)" }, // green-200 to green-500
  { from: "rgb(153, 246, 228)", to: "rgb(20, 184, 166)" }, // teal-200 to teal-500
  { from: "rgb(165, 243, 252)", to: "rgb(6, 182, 212)" }, // cyan-200 to cyan-500
  { from: "rgb(191, 219, 254)", to: "rgb(59, 130, 246)" }, // blue-200 to blue-500
  { from: "rgb(221, 214, 254)", to: "rgb(139, 92, 246)" }, // violet-200 to violet-500
  { from: "rgb(243, 232, 255)", to: "rgb(168, 85, 247)" }, // purple-200 to purple-500
  { from: "rgb(251, 207, 232)", to: "rgb(236, 72, 153)" }, // pink-200 to pink-500
  { from: "rgb(254, 205, 211)", to: "rgb(244, 63, 94)" }, // rose-200 to rose-500
  { from: "rgb(196, 181, 253)", to: "rgb(124, 58, 237)" }, // violet-300 to violet-600
  { from: "rgb(147, 197, 253)", to: "rgb(37, 99, 235)" }, // blue-300 to blue-600
  { from: "rgb(134, 239, 172)", to: "rgb(22, 163, 74)" }, // green-300 to green-600
];

// Generate a consistent color for a session ID
export function getMarkerGradient(sessionId: string): {
  from: string;
  to: string;
} {
  // Create a simple hash from the session ID
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = sessionId.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use absolute value and modulo to get a consistent index
  const index = Math.abs(hash) % TAILWIND_GRADIENTS.length;
  return TAILWIND_GRADIENTS[index];
}

// Parse RGB string to components
export function parseRGB(rgb: string): { r: number; g: number; b: number } {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return { r: 255, g: 100, b: 100 };

  return {
    r: Number.parseInt(match[1]),
    g: Number.parseInt(match[2]),
    b: Number.parseInt(match[3]),
  };
}
