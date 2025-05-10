import { CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useState, useEffect } from "react";
import { DotBackground } from "@/components/Aceternity/DotBackground";

const EmailVerificationCard = () => {
  const t = useTranslations("auth");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isResendDisabled, setIsResendDisabled] = useState(true);

  useEffect(() => {
    if (isResendDisabled) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsResendDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer); // Cleanup on unmount
    }
  }, [isResendDisabled]);

  const handleResendEmail = () => {
    // TODO: Logic to resend the email
    setIsResendDisabled(true);
    setTimeLeft(300);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <DotBackground>
        <section className="w-full max-w-xl mx-auto p-6 sm:p-8 md:p-10 z-0 bg-card border border-border rounded-xl shadow">
          <div className="flex flex-col items-center text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <h2 className="text-2xl font-semibold text-foreground">
              {t("email_verification.title")}
            </h2>
            <p className="text-muted-foreground">
              {t("email_verification.description")}
            </p>
            <button
              onClick={handleResendEmail}
              disabled={isResendDisabled}
              className={`mt-4 px-6 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isResendDisabled
                  ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                  : "bg-primary text-white hover:bg-primary/90 focus:ring-primary"
              }`}
            >
              {isResendDisabled
                ? t("email_verification.resend_email_time_remaining", {
                    time_remaining: formatTime(timeLeft),
                  })
                : t("email_verification.resend_email")}
            </button>
          </div>
        </section>
      </DotBackground>
    </div>
  );
};

export default EmailVerificationCard;
