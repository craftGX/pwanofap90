import type { Metadata, Viewport } from "next";
import "./globals.css";
import RegisterSW from "./registerSW";

export const metadata: Metadata = {
  title: "Health Tracker PWA",
  description: "Suivi quotidien avec calendrier, graphiques et thème clair/sombre.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
    shortcut: "/icon-512.png",
  },
};

// nouveau: viewport séparé
export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <RegisterSW />
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
