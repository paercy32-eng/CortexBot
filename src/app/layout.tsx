import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ["latin"], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: "Fragrance Files", // 🚨 Updated Title
  description: "The ultimate luxury fragrance investment platform.", // 🚨 Updated Description
  manifest: "/manifest.json", 
};

// 🚨 Added Viewport for mobile theme color
export const viewport: Viewport = {
  themeColor: "#D4AF37",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body 
        className={`${inter.variable} ${playfair.variable}`}
        style={{ 
          backgroundColor: '#0a0a0a', // 🚨 Updated Background
          color: '#fff', 
          margin: 0, 
          padding: 0, 
          paddingBottom: '80px' 
        }}
      >
        {children}
        <BottomNav />
      </body>
    </html>
  );
}