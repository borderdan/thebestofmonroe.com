// File: src/hooks/use-barcode-scanner.ts
import { useEffect, useRef } from 'react';

interface UseBarcodeScannerProps {
  onScan: (barcode: string) => void;
  latency?: number; // Max ms between keystrokes to be considered a scanner (default: 50ms)
}

export function useBarcodeScanner({ onScan, latency = 50 }: UseBarcodeScannerProps) {
  const buffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore events originating from standard input fields
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const currentTime = Date.now();
      
      if (currentTime - lastKeyTime.current > latency) {
        buffer.current = ''; // Reset buffer if typed manually
      }

      lastKeyTime.current = currentTime;

      if (e.key === 'Enter') {
        if (buffer.current.length > 3) {
          onScan(buffer.current);
          e.preventDefault();
        }
        buffer.current = '';
      } else if (e.key.length === 1) { // Only capture printable characters
        buffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onScan, latency]);
}
