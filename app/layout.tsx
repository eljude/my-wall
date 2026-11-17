import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Wall",
  description: "A 2008-style wall built with Next.js and Supabase.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
