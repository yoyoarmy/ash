'use client';

import { Loader2 } from "lucide-react";

export function LoadingAnimation() {
  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <p className="mt-2 text-sm text-gray-500">Loading...</p>
    </div>
  );
} 