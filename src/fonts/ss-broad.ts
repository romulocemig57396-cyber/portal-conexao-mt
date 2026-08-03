import localFont from "next/font/local";

export const ssBroad = localFont({
  src: [{ path: "./ss-broad/SSBroad-Regular.otf", weight: "400", style: "normal" }],
  variable: "--font-ss-broad",
  fallback: ["sans-serif"],
  display: "swap",
});
