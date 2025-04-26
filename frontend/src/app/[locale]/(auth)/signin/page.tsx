import { auth } from "@/auth";
import SignInForm from "@/components/Auth/SignIn/SignInForm";
import { redirect } from "next/navigation";

const SigninPage = async () => {
  const session = await auth();

  if (session) redirect("/");

  return <SignInForm />;
};

export default SigninPage;
