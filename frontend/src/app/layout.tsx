import "./globals.css";
import { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { getLocale } from "next-intl/server";
import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";
import { Navbar } from "@/components/Navbar/Navbar";
import { ThemeProvider } from "@/components/Theme/themeProvider";

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

async function getMessages(locale: string) {
  return (await import(`../../messages/${locale ?? "en"}.json`)).default;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages(locale);

  return (
    <html lang={locale} suppressHydrationWarning={true}>
      <head>
        <title>HomiQ</title>
      </head>
      <body>
        <SessionProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <Toaster position="top-right" reverseOrder={false} />
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <Navbar />
              {children}
            </ThemeProvider>
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
