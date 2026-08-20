'use client';
import { AuthProvider } from '../lib/AuthContext';
import React, { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
