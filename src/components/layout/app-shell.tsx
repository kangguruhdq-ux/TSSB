"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileNav } from "./mobile-nav";
import { PageTransition } from "@/components/common/page-transition";
import { SessionUser } from "@/types";

interface AppShellProps {
  user: SessionUser | null;
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Desktop Sidebar (Persistent) */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar user={user} />
      </div>

      {/* Mobile Drawer Navigation */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        user={user}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={user} onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
