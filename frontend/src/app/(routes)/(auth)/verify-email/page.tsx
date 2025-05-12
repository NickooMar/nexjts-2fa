import { auth } from "@/auth";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Verify Email",
  description: "Verify your email",
  alternates: {
    languages: {
      "en-US": "/en-US/verify-email",
      "es-AR": "/es-AR/verify-email",
    },
  },
  applicationName: "HomiQ",
  keywords: ["HomiQ", "Real Estate", "Property", "Home", "Rent", "Buy"],
  icons: {
    icon: "/favicon.ico",
  },
};

const VerifyEmailPage = async () => {
  const session = await auth();

  if (session) redirect("/");

  return (
    <section className="w-full max-w-xl mx-auto p-4 sm:p-6 md:p-8 z-0 bg-card border border-border rounded-xl shadow">
      TEST
    </section>
  );
};

export default VerifyEmailPage;
