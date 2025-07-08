import { SessionChecker } from "@/components/SessionChecker";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SessionChecker />
      {children}
    </>
  );
}
