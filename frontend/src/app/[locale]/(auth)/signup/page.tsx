import { auth } from "@/auth";
import SignUpForm from "@/components/Auth/SignUpForm";
import { redirect } from "next/navigation";

const SignupPage = async () => {
  const session = await auth();

  if (session) redirect("/");

  return <SignUpForm />;
};

export default SignupPage;
