import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav"; // Import the nav bar

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ["latin"], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: "CortexBot",
  description: "Smart AI mining machines for daily income.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Added paddingBottom so the nav bar doesn't hide the bottom of your pages */}
      <body 
        className={`${inter.variable} ${playfair.variable}`}
        style={{ 
          backgroundColor: '#000', 
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
