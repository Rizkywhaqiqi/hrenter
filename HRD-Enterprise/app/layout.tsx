import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HRD Enterprise",
  description: "Human Resources Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <html lang="id"><body>{children}</body></html>;
}
