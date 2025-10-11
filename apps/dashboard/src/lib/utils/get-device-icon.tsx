import { Monitor, Smartphone, Tablet } from "lucide-react";

interface DeviceConfig {
  name: string;
  pattern: string;
  icon: React.ComponentType<{ size?: number }>;
}

const DEVICE_CONFIG: DeviceConfig[] = [
  {
    name: "Mobile",
    pattern: "Mobile",
    icon: Smartphone,
  },
  {
    name: "Tablet",
    pattern: "Tablet",
    icon: Tablet,
  },
];

const DEFAULT_DEVICE = {
  name: "Desktop",
  icon: Monitor,
};

export function getDeviceIcon(device: string) {
  const deviceConfig = DEVICE_CONFIG.find((config) => config.name === device);

  if (deviceConfig) {
    const Icon = deviceConfig.icon;
    return <Icon size={16} />;
  }

  if (device === DEFAULT_DEVICE.name) {
    const Icon = DEFAULT_DEVICE.icon;
    return <Icon size={16} />;
  }

  return null;
}

export function getDeviceTypeFromUserAgent(userAgent: string | null): string {
  if (!userAgent) return "Unknown";

  for (const config of DEVICE_CONFIG) {
    if (userAgent.includes(config.pattern)) return config.name;
  }

  return DEFAULT_DEVICE.name;
}
