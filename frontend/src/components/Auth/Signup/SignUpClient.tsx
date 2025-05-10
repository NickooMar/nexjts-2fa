"use client";

import SignUpForm from "./SignUpForm";
import React, { useMemo, useState } from "react";
import EmailVerificationCard from "./EmailVerificationCard";
import { AnimatePresence, motion } from "framer-motion";

const SignUpClient = () => {
  const [signupStep, setSignupStep] = useState<"signup" | "email_verification">(
    "signup"
  );

  const signupStepComponent = useMemo(() => {
    const mappedSignupComponentSteps = {
      signup: <SignUpForm setSignupStep={setSignupStep} />,
      email_verification: <EmailVerificationCard />,
    };
    const renderedComponent = mappedSignupComponentSteps[signupStep];
    return renderedComponent || mappedSignupComponentSteps["signup"];
  }, [signupStep]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={signupStep}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {signupStepComponent}
      </motion.div>
    </AnimatePresence>
  );
};

export default SignUpClient;
