import type { Metadata } from 'next';
import './globals.css';
import { TrpcProvider } from '@/providers/TrpcProvider';

export const metadata: Metadata = {
  title: 'UNO Score Table',
  description: 'UNO game score tracking and payment calculator',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <TrpcProvider>
          {children}
        </TrpcProvider>
      </body>
    </html>
  );
}