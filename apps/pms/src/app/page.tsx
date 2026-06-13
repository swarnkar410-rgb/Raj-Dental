'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTokens } from '../utils/api';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const tokens = getTokens();
    if (tokens.access) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
