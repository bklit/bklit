import { pixelBasedPreset } from "@react-email/components";

export const tailwindConfig = {
  presets: [pixelBasedPreset],
  theme: {
    extend: {
      colors: {
        brand: "#98D283",
        offwhite: "#fafbfb",
      },
      spacing: {
        0: "0px",
        20: "20px",
        45: "45px",
      },
    },
  },
};
