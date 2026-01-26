/**
 * Purpose: Define the root layout for the portfolio routes.
 * Main responsibilities: Provide global providers, fonts, and shared UI chrome.
 * Key collaborators: ThemeProvider, ClerkProvider, Sanity Live/Visual Editing, sidebar UI.
 * Notes/assumptions: Draft mode controls visual editing features on the page.
 */

import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { draftMode } from "next/headers";
import Script from "next/script";
import { VisualEditing } from "next-sanity/visual-editing";
import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/DarkModeToggle";
import { DisableDraftMode } from "@/components/DisableDraftMode";
import { FloatingDock } from "@/components/FloatingDock";
import SidebarToggle from "@/components/SidebarToggle";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import VisitorBootstrap from "@/components/usage/VisitorBootstrap";
import { SanityLive } from "@/sanity/lib/live";
import "../globals.css";

/**
 * Purpose: Register the primary sans font for the app.
 * Main responsibilities: Provide CSS variable for typography styling.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/**
 * Purpose: Register the monospace font for code and UI accents.
 * Main responsibilities: Provide CSS variable for monospace typography.
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Purpose: Define default SEO metadata for portfolio routes.
 * Main responsibilities: Provide title and description for the layout.
 */
export const metadata: Metadata = {
  title: "Shivansh Sharma Portfolio",
  description: "Portfolio website of Shivansh Sharma",
};

/**
 * Purpose: Wrap portfolio pages with providers, scripts, and shared layout.
 * Main responsibilities: Configure theming, sidebars, and Sanity preview features.
 * Inputs/outputs: Receives React children and returns the HTML shell.
 * Side effects: Loads external chat script and reads draft mode status.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <VisitorBootstrap />
            <Script
              src="https://cdn.platform.openai.com/deployments/chatkit/chatkit.js"
              strategy="afterInteractive"
            />

            <SidebarProvider defaultOpen={false}>
              <SidebarInset className="">{children}</SidebarInset>

              <AppSidebar side="right" />

              <FloatingDock />
              <SidebarToggle />

              {/* Mode Toggle - Desktop: bottom right next to AI chat, Mobile: top right next to burger menu */}
              <div className="fixed md:bottom-6 md:right-24 top-4 right-18 md:top-auto md:left-auto z-20">
                <div className="w-10 h-10 md:w-12 md:h-12">
                  <ModeToggle />
                </div>
              </div>
            </SidebarProvider>

            {/* Live content API */}
            <SanityLive />

            {(await draftMode()).isEnabled && (
              <>
                <VisualEditing />
                <DisableDraftMode />
              </>
            )}
          </ThemeProvider>

          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
