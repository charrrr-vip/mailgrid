"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen" style={{ backgroundColor: "#F8F8F9" }}>
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />

        <main className="flex-1 overflow-y-auto rounded-tl-2xl bg-white">
          <div className="mx-auto max-w-[1600px] p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
