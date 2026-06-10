import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
