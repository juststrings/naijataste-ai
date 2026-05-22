import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import NextAuthProvider from "@/components/SessionProvider";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "NaijaTaste AI | Correct Taste, Every Time",
  description:
    "The AI-powered food engine for the Nigerian palate. Simulate reviews and get hyper-local restaurant recommendations.",
  icons: {
    icon: "/screen.png",
    shortcut: "/screen.png",
    apple: "/screen.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/screen.png" type="image/png" />
        <link rel="apple-touch-icon" href="/screen.png" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&display=swap"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-on-background">
        <NextAuthProvider>
          <AuthProvider>
            <div className="adire-bg" />
            <NavBar />
            <main className="flex-grow relative z-10 pb-16 md:pb-0">{children}</main>
            <Footer />
            <BottomNav />
            <Toaster position="top-right" />
          </AuthProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
