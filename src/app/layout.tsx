import type { Metadata } from "next";
import { Inter, Inconsolata } from "next/font/google";

import { Sidebar } from "@/components/sidebar";
import { Providers } from "@/components/providers";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const inconsolata = Inconsolata({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "AegisPay",
  description: "Hackathon demo — AegisPay",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${inconsolata.variable} antialiased`}
        style={{ backgroundColor: "#f7f7f8", color: "#0f0f10", margin: 0, padding: 0 }}
      >
        <Providers>
          <div style={{ display: "flex", minHeight: "100vh" }}>
            <Sidebar />
            <main style={{ flex: 1, minWidth: 0, overflow: "auto", padding: "32px 32px", marginLeft: "240px", backgroundColor: "#f7f7f8" }}>
              <div style={{ maxWidth: "1024px" }}>
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
