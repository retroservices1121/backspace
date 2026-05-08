'use client';

import { PrivyProvider } from '@privy-io/react-auth';

// Admin uses a SEPARATE Privy app from apps/web — different appId, different
// allowlists, different login methods. This is the security boundary: a token
// minted by the user-facing Privy app cannot authenticate against admin.
const ADMIN_PRIVY_APP_ID = process.env.NEXT_PUBLIC_ADMIN_PRIVY_APP_ID;

export function Providers({ children }: { children: React.ReactNode }) {
  if (!ADMIN_PRIVY_APP_ID) {
    // In dev with no env wired up, skip the provider so the UI still renders.
    // Server routes still enforce auth — this is purely so the shell loads.
    return <>{children}</>;
  }
  return (
    <PrivyProvider
      appId={ADMIN_PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'passkey'],
        appearance: { theme: 'dark', accentColor: '#5822FB' },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
