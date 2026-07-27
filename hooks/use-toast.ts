'use client';

import { useCallback, useState } from 'react';

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const [variant, setVariant] = useState<'success' | 'error'>('success');

  const showToast = useCallback((content: string, type: 'success' | 'error' = 'success') => {
    setVariant(type);
    setMessage(content);
    window.setTimeout(() => setMessage(null), 4000);
  }, []);

  return { message, variant, showToast };
}
