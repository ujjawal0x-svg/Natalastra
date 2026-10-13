import type { Metadata } from "next";
import "./globals.css";
import "./minimal.css";
import "./reflection.css";
import "./bento.css";
import "./reference-grid.css";
import "./design-system.css";
import "./account.css";
import "./public-home.css";
import "./info.css";
import "./birth-form.css";
import "./chart-overview.css";
import "./guided-reading.css";
import {BrowserObserver} from "./browser-observer";
import {AccountProvider} from "./account-session";

export const metadata: Metadata = {
  title: "Natalastra — A map, not a destiny.",
  description: "Explore your birth chart, save a three-minute reflection, and return to what you notice. Your experience comes first.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><AccountProvider><BrowserObserver/>{children}</AccountProvider></body>
    </html>
  );
}
