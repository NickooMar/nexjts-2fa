import { DotBackground } from "@/components/Aceternity/DotBackground";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <DotBackground>{children}</DotBackground>
    </div>
  );
}
