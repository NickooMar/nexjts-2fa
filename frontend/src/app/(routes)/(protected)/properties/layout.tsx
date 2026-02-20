import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Properties",
  description: "Properties",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
