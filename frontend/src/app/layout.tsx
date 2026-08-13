import type { Metadata } from "next";
import "./globals.css";
import { AppThemeProvider } from "@/components/theme/app-theme-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Typeform Clone",
  description: "A polished Typeform-style form builder and respondent experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <AppThemeProvider>
          {children}
          <Toaster />
        </AppThemeProvider>
      </body>
    </html>
  );
}
