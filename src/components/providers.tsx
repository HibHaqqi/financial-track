'use client';

import { SessionProvider } from 'next-auth/react';
import { BlurProvider } from '@/contexts/blur-context';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <BlurProvider>
        {children}
      </BlurProvider>
    </SessionProvider>
  );
}