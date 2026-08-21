'use client';

import { Providers } from "@/src/components/Providers";
import { AppShell } from "@/src/components/layout/AppShell";
import { ChatWorkspace } from "@/src/components/chat/ChatWorkspace";

export default function DashboardWrapper() {
  return (
    <Providers>
      <AppShell>
        <ChatWorkspace />
      </AppShell>
    </Providers>
  );
}
