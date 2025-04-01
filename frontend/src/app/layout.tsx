import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HomiQ",
  description: "HomiQ"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
