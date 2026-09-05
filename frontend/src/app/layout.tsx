import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'X-Ray Audit Copilot | Autonomous Financial Lineage & Verification',
  description:
    'Split-screen cell-to-PDF audit verification agent for Fund Administrators and Auditors.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full w-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full w-full bg-audit-bg text-audit-text flex flex-col antialiased select-none">
        {children}
      </body>
    </html>
  );
}
