"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { navItems } from "@/components/app/nav-items";
import { cn } from "@/lib/utils/cn";

export function BottomNav() {
  const pathname = usePathname();
  const primaryItems = navItems.filter((item) => !("secondary" in item && item.secondary));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] lg:hidden">
      <div className="surface grid grid-cols-5 rounded-[1.65rem] p-1.5">
        {primaryItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex h-14 flex-col items-center justify-center gap-1 rounded-[1.25rem] text-[0.68rem] text-muted-foreground transition",
                active && "text-primary"
              )}
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-active"
                  className="absolute inset-0 rounded-[1.25rem] bg-primary/12"
                  transition={{ type: "spring", stiffness: 360, damping: 32 }}
                />
              )}
              <Icon className="relative h-5 w-5" strokeWidth={active ? 2.6 : 2} />
              <span className="relative leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
