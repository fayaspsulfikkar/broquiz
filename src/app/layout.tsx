import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "react-hot-toast";
import InteractiveBackground from "@/components/InteractiveBackground";
import CustomCursor from "@/components/CustomCursor";

export const metadata: Metadata = {
  title: "BroQuiz — Prove Your Code Logic. Earn Your Scholarship.",
  description: "A coding scholarship quiz platform that tests programming logic and fundamentals through a level-gated system. Prove your skills and earn scholarships.",
  keywords: ["coding quiz", "programming scholarship", "coding test", "BroQuiz", "programming logic"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <CustomCursor />
        <InteractiveBackground />
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1D1D1F',
                color: '#F5F5F7',
                borderRadius: '12px',
                padding: '12px 20px',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
              },
              success: {
                iconTheme: { primary: '#34C759', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#FF3B30', secondary: '#fff' },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
