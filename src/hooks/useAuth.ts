'use client';

import { useCallback, useEffect, useState } from 'react';

interface AuthState {
  token: string | null;
  customer: { id: number; email: string; name: string } | null;
  isLoggedIn: boolean;
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({
    token: null,
    customer: null,
    isLoggedIn: false,
  });

  useEffect(() => {
    try {
      const token = localStorage.getItem('customerToken');
      const raw = localStorage.getItem('customerData');
      if (token && raw) {
        const customer = JSON.parse(raw);
        setAuth({ token, customer, isLoggedIn: true });
      }
    } catch {
      // ignore corrupt data
    }
  }, []);

  const login = useCallback((token: string, customer: AuthState['customer']) => {
    localStorage.setItem('customerToken', token);
    localStorage.setItem('customerData', JSON.stringify(customer));
    setAuth({ token, customer, isLoggedIn: true });
  }, []);

  const logout = useCallback(async () => {
    const token = localStorage.getItem('customerToken');
    if (token) {
      try {
        await fetch('/api/customer/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // ignore
      }
    }
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerData');
    setAuth({ token: null, customer: null, isLoggedIn: false });
  }, []);

  return { ...auth, login, logout };
}
