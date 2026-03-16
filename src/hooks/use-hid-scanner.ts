import { useEffect, useRef } from 'react'

interface UseHidScannerProps {
  onScan: (barcode: string) => void
  /** Delay in MS between keystrokes to be considered a human vs a scanner. Default 30ms. */
  threshold?: number 
  /** Only listen for scanner events if this is true. Default true. */
  isActive?: boolean
}

export function useHidScanner({ onScan, threshold = 30, isActive = true }: UseHidScannerProps) {
  const bufferRef = useRef<string>('')
  const lastKeyTimeRef = useRef<number>(0)

  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keystrokes if the user is typing into an input/textarea
      const target = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) {
        return
      }

      const currentTime = Date.now()
      const timeElapsed = currentTime - lastKeyTimeRef.current

      if (timeElapsed > threshold) {
        // Human typing is slower than the threshold. Clear the buffer.
        bufferRef.current = ''
      }

      if (e.key === 'Enter') {
        const str = bufferRef.current
        if (str.length > 0) {
          e.preventDefault() // prevent form submission or scrolling
          onScan(str)
        }
        bufferRef.current = ''
      } else if (e.key.length === 1) { // Ignore meta keys like Shift, Ctrl, etc.
        bufferRef.current += e.key
      }

      lastKeyTimeRef.current = currentTime
    }

    // Capture phase to intercept before React synthetic events
    window.addEventListener('keydown', handleKeyDown, { capture: true })
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
    }
  }, [onScan, threshold, isActive])
}
