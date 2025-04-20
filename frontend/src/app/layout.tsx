import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HomiQ",
  description: "HomiQ",
  keywords: ["HomiQ", "Real Estate", "Property", "Home", "Rent", "Buy"],
  icons: {
    icon: "/favicon.ico",
  },
  alternates: {
    languages: {
      "en-US": "/en-US",
      "es-AR": "/es-AR",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
