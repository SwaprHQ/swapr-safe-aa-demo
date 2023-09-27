import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AccountAbstractionProvider } from "@/context/accountAbstraction";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AccountAbstractionProvider>
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </AccountAbstractionProvider>
  );
}
