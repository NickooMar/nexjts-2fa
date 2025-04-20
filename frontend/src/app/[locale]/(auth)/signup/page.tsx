import { auth } from "@/auth";
import SignUpForm from "@/components/Auth/SignUpForm";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Sign up to our platform",
  alternates: {
    languages: {
      "en-US": "/en-US/signup",
      "es-AR": "/es-AR/signup",
    },
  },
  applicationName: "HomiQ",
  keywords: ["HomiQ", "Real Estate", "Property", "Home", "Rent", "Buy"],
  icons: {
    icon: "/favicon.ico",
  },
};

const SignupPage = async () => {
  const session = await auth();

  if (session) redirect("/");

  return <SignUpForm />;
};

export default SignupPage;
