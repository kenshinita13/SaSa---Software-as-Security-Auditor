import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SaSa — Software as Security Auditor",
  description: "Enterprise-grade OWASP Top 10 vulnerability scanner. Automated security auditing with white-labeled PDF reports for agencies.",
  keywords: "security scanner, OWASP, vulnerability assessment, penetration testing, security audit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </body>
    </html>
  );
}
