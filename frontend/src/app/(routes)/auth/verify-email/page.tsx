import { auth } from "@/auth";
import { redirect } from "next/navigation";
import EmailVerificationCard from "@/components/Auth/Signup/EmailVerificationCard";

const VerifyEmailPage = async () => {
  const session = await auth();

  if (session) redirect("/");

  return <EmailVerificationCard />;
};

export default VerifyEmailPage;
