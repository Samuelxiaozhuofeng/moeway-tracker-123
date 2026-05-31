"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/app/bottom-nav";
import { DesktopRail } from "@/components/app/desktop-rail";
import { TimerDock } from "@/components/timer/timer-dock";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#0d1020_0%,#151827_56%,#111423_100%)]">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(90deg,rgba(198,182,255,0.05),transparent_42%,rgba(247,178,103,0.04))]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl">
        <DesktopRail />
        <main className="safe-bottom w-full px-4 pb-28 pt-5 sm:px-6 lg:ml-24 lg:px-8 lg:pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        <TimerDock />
        <BottomNav />
      </div>
    </div>
  );
}
