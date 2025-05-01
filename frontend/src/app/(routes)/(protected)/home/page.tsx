import { auth } from "@/auth";
import { redirect } from "@/i18n/routing";
import React from "react";

const page = async () => {
  const session = await auth();

  if (!session?.user) redirect({ href: "/signin", locale: "en" });

  return <div>page</div>;
};

export default page;
