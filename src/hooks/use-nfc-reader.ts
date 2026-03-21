'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UseNfcReaderProps {
  onScan: (data: string) => void;
}

export function useNfcReader({ onScan }: UseNfcReaderProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isSupported, setIsSupported] = useState(
    typeof window !== 'undefined' && 'NDEFReader' in window
  );

  const startScan = useCallback(async () => {
    if (!('NDEFReader' in window)) {
      toast.error('Web NFC is not supported on this device or browser.');
      setIsSupported(false);
      return;
    }

    try {
      // @ts-expect-error - NDEFReader is not fully typed in TS yet
      const ndef = new window.NDEFReader();
      await ndef.scan();
      setIsScanning(true);
      toast.success('NFC Reader active. Please tap a tag.');

      ndef.onreading = (event: any) => {
        const message = event.message;
        for (const record of message.records) {
          if (record.recordType === 'text') {
            const textDecoder = new TextDecoder(record.encoding);
            const data = textDecoder.decode(record.data);
            onScan(data);
          } else if (record.recordType === 'url') {
            const textDecoder = new TextDecoder();
            const data = textDecoder.decode(record.data);
            onScan(data);
          } else {
            // Unhandled record type, just try to decode as text
            const textDecoder = new TextDecoder();
            const data = textDecoder.decode(record.data);
            onScan(data);
          }
        }
      };

      ndef.onreadingerror = () => {
        toast.error('NFC read error. Try again.');
      };
    } catch (error: any) {
      console.error('NFC Scan Error:', error);
      setIsScanning(false);
      if (error.name === 'NotAllowedError') {
        toast.error('NFC permission denied.');
      } else {
        toast.error('Could not start NFC scan: ' + error.message);
      }
    }
  }, [onScan]);

  const stopScan = useCallback(() => {
    setIsScanning(false);
    toast.info('NFC Reader deactivated.');
    // Note: Web NFC doesn't have a reliable manual abort method globally supported yet,
    // usually handled via AbortController, but simplified here by just stopping our state.
  }, []);

  return { startScan, stopScan, isScanning, isSupported };
}
