import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Typeform Clone",
  description: "A polished Typeform-style form builder and respondent experience.",
};

import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
