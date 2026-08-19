import { createBrowserClient } from '@supabase/ssr';

let client: any = null;

const createMockClient = () => ({
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ data: {}, error: new Error('SSR') }),
    signUp: async () => ({ data: {}, error: new Error('SSR') }),
    signOut: async () => ({ error: null }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null }),
        then: (cb: any) => cb({ data: [], error: null }),
      }),
    }),
  }),
});

export const createClient = () => {
  if (typeof window === 'undefined') {
    return createMockClient();
  }

  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  try {
    client = createBrowserClient(url, anonKey);
    return client;
  } catch (e) {
    return createMockClient();
  }
};
