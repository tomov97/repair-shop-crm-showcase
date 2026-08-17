import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Coffee Machine Repair CRM",
    short_name: "Service CRM",
    description: "Internal CRM for intake and tracking of repair jobs.",
    start_url: "/",
    display: "standalone",
    background_color: "#eef4f0",
    theme_color: "#23443f",
    lang: "bg",
  };
}
