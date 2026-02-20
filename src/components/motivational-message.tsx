
'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { useMotivationStore } from '@/hooks/use-motivation-store';
import { usePathname } from 'next/navigation';

export function MotivationalMessage() {
  const { message, isVisible, hideMessage, selectMessage } = useMotivationStore();
  const pathname = usePathname();

  // Trigger message selection on page navigation
  useEffect(() => {
    selectMessage();
  }, [pathname, selectMessage]);

  // Auto-dismiss timer
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        hideMessage();
      }, 8000); // 8-second visibility

      return () => clearTimeout(timer);
    }
  }, [isVisible, hideMessage]);

  return (
    <AnimatePresence>
      {isVisible && message && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="relative text-center overflow-hidden"
        >
          <div className="bg-primary/10 text-primary-foreground p-3">
            <p className="text-sm font-medium text-foreground">{message}</p>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1/2 right-2 -translate-y-1/2 h-7 w-7 text-foreground/70 hover:text-foreground"
              onClick={hideMessage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
