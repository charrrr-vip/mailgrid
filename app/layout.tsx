import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { AntdProvider } from "@/components/providers/AntdProvider";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mailforge",
  description: "Professional email campaign platform",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full bg-shell">
        <AntdProvider>{children}</AntdProvider>
      </body>
    </html>
  );
}
