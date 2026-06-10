import { DotBackground } from "@/components/Aceternity/DotBackground";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col items-center justify-center p-4 sm:p-8 md:p-10">
      <DotBackground>{children}</DotBackground>
    </div>
  );
}
