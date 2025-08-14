"use client"
import { useRouter } from 'next/navigation'

export function useOpenMessages() {
  const router = useRouter();
  return (threadId?: string) => {
    const url = threadId ? `/messages?thread=${encodeURIComponent(threadId)}` : '/messages';
    router.push(url);
  };
}


