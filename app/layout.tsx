import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "AlMurshid - AI Guide",
  description: "Your intelligent AI guide powered by DeepSeek V3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning>
      <head>
        <Script
          id="almurshed-theme-loader"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var themes = ["dark","light","neon","sunset","sand","sky","pink","coffee"];
                  var stored = localStorage.getItem("almurshed-theme");
                  var theme = themes.indexOf(stored) !== -1 ? stored : "dark";
                  var root = document.documentElement;
                  root.classList.remove.apply(root.classList, themes);
                  root.classList.add(theme);
                  root.dataset.theme = theme;
                } catch (e) {
                  // ignore
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
