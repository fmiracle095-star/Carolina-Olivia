'use client';

import * as React from 'react';
import { createClient } from './supabase/client';
import type { Session, User } from '@supabase/supabase-js';

export type DiagnosticInfo = {
  gatewayUrl: string;
  userId: string;
  httpStatus: number | string;
  rawResponse: string;
};

type AuthContextType = {
  supabase: any;
  session: Session | null;
  user: User | null;
  loading: boolean;
  isOwner: boolean;
  diagnostic: DiagnosticInfo | null;
};

const AuthContext = React.createContext<AuthContextType>({
  supabase: null,
  session: null,
  user: null,
  loading: true,
  isOwner: false,
  diagnostic: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [supabase] = React.useState(() => createClient());
  const [session, setSession] = React.useState<Session | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isOwner, setIsOwner] = React.useState(false);
  const [diagnostic, setDiagnostic] = React.useState<DiagnosticInfo | null>(null);

  React.useEffect(() => {
    let mounted = true;

    async function checkOwnerStatus(token: string, currentUserId: string | undefined) {
      const diag: DiagnosticInfo = {
        gatewayUrl: '',
        userId: currentUserId || 'NOT_AUTHENTICATED',
        httpStatus: 'PENDING',
        rawResponse: 'WAITING',
      };

      try {
        const url = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://carolina-gateway.vercel.app';
        const targetEndpoint = `${url}/api/v1/system/status`;
        diag.gatewayUrl = targetEndpoint;
        
        console.log(`[OWNER-AUTH] Calling Gateway URL: ${targetEndpoint}`);
        if (currentUserId) {
          console.log(`[OWNER-AUTH] Authenticated Supabase user.id: ${currentUserId}`);
        }

        const res = await fetch(targetEndpoint, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        diag.httpStatus = res.status;
        console.log(`[OWNER-AUTH] HTTP Response Status: ${res.status}`);

        if (res.ok) {
          const data = await res.json();
          diag.rawResponse = JSON.stringify(data, null, 2);
          
          console.log(`[OWNER-AUTH] Response JSON:`, JSON.stringify(data));
          console.log(`[OWNER-AUTH] Returned data.isOwner: ${!!data.isOwner}`);
          
          if (mounted) {
            setIsOwner(!!data.isOwner);
            setDiagnostic(diag);
          }
        } else {
          diag.rawResponse = 'NETWORK_OR_AUTH_ERROR';
          console.error(`[OWNER-AUTH] Request failed with status ${res.status}`);
          if (mounted) {
            setIsOwner(false);
            setDiagnostic(diag);
          }
        }
      } catch (err: any) {
        diag.httpStatus = 'NETWORK_ERROR';
        diag.rawResponse = err?.message || 'Failed to fetch from Gateway';
        console.error(`[OWNER-AUTH] Request threw an error:`, err);
        if (mounted) {
          setIsOwner(false);
          setDiagnostic(diag);
        }
      }
    }

    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (session?.access_token) {
          checkOwnerStatus(session.access_token, session?.user?.id);
        } else {
          setIsOwner(false);
          setDiagnostic(null);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.access_token) {
          checkOwnerStatus(session.access_token, session?.user?.id);
        } else {
          setIsOwner(false);
          setDiagnostic(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <AuthContext.Provider value={{ supabase, session, user, loading, isOwner, diagnostic }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return React.useContext(AuthContext);
}
