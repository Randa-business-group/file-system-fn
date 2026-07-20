import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Providers } from "@/lib/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FileVault",
  description:
    "Upload, organize, share, and find documents faster with FileVault.",
  icons: "/file-browser-icon.png",
};




export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-background text-foreground antialiased">
        <Providers>
          <AuthGuard>{children}</AuthGuard>
        </Providers>
      </body>
    </html>
  );
}
