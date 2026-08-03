import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zenzy | Operating System for Service Businesses",
    short_name: "Zenzy",
    description:
      "The all-in-one operating system for service businesses. Manage leads, projects, workspaces, quotes, invoices and customers from one platform.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f2744",
    theme_color: "#0f2744",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/maskable-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
