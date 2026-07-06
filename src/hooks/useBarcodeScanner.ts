import { useEffect, useRef, useState } from 'react';

export function useBarcodeScanner(onScan: (barcode: string) => void) {
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(0);
  const [isScannerDetected, setIsScannerDetected] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const currentTime = new Date().getTime();
      
      // Barcode scanners usually send keystrokes very fast (< 30ms between keys)
      // Reset buffer if more than 100ms passed since last key press
      if (currentTime - lastKeyTime.current > 100) {
        barcodeBuffer.current = '';
      }
      
      lastKeyTime.current = currentTime;

      // If Enter key is pressed, process the barcode
      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length > 0) {
          onScan(barcodeBuffer.current);
          if (!isScannerDetected) {
            setIsScannerDetected(true);
          }
          barcodeBuffer.current = '';
        }
        return;
      }

      // Add alphanumeric characters to buffer
      if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onScan, isScannerDetected]);

  return { isScannerDetected };
}
