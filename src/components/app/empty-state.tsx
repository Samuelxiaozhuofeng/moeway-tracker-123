import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("quiet-panel flex flex-col items-center justify-center rounded-[1.5rem] px-6 py-12 text-center", className)}>
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary/12 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
