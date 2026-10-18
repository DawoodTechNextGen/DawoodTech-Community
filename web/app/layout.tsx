import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { NotificationToast } from "@/components/notifications/notification-toast";
import { NotificationsProvider } from "@/lib/notifications-context";
import { LaunchSplash } from "@/components/pwa/launch-splash";
import { RegisterServiceWorker } from "./register-service-worker";
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
  title: "DawoodTech Community",
  description:
    "Internal social platform for interns to share success stories, comment, and follow each other.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  // iOS: open full-screen from the home screen, under a translucent status bar.
  appleWebApp: {
    capable: true,
    title: "DT Community",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#3D5AFE",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <LaunchSplash />
          <NotificationsProvider>
            {children}
            {/* Here rather than in AppShell, so it survives page changes. */}
            <NotificationToast />
          </NotificationsProvider>
        </AuthProvider>
        <RegisterServiceWorker />
        <Analytics />
      </body>
    </html>
  );
}
