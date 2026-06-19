import "./globals.css";

export const metadata = {
  title: "SIPulse",
  description: "Single-screen stock research and SIP simulator.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark" suppressHydrationWarning>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
