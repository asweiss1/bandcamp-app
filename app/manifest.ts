import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BandCamp",
    short_name: "BandCamp",
    description: "The road companion: next gig, route, lodging rules, and the musician board.",
    start_url: "/phone",
    scope: "/",
    display: "standalone",
    background_color: "#f7f1e6",
    theme_color: "#1b1612",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
