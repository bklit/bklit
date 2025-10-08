import { Monitor, Smartphone, Tablet } from "lucide-react";

export function getDeviceIcon(device: string) {
  switch (device) {
    case "Mobile":
      return <Smartphone size={16} />;
    case "Tablet":
      return <Tablet size={16} />;
    case "Desktop":
      return <Monitor size={16} />;
    default:
      return null;
  }
}
