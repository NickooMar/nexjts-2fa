"use client";

import React from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

const HomePage = () => {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {JSON.stringify(session)}
      <Button>
        <Link href="/test">Go to Test Page</Link>
      </Button>
      <Button onClick={() => signOut()}>Logout</Button>
    </div>
  );
};

export default HomePage;
