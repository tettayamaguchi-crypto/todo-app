'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

// gtag の型定義
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

interface Props {
  gaId: string;
}

export default function GoogleAnalytics({ gaId }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window.gtag !== 'function') return;
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    window.gtag('config', gaId, { page_path: url });
  }, [gaId, pathname, searchParams]);

  return null;
}
