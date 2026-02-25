import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Suspense } from 'react';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import './globals.css';

export const metadata: Metadata = {
  title: 'ことしやるぞ',
  description: '今年やりたいことを、月ごとに管理しよう',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

const gaId = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 min-h-screen">
        {children}
        {gaId && (
          <>
            {/* GA スクリプト本体 */}
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
            {/* ルート変更ごとのページビュー計測（useSearchParams は Suspense 必須） */}
            <Suspense fallback={null}>
              <GoogleAnalytics gaId={gaId} />
            </Suspense>
          </>
        )}
      </body>
    </html>
  );
}
