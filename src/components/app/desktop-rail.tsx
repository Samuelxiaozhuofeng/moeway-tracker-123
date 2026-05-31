"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { navItems } from "@/components/app/nav-items";
import { cn } from "@/lib/utils/cn";

export function DesktopRail() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-5 top-5 z-30 hidden h-[calc(100svh-2.5rem)] w-20 flex-col items-center rounded-[1.75rem] border border-white/[0.08] bg-white/[0.045] py-5 shadow-soft backdrop-blur-xl lg:flex">
      <Link href="/" className="mb-8 grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
        浸
      </Link>
      <div className="flex flex-1 flex-col items-center gap-2">
        {navItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "relative grid h-12 w-12 place-items-center rounded-2xl text-muted-foreground transition hover:text-foreground",
                active && "text-primary"
              )}
            >
              {active && (
                <motion.span
                  layoutId="desktop-nav-active"
                  className="absolute inset-0 rounded-2xl bg-primary/12"
                  transition={{ type: "spring", stiffness: 360, damping: 34 }}
                />
              )}
              <Icon className="relative h-5 w-5" />
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
