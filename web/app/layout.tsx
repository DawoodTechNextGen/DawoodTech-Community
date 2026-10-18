import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { AuthProvider } from "@/lib/auth-context";
import { NotificationToast } from "@/components/notifications/notification-toast";
import { NotificationsProvider } from "@/lib/notifications-context";
import { BootSpinner } from "@/components/pwa/boot-spinner";
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

/**
 * Runs before the page paints: the launch screen is for opening the app, not
 * for every reload (pull-to-refresh). The first load of a session marks it
 * seen; later loads in that session hide it via `html[data-splash-seen]`.
 * Closing and reopening the app starts a new session, so it shows again.
 */
const SPLASH_ONCE_SCRIPT = `try{if(sessionStorage.getItem("dtc_splash_seen")){document.documentElement.setAttribute("data-splash-seen","")}else{sessionStorage.setItem("dtc_splash_seen","1")}}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // The script below may add data-splash-seen before React hydrates.
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Script id="splash-once" strategy="beforeInteractive">
          {SPLASH_ONCE_SCRIPT}
        </Script>
        <AuthProvider>
          <LaunchSplash />
          <BootSpinner />
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
