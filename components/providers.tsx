'use client';

import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';
import { MotionConfig } from 'framer-motion';
import { PropsWithChildren } from 'react';

export function Providers({ children }: PropsWithChildren) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <MotionConfig reducedMotion="user">
        {children}
        <Toaster position="bottom-right" richColors />
      </MotionConfig>
    </ThemeProvider>
  );
}
