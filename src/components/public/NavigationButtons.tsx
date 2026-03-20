'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export function NavigationButtons() {
  const router = useRouter();

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => router.back()}
        className="flex items-center justify-center h-7 w-7 rounded-md text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-all duration-200 cursor-pointer"
        aria-label="Go back"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => router.forward()}
        className="flex items-center justify-center h-7 w-7 rounded-md text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-all duration-200 cursor-pointer"
        aria-label="Go forward"
      >
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
